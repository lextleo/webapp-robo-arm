export interface VisionConfig {
  face_detection: boolean;
  object_detection: boolean;
  color_detection: boolean;
  distance_estimation: boolean;
  active: boolean;
  source: string;
}

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
  centroid: [number, number];
  color: string;
  distance_cm: number;
}

export interface VisionMetrics {
  fps: number;
  resolution: string;
  latency_ms: number;
  detected_faces: number;
  detected_objects: number;
  detected_colors: number;
  estimated_distance_cm: number;
  engine_status: string;
  opencv_status: string;
  model_type: string;
  simulation_mode: boolean;
  objects: DetectedObject[];
}

export interface RobotStatus {
  connected: boolean;
  position: string;
  gripper: string;
  joints: number[];
  is_moving: boolean;
  mode: string;
  last_ack?: string;
}

export interface PlanStep {
  id: number;
  description: string;
  completed: boolean;
}

export interface ExecutionPlan {
  plan_id: string;
  prompt: string;
  steps: PlanStep[];
  status: string; // "AWAITING_CONFIRMATION" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "STOPPED"
  target_color?: string;
  target_action?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  plan?: ExecutionPlan;
  awaiting_confirmation?: boolean;
}

export interface HealthStatus {
  system_online: boolean;
  camera: string;
  vision: string;
  robot: string;
  simulation_mode: boolean;
}

export interface TelemetryPayload {
  type: string;
  timestamp: number;
  robot: RobotStatus;
  vision: VisionMetrics;
}
