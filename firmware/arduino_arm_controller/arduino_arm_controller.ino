/*
 * ==============================================================================
 * AVEON - Robotic Arm Firmware (Arduino Uno R3)
 * Target: Arduino Uno R3 / Nano (ATmega328P @ 16MHz)
 * Baud Rate: 115200 baud
 * Actuators: 6-DOF (J1: MG90 Base, J2: MG90 Shoulder, J3: MG90 Elbow,
 *                   J4: SG90 Wrist Pitch, J5: SG90 Wrist Roll, J6: SG90 Gripper)
 * Drivers Supported: 
 *   1) PCA9685 16-Channel 12-bit PWM Driver over I2C (Address 0x40)
 *   2) Direct Arduino PWM Pins / Sensor Shield V4
 * ==============================================================================
 */

#include <Arduino.h>
#include <Wire.h>

// Set to 1 to use PCA9685 I2C PWM Driver (Recommended)
// Set to 0 to use Direct Arduino Servo Library on PWM pins (3, 5, 6, 9, 10, 11)
#define USE_PCA9685 1

#if USE_PCA9685
  #include <Adafruit_PWMServoDriver.h>
  Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x40);
  #define SERVOMIN  125 // 0 degrees (pulse length in ticks at 50Hz)
  #define SERVOMAX  575 // 180 degrees (pulse length in ticks at 50Hz)
#else
  #include <Servo.h>
  Servo servos[6];
  const int SERVO_PINS[6] = {3, 5, 6, 9, 10, 11};
#endif

// Mechanical Safety Limits (Degrees)
const float JOINT_MIN[6] = {  0.0,  15.0,   0.0,   0.0,   0.0,  20.0};
const float JOINT_MAX[6] = {180.0, 165.0, 180.0, 180.0, 180.0, 110.0};

// Home Pose (Degrees)
const float HOME_POSE[6] = {90.0, 45.0, 120.0, 90.0, 90.0, 25.0};

// Kinematic State
float currentAngles[6] = {90.0, 45.0, 120.0, 90.0, 90.0, 25.0};
float startAngles[6]   = {90.0, 45.0, 120.0, 90.0, 90.0, 25.0};
float targetAngles[6]  = {90.0, 45.0, 120.0, 90.0, 90.0, 25.0};

// Gripper state: 0 = Closed (100°), 1 = Open (25°)
bool gripperOpen = true;

// Trajectory Interpolation Engine
bool isMoving = false;
unsigned long moveStartTime = 0;
unsigned long moveDurationMs = 1200; // default duration per movement segment

// Serial Packet Parsing Buffer
const int BUFFER_SIZE = 64;
char rxBuffer[BUFFER_SIZE];
int rxIndex = 0;
bool packetReady = false;

// Convert degrees (0-180) to PCA9685 PWM pulse ticks
int angleToPulse(float angle) {
  angle = constrain(angle, 0.0, 180.0);
  return map((int)(angle * 10), 0, 1800, SERVOMIN, SERVOMAX);
}

// Low-level hardware output
void writeServoAngle(int jointIndex, float angle) {
  angle = constrain(angle, JOINT_MIN[jointIndex], JOINT_MAX[jointIndex]);
  
#if USE_PCA9685
  pwm.setPWM(jointIndex, 0, angleToPulse(angle));
#else
  servos[jointIndex].write((int)round(angle));
#endif
}

// Emergency stop: detach / stop PWM immediately
void emergencyStopAll() {
  isMoving = false;
#if USE_PCA9685
  for (int i = 0; i < 6; i++) {
    pwm.setPWM(i, 0, 0); // 0 duty cycle detaches servo
  }
#else
  for (int i = 0; i < 6; i++) {
    if (servos[i].attached()) {
      servos[i].detach();
    }
  }
#endif
  Serial.println(F("ACK:STOPPED:EMERGENCY_HALT"));
}

// Re-attach / energize servos
void reattachServos() {
#if USE_PCA9685
  for (int i = 0; i < 6; i++) {
    writeServoAngle(i, currentAngles[i]);
  }
#else
  for (int i = 0; i < 6; i++) {
    if (!servos[i].attached()) {
      servos[i].attach(SERVO_PINS[i]);
    }
    writeServoAngle(i, currentAngles[i]);
  }
#endif
}

// Send Deterministic Telemetry Packet
void sendTelemetryAck() {
  Serial.print(F("ACK:POS:"));
  for (int i = 0; i < 6; i++) {
    Serial.print((int)round(currentAngles[i]));
    if (i < 5) Serial.print(F(","));
  }
  Serial.print(F(":GRIP:"));
  Serial.println(gripperOpen ? F("OPEN") : F("CLOSED"));
}

// Initiate smooth interpolated motion
void startMoveTo(float j1, float j2, float j3, float j4, float j5, float j6, unsigned long durationMs = 1000) {
  reattachServos();
  for (int i = 0; i < 6; i++) {
    startAngles[i] = currentAngles[i];
  }
  targetAngles[0] = constrain(j1, JOINT_MIN[0], JOINT_MAX[0]);
  targetAngles[1] = constrain(j2, JOINT_MIN[1], JOINT_MAX[1]);
  targetAngles[2] = constrain(j3, JOINT_MIN[2], JOINT_MAX[2]);
  targetAngles[3] = constrain(j4, JOINT_MIN[3], JOINT_MAX[3]);
  targetAngles[4] = constrain(j5, JOINT_MIN[4], JOINT_MAX[4]);
  targetAngles[5] = constrain(j6, JOINT_MIN[5], JOINT_MAX[5]);

  moveStartTime = millis();
  moveDurationMs = max(durationMs, 100UL);
  isMoving = true;
}

