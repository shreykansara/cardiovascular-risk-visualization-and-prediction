import React from 'react';

export interface ChipProps {
  label: React.ReactNode;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({ label, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 border border-border text-text-muted rounded text-[12px] leading-[16px] font-normal bg-page select-none ${className}`}
    >
      {label}
    </span>
  );
};
