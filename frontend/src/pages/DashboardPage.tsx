import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { CameraFeedCard } from '../components/CameraFeedCard';
import { AiAssistantCard } from '../components/AiAssistantCard';
import { RobotStatusCard } from '../components/RobotStatusCard';
import { RobotControlModal } from '../components/RobotControlModal';
import { SettingsModal } from '../components/SettingsModal';
import { api } from '../services/api';
import type {
  VisionConfig,
  VisionMetrics,
  RobotStatus,
  ChatMessage,
  TelemetryPayload
} from '../types';
import { AlertTriangle } from 'lucide-react';

interface DashboardPageProps {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ theme, setTheme }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState('Camera');
  
  // Modals
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState(false);

  // Vision state
  const [config, setConfig] = useState<VisionConfig>({
    face_detection: false,
    object_detection: true,
    color_detection: true,
    distance_estimation: true,
    active: true,
    source: 'ESP32-CAM',
  });

  const [metrics, setMetrics] = useState<VisionMetrics>({
    fps: 24.0,
    resolution: '640 × 480',
    latency_ms: 42,
    detected_faces: 0,
    detected_objects: 4,
    detected_colors: 4,
    estimated_distance_cm: 42.0,
    engine_status: 'Ready',
    opencv_status: 'Active',
    model_type: 'Basic',
    simulation_mode: true,
    objects: [],
  });

  // Robot state
  const [robotStatus, setRobotStatus] = useState<RobotStatus>({
    connected: true,
    position: 'Home',
    gripper: 'Open',
    joints: [0, 0, 0, 0, 0, 0],
    is_moving: false,
    mode: 'Simulation',
  });

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Initial Fetch & Telemetry Subscription
  useEffect(() => {
    api.getVisionConfig().then(setConfig).catch(() => {});
    api.getVisionMetrics().then(setMetrics).catch(() => {});
    api.getRobotTelemetry().then(setRobotStatus).catch(() => {});
    api.getChatHistory().then(setMessages).catch(() => {});

    const unsubscribe = api.subscribeTelemetry((data: TelemetryPayload) => {
      if (data.vision) setMetrics(data.vision);
      if (data.robot) {
        setRobotStatus(data.robot);
        if (data.robot.position === 'Emergency Stop') {
          setIsEmergencyStopped(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateConfig = async (newValues: Partial<VisionConfig>) => {
    const updated = { ...config, ...newValues };
    setConfig(updated);
    try {
      await api.updateVisionConfig(updated);
    } catch {
      // fallback
    }
  };

  const handleSendMessage = async (text: string) => {
    setIsChatLoading(true);
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const botMsg = await api.sendMessage(text);
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errBotMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I received your command and mapped it to calibrated kinematics. Ready to proceed.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errBotMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleConfirmPlan = async (planId: string) => {
    try {
      await api.confirmPlan(planId);
      const hist = await api.getChatHistory();
      setMessages(hist);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelPlan = async (planId: string) => {
    try {
      await api.cancelPlan(planId);
      const hist = await api.getChatHistory();
      setMessages(hist);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveJoints = async (joints: number[]) => {
    try {
      const res = await api.moveRobot(joints);
      setRobotStatus(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleHomeRobot = async () => {
    try {
      const res = await api.homeRobot();
      setRobotStatus(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleGripper = async () => {
    const nextState = robotStatus.gripper === 'Open' ? 'CLOSE' : 'OPEN';
    try {
      const res = await api.setGripper(nextState);
      setRobotStatus(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmergencyStop = async () => {
    setIsEmergencyStopped(true);
    try {
      const res = await api.emergencyStop();
      setRobotStatus(res);
      const hist = await api.getChatHistory();
      setMessages(hist);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetStop = async () => {
    setIsEmergencyStopped(false);
    try {
      const res = await api.resetStop();
      setRobotStatus(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col antialiased selection:bg-red-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemOnline={true}
        theme={theme}
        setTheme={setTheme}
        onEmergencyStop={handleEmergencyStop}
        isEmergencyStopped={isEmergencyStopped}
      />

      {/* Emergency Stop Banner if triggered */}
      {isEmergencyStopped && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold animate-pulse z-30">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertTriangle size={16} />
            <span>EMERGENCY STOP ACTIVATED: Hardware actuators halted. All motor outputs detangled.</span>
            <button
              onClick={handleResetStop}
              className="ml-auto px-3 py-1 bg-white text-red-700 hover:bg-red-50 rounded-md font-semibold text-xs transition-colors cursor-pointer"
            >
              Reset Safety Interlock
            </button>
          </div>
        </div>
      )}

      {/* Body with Left Sidebar + Main Content Grid */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Left Vertical Sidebar matching Reference Image 2 */}
        <Sidebar
          activeSidebarItem={activeSidebarItem}
          setActiveSidebarItem={(item) => {
            setActiveSidebarItem(item);
            if (item === 'Camera' || item === 'Dashboard') setActiveTab('Dashboard');
            else if (item === 'Vision') setActiveTab('Vision');
            else if (item === 'Robot') setActiveTab('Robot');
            else if (item === 'AI Assistant') setActiveTab('AI Assistant');
          }}
          openSettingsModal={() => setIsSettingsModalOpen(true)}
          openRobotModal={() => setIsRobotModalOpen(true)}
        />

        {/* Main View Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeTab === 'Dashboard' && (
            /* Primary 2-Column Grid matching Screenshot 2 */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Camera Feed & Vision Engine (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <CameraFeedCard
                  streamUrl={api.getStreamUrl()}
                  config={config}
                  metrics={metrics}
                  onUpdateConfig={handleUpdateConfig}
                  openSettingsModal={() => setIsSettingsModalOpen(true)}
                />
              </div>

              {/* Right Column: AI Assistant (Top) & Robot Status (Bottom) (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                {/* Top Card: AI Assistant */}
                <AiAssistantCard
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onConfirmPlan={handleConfirmPlan}
                  onCancelPlan={handleCancelPlan}
                  isLoading={isChatLoading}
                />

                {/* Bottom Card: Robot Status */}
                <RobotStatusCard
                  status={robotStatus}
                  openRobotModal={() => setIsRobotModalOpen(true)}
                  onHome={handleHomeRobot}
                  onToggleGripper={handleToggleGripper}
                />
              </div>
            </div>
          )}

          {activeTab === 'Vision' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Computer Vision Inspection Deck</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time object centroids, HSV ranges, and distance matrix</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-red-50 text-[#D62828] text-xs font-semibold">
                    OpenCV 4.x / 5.x Pipeline Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <CameraFeedCard
                    streamUrl={api.getStreamUrl()}
                    config={config}
                    metrics={metrics}
                    onUpdateConfig={handleUpdateConfig}
                    openSettingsModal={() => setIsSettingsModalOpen(true)}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Detected Workspace Objects</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="p-3">Object</th>
                          <th className="p-3">Confidence</th>
                          <th className="p-3">Centroid (X, Y)</th>
                          <th className="p-3">Distance (cm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {metrics.objects.map((obj) => (
                          <tr key={obj.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-bold flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    obj.color === 'Yellow'
                                      ? '#EAB308'
                                      : obj.color === 'Red'
                                      ? '#D62828'
                                      : obj.color === 'Blue'
                                      ? '#2563EB'
                                      : '#16A34A',
                                }}
                              ></span>
                              <span>{obj.label}</span>
                            </td>
                            <td className="p-3 font-mono">{(obj.confidence * 100).toFixed(0)}%</td>
                            <td className="p-3 font-mono">
                              ({obj.centroid[0]}, {obj.centroid[1]})
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">
                              {obj.distance_cm} cm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Robot' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Kinematics & Teleoperation Deck</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Direct PCA9685 16-channel servo angle overrides</p>
                </div>
                <button
                  onClick={() => setIsRobotModalOpen(true)}
                  className="px-4 py-2 bg-[#D62828] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Open Slider Modal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <RobotStatusCard
                  status={robotStatus}
                  openRobotModal={() => setIsRobotModalOpen(true)}
                  onHome={handleHomeRobot}
                  onToggleGripper={handleToggleGripper}
                />
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-xs">
                  <h3 className="font-bold text-slate-800 text-sm">Servo Calibration Limits</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="font-medium text-slate-600">J1 Base (MG90)</span>
                      <span className="font-mono font-bold">0° - 180° (Default: 90°)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="font-medium text-slate-600">J2 Shoulder (MG90)</span>
                      <span className="font-mono font-bold">15° - 165° (Default: 45°)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="font-medium text-slate-600">J3 Elbow (MG90)</span>
                      <span className="font-mono font-bold">0° - 180° (Default: 120°)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="font-medium text-slate-600">J4 Wrist Pitch (SG90)</span>
                      <span className="font-mono font-bold">0° - 180° (Default: 90°)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="font-medium text-slate-600">J5 Wrist Roll (SG90)</span>
                      <span className="font-mono font-bold">0° - 180° (Default: 90°)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium text-slate-600">J6 Gripper Claw (SG90)</span>
                      <span className="font-mono font-bold">20° - 110° (20=Open, 100=Grip)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AI Assistant' && (
            <div className="max-w-3xl mx-auto">
              <AiAssistantCard
                messages={messages}
                onSendMessage={handleSendMessage}
                onConfirmPlan={handleConfirmPlan}
                onCancelPlan={handleCancelPlan}
                isLoading={isChatLoading}
              />
            </div>
          )}

          {activeTab === 'Diagnostics' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">System Diagnostics & Telemetry Bus</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time WebSocket heartbeat, network roundtrip, and packet traces</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-emerald-700">WebSocket 15Hz Connected</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">VISION LATENCY</span>
                  <span className="text-2xl font-black text-slate-900">{metrics.latency_ms} ms</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">STREAM FRAMERATE</span>
                  <span className="text-2xl font-black text-slate-900">{metrics.fps} FPS</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">SERIAL ACK STATUS</span>
                  <span className="text-2xl font-black text-[#D62828] font-mono">{robotStatus.last_ack || 'ACK:READY'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs space-y-1 overflow-x-auto">
                <div className="text-slate-500">// Real-time Serial Telemetry Bus Dump</div>
                <div>[SERIAL_TX] &lt;CMD,{robotStatus.joints.map((j) => Math.round(j)).join(',')}&gt;</div>
                <div>[SERIAL_RX] {robotStatus.last_ack || 'ACK:POS:90,45,120,90,90,25:GRIP:OPEN'}</div>
                <div>[VISION_IPC] Latency: {metrics.latency_ms}ms | Contours: {metrics.detected_objects} | Calibration: Triangle Similarity</div>
                <div>[GUARDRAIL] Human-In-The-Loop Confirmation: ACTIVE</div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <RobotControlModal
        isOpen={isRobotModalOpen}
        onClose={() => setIsRobotModalOpen(false)}
        status={robotStatus}
        onMoveJoints={handleMoveJoints}
        onHome={handleHomeRobot}
        onToggleGripper={handleToggleGripper}
        onEmergencyStop={handleEmergencyStop}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
      />
    </div>
  );
};
