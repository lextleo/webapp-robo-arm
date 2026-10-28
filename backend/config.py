import os

class Settings:
    HOST: str = os.getenv("AVEON_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("AVEON_PORT", "8000"))
    
    # Serial / Hardware
    SERIAL_PORT: str = os.getenv("AVEON_SERIAL_PORT", "AUTO")
    SERIAL_BAUDRATE: int = int(os.getenv("AVEON_SERIAL_BAUD", "115200"))
    SIMULATION_FALLBACK: bool = True
    
    # ESP32-CAM Bridge
    ESP32_CAM_STREAM_URL: str = os.getenv("ESP32_CAM_STREAM_URL", "http://192.168.4.1:81/stream")
    ESP32_CAM_CMD_URL: str = os.getenv("ESP32_CAM_CMD_URL", "http://192.168.4.1/command")
    
    # Computer Vision Calibration (Triangle Similarity: D = (W * F) / P)
    KNOWN_OBJECT_WIDTH_CM: float = 3.5  # standard 3.5cm colored cubes
    CALIBRATED_FOCAL_LENGTH: float = 620.0  # calibrated at 640x480 resolution
    FRAME_WIDTH: int = 640
    FRAME_HEIGHT: int = 480
    TARGET_FPS: int = 24

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
        "*"
    ]

settings = Settings()
