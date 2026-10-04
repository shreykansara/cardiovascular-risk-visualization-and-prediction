import React from 'react';
import { riskLabel, RiskBand } from '@/config/riskBands';

export interface RiskLabelProps {
  band?: RiskBand | string;
  probability?: number;
  afterNumber?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const RiskLabel: React.FC<RiskLabelProps> = ({
  band,
  probability,
  afterNumber = false,
  className = '',
  style,
}) => {
  const resolvedBand: RiskBand = (band && (band === 'Low' || band === 'Moderate' || band === 'High'))
    ? (band as RiskBand)
    : probability !== undefined
    ? riskLabel(probability)
    : 'Low';

  let dotColor = 'var(--low)';
  if (resolvedBand === 'Moderate') {
    dotColor = 'var(--mod)';
  } else if (resolvedBand === 'High') {
    dotColor = 'var(--high)';
  }

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{
        gap: '6px',
        marginLeft: afterNumber ? '10px' : undefined,
        userSelect: 'none',
        ...style,
      }}
    >
      {/* 8px round dot */}
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {/* The word ("Low", "Moderate", "High") in Sora 12px/600, color --ink */}
      <span
        style={{
          fontFamily: 'var(--fs)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--ink)',
          lineHeight: '1',
        }}
      >
        {resolvedBand}
      </span>
    </span>
  );
};
