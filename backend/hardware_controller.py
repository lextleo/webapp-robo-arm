import time
import threading
import logging
import math
from typing import List, Optional, Tuple
import serial
import serial.tools.list_ports
import httpx
from .config import settings
from .models import RobotStatus

logger = logging.getLogger("aveon.hardware")
logging.basicConfig(level=logging.INFO)

class HardwareController:
    """
    Hardware Abstraction Layer for 6-DOF Robotic Arm with PCA9685/Sensor Shield.
    Supports:
    1. Direct USB Serial to Arduino Uno R3 (115200 baud)
    2. ESP32-CAM UART/HTTP bridge
    3. High-fidelity Smooth Kinematics Simulation Fallback
    """

    # Mechanical Safety Limits per joint (in degrees)
    LIMITS = [
        (0.0, 180.0),    # J1: Base
        (15.0, 165.0),   # J2: Shoulder
        (0.0, 180.0),    # J3: Elbow
        (0.0, 180.0),    # J4: Wrist Pitch
        (0.0, 180.0),    # J5: Wrist Roll
        (20.0, 110.0),   # J6: Gripper (20=Open, 100=Closed)
    ]

    # Calibrated Poses
    POSES = {
        "HOME": [90.0, 45.0, 120.0, 90.0, 90.0, 25.0],
        "HOVER_YELLOW": [105.0, 65.0, 95.0, 80.0, 90.0, 25.0],
        "PICK_YELLOW": [105.0, 82.0, 75.0, 85.0, 90.0, 95.0],
        "HOVER_RED": [75.0, 60.0, 100.0, 80.0, 90.0, 25.0],
        "PICK_RED": [75.0, 80.0, 78.0, 85.0, 90.0, 95.0],
        "HOVER_BLUE": [65.0, 55.0, 105.0, 80.0, 90.0, 25.0],
        "PICK_BLUE": [65.0, 75.0, 80.0, 85.0, 90.0, 95.0],
        "HOVER_GREEN": [88.0, 58.0, 100.0, 80.0, 90.0, 25.0],
        "PICK_GREEN": [88.0, 78.0, 76.0, 85.0, 90.0, 95.0],
        "PLACE_RIGHT": [35.0, 65.0, 100.0, 85.0, 90.0, 25.0],
        "PLACE_LEFT": [145.0, 65.0, 100.0, 85.0, 90.0, 25.0],
    }

    def __init__(self):
        self._lock = threading.Lock()
        self.serial_conn: Optional[serial.Serial] = None
        self.is_hardware_connected: bool = False
        self.port_name: Optional[str] = None
        
        # State
        self.current_joints: List[float] = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]  # displayed relative / absolute
        self.target_joints: List[float] = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        self.gripper_state: str = "Open"
        self.position_name: str = "Home"
        self.is_moving: bool = False
        self.emergency_stopped: bool = False
        self.last_ack: str = "ACK:READY"

        # Trajectory Simulation Worker
        self._stop_sim_event = threading.Event()
        self._traj_thread: Optional[threading.Thread] = None
        
        # Attempt initial hardware connection
        self.connect()

    def find_arduino_port(self) -> Optional[str]:
        """Detect Arduino USB Serial COM/tty port."""
        if settings.SERIAL_PORT != "AUTO":
            return settings.SERIAL_PORT
        
        ports = serial.tools.list_ports.comports()
        for p in ports:
            desc = p.description.lower()
            hwid = p.hwid.lower()
            if any(k in desc or k in hwid for k in ["arduino", "ch340", "cp210", "ftdi", "usb serial"]):
                return p.device
        return None

    def connect(self) -> bool:
        """Connect to real Arduino serial port or activate simulation mode."""
        with self._lock:
            port = self.find_arduino_port()
            if port:
                try:
                    self.serial_conn = serial.Serial(
                        port=port,
                        baudrate=settings.SERIAL_BAUDRATE,
                        timeout=1.0,
                        write_timeout=1.0
                    )
                    time.sleep(1.8)  # Allow Arduino bootloader reset
                    self.is_hardware_connected = True
                    self.port_name = port
                    logger.info(f"Connected to Arduino Uno on {port} @ {settings.SERIAL_BAUDRATE} baud.")
                    self._send_raw_command("<HOME>\n")
                    return True
                except Exception as e:
                    logger.warning(f"Failed to connect to serial port {port}: {e}. Running in Simulation Mode.")
            else:
                logger.info("No physical Arduino detected. Operating in Simulation Mode.")

            self.is_hardware_connected = False
            self.port_name = "SIMULATED_PORT"
            return False

    def _send_raw_command(self, cmd: str) -> Optional[str]:
        """Send formatted packet to physical hardware or ESP32-CAM bridge."""
        if self.is_hardware_connected and self.serial_conn and self.serial_conn.is_open:
            try:
                self.serial_conn.write(cmd.encode("ascii"))
                self.serial_conn.flush()
                # Read response
                resp = self.serial_conn.readline().decode("ascii", errors="ignore").strip()
                self.last_ack = resp or "ACK:OK"
                return resp
            except Exception as e:
                logger.error(f"Serial write error: {e}")
                self.is_hardware_connected = False
        return None

    def clamp_joints(self, joints: List[float]) -> List[float]:
        """Enforce mechanical safety angle limits per actuator."""
        clamped = []
        for i, val in enumerate(joints):
            min_val, max_val = self.LIMITS[i]
            c = max(min_val, min(max_val, float(val)))
            clamped.append(round(c, 1))
        return clamped

    def move_joints_smooth(self, target: List[float], duration_sec: float = 1.0, position_name: str = "Custom"):
        """Smooth non-blocking interpolated trajectory to target joints."""
        if self.emergency_stopped:
            logger.warning("Movement blocked by Emergency Stop state.")
            return

        target_clamped = self.clamp_joints(target)
        self.target_joints = target_clamped
        self.position_name = position_name
        self.is_moving = True

        # If connected to hardware, send command directly
        if self.is_hardware_connected:
            cmd = f"<CMD,{','.join(str(int(j)) for j in target_clamped)}>\n"
            self._send_raw_command(cmd)

        # Simulation trajectory interpolation thread
        def _interpolate():
            start_time = time.time()
            start_joints = list(self.current_joints)
            
            while time.time() - start_time < duration_sec and not self.emergency_stopped:
                elapsed = time.time() - start_time
                t = min(1.0, max(0.0, elapsed / duration_sec))
                # Smooth sinusoidal ease-in-out interpolation: (1 - cos(pi * t)) / 2
                ease = (1.0 - math.cos(math.pi * t)) / 2.0
                
                with self._lock:
                    new_joints = [
                        round(start_joints[i] + (target_clamped[i] - start_joints[i]) * ease, 1)
                        for i in range(6)
                    ]
                    self.current_joints = new_joints
                time.sleep(0.03)

            with self._lock:
                if not self.emergency_stopped:
                    self.current_joints = list(target_clamped)
                self.is_moving = False

        if self._traj_thread and self._traj_thread.is_alive():
            # Let previous finish or override target
            pass
        self._traj_thread = threading.Thread(target=_interpolate, daemon=True)
        self._traj_thread.start()

    def set_gripper(self, state: str):
        """Control gripper: 'OPEN' or 'CLOSE'."""
        state = state.upper()
        with self._lock:
            if state in ["OPEN", "OPENED"]:
                self.gripper_state = "Open"
                self.current_joints[5] = 25.0
                if self.is_hardware_connected:
                    self._send_raw_command("<GRIP,OPEN>\n")
            else:
                self.gripper_state = "Closed"
                self.current_joints[5] = 95.0
                if self.is_hardware_connected:
                    self._send_raw_command("<GRIP,CLOSE>\n")

    def go_home(self):
        """Move arm to calibrated Home position."""
        self.emergency_stopped = False
        home_pose = self.POSES["HOME"]
        self.move_joints_smooth(home_pose, duration_sec=1.2, position_name="Home")
        self.set_gripper("OPEN")
        if self.is_hardware_connected:
            self._send_raw_command("<HOME>\n")

    def emergency_stop(self):
        """Immediate Emergency Stop - detaches servos, halts motion."""
        logger.warning("EMERGENCY STOP ACTIVATED!")
        self.emergency_stopped = True
        self.is_moving = False
        self.position_name = "Emergency Stop"
        self.last_ack = "ACK:STOPPED"
        if self.is_hardware_connected:
            self._send_raw_command("<STOP>\n")

    def reset_emergency_stop(self):
        """Reset emergency stop state."""
        self.emergency_stopped = False
        self.last_ack = "ACK:READY"

    def get_status(self) -> RobotStatus:
        """Return snapshot of current telemetry for API and WebSocket."""
        with self._lock:
            return RobotStatus(
                connected=True,  # always responsive via simulation or hardware
                position=self.position_name,
                gripper=self.gripper_state,
                joints=list(self.current_joints),
                is_moving=self.is_moving,
                mode="Hardware" if self.is_hardware_connected else "Simulation",
                last_ack=self.last_ack
            )

# Global singleton
hardware = HardwareController()
