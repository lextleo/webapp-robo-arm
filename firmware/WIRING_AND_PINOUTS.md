# AVEON Robotics Hardware Wiring & Pinout Guide

This document details the complete wiring schematics, actuator mapping, power distribution, and safety considerations for the AVEON 6-DOF Robotic Arm and ESP32-CAM vision node.

---

## 1. System Architecture Diagram

```
+-------------------------------------------------------------+
|                     AVEON CONTROL SERVER                    |
|      (FastAPI + OpenCV Pipeline + Safe AI Task Planner)     |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            | (HTTP / MJPEG)                      | (USB Serial / UART)
            v                                     v
+-----------------------+              +----------------------+
|   ESP32-CAM NODE      |              |   ARDUINO UNO R3     |
|   - OV2640 Sensor     |              |   - Kinetic Firmware |
|   - Port 81: /stream  |              |   - Safe Limits      |
|   - Port 80: /command |              |   - Smooth Easing    |
+-----------+-----------+              +----------+-----------+
            |                                     |
            | (UART TX/RX)                        | (I2C SDA/SCL)
            +------------------------------------>+
                                                  |
                                                  v
                                       +----------------------+
                                       |   PCA9685 16-CH PWM  |
                                       +----------+-----------+
                                                  |
                     +----------------------------+----------------------------+
                     |         |         |         |         |                 |
                    CH0       CH1       CH2       CH3       CH4               CH5
                     |         |         |         |         |                 |
                   Base    Shoulder    Elbow     Wrist     Wrist            Gripper
                   MG90      MG90      MG90     Pitch SG  Roll SG           Claw SG
```

---

## 2. Power Supply Architecture (CRITICAL SAFETY RULE)

> [!CAUTION]
> **NEVER power the 6 servo actuators from the Arduino Uno 5V pin or USB bus!**
> Six servos under mechanical load draw up to 3.5 Amps peak. Drawing this from the Arduino will cause instantaneous voltage drop, ATmega328P brownout resets, and permanent damage to the USB controller.

- **Main Servo Power Supply**: Regulated **5.0V DC @ 4.0A to 5.0A** power brick connected directly to the **V+ screw terminals** on the PCA9685 driver.
- **Logic Power**: 5V from Arduino `5V` pin connected to `VCC` on the PCA9685 board.
- **Common Ground**: Ensure the external 5V power supply ground is tied together with the Arduino ground (`GND`).

---

## 3. PCA9685 16-Channel I2C PWM Driver Wiring

### Logic Connections (Arduino Uno -> PCA9685)
| Arduino Uno Pin | PCA9685 Pin | Description |
| :--- | :--- | :--- |
| **A4** | **SDA** | I2C Data Line (400 kHz Fast Mode) |
| **A5** | **SCL** | I2C Clock Line |
| **5V** | **VCC** | Logic Power (Low Current) |
| **GND** | **GND** | Logic Common Ground |
| **External 5V+** | **V+** (Screw Terminal) | High-Current Servo Power Rail |
| **External GND** | **GND** (Screw Terminal)| Servo Power Return |

### Servo Actuator Channel Assignment
| PCA9685 Channel | Actuator Role | Servo Model | Safe Angular Range | Calibrated Home |
| :--- | :--- | :--- | :--- | :--- |
| **Channel 0** | Joint 1: Base Turntable | MG90S Metal Gear | `0° to 180°` | `90°` |
| **Channel 1** | Joint 2: Shoulder Lift | MG90S Metal Gear | `15° to 165°` | `45°` |
| **Channel 2** | Joint 3: Elbow Pitch | MG90S Metal Gear | `0° to 180°` | `120°` |
| **Channel 3** | Joint 4: Wrist Pitch | SG90 Nylon/Carbon | `0° to 180°` | `90°` |
| **Channel 4** | Joint 5: Wrist Roll | SG90 Nylon/Carbon | `0° to 180°` | `90°` |
| **Channel 5** | Joint 6: Gripper Claw | SG90 Nylon/Carbon | `20° to 110°` | `25° (Open)` |

---

## 4. Alternative Direct Arduino Sensor Shield V4 Wiring

If operating without the PCA9685 driver, change `#define USE_PCA9685 0` in `arduino_arm_controller.ino`. Connect the servo signal wires directly to PWM pins:

| Joint | Servo Role | Arduino Uno PWM Pin |
| :--- | :--- | :--- |
| **J1** | Base | **Pin 3** |
| **J2** | Shoulder | **Pin 5** |
| **J3** | Elbow | **Pin 6** |
| **J4** | Wrist Pitch | **Pin 9** |
| **J5** | Wrist Roll | **Pin 10** |
| **J6** | Gripper Claw | **Pin 11** |

---

## 5. ESP32-CAM Node Pinout & Bridge Connections

| ESP32-CAM Pin | Target Connection | Notes |
| :--- | :--- | :--- |
| **5V** | Regulated 5V Rail | Camera requires solid 5V supply |
| **GND** | Common System Ground | |
| **U0T (TX)** | Arduino Uno **RX (Pin 0)** | Transmits `<CMD>` packets from WiFi bridge |
| **U0R (RX)** | Arduino Uno **TX (Pin 1)** | Receives `ACK:POS` telemetry packets |

---

## 6. Serial ASCII Frame Specification

All serial packets are framed by `<` and `>` and terminated with `\n` at **115200 baud**:

1. **Move Joints**:
   ```
   <CMD,90,45,120,90,90,25>
   ```
2. **Move to Home**:
   ```
   <HOME>
   ```
3. **Open Gripper**:
   ```
   <GRIP,OPEN>
   ```
4. **Close Gripper**:
   ```
   <GRIP,CLOSE>
   ```
5. **Emergency Stop**:
   ```
   <STOP>
   ```
6. **Arduino Acknowledgment Telemetry**:
   ```
   ACK:POS:90,45,120,90,90,25:GRIP:OPEN
   ```
