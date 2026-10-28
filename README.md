# AVEON — AI Robotics & Computer Vision Platform

**AVEON** is a production-grade, end-to-end AI Robotics Control Web Application, Computer Vision Backend, and Microcontroller Firmware suite designed for 6-DOF robotic arms. Built to match the production visual interface in layout, Canadian Maple Red palette (`#D62828`), and component hierarchy, AVEON provides complete real hardware control and a realistic simulation/demo fallback mode.

---

## 📸 Reference Screens & Layout

| Screen 1: Login & Hardware Readiness Gate | Screen 2: Main Control Dashboard |
| :---: | :---: |
| Real-time pings to `/api/health`, 5 feature pills, 3 readiness cards, OAuth, and Try Demo Login | 2-column layout with live MJPEG camera feed, OpenCV HUD overlays, 4 toggles, 4 metrics, safe AI conversational planner with 5-step confirmation gate, and 6-DOF telemetry |

---

## 🚀 Key Features

1. **High-Performance Computer Vision Pipeline (`OpenCV + NumPy`)**:
   - Multi-source input: **ESP32-CAM MJPEG stream**, **USB Webcam**, or **High-Fidelity Virtual Workspace** with 4 colored cubes (Red, Yellow, Green, Blue).
   - Real-time HSV segmentation, morphological noise filtering, and contour centroid tracking `(cx, cy)`.
   - **Calibrated Distance Estimation** via triangle similarity ($D = \frac{W \times F}{P}$).
   - Dynamic HUD pill (`FPS: 24 | 640 × 480 | Latency: 42ms`) and labeled bounding boxes matching the reference UI.
2. **Safe Conversational AI Task Planner (`Human-in-the-Loop Gate`)**:
   - Natural language intent parsing for pick-and-place, arm translations, and gripper actuation.
   - Maps intents exclusively to a validated state machine of calibrated poses (`HOME`, `HOVER_TARGET`, `PICK_TARGET`, `PLACE_RIGHT`, `PLACE_LEFT`, `OPEN_GRIPPER`, `CLOSE_GRIPPER`).
   - Generates a human-readable **5-step numbered execution plan** (red circular badges `1` through `5`).
   - Strict Human-in-the-Loop Confirmation Gate: Asks `"Shall I proceed with the task?"` with **`Yes, proceed`** and **`Cancel`** buttons before any actuator moves.
   - Instantaneous **Emergency Stop** (`POST /api/robot/stop`) halts all motor outputs immediately.
3. **Deterministic Microcontroller Firmware (`Arduino Uno R3 + PCA9685`)**:
   - `arduino_arm_controller.ino`: Non-blocking sinusoidal interpolation (`millis()`-based easing) prevents jerking, current spikes, and brownout resets.
   - Strict mechanical angular limits per joint (`J1: 0-180°`, `J2: 15-165°`, `J3: 0-180°`, `J4: 0-180°`, `J5: 0-180°`, `J6: 20-110°`).
   - ASCII framing protocol: `<CMD,j1,j2,j3,j4,j5,j6>`, `<HOME>`, `<GRIP,OPEN>`, `<GRIP,CLOSE>`, `<STOP>`.
   - Returns deterministic telemetry frames: `ACK:POS:j1,j2,j3,j4,j5,j6:GRIP:state`.
4. **Wireless Edge Vision Node (`ESP32-CAM`)**:
   - `esp32_cam_node.ino`: Serves low-latency MJPEG video on `:81/stream`.
   - Local HTTP REST endpoint on port 80 (`POST /command`) that forwards validated commands over Hardware UART (`GPIO 1 / GPIO 3`) to the Arduino.
5. **Real-Time WebSocket Telemetry (`15Hz Bus`)**:
   - WebSocket `/ws/telemetry` synchronizes vision detection metrics and joint angles with sub-50ms latency.

---

## 📂 Project Architecture

