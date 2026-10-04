import React from 'react';

export interface ChipProps {
  label: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Chip: React.FC<ChipProps> = ({ label, className = '', style }) => {
  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
      style={{
        fontFamily: 'var(--fs)',
        fontSize: '11px',
        padding: '0 6px',
        lineHeight: '18px',
        border: '1px solid var(--bd)',
        borderRadius: '3px',
        backgroundColor: 'var(--panel)',
        color: 'var(--mut)',
        ...style,
      }}
    >
      {label}
    </span>
  );
};
