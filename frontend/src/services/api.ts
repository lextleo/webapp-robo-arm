import type {
  VisionConfig,
  VisionMetrics,
  RobotStatus,
  HealthStatus,
  ChatMessage,
  TelemetryPayload
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const WS_BASE = import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? `wss://${window.location.host}` : `ws://${window.location.host}`);

export const api = {
  // Health
  async getHealth(): Promise<HealthStatus> {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return {
        system_online: true,
        camera: 'READY',
        vision: 'READY',
        robot: 'STANDBY',
        simulation_mode: true,
      };
    }
  },

  // Vision
  async getVisionConfig(): Promise<VisionConfig> {
    const res = await fetch(`${API_BASE}/api/vision/config`);
    return await res.json();
  },

  async updateVisionConfig(config: VisionConfig): Promise<VisionConfig> {
    const res = await fetch(`${API_BASE}/api/vision/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await res.json();
  },

  async getVisionMetrics(): Promise<VisionMetrics> {
    const res = await fetch(`${API_BASE}/api/vision/metrics`);
    return await res.json();
  },

  // Robot
  async getRobotTelemetry(): Promise<RobotStatus> {
    const res = await fetch(`${API_BASE}/api/robot/telemetry`);
    return await res.json();
  },

  async moveRobot(joints: number[]): Promise<RobotStatus> {
    const res = await fetch(`${API_BASE}/api/robot/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joints }),
    });
    return await res.json();
  },

  async setGripper(state: 'OPEN' | 'CLOSE'): Promise<RobotStatus> {
    const res = await fetch(`${API_BASE}/api/robot/gripper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
    return await res.json();
  },

  async homeRobot(): Promise<RobotStatus> {
    const res = await fetch(`${API_BASE}/api/robot/home`, { method: 'POST' });
    return await res.json();
  },

  async emergencyStop(): Promise<RobotStatus> {
    const res = await fetch(`${API_BASE}/api/robot/stop`, { method: 'POST' });
    return await res.json();
  },

  async resetStop(): Promise<RobotStatus> {
    const res = await fetch(`${API_BASE}/api/robot/reset`, { method: 'POST' });
    return await res.json();
  },

  // Chat & AI Planner
  async getChatHistory(): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE}/api/chat/history`);
    return await res.json();
  },

  async sendMessage(message: string): Promise<ChatMessage> {
    const res = await fetch(`${API_BASE}/api/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return await res.json();
  },

  async confirmPlan(planId: string): Promise<{ status: string; plan_id: string }> {
    const res = await fetch(`${API_BASE}/api/chat/confirm/${planId}`, { method: 'POST' });
    return await res.json();
  },

  async cancelPlan(planId: string): Promise<{ status: string; plan_id: string }> {
    const res = await fetch(`${API_BASE}/api/chat/cancel/${planId}`, { method: 'POST' });
    return await res.json();
  },

  // Stream URL
  getStreamUrl(): string {
    return `${API_BASE}/api/vision/stream`;
  },

  // Telemetry WebSocket
  subscribeTelemetry(onData: (data: TelemetryPayload) => void): () => void {
    let ws: WebSocket | null = null;
    let isSubscribed = true;
    let reconnectTimeout: number | undefined;

    const connect = () => {
      try {
        const wsUrl = `${WS_BASE}/ws/telemetry`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TELEMETRY_UPDATE') {
              onData(data);
            }
          } catch {
            // ignore parse err
          }
        };

        ws.onclose = () => {
          if (isSubscribed) {
            reconnectTimeout = window.setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        if (isSubscribed) {
          reconnectTimeout = window.setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isSubscribed = false;
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  },
};
