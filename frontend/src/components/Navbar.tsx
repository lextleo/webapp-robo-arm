import React from 'react';
import { Home, Eye, Bot, MessageSquare, Activity, Sun, Moon, AlertOctagon } from 'lucide-react';
import { MapleLeafIcon } from './MapleLeafIcon';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemOnline: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onEmergencyStop: () => void;
  isEmergencyStopped: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  systemOnline,
  theme,
  setTheme,
  onEmergencyStop,
  isEmergencyStopped,
}) => {
  const navItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: Home },
    { id: 'Vision', label: 'Vision', icon: Eye },
    { id: 'Robot', label: 'Robot', icon: Bot },
    { id: 'AI Assistant', label: 'AI Assistant', icon: MessageSquare },
    { id: 'Diagnostics', label: 'Diagnostics', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-2.5 transition-colors">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between">
        {/* Left: Brand Logo & Subtitle */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setActiveTab('Dashboard')}
        >
          <MapleLeafIcon size={34} color="#D62828" />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
              AVEON
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mt-0.5">
              AI • VISION • ROBOTICS
            </span>
          </div>
        </div>

        {/* Center: Navigation Pills matching screenshot */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-50/80 p-1 rounded-full border border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#D62828] text-white shadow-sm shadow-red-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status Area */}
        <div className="flex items-center gap-3">
          {/* Emergency Stop Button */}
          <button
            onClick={onEmergencyStop}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              isEmergencyStopped
                ? 'bg-red-700 text-white ring-4 ring-red-400'
                : 'bg-red-600 hover:bg-red-700 text-white pulse-emergency'
            }`}
            title="Immediate Emergency Stop - Detaches All Actuators"
          >
            <AlertOctagon size={14} className="stroke-[2.5]" />
            <span>{isEmergencyStopped ? 'E-STOPPED' : 'EMERGENCY STOP'}</span>
          </button>

          {/* System Online Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-[12px] font-medium text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{systemOnline ? 'System Online' : 'System Offline'}</span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* User Avatar Circle ('S' in red) */}
          <div className="w-8 h-8 rounded-full bg-[#8B1E1E] text-white flex items-center justify-center font-semibold text-xs shadow-sm ring-2 ring-red-100">
            S
          </div>
        </div>
      </div>
    </header>
  );
};
