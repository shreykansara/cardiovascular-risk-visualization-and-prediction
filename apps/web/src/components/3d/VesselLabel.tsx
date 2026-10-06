import React, { forwardRef, useState } from 'react';

export interface VesselLabelProps {
  vesselKey: 'vessel_LAD' | 'vessel_LCX' | 'vessel_RCA';
  code: 'LAD' | 'LCX' | 'RCA';
  riskDotColor: string;
  riskText: string;
  placement: 'left' | 'right' | 'below';
  isSelected: boolean;
  onSelect: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

export const VesselLabel = forwardRef<HTMLDivElement, VesselLabelProps>(({
  vesselKey,
  code,
  riskDotColor,
  riskText,
  placement,
  isSelected,
  onSelect,
  onPointerOver,
  onPointerOut,
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const isHighlighted = isSelected || isHovered;

  let containerInnerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    pointerEvents: 'auto',
  };

  let leaderLine: React.ReactNode = null;

  if (placement === 'right') {
    // LCX: Anchor at (0, 0), leader line 12px right, then label box
    containerInnerStyle = {
      ...containerInnerStyle,
      transform: 'translate(0, -11px)',
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
    containerInnerStyle = {
      ...containerInnerStyle,
      transform: 'translate(-100%, -11px)',
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
    containerInnerStyle = {
      ...containerInnerStyle,
      transform: 'translate(-50%, 0)',
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
        transition: 'border-color 120ms ease, background-color 120ms ease',
      }}
    >
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
      <span
        style={{
          fontFamily: 'var(--fs)',
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {code}
      </span>
      <span
        style={{
          fontFamily: 'var(--fm)',
          fontSize: '11px',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--mut)',
        }}
      >
        {riskText}
      </span>
    </button>
  );

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'opacity 120ms ease',
        willChange: 'transform, opacity',
        zIndex: 2,
        transform: 'translate3d(0, 0, 0)',
        opacity: 1,
      }}
    >
      <div style={containerInnerStyle}>
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
    </div>
  );
});

VesselLabel.displayName = 'VesselLabel';
