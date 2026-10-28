import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Save } from 'lucide-react';
import type { VisionConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VisionConfig;
  onUpdateConfig: (newConfig: Partial<VisionConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [streamUrl, setStreamUrl] = useState('http://192.168.4.1:81/stream');
  const [serialPort, setSerialPort] = useState('AUTO');
  const [baudRate, setBaudRate] = useState('115200');
  const [focalLength, setFocalLength] = useState('620.0');
  const [cubeWidth, setCubeWidth] = useState('3.5');

  if (!isOpen) return null;

  const handleSave = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D62828] text-white flex items-center justify-center">
              <SettingsIcon size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-none">AVEON Settings</h3>
              <p className="text-xs text-slate-400 mt-1">Camera, Hardware Bridge & Calibration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Video Feed Source */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Video Stream Source</label>
            <select
              value={config.source}
              onChange={(e) => onUpdateConfig({ source: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium"
            >
              <option value="ESP32-CAM">ESP32-CAM (MJPEG Stream)</option>
              <option value="USB Webcam">USB Webcam (Local /dev/video0)</option>
              <option value="Simulated Feed">Simulated Feed (Virtual Robotics Workspace)</option>
            </select>
          </div>

          {/* ESP32-CAM URL */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">ESP32-CAM Stream URL</label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800"
            />
          </div>

          {/* Hardware Serial Port */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Arduino Serial Port</label>
              <input
                type="text"
                value={serialPort}
                onChange={(e) => setSerialPort(e.target.value)}
                placeholder="AUTO / COM3 / /dev/ttyUSB0"
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Baud Rate</label>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium"
              >
                <option value="115200">115200 (Default)</option>
                <option value="57600">57600</option>
                <option value="9600">9600</option>
              </select>
            </div>
          </div>

          {/* Distance Calibration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Object Width (cm)</label>
              <input
                type="number"
                step="0.1"
                value={cubeWidth}
                onChange={(e) => setCubeWidth(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Focal Length (F)</label>
              <input
                type="number"
                step="1"
                value={focalLength}
                onChange={(e) => setFocalLength(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#D62828] hover:bg-red-700 text-white font-semibold text-xs shadow-xs"
          >
            <Save size={13} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
