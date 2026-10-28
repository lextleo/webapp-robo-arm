<div align="center">

# 🍁 AVEON
### **See. Understand. Act.**
**AI-Powered Computer Vision & Conversational Control Platform for 6-DOF Robotic Arms**

[![React](https://img.shields.io/badge/Frontend-React_18_%7C_TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_%7C_Python-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![OpenCV](https://img.shields.io/badge/Vision-OpenCV_%7C_NumPy-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](https://opencv.org/)
[![Hardware](https://img.shields.io/badge/Hardware-Arduino_Uno_%7C_ESP32--CAM-00979D?style=for-the-badge&logo=arduino&logoColor=white)](https://www.arduino.cc/)

</div>

---

## 📌 Overview

**AVEON** is a full-stack robotics control web application combining real-time OpenCV computer vision, conversational AI task planning, and safe hardware control for a 6-DOF robotic arm (**Arduino Uno R3 + PCA9685 + ESP32-CAM**).

| **Login & Readiness (`/login`)** | **Main Dashboard (`/dashboard`)** |
| :---: | :---: |
| ![AVEON Login](./docs/assets/login-preview.jpeg) | ![AVEON Dashboard](./docs/assets/dashboard-preview.jpeg) |

---

## ✨ Features

* **Real-Time Vision (`OpenCV` + `FastAPI`)**: Live ESP32-CAM MJPEG stream with FPS/latency HUD, face detection, HSV color tracking (**Red, Yellow, Green, Blue**), and calibrated distance estimation (`cm`).
* **Safe AI Assistant**: Converts commands like *"Pick up the yellow cube and place it on the right"* into a 5-step execution plan with a mandatory **Yes, proceed / Cancel** confirmation gate.
* **Hardware Protection**: Smooth servo interpolation, strict joint angle limits, and an instant **STOP** interrupt.
* **Demo Mode**: Built-in simulated camera feed and virtual robot state via **Try Demo Login** when hardware is disconnected.

---

## 🔌 Hardware Stack & Pinout

* **Controller**: Arduino Uno R3 + PCA9685 16-Channel PWM Driver (or Sensor Shield V4)
* **Vision & Wireless Node**: ESP32-CAM (AI-Thinker)
* **Actuators**: 3× MG90S (`J1` Base, `J2` Shoulder, `J3` Elbow) + 3× SG90 (`J4` Wrist Pitch, `J5` Wrist Roll, `J6` Gripper)
* **Power**: External 5V–6V 3A+ DC supply connected to PCA9685 `V+` (common `GND` shared with Arduino & ESP32)

| Joint | Function | Servo | PCA9685 Channel | Safe Limits |
| :---: | :--- | :---: | :---: | :---: |
| **J1–J3** | Base, Shoulder, Elbow | MG90S | `CH0 – CH2` | `0° – 180°` (`J2: 15°–165°`) |
| **J4–J5** | Wrist Pitch & Roll | SG90 | `CH3 – CH4` | `0° – 180°` |
| **J6** | Gripper (`Open` / `Close`) | SG90 | `CH5` | `20° – 110°` |

---

## ⚙️ Installation Guide

### 1. Prerequisites
* **Node.js** (`v18+`), **Python** (`v3.10+`), **Git**, and **Arduino IDE**.

### 2. Clone the Repository
```bash
git clone [https://github.com/lextleo/aveon.git](https://github.com/lextleo/aveon.git)
cd aveon