// Parse deterministic ASCII protocol frame: <CMD,J1,J2,J3,J4,J5,J6>, <HOME>, <GRIP,OPEN>, <STOP>
void parseCommandPacket(char* packet) {
  // Remove leading '<' and trailing '>'
  if (packet[0] == '<') packet++;
  int len = strlen(packet);
  if (len > 0 && packet[len - 1] == '>') {
    packet[len - 1] = '\0';
  }

  // 1. EMERGENCY STOP
  if (strcmp(packet, "STOP") == 0) {
    emergencyStopAll();
    return;
  }

  // 2. RETURN HOME
  if (strcmp(packet, "HOME") == 0) {
    gripperOpen = true;
    startMoveTo(HOME_POSE[0], HOME_POSE[1], HOME_POSE[2], HOME_POSE[3], HOME_POSE[4], HOME_POSE[5], 1200);
    sendTelemetryAck();
    return;
  }

  // 3. GRIPPER CONTROL
  if (strncmp(packet, "GRIP,", 5) == 0) {
    char* arg = packet + 5;
    if (strcmp(arg, "OPEN") == 0) {
      gripperOpen = true;
      startMoveTo(currentAngles[0], currentAngles[1], currentAngles[2], currentAngles[3], currentAngles[4], 25.0, 500);
    } else if (strcmp(arg, "CLOSE") == 0) {
      gripperOpen = false;
      startMoveTo(currentAngles[0], currentAngles[1], currentAngles[2], currentAngles[3], currentAngles[4], 95.0, 500);
    }
    sendTelemetryAck();
    return;
  }

  // 4. COORDINATE MOVE: CMD,j1,j2,j3,j4,j5,j6
  if (strncmp(packet, "CMD,", 4) == 0) {
    char* token = strtok(packet + 4, ",");
    float parsedJoints[6];
    int count = 0;
    while (token != NULL && count < 6) {
      parsedJoints[count++] = atof(token);
      token = strtok(NULL, ",");
    }

    if (count == 6) {
      startMoveTo(parsedJoints[0], parsedJoints[1], parsedJoints[2],
                  parsedJoints[3], parsedJoints[4], parsedJoints[5], 1000);
      sendTelemetryAck();
    } else {
      Serial.println(F("ERR:INVALID_JOINT_COUNT"));
    }
    return;
  }

  Serial.println(F("ERR:UNKNOWN_COMMAND"));
}

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 2000); // Allow USB connection

#if USE_PCA9685
  Wire.begin();
  pwm.begin();
  pwm.setOscillatorFrequency(27000000);
  pwm.setPWMFreq(50); // Standard analog/digital servo 50Hz update rate
  Wire.setClock(400000); // Fast 400kHz I2C bus
#else
  for (int i = 0; i < 6; i++) {
    servos[i].attach(SERVO_PINS[i]);
  }
#endif

  // Move directly to Home pose at startup
  for (int i = 0; i < 6; i++) {
    currentAngles[i] = HOME_POSE[i];
    writeServoAngle(i, currentAngles[i]);
  }

  delay(400);
  Serial.println(F("AVEON_ARM_CONTROLLER_READY:V1.0"));
  sendTelemetryAck();
}

void loop() {
  // 1. Non-blocking Serial Packet Collector
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '<') {
      rxIndex = 0;
      rxBuffer[rxIndex++] = c;
    } else if (c == '>') {
      if (rxIndex < BUFFER_SIZE - 1) {
        rxBuffer[rxIndex++] = c;
        rxBuffer[rxIndex] = '\0';
        packetReady = true;
      }
    } else if (c == '\n' || c == '\r') {
      // Ignore newlines
    } else {
      if (rxIndex < BUFFER_SIZE - 1) {
        rxBuffer[rxIndex++] = c;
      }
    }

    if (packetReady) {
      parseCommandPacket(rxBuffer);
      packetReady = false;
      rxIndex = 0;
    }
  }

  // 2. Non-blocking Sinusoidal Trajectory Interpolation Engine
  if (isMoving) {
    unsigned long elapsed = millis() - moveStartTime;
    if (elapsed >= moveDurationMs) {
      // Reached destination
      for (int i = 0; i < 6; i++) {
        currentAngles[i] = targetAngles[i];
        writeServoAngle(i, currentAngles[i]);
      }
      isMoving = false;
      sendTelemetryAck();
    } else {
      // Sinusoidal ease-in-out formula: ease = (1 - cos(pi * t)) / 2
      float t = (float)elapsed / (float)moveDurationMs;
      float ease = (1.0 - cos(3.14159265 * t)) * 0.5;

      for (int i = 0; i < 6; i++) {
        currentAngles[i] = startAngles[i] + (targetAngles[i] - startAngles[i]) * ease;
        writeServoAngle(i, currentAngles[i]);
      }
    }
  }

  // 3. Periodic Background Heartbeat (every 2500ms)
  static unsigned long lastHeartbeat = 0;
  if (!isMoving && millis() - lastHeartbeat > 2500) {
    lastHeartbeat = millis();
    sendTelemetryAck();
  }
}
