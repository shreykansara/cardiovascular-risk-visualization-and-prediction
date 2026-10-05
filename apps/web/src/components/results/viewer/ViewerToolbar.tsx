import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export type PresetView = 'Front' | 'Left' | 'Back' | 'Right';

interface ViewerToolbarProps {
  currentAzimuth: number; // degrees, [-180, 180]
  onSelectView: (view: PresetView) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  className?: string;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  currentAzimuth,
  onSelectView,
  onZoomIn,
  onZoomOut,
  onResetView,
  className = '',
}) => {
  // Normalize azimuth to [-180, 180]
  let norm = ((currentAzimuth + 180) % 360 + 360) % 360 - 180;

  // Determine nearest view within 15 degrees
  const isFront = Math.abs(norm) <= 15;
  const isRight = Math.abs(norm - 90) <= 15;
  const isLeft = Math.abs(norm - (-90)) <= 15;
  const isBack = Math.abs(Math.abs(norm) - 180) <= 15;

  const views: { key: PresetView; label: string; active: boolean }[] = [
    { key: 'Front', label: 'Front', active: isFront },
    { key: 'Left', label: 'Left', active: isLeft },
    { key: 'Back', label: 'Back', active: isBack },
    { key: 'Right', label: 'Right', active: isRight },
  ];

  return (
    <div
      id="viewer-toolbar"
      className={`flex items-center justify-between flex-wrap gap-2 mt-2 w-full select-none ${className}`}
      style={{
        marginTop: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      {/* Left: Segmented control Front | Left | Back | Right (32px high) */}
      <div
        role="group"
        aria-label="Preset 3D camera angles"
        className="flex items-center rounded overflow-hidden"
        style={{
          height: '32px',
          border: '1px solid var(--bds)',
          borderRadius: '3px',
          backgroundColor: 'var(--panel)',
          display: 'flex',
        }}
      >
        {views.map((v, idx) => (
          <button
            key={v.key}
            type="button"
            id={`view-preset-${v.key.toLowerCase()}`}
            aria-pressed={v.active}
            onClick={() => onSelectView(v.key)}
            style={{
              height: '30px',
              padding: '0 12px',
              fontSize: '12px',
              fontFamily: 'var(--fs)',
              fontWeight: v.active ? 600 : 500,
              color: v.active ? 'var(--onacc)' : 'var(--ink)',
              backgroundColor: v.active ? 'var(--acc)' : 'transparent',
              border: 'none',
              borderRight: idx < views.length - 1 ? '1px solid var(--bds)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
            className="hover:bg-hover transition-colors"
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Right: Three 32px icon buttons (ZoomOut, ZoomIn, RotateCcw) */}
      <div
        className="flex items-center gap-1.5"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <button
          type="button"
          id="viewer-zoom-out"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={onZoomOut}
          style={{
            width: '32px',
            height: '32px',
            minWidth: '32px',
            borderRadius: '3px',
            border: '1px solid var(--bds)',
            backgroundColor: 'var(--panel)',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          className="hover:bg-hover transition-colors"
        >
          <ZoomOut size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          id="viewer-zoom-in"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={onZoomIn}
          style={{
            width: '32px',
            height: '32px',
            minWidth: '32px',
            borderRadius: '3px',
            border: '1px solid var(--bds)',
            backgroundColor: 'var(--panel)',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          className="hover:bg-hover transition-colors"
        >
          <ZoomIn size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          id="viewer-reset-view"
          aria-label="Reset view"
          title="Reset view"
          onClick={onResetView}
          style={{
            width: '32px',
            height: '32px',
            minWidth: '32px',
            borderRadius: '3px',
            border: '1px solid var(--bds)',
            backgroundColor: 'var(--panel)',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          className="hover:bg-hover transition-colors"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default ViewerToolbar;
