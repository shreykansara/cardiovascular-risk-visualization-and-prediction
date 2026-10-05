import React, { useState, useEffect } from 'react';
import { Rotate3d, HelpCircle } from 'lucide-react';
import { IconButton } from '../../ui/IconButton';

interface ViewerHintProps {
  hasInteracted: boolean;
  onShowAgain?: () => void;
  className?: string;
}

export const ViewerHint: React.FC<ViewerHintProps> = ({
  hasInteracted,
  className = '',
}) => {
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(pointer: coarse)');
      setIsCoarsePointer(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsCoarsePointer(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  // When user interacts, dismiss the hint (unless user clicked ? to re-show)
  useEffect(() => {
    if (hasInteracted && !forceShow) {
      setUserDismissed(true);
    }
  }, [hasInteracted, forceShow]);

  const showHint = !userDismissed || forceShow;

  if (!showHint) {
    return (
      <IconButton
        id="viewer-help-button"
        aria-label="Show 3D controls help"
        title="Show 3D controls help"
        size="sm"
        variant="secondary"
        onClick={() => {
          setForceShow(true);
          setUserDismissed(false);
        }}
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          zIndex: 25,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '13px',
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          ?
        </span>
      </IconButton>
    );
  }

  return (
    <div
      id="viewer-hint-chip"
      role="note"
      aria-label="3D interaction instructions"
      style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--bds)',
        borderRadius: '3px',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--ink)',
        fontFamily: 'var(--fs)',
        fontSize: '12px',
        lineHeight: 1.2,
        zIndex: 25,
        transition: 'opacity 180ms ease',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
      className={className}
    >
      <Rotate3d
        size={16}
        style={{ color: 'var(--acc)', flexShrink: 0 }}
        aria-hidden="true"
      />
      <span>
        {isCoarsePointer
          ? 'Swipe sideways to rotate · Pinch to zoom · Tap an artery'
          : 'Drag to rotate · Scroll to zoom · Click an artery'}
      </span>
    </div>
  );
};

export default ViewerHint;
