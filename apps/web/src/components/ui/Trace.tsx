import React from 'react';

export interface TraceProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const Trace: React.FC<TraceProps> = ({
  width = 84,
  height = 16,
  className = '',
  style,
}) => {
  return (
    <svg
      viewBox="0 0 120 22"
      width={width}
      height={height}
      className={`trace ${className}`}
      style={{
        overflow: 'visible',
        display: 'inline-block',
        ...style,
      }}
    >
      <polyline
        pathLength="1"
        points="0,12 22,12 28,12 32,5 36,19 40,12 58,12 64,12 68,2 74,22 79,12 100,12 110,9 120,12"
        fill="none"
        stroke="var(--acc)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeDasharray="1"
        strokeDashoffset="0"
      />
    </svg>
  );
};
