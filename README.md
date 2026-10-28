<div align="center">

# 🍁 AVEON
### **See. Understand. Act.**
**AI-Powered Computer Vision & Conversational Control Platform for 6-DOF Robotic Arms**

[![React](https://img.shields.io/badge/Frontend-React_18_%7C_TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_%7C_Python_3.11-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![OpenCV](https://img.shields.io/badge/Vision-OpenCV_%7C_NumPy-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](https://opencv.org/)
[![Hardware](https://img.shields.io/badge/Hardware-Arduino_Uno_%7C_ESP32--CAM-00979D?style=for-the-badge&logo=arduino&logoColor=white)](https://www.arduino.cc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-D62828?style=for-the-badge)](./LICENSE)

[Overview](#-overview) • [System Architecture](#-system-architecture) • [Features](#-key-features) • [Hardware & Wiring](#-hardware--wiring) • [Quick Start](#-quick-start) • [Serial Protocol](#-serial-communication-protocol) • [Deployment](#-https--remote-deployment)

</div>

---

## 📌 Overview

**AVEON** is an end-to-end robotics control web application that bridges real-time OpenCV computer vision, natural language task planning, and deterministic microcontroller actuation. 

Designed for a **6-DOF robotic arm** powered by an **Arduino Uno R3**, **PCA9685 PWM driver**, and **ESP32-CAM**, AVEON allows operators to monitor live annotated camera feeds, track object distances and color coordinates, and issue natural language commands (e.g., *"Pick up the yellow cube and place it on the right side"*) through a safe, human-in-the-loop confirmation workflow.

### 📸 Interface Preview

| **Hardware Readiness & Login (`/login`)** | **Main Control Dashboard (`/dashboard`)** |
| :---: | :---: |
| ![AVEON Login](./docs/assets/login-preview.jpeg) | ![AVEON Dashboard](./docs/assets/dashboard-preview.jpeg) |

---

## 🏗 System Architecture

AVEON enforces strict isolation between AI intent parsing and physical hardware actuation. The AI Assistant never generates raw PWM signals; instead, it compiles natural language into a validated sequence of calibrated joint states that require operator confirmation before execution.

```mermaid
graph LR
    subgraph Frontend ["Vercel / Browser UI (React + TS)"]
        UI[AVEON Dashboard]
        Chat[AI Assistant & Confirmation Gate]
        HUD[Live Video HUD & Telemetry]
    end

    subgraph EdgeBackend ["Local PC Edge Server (Python / FastAPI)"]
        API[FastAPI REST & WebSocket Server]
        CV[OpenCV Vision Engine]
        Planner[Validated Task Planner & Pose State Machine]
    end

    subgraph Embedded ["Embedded Hardware Layer"]
        ESP[ESP32-CAM Wi-Fi & Stream Node]
        ARD[Arduino Uno R3 Motion Controller]
        PCA[PCA9685 / Servo Shield V4]
        ARM[6-DOF Arm: 3x MG90 + 3x SG90]
    end

    ESP -- "MJPEG Stream (:81/stream)" --> CV
    CV -- "Annotated Stream + FPS/Distance" --> HUD
    Chat -- "Natural Language Prompt" --> Planner
    Planner -- "5-Step Plan (Awaiting Approval)" --> Chat
    UI -- "POST /confirm or EMERGENCY STOP" --> API
    API -- "Validated Packet <CMD,J1..J6>" --> ESP
    ESP -- "UART Serial (115200 baud)" --> ARD
    ARD -- "Interpolated PWM Signals" --> PCA
    PCA --> ARM
