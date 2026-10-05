import React from 'react';
import { RISK_BANDS, getRiskColorToken } from '@/config/riskBands';

export interface BarProps {
  value: number; // 0.0 to 1.0 (or 0 to 100 if specified)
  variant?: 'probability' | 'thin';
  fillColor?: string; // override color (e.g. for factor bars: var(--high) or var(--acc))
  animationIndex?: number; // --i for stagger
  className?: string;
  style?: React.CSSProperties;
}

export const Bar: React.FC<BarProps> = ({
  value,
  variant = 'probability',
  fillColor,
  animationIndex,
  className = '',
  style,
}) => {
  // Normalize value to 0..1 range if > 1 (e.g. 45 -> 0.45)
  const normalizedValue = value > 1 ? Math.min(1, Math.max(0, value / 100)) : Math.min(1, Math.max(0, value));
  const percent = `${normalizedValue * 100}%`;

  const isThin = variant === 'thin';
  const color = fillColor || getRiskColorToken(normalizedValue);

  const modStartPercent = `${RISK_BANDS.Moderate.minProb * 100}%`;
  const highStartPercent = `${RISK_BANDS.High.minProb * 100}%`;

  if (isThin) {
    return (
      <div
        className={`w-full ${className}`}
        style={{
          height: '4px',
          marginTop: '3px',
          backgroundColor: 'var(--bd)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '0',
          ...style,
        }}
      >
        <div
          className="bar-fill"
          style={{
            height: '100%',
            width: percent,
            backgroundColor: color,
            transformOrigin: 'left',
            ...((animationIndex !== undefined ? { '--i': animationIndex } : {}) as React.CSSProperties),
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full relative ${className}`}
      style={{
        height: '6px',
        marginTop: '9px',
        backgroundColor: 'var(--bd)',
        position: 'relative',
        ...style,
      }}
    >
      {/* Fill: height 100%, background = risk color, transform-origin left */}
      <div
        className="bar-fill"
        style={{
          height: '100%',
          width: percent,
          backgroundColor: color,
          transformOrigin: 'left',
          ...((animationIndex !== undefined ? { '--i': animationIndex } : {}) as React.CSSProperties),
        }}
      />

      {/* A tick overlay on top: repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), var(--panel) calc(10% - 1px) 10%) at opacity .55, pointer-events none */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), var(--panel) calc(10% - 1px) 10%)',
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />

      {/* Two marker lines: absolutely positioned, width 1px, height 12px, top -3px, background --mut, opacity .7, at Moderate and High starts */}
      <div
        style={{
          position: 'absolute',
          left: modStartPercent,
          top: '-3px',
          width: '1px',
          height: '12px',
          backgroundColor: 'var(--mut)',
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: highStartPercent,
          top: '-3px',
          width: '1px',
          height: '12px',
          backgroundColor: 'var(--mut)',
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
