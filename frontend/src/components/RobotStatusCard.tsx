import React from 'react';
import { Bot, Sliders, RotateCcw, Hand } from 'lucide-react';
import type { RobotStatus } from '../types';
import { RobotArmGraphic } from './RobotArmGraphic';

interface RobotStatusCardProps {
  status: RobotStatus;
  openRobotModal: () => void;
  onHome: () => void;
  onToggleGripper: () => void;
}

export const RobotStatusCard: React.FC<RobotStatusCardProps> = ({
  status,
  openRobotModal,
  onHome,
  onToggleGripper,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col justify-between transition-all">
      {/* 1. Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#D62828] text-white flex items-center justify-center shadow-sm shadow-red-500/20">
            <Bot size={18} />
          </div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">Robot Status</h2>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>CONNECTED</span>
          </div>
        </div>

        {/* Quick actions: Manual Controls slider icon */}
        <button
          onClick={openRobotModal}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-[#D62828] hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
          title="Open Manual Joint Controls"
        >
          <Sliders size={13} />
          <span>Manual Control</span>
        </button>
      </div>

      {/* 2. Telemetry and 3D Graphic */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Left Telemetry columns */}
        <div className="sm:col-span-7 grid grid-cols-2 gap-y-3.5 gap-x-4 pl-1">
          {/* Position */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Position</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5">{status.position}</span>
          </div>

          {/* Joints (6) */}
          <div className="flex flex-col col-span-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Joints (6)</span>
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-800 mt-0.5">
              {status.joints.map((angle, idx) => (
                <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                  {Math.round(angle)}°
                </span>
              ))}
            </div>
          </div>

          {/* Gripper */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Gripper</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5">{status.gripper}</span>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onHome}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
              title="Return Arm to Home Position"
            >
              <RotateCcw size={12} />
              <span>Home</span>
            </button>
            <button
              onClick={onToggleGripper}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
              title="Toggle Gripper Open/Close"
            >
              <Hand size={12} />
              <span>{status.gripper === 'Open' ? 'Grip' : 'Release'}</span>
            </button>
          </div>
        </div>

        {/* Right Robot 3D Illustration matching reference screenshot */}
        <div className="sm:col-span-5 h-36 flex items-center justify-center p-1">
          <RobotArmGraphic
            compact={true}
            jointAngles={status.joints}
            className="w-full h-full max-h-36"
          />
        </div>
      </div>
    </div>
  );
};
