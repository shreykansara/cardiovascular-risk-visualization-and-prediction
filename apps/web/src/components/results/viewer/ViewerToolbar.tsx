import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { SegmentedControl, SegmentedOption } from '../../ui/SegmentedControl';
import { IconButton } from '../../ui/IconButton';

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
  const [selectedView, setSelectedView] = React.useState<PresetView | null>(null);

  // Normalize azimuth to [-180, 180]
  let norm = ((currentAzimuth + 180) % 360 + 360) % 360 - 180;

  // Determine nearest view within 15 degrees
  let cameraView: PresetView = 'Front';
  if (Math.abs(norm - 90) <= 15) cameraView = 'Right';
  else if (Math.abs(norm - (-90)) <= 15) cameraView = 'Left';
  else if (Math.abs(Math.abs(norm) - 180) <= 15) cameraView = 'Back';

  React.useEffect(() => {
    setSelectedView(null);
  }, [cameraView]);

  const activeView = selectedView || cameraView;

  const handleSelectView = (view: PresetView) => {
    setSelectedView(view);
    onSelectView(view);
  };

  const viewOptions: SegmentedOption<PresetView>[] = [
    { id: 'Front', label: 'Front', elementId: 'view-preset-front' },
    { id: 'Left', label: 'Left', elementId: 'view-preset-left' },
    { id: 'Back', label: 'Back', elementId: 'view-preset-back' },
    { id: 'Right', label: 'Right', elementId: 'view-preset-right' },
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
      <SegmentedControl<PresetView>
        aria-label="Preset 3D camera angles"
        options={viewOptions}
        value={activeView}
        onChange={handleSelectView}
        size="sm"
      />

      <div
        className="flex items-center gap-1.5"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <IconButton
          id="viewer-zoom-out"
          size="sm"
          variant="secondary"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={onZoomOut}
        >
          <ZoomOut size={16} aria-hidden="true" />
        </IconButton>

        <IconButton
          id="viewer-zoom-in"
          size="sm"
          variant="secondary"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={onZoomIn}
        >
          <ZoomIn size={16} aria-hidden="true" />
        </IconButton>

        <IconButton
          id="viewer-reset-view"
          size="sm"
          variant="secondary"
          aria-label="Reset view"
          title="Reset view"
          onClick={onResetView}
        >
          <RotateCcw size={16} aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
};

export default ViewerToolbar;
