import React from 'react';

interface MapleLeafProps {
  className?: string;
  size?: number;
  color?: string;
}

export const MapleLeafIcon: React.FC<MapleLeafProps> = ({
  className = '',
  size = 28,
  color = '#D62828',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 4 L53.5 24 L66 16 L63 29.5 L78 28.5 L70 40 L88 45 L76 56 L86 67 L69 67.5 L66 88 L51.5 76 L52.5 96 L47.5 96 L48.5 76 L34 88 L31 67.5 L14 67 L24 56 L12 45 L30 40 L22 28.5 L37 29.5 L34 16 L46.5 24 Z" />
    </svg>
  );
};
