import React, { useState, useEffect } from 'react';
import { X, Sliders, RotateCcw, Check, ShieldAlert } from 'lucide-react';
import type { RobotStatus } from '../types';

interface RobotControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: RobotStatus;
  onMoveJoints: (joints: number[]) => void;
  onHome: () => void;
  onToggleGripper?: () => void;
  onEmergencyStop: () => void;
}

export const RobotControlModal: React.FC<RobotControlModalProps> = ({
  isOpen,
  onClose,
  status,
  onMoveJoints,
  onHome,
  onEmergencyStop,
}) => {
  const [localJoints, setLocalJoints] = useState<number[]>([90, 45, 120, 90, 90, 25]);

  useEffect(() => {
    if (status.joints && status.joints.length === 6) {
      setLocalJoints(status.joints);
    }
  }, [status.joints]);

  if (!isOpen) return null;

  const jointMeta = [
    { name: 'J1: Base Turntable (MG90)', min: 0, max: 180, desc: 'Horizontal Rotation' },
    { name: 'J2: Shoulder (MG90)', min: 15, max: 165, desc: 'Vertical Elevation' },
    { name: 'J3: Elbow (MG90)', min: 0, max: 180, desc: 'Forearm Pitch' },
    { name: 'J4: Wrist Pitch (SG90)', min: 0, max: 180, desc: 'Wrist Angle' },
    { name: 'J5: Wrist Roll (SG90)', min: 0, max: 180, desc: 'Gripper Rotation' },
    { name: 'J6: Gripper Claw (SG90)', min: 20, max: 110, desc: 'Clamping Width (20=Open, 100=Grip)' },
  ];

  const presets = [
    { label: 'Home Pose', joints: [90, 45, 120, 90, 90, 25] },
    { label: 'Hover Yellow', joints: [105, 65, 95, 80, 90, 25] },
    { label: 'Pick Yellow', joints: [105, 82, 75, 85, 90, 95] },
    { label: 'Place Right', joints: [35, 65, 100, 85, 90, 25] },
    { label: 'Place Left', joints: [145, 65, 100, 85, 90, 25] },
  ];

  const handleSliderChange = (idx: number, val: number) => {
    const next = [...localJoints];
    next[idx] = val;
    setLocalJoints(next);
  };

  const handleApply = () => {
    onMoveJoints(localJoints);
  };

  const applyPreset = (presetJoints: number[]) => {
    setLocalJoints(presetJoints);
    onMoveJoints(presetJoints);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D62828] text-white flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-none">6-DOF Robot Joint Control</h3>
              <p className="text-xs text-slate-400 mt-1">Direct PWM Servo Teleoperation & Calibrated Poses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Presets */}
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Preset Trajectories
            </span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(p.joints)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-200 hover:text-[#D62828] text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Joint Sliders */}
          <div className="space-y-4">
            {jointMeta.map((jm, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-slate-800">{jm.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2">({jm.desc})</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#D62828] bg-red-50 px-2 py-0.5 rounded">
                    {Math.round(localJoints[i] || 0)}°
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-mono">{jm.min}°</span>
                  <input
                    type="range"
                    min={jm.min}
                    max={jm.max}
                    value={localJoints[i] || 0}
                    onChange={(e) => handleSliderChange(i, Number(e.target.value))}
                    className="flex-1 accent-[#D62828] cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">{jm.max}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onEmergencyStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-[#D62828] font-bold text-xs transition-colors"
          >
            <ShieldAlert size={14} />
            <span>Emergency Stop</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              <RotateCcw size={13} />
              <span>Reset Home</span>
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#D62828] hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Check size={14} />
              <span>Send To Servos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
