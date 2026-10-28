from typing import List, Optional
from pydantic import BaseModel, Field

class VisionConfig(BaseModel):
    face_detection: bool = False
    object_detection: bool = True
    color_detection: bool = True
    distance_estimation: bool = True
    active: bool = True
    source: str = "ESP32-CAM"  # "ESP32-CAM", "USB Webcam", "Simulated Feed"

class DetectedObject(BaseModel):
    id: str
    label: str
    confidence: float
    bbox: List[int] = Field(description="[x, y, width, height]")
    centroid: List[int] = Field(description="[cx, cy]")
    color: str
    distance_cm: float

class VisionMetrics(BaseModel):
    fps: float = 24.0
    resolution: str = "640 × 480"
    latency_ms: int = 42
    detected_faces: int = 0
    detected_objects: int = 4
    detected_colors: int = 4
    estimated_distance_cm: float = 42.0
    engine_status: str = "Ready"
    opencv_status: str = "Active"
    model_type: str = "Basic"
    simulation_mode: bool = True
    objects: List[DetectedObject] = []

class RobotStatus(BaseModel):
    connected: bool = True
    position: str = "Home"  # "Home", "Picking", "Placing", "Custom", "Emergency Stop"
    gripper: str = "Open"   # "Open", "Closed"
    joints: List[float] = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]  # J1 to J6 in degrees
    is_moving: bool = False
    mode: str = "Simulation"  # "Hardware" or "Simulation"
    last_ack: Optional[str] = "ACK:READY"

class PlanStep(BaseModel):
    id: int
    description: str
    completed: bool = False

class ExecutionPlan(BaseModel):
    plan_id: str
    prompt: str
    steps: List[PlanStep]
    status: str = "AWAITING_CONFIRMATION"  # "AWAITING_CONFIRMATION", "IN_PROGRESS", "COMPLETED", "CANCELLED", "STOPPED"
    target_color: Optional[str] = None
    target_action: Optional[str] = None

class ChatMessage(BaseModel):
    id: str
    sender: str  # "user" or "assistant"
    text: str
    timestamp: str
    plan: Optional[ExecutionPlan] = None
    awaiting_confirmation: bool = False

class UserPromptRequest(BaseModel):
    message: str

class JointMoveRequest(BaseModel):
    joints: List[float]  # [J1, J2, J3, J4, J5, J6]
    speed: Optional[float] = 1.0

class GripperRequest(BaseModel):
    state: str  # "OPEN" or "CLOSE"

class HealthStatus(BaseModel):
    system_online: bool = True
    camera: str = "READY"    # "READY", "CONNECTING", "STANDBY", "OFFLINE"
    vision: str = "READY"    # "READY", "STANDBY", "OFFLINE"
    robot: str = "STANDBY"   # "READY", "STANDBY", "OFFLINE"
    simulation_mode: bool = True
