import React from 'react';
import { RiskLevel } from '../../config/riskBands';

export type BadgeRiskLevel = RiskLevel | 'Low' | 'Moderate' | 'High' | string;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'blue' | 'risk-low' | 'risk-moderate' | 'risk-high';
  riskLevel?: BadgeRiskLevel;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  riskLevel,
  size = 'md',
  className = '',
  ...props
}) => {
  let effectiveVariant = variant;
  if (riskLevel) {
    const normalized = riskLevel.toLowerCase();
    if (normalized === 'low') effectiveVariant = 'risk-low';
    else if (normalized === 'moderate') effectiveVariant = 'risk-moderate';
    else if (normalized === 'high') effectiveVariant = 'risk-high';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-mono-numbers',
    md: 'text-xs px-2.5 py-1 font-mono-numbers',
  }[size];

  const variantClasses = {
    neutral: 'bg-[#1c2637] text-slate-300 border border-[#283548]',
    blue: 'bg-blue-950/60 text-blue-300 border border-blue-800/60',
    'risk-low': 'bg-green-950/60 text-green-300 border border-green-800/60',
    'risk-moderate': 'bg-amber-950/60 text-amber-300 border border-amber-800/60',
    'risk-high': 'bg-red-950/60 text-red-300 border border-red-800/60',
  }[effectiveVariant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {effectiveVariant.startsWith('risk-') && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            effectiveVariant === 'risk-low'
              ? 'bg-green-400'
              : effectiveVariant === 'risk-moderate'
              ? 'bg-amber-400'
              : 'bg-red-400'
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
