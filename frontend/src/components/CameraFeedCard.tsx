import React, { useState, useRef } from 'react';
import {
  Camera,
  Play,
  Square,
  Maximize2,
  Minimize2,
  Settings as SettingsIcon,
  Smile,
  Box,
  Palette,
  Maximize,
  ChevronDown
} from 'lucide-react';
import type { VisionConfig, VisionMetrics } from '../types';

interface CameraFeedCardProps {
  streamUrl: string;
  config: VisionConfig;
  metrics: VisionMetrics;
  onUpdateConfig: (newConfig: Partial<VisionConfig>) => void;
  openSettingsModal: () => void;
}

export const CameraFeedCard: React.FC<CameraFeedCardProps> = ({
  streamUrl,
  config,
  metrics,
  onUpdateConfig,
  openSettingsModal,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleToggle = (key: keyof VisionConfig) => {
    onUpdateConfig({ [key]: !config[key] });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col transition-all">
      {/* 1. Card Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Red camera icon badge */}
          <div className="w-8 h-8 rounded-lg bg-[#D62828] text-white flex items-center justify-center shadow-sm shadow-red-500/20">
            <Camera size={18} />
          </div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">Camera Feed</h2>
          {/* Green Connected Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>CONNECTED</span>
          </div>
        </div>

        {/* Source Dropdown & Settings Gear */}
        <div className="flex items-center gap-2.5">
          <div className="relative inline-block">
            <select
              value={config.source}
              onChange={(e) => onUpdateConfig({ source: e.target.value })}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer shadow-xs"
            >
              <option value="ESP32-CAM">ESP32-CAM</option>
              <option value="USB Webcam">USB Webcam</option>
              <option value="Simulated Feed">Simulated Feed</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={openSettingsModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Camera & Vision Settings"
          >
            <SettingsIcon size={17} />
          </button>
        </div>
      </div>

      {/* 2. Video Viewport */}
      <div
        ref={videoContainerRef}
        className="relative bg-slate-900 aspect-16/10 sm:aspect-16/9 w-full overflow-hidden flex items-center justify-center select-none"
      >
        {config.active ? (
          <img
            src={streamUrl}
            alt="Robotics Live Vision Stream"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              setTimeout(() => {
                target.src = `${streamUrl}?t=${Date.now()}`;
              }, 1500);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Camera size={44} className="mb-2 opacity-40 text-red-400" />
            <span className="text-sm font-semibold text-slate-300">Vision Engine Paused</span>
            <span className="text-xs text-slate-500 mt-1">Click "Start Vision" to resume stream processing</span>
          </div>
        )}

        {/* Top-Left Translucent HUD Pill */}
        {config.active && (
          <div className="absolute top-3 left-3 bg-slate-950/75 backdrop-blur-md text-slate-100 text-[11px] font-mono font-medium px-3 py-1 rounded-md border border-white/10 shadow-md">
            FPS: {metrics.fps} | {metrics.resolution} | Latency: {metrics.latency_ms}ms
          </div>
        )}

        {/* Bottom-Right Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-3 right-3 p-1.5 bg-black/60 hover:bg-black/85 text-white/90 hover:text-white rounded-md backdrop-blur-xs transition-colors shadow-sm"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* 3. Vision Features Control Row */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm flex items-center justify-center text-[#D62828]">
              <Maximize size={16} className="stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-slate-800 tracking-tight">Vision Features</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateConfig({ active: true })}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                config.active
                  ? 'bg-[#D62828] text-white shadow-xs'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <Play size={12} fill="currentColor" />
              <span>Start Vision</span>
            </button>
            <button
              onClick={() => onUpdateConfig({ active: false })}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all`}
            >
              <Square size={12} />
              <span>Stop</span>
            </button>
          </div>
        </div>

        {/* 4 Feature Toggles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Face Detection */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Smile size={16} className="text-[#D62828]" />
              <span className="text-xs font-medium text-slate-700">Face Detection</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('face_detection')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.face_detection ? 'bg-[#D62828]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  config.face_detection ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Object Detection */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Box size={16} className="text-[#D62828]" />
              <span className="text-xs font-medium text-slate-700">Object Detection</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('object_detection')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.object_detection ? 'bg-[#D62828]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  config.object_detection ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Color Detection */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-[#D62828]" />
              <span className="text-xs font-medium text-slate-700">Color Detection</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('color_detection')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.color_detection ? 'bg-[#D62828]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  config.color_detection ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Distance Estimation */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Maximize size={16} className="text-[#D62828]" />
              <span className="text-xs font-medium text-slate-700">Distance Estimation</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('distance_estimation')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.distance_estimation ? 'bg-[#D62828]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  config.distance_estimation ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Live Metric Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-white">
        {/* Detected Faces */}
        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Smile size={14} className="text-[#D62828]" />
            <span className="text-[11px] font-medium">Detected Faces</span>
          </div>
          <span className="text-xl font-bold text-slate-900 leading-tight">
            {metrics.detected_faces}
          </span>
        </div>

        {/* Detected Objects */}
        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Box size={14} className="text-[#D62828]" />
            <span className="text-[11px] font-medium">Detected Objects</span>
          </div>
          <span className="text-xl font-bold text-slate-900 leading-tight">
            {metrics.detected_objects}
          </span>
        </div>

        {/* Detected Colors */}
        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Palette size={14} className="text-[#D62828]" />
            <span className="text-[11px] font-medium">Detected Colors</span>
          </div>
          <span className="text-xl font-bold text-slate-900 leading-tight">
            {metrics.detected_colors}
          </span>
        </div>

        {/* Estimated Distance */}
        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Maximize size={14} className="text-[#D62828]" />
            <span className="text-[11px] font-medium">Estimated Distance</span>
          </div>
          <span className="text-xl font-bold text-slate-900 leading-tight">
            {metrics.estimated_distance_cm} cm
          </span>
        </div>
      </div>

      {/* 5. Card Footer Status Bar */}
      <div className="px-5 py-2.5 bg-slate-50/90 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Vision Engine: {metrics.engine_status}</span>
          </div>
          <div>• OpenCV: {metrics.opencv_status}</div>
          <div>• Model: {metrics.model_type}</div>
        </div>

        {metrics.simulation_mode && (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wide">
            SIMULATION MODE
          </span>
        )}
      </div>
    </div>
  );
};
