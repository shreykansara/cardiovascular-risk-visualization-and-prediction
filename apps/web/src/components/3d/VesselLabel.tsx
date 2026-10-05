import React, { useState } from 'react';
import { Html } from '@react-three/drei';

export interface VesselLabelProps {
  vesselKey: 'vessel_LAD' | 'vessel_LCX' | 'vessel_RCA';
  code: 'LAD' | 'LCX' | 'RCA';
  riskDotColor: string;
  riskText: string;
  position: [number, number, number];
  placement: 'left' | 'right' | 'below';
  isSelected: boolean;
  isFacingAway: boolean;
  nudgeY?: number;
  onSelect: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

export const VesselLabel: React.FC<VesselLabelProps> = ({
  vesselKey,
  code,
  riskDotColor,
  riskText,
  position,
  placement,
  isSelected,
  isFacingAway,
  nudgeY = 0,
  onSelect,
  onPointerOver,
  onPointerOut,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Active / hover state styling: border var(--acc), background var(--hov)
  const isHighlighted = isSelected || isHovered;

  // Placement container styling for leader line attachment
  let containerStyle: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'auto',
    userSelect: 'none',
    opacity: isFacingAway ? 0.35 : 1.0,
    transition: 'opacity 180ms ease',
    transform: `translateY(${nudgeY}px)`,
    display: 'flex',
    alignItems: 'center',
  };

  let leaderLine: React.ReactNode = null;

  if (placement === 'right') {
    // LCX: Anchor at (0, 0), leader line 12px right, then label box
    containerStyle = {
      ...containerStyle,
      left: 0,
      top: '-11px', // vertically center 22px label box on anchor
      flexDirection: 'row',
    };
    leaderLine = (
      <div
        style={{
          width: '12px',
          height: '1px',
          backgroundColor: 'var(--ink)',
          opacity: 0.6,
          flexShrink: 0,
        }}
      />
    );
  } else if (placement === 'left') {
    // RCA: Anchor at (0, 0), label box on left, leader line 12px to anchor
    containerStyle = {
      ...containerStyle,
      right: 0,
      top: '-11px',
      flexDirection: 'row',
    };
    leaderLine = (
      <div
        style={{
          width: '12px',
          height: '1px',
          backgroundColor: 'var(--ink)',
          opacity: 0.6,
          flexShrink: 0,
        }}
      />
    );
  } else {
    // LAD: below anchor. Leader line 12px down, then label box
    containerStyle = {
      ...containerStyle,
      left: '-48px', // center ~96px box under anchor
      top: 0,
      flexDirection: 'column',
      alignItems: 'center',
    };
    leaderLine = (
      <div
        style={{
          width: '1px',
          height: '12px',
          backgroundColor: 'var(--ink)',
          opacity: 0.6,
          flexShrink: 0,
        }}
      />
    );
  }

  const labelButton = (
    <button
      type="button"
      id={`vessel-label-${code.toLowerCase()}`}
      data-vessel={vesselKey}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        onPointerOver?.();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onPointerOut?.();
      }}
      style={{
        height: '22px',
        padding: '0 6px',
        gap: '5px',
        borderRadius: '3px',
        backgroundColor: isHighlighted ? 'var(--hov)' : 'var(--panel)',
        border: `1px solid ${isHighlighted ? 'var(--acc)' : 'var(--bds)'}`,
        color: 'var(--ink)',
        whiteSpace: 'nowrap',
        maxWidth: '96px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'border-color 150ms ease, background-color 150ms ease',
      }}
    >
      {/* 6px risk-colour dot */}
      <span
        style={{
          width: '6px',
          height: '6px',
          minWidth: '6px',
          minHeight: '6px',
          borderRadius: '50%',
          backgroundColor: riskDotColor,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {/* Key: Sora 11px/600 */}
      <span
        style={{
          fontFamily: 'var(--fs)',
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: '0.02em',
        }}
      >
        {code}
      </span>
      {/* Value: IBM Plex Mono 11px */}
      <span
        style={{
          fontFamily: 'var(--fm)',
          fontSize: '11px',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {riskText}
      </span>
    </button>
  );

  return (
    <Html
      position={position}
      center={false}
      style={{ pointerEvents: 'auto', userSelect: 'none' }}
    >
      <div style={containerStyle}>
        {placement === 'left' ? (
          <>
            {labelButton}
            {leaderLine}
          </>
        ) : (
          <>
            {leaderLine}
            {labelButton}
          </>
        )}
      </div>
    </Html>
  );
};

export default VesselLabel;
