import React from 'react';
import { Camera, Eye, Bot, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import { MapleLeafIcon } from './MapleLeafIcon';

interface SidebarProps {
  activeSidebarItem: string;
  setActiveSidebarItem: (item: string) => void;
  openSettingsModal: () => void;
  openRobotModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSidebarItem,
  setActiveSidebarItem,
  openSettingsModal,
  openRobotModal,
}) => {
  const items = [
    { id: 'Camera', label: 'Camera', icon: Camera },
    { id: 'Vision', label: 'Vision', icon: Eye },
    { id: 'Robot', label: 'Robot', icon: Bot, action: openRobotModal },
    { id: 'AI Assistant', label: 'AI Assistant', icon: MessageSquare },
    { id: 'Settings', label: 'Settings', icon: SettingsIcon, action: openSettingsModal },
  ];

  return (
    <aside className="hidden md:flex flex-col items-center justify-between w-20 py-5 bg-white border-r border-slate-200/80 shrink-0">
      {/* Icon Navigation stack */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSidebarItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveSidebarItem(item.id);
                if (item.action) item.action();
              }}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 group ${
                isActive
                  ? 'bg-[#D62828] text-white shadow-md shadow-red-500/25'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={20} className="mb-1 group-hover:scale-105 transition-transform" />
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-white' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer Branding & Watermark */}
      <div className="relative flex flex-col items-center w-full px-1 text-center select-none overflow-hidden pb-1">
        <div className="opacity-15 mb-1 pointer-events-none">
          <MapleLeafIcon size={48} color="#D62828" />
        </div>
        <span className="text-[9px] font-medium text-slate-400 tracking-tight leading-tight">
          Built for a<br />smarter tomorrow
        </span>
      </div>
    </aside>
  );
};