```
arrmm/
├── backend/                              # Python 3.11+ FastAPI Server
│   ├── config.py                         # Port, baud rate, and calibration constants
│   ├── hardware_controller.py            # Serial HAL, Kinematics & Simulation Fallback
│   ├── main.py                           # REST endpoints & WebSocket Telemetry Bus
│   ├── models.py                         # Pydantic Schemas
│   ├── planner.py                        # Safe AI Chatbot & 5-Step Plan State Machine
│   ├── requirements.txt                  # Python dependencies
│   └── vision_engine.py                  # OpenCV Pipeline, HSV Segmentation & HUD
├── frontend/                             # React 18 + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── components/
│   │   │   ├── AiAssistantCard.tsx       # Conversational Planner & Confirmation Gate
│   │   │   ├── CameraFeedCard.tsx        # Live Stream, 4 Toggles, 4 Metrics
│   │   │   ├── MapleLeafIcon.tsx         # Brand Maple Leaf SVG Icons
│   │   │   ├── Navbar.tsx                # Brand Header, Status Pill, E-STOP
│   │   │   ├── RobotArmGraphic.tsx       # 3D-Style Robot Arm Graphic with Joint Insignia
│   │   │   ├── RobotControlModal.tsx     # Direct 6-DOF Manual Joint Sliders
│   │   │   ├── RobotStatusCard.tsx       # Telemetry Grid (Position, Gripper, Joints)
│   │   │   ├── SettingsModal.tsx         # Camera, Baud Rate & Calibration Modal
│   │   │   └── Sidebar.tsx               # Left Vertical Icon Navigation
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx         # Screen 2: Main Control Dashboard
│   │   │   └── LoginPage.tsx             # Screen 1: Login & Hardware Readiness Gate
│   │   ├── services/
│   │   │   └── api.ts                    # REST API & WebSocket Client
│   │   ├── App.tsx                       # Main Router & Route Switcher
│   │   ├── index.css                     # Tailwind v4 Tokens & Maple Watermarks
│   │   └── types.ts                      # TypeScript Interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── firmware/
│   ├── arduino_arm_controller/
│   │   └── arduino_arm_controller.ino    # Arduino Uno R3 Smooth Kinematics Firmware
│   ├── esp32_cam_node/
│   │   └── esp32_cam_node.ino            # ESP32-CAM MJPEG Video & UART Bridge
│   └── WIRING_AND_PINOUTS.md             # Complete Wiring Schematics & Safety Guide
├── deploy/
│   ├── cloudflared/
│   │   └── config.yml                    # Cloudflare Tunnel Config for HTTPS Edge
│   ├── Caddyfile                         # Local TLS Reverse Proxy Config
│   ├── vercel.json                       # Vercel SPA Rewrite Rules
│   └── .env.example                      # Environment Template
├── start_all.bat                         # 1-Click Windows Launcher
├── start_all.sh                          # 1-Click Linux / macOS Launcher
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start FastAPI server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend initializes in **Simulation Mode** automatically if physical hardware is not detected.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.
- Click **"Screen 1: Login"** in the bottom-left floating switcher to view the **Login & Hardware Readiness Gate**.
- Click **"Try Demo Login"** or **"Screen 2: Dashboard"** to enter the **Main Control Dashboard**.

### 3. One-Click Launchers
- **Windows**: Double-click `start_all.bat`
- **Linux/macOS**: Run `chmod +x start_all.sh && ./start_all.sh`

---

## 🤖 AI Planner & Confirmation Workflow

1. In the AI Assistant card, send a command:
   ```
   "Pick up the yellow cube and place it on the right side."
   ```
2. The AI assistant maps your request to calibrated robotic kinematics and outputs a 5-step plan:
   1. Locate the yellow cube using vision.
   2. Move the arm to the object position.
   3. Close the gripper and pick up the cube.
   4. Move to the right side placement area.
   5. Open the gripper and place the cube.
3. The prompt displays: **`Shall I proceed with the task?`**
4. Click **`Yes, proceed`**: The robot arm initiates smooth sinusoidal trajectory execution step-by-step.
5. Click **`Cancel`**: The plan is aborted safely.
6. Click **`EMERGENCY STOP`** in the top navbar at any time to immediately cut all motor duty cycles.

---

## 📐 Computer Vision Calibration Formula

AVEON uses calibrated triangle similarity for distance calculation:

$$D = \frac{W \times F}{P}$$

Where:
- $W$ = Known physical object width ($3.5\text{ cm}$ standard cube width)
- $F$ = Calibrated camera focal length ($620.0\text{ px}$ at $640 \times 480$)
- $P$ = Perceived bounding box width in pixels
- $D$ = Calculated Euclidean distance in $\text{cm}$

---

## 🔌 Hardware Wiring Summary

- **Servos**: MG90S (Joints 1–3) and SG90 (Joints 4–6).
- **Driver**: PCA9685 I2C 16-channel driver at I2C address `0x40`.
- **Power**: External **5V 4A regulated DC** connected directly to the PCA9685 `V+` terminal.
- Full pinouts and diagrams are provided in [`/firmware/WIRING_AND_PINOUTS.md`](file:///c:/Users/ADITYA/Downloads/arrmm/firmware/WIRING_AND_PINOUTS.md).

---

## 🌐 Production Edge Deployment

To deploy the frontend to Vercel while keeping hardware connected to your local PC:
1. Deploy `frontend` to Vercel (using [`deploy/vercel.json`](file:///c:/Users/ADITYA/Downloads/arrmm/deploy/vercel.json)).
2. Expose the local FastAPI server over HTTPS using Cloudflare Tunnel:
   ```bash
   cloudflared tunnel --config deploy/cloudflared/config.yml run aveon-edge
   ```
3. Set `VITE_API_BASE_URL` and `VITE_WS_URL` in your Vercel project environment variables to prevent mixed-content browser blocks.
