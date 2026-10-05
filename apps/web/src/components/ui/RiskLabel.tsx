import React from 'react';
import { riskLabel, RiskBand } from '@/config/riskBands';

export interface RiskLabelProps {
  band?: RiskBand | string;
  probability?: number;
  afterNumber?: boolean;
  variant?: 'app' | 'sheet';
  className?: string;
  style?: React.CSSProperties;
}

export const RiskLabel: React.FC<RiskLabelProps> = ({
  band,
  probability,
  afterNumber = false,
  variant = 'app',
  className = '',
  style,
}) => {
  const resolvedBand: RiskBand = (band && (band === 'Low' || band === 'Moderate' || band === 'High'))
    ? (band as RiskBand)
    : probability !== undefined
    ? riskLabel(probability)
    : 'Low';

  const isSheet = variant === 'sheet';
  let dotColor = isSheet ? 'var(--s-low)' : 'var(--low)';
  if (resolvedBand === 'Moderate') {
    dotColor = isSheet ? 'var(--s-mod)' : 'var(--mod)';
  } else if (resolvedBand === 'High') {
    dotColor = isSheet ? 'var(--s-high)' : 'var(--high)';
  }

  const textColor = isSheet ? 'var(--s-ink)' : 'var(--ink)';

  return (
    <span
      className={`inline-flex items-center ${isSheet ? 'risk-label-sheet' : ''} ${className}`}
      style={{
        gap: '6px',
        marginLeft: afterNumber ? '10px' : undefined,
        userSelect: 'none',
        ...style,
      }}
    >
      {/* 8px round dot */}
      <span
        className={`risk-dot risk-dot-${resolvedBand.toLowerCase()}`}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {/* The word ("Low", "Moderate", "High") in Sora 12px/600 */}
      <span
        className="risk-label-text"
        style={{
          fontFamily: 'var(--fs)',
          fontSize: '12px',
          fontWeight: 600,
          color: textColor,
          lineHeight: '1',
        }}
      >
        {resolvedBand}
      </span>
    </span>
  );
};
