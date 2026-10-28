import React from 'react';

interface RobotArmGraphicProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  jointAngles?: number[];
  compact?: boolean;
}

export const RobotArmGraphic: React.FC<RobotArmGraphicProps> = ({
  className = '',
  width = '100%',
  height = '100%',
  compact = false,
}) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 340 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="max-h-full drop-shadow-md select-none transition-transform duration-500 hover:scale-[1.02]"
      >
        <defs>
          <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="redAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="60%" stopColor="#D62828" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          <linearGradient id="darkMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#D62828" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Base Pedestal */}
        <ellipse cx="230" cy="305" rx="55" ry="18" fill="url(#metalGrad)" stroke="#94A3B8" strokeWidth="2.5" />
        <ellipse cx="230" cy="298" rx="42" ry="14" fill="url(#darkMetal)" />
        <rect x="208" y="260" width="44" height="38" rx="6" fill="url(#metalGrad)" stroke="#94A3B8" strokeWidth="2" />
        
        {/* Red Base Ring */}
        <rect x="206" y="278" width="48" height="10" rx="3" fill="url(#redAccentGrad)" />

        {/* Joint 1 / Base Turntable */}
        <circle cx="230" cy="255" r="22" fill="url(#darkMetal)" stroke="#64748B" strokeWidth="2" />
        <circle cx="230" cy="255" r="14" fill="url(#redAccentGrad)" />

        {/* Arm Segment 1: Lower Arm */}
        <g transform="rotate(-30 230 255)">
          <path
            d="M218 255 L214 140 Q214 130 224 130 L236 130 Q246 130 246 140 L242 255 Z"
            fill="url(#metalGrad)"
            stroke="#94A3B8"
            strokeWidth="2.5"
          />
          {/* Red Accent Stripe on Link 1 */}
          <rect x="216" y="165" width="28" height="40" rx="4" fill="url(#redAccentGrad)" />
          {/* Joint 2 Housing with Canadian Emblem */}
          <circle cx="230" cy="130" r="30" fill="url(#darkMetal)" stroke="#94A3B8" strokeWidth="3" filter="url(#shadowGlow)" />
          <circle cx="230" cy="130" r="22" fill="url(#redAccentGrad)" />
          {/* Maple Leaf Emblem on Joint 2 */}
          <path
            d="M230 115 L231.5 122 L236 119 L235 124 L240 123.5 L237.5 128 L243 130 L239 134 L242 138 L236.5 138 L235.5 145 L230.5 141 L231 147 L229 147 L229.5 141 L224.5 145 L223.5 138 L218 138 L221 134 L217 130 L222.5 128 L220 123.5 L225 124 L224 119 L228.5 122 Z"
            fill="#FFFFFF"
          />
        </g>

        {/* Arm Segment 2: Upper Forearm */}
        <path
          d="M172 118 L105 138 Q96 141 93 150 L85 174 Q82 182 89 187 L102 194 Q110 198 118 193 L185 148 Z"
          fill="url(#metalGrad)"
          stroke="#94A3B8"
          strokeWidth="2.5"
        />
        {/* Red Stripe on Forearm */}
        <path d="M142 138 L122 152 L128 166 L148 152 Z" fill="url(#redAccentGrad)" />

        {/* Wrist Joint & Actuator Pack */}
        <circle cx="94" cy="182" r="18" fill="url(#darkMetal)" stroke="#94A3B8" strokeWidth="2.5" />
        <circle cx="94" cy="182" r="10" fill="url(#redAccentGrad)" />

        {/* Gripper Wrist Extension */}
        <rect x="74" y="185" width="22" height="14" rx="3" transform="rotate(35 74 185)" fill="url(#metalGrad)" stroke="#64748B" strokeWidth="1.5" />

        {/* 2-Finger Industrial Claw Gripper */}
        {/* Left Claw Finger */}
        <path
          d="M65 195 L50 208 L44 225 L50 228 L56 215 L70 204 Z"
          fill="url(#darkMetal)"
          stroke="#475569"
          strokeWidth="1.5"
        />
        <circle cx="47" cy="226" r="3" fill="#D62828" />

        {/* Right Claw Finger */}
        <path
          d="M74 188 L72 208 L80 226 L86 223 L80 210 L81 194 Z"
          fill="url(#darkMetal)"
          stroke="#475569"
          strokeWidth="1.5"
        />
        <circle cx="83" cy="224" r="3" fill="#D62828" />

        {/* Subtle highlights */}
        {!compact && (
          <ellipse cx="230" cy="305" rx="70" ry="12" fill="#D62828" opacity="0.06" filter="blur(8px)" />
        )}
      </svg>
    </div>
  );
};
