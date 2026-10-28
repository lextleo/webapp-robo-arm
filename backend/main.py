import asyncio
import logging
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .config import settings
from .models import (
    VisionConfig, VisionMetrics, RobotStatus, HealthStatus,
    UserPromptRequest, JointMoveRequest, GripperRequest,
    ChatMessage, ExecutionPlan
)
from .hardware_controller import hardware
from .vision_engine import vision
from .planner import planner

logger = logging.getLogger("aveon.main")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Active WebSocket clients
connected_clients: list[WebSocket] = []

async def telemetry_broadcaster():
    """Background task broadcasting real-time telemetry over WebSockets."""
    while True:
        try:
            if connected_clients:
                robot_status = hardware.get_status().model_dump()
                vision_metrics = vision.metrics.model_dump()
                payload = {
                    "type": "TELEMETRY_UPDATE",
                    "timestamp": asyncio.get_event_loop().time(),
                    "robot": robot_status,
                    "vision": vision_metrics
                }
                data_str = json.dumps(payload)
                # Broadcast to all connected clients
                for ws in list(connected_clients):
                    try:
                        await ws.send_text(data_str)
                    except Exception:
                        if ws in connected_clients:
                            connected_clients.remove(ws)
        except Exception as e:
            logger.error(f"Error in telemetry broadcaster: {e}")
        
        await asyncio.sleep(0.066)  # ~15Hz broadcast rate

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background telemetry broadcaster
    broadcaster_task = asyncio.create_task(telemetry_broadcaster())
    logger.info("AVEON Backend & Telemetry Broadcaster initialized.")
    yield
    # Shutdown
    broadcaster_task.cancel()
    logger.info("AVEON Backend stopped.")

app = FastAPI(
    title="AVEON - AI Robotics & Vision System API",
    version="1.0.0",
    description="Backend for real-time computer vision, 6-DOF kinematics, and safe LLM task planner.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- HEALTH & READINESS -----------------

@app.get("/api/health", response_model=HealthStatus)
async def get_health():
    """Pinged by login hardware readiness gate & dashboard."""
    is_hw = hardware.is_hardware_connected
    return HealthStatus(
        system_online=True,
        camera="READY",
        vision="READY" if vision.config.active else "STANDBY",
        robot="READY" if is_hw else "STANDBY",
        simulation_mode=not is_hw
    )

# ----------------- VISION & CAMERA -----------------

@app.get("/api/vision/stream")
async def get_vision_stream():
    """Live MJPEG stream for dashboard camera viewport."""
    return StreamingResponse(
        vision.generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/vision/metrics", response_model=VisionMetrics)
async def get_vision_metrics():
    """Current vision detector metrics."""
    return vision.metrics

@app.get("/api/vision/config", response_model=VisionConfig)
async def get_vision_config():
    """Get active vision toggle configuration."""
    return vision.config

@app.post("/api/vision/config", response_model=VisionConfig)
async def update_vision_config(config: VisionConfig):
    """Toggle face, object, color detection, distance estimation, active state, or source."""
    vision.update_config(config)
    return vision.config

# ----------------- ROBOT & KINEMATICS -----------------

@app.get("/api/robot/telemetry", response_model=RobotStatus)
async def get_robot_telemetry():
    """Current robot state and joint angles."""
    return hardware.get_status()

@app.post("/api/robot/move", response_model=RobotStatus)
async def move_robot_joints(req: JointMoveRequest):
    """Move robot joints manually or via automation."""
    if len(req.joints) != 6:
        raise HTTPException(status_code=400, detail="Must provide exactly 6 joint angles.")
    hardware.move_joints_smooth(req.joints, duration_sec=1.0, position_name="Custom")
    return hardware.get_status()

@app.post("/api/robot/gripper", response_model=RobotStatus)
async def control_gripper(req: GripperRequest):
    """Set gripper state to 'OPEN' or 'CLOSE'."""
    hardware.set_gripper(req.state)
    return hardware.get_status()

@app.post("/api/robot/home", response_model=RobotStatus)
async def return_to_home():
    """Move robot back to Home pose."""
    hardware.go_home()
    return hardware.get_status()

@app.post("/api/robot/stop", response_model=RobotStatus)
async def emergency_stop():
    """Emergency Stop: immediately halts arm motion and detaches motors."""
    planner.emergency_stop_all()
    return hardware.get_status()

@app.post("/api/robot/reset", response_model=RobotStatus)
async def reset_robot_stop():
    """Clear emergency stop flag."""
    hardware.reset_emergency_stop()
    return hardware.get_status()

# ----------------- AI PLANNER & CHAT -----------------

@app.get("/api/chat/history", response_model=list[ChatMessage])
async def get_chat_history():
    """Get conversation message history."""
    return planner.chat_history

@app.post("/api/chat/message", response_model=ChatMessage)
async def send_chat_message(req: UserPromptRequest):
    """
    Submits user prompt (e.g. 'Pick up the yellow cube and place it on the right side').
    Generates numbered execution plan awaiting confirmation.
    """
    bot_msg, _ = planner.create_plan_for_prompt(req.message)
    return bot_msg

@app.post("/api/chat/confirm/{plan_id}")
async def confirm_plan(plan_id: str):
    """Human-in-the-Loop Gate: Confirms plan and dispatches arm execution."""
    success = planner.confirm_and_execute_plan(plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Plan not found or already executed.")
    return {"status": "EXECUTION_STARTED", "plan_id": plan_id}

@app.post("/api/chat/cancel/{plan_id}")
async def cancel_plan(plan_id: str):
    """User cancels execution plan."""
    planner.cancel_plan(plan_id)
    return {"status": "PLAN_CANCELLED", "plan_id": plan_id}

# ----------------- WEBSOCKET -----------------

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """High-frequency real-time WebSocket connection for live telemetry."""
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            # Keep connection open; handle incoming ping/commands if any
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("action") == "PING":
                    await websocket.send_text(json.dumps({"action": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        if websocket in connected_clients:
            connected_clients.remove(websocket)
