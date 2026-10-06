import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { HeartModel } from './HeartModel';
import { CameraRig } from './CameraRig';
import { usePatientStore } from '../../store/usePatientStore';
import { RotateCcw, RotateCw, HelpCircle } from 'lucide-react';
import { VIEWER_BG } from '../canvas/viewerConfig';

export interface HeartCanvasProps {
  results?: {
    cad: number;
    lad: number;
    lcx: number;
    rca: number;
  };
  selection?: string | null;
  onSelect?: (vesselKey: string | null) => void;
  isLanding?: boolean;
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export const HeartCanvas: React.FC<HeartCanvasProps> = ({
  results,
  selection,
  onSelect,
  isLanding = false,
}) => {
  const controlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const { activeVesselFocus, setVesselFocus } = usePatientStore();

  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
    if (typeof window !== 'undefined') {
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    }
  }, []);

  // When selection changes on landing page, hide the hint
  useEffect(() => {
    if (isLanding && selection) {
      setShowHint(false);
    }
  }, [isLanding, selection]);

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    if (onSelect) {
      onSelect(null);
    } else {
      setVesselFocus('default');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isLanding) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      handleResetView();
      return;
    }
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;
    const cam = ctrl.object;
    if (!cam) return;

    setShowHint(false);
    const step = (5 * Math.PI) / 180;
    const r = cam.position.length() || 3.1;
    let angle = ctrl.getAzimuthalAngle();
    let polar = ctrl.getPolarAngle();

    if (e.key === 'ArrowLeft') {
      angle -= step;
    } else if (e.key === 'ArrowRight') {
      angle += step;
    } else if (e.key === 'ArrowUp') {
      polar = Math.max(Math.PI * 0.15, polar - step);
    } else if (e.key === 'ArrowDown') {
      polar = Math.min(Math.PI * 0.85, polar + step);
    }

    cam.position.x = r * Math.sin(polar) * Math.sin(angle);
    cam.position.y = r * Math.cos(polar);
    cam.position.z = r * Math.sin(polar) * Math.cos(angle);
    ctrl.update();
  };

  if (!webglSupported) {
    return (
      <div
        className="w-full h-full flex items-center justify-center p-4 text-center select-none"
        style={{ backgroundColor: VIEWER_BG }}
      >
        <div
          style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--bds)',
            borderRadius: '3px',
            padding: '8px 14px',
            fontSize: '12px',
            color: 'var(--ink)',
            fontFamily: 'var(--fs)',
          }}
        >
          3D view is not supported on this device.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={isLanding ? 0 : undefined}
      role={isLanding ? 'group' : undefined}
      aria-label={
        isLanding
          ? '3D heart. Arrow keys rotate, Escape clears the selection.'
          : undefined
      }
      onKeyDown={handleKeyDown}
      className={`relative w-full h-full overflow-hidden select-none outline-none ${
        isLanding
          ? 'focus-visible:ring-2 focus-visible:ring-[var(--acc)] focus-visible:ring-inset'
          : ''
      }`}
      style={{
        backgroundColor: VIEWER_BG,
        touchAction: isLanding ? 'pan-y' : 'auto',
        cursor: isUserInteracting ? 'grabbing' : isLanding ? 'grab' : 'auto',
        isolation: 'isolate',
        zIndex: 1,
      }}
    >
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0.0, 0.0, 3.1], fov: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{
          touchAction: isLanding ? 'pan-y' : 'auto',
        }}
      >
        <color attach="background" args={[VIEWER_BG]} />

        {/* High-Luminance Studio Clinical Lighting System */}
        <ambientLight intensity={1.1} color="rgb(255, 255, 255)" />
        <directionalLight position={[3.5, 4.0, 3.5]} intensity={1.8} color="rgb(255, 255, 255)" />
        <directionalLight position={[-3.5, 1.5, 2.5]} intensity={0.9} color="rgb(226, 232, 240)" />
        <directionalLight position={[0.0, 3.0, -4.0]} intensity={1.0} color="rgb(203, 213, 225)" />
        <directionalLight position={[0.0, -3.0, 1.5]} intensity={0.4} color="rgb(255, 255, 255)" />

        <Suspense
          fallback={
            <Html center zIndexRange={[5, 1]}>
              <div
                style={{
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--bds)',
                  borderRadius: '3px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: 'var(--ink)',
                  fontFamily: 'var(--fs)',
                  whiteSpace: 'nowrap',
                }}
              >
                Loading 3D heart…
              </div>
            </Html>
          }
        >
          <HeartModel
            onHoverVessel={setHoveredVessel}
            results={results}
            selection={selection}
            onSelect={onSelect}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          enableZoom={!isLanding}
          enablePan={false}
          rotateSpeed={isLanding ? 0.8 : 1.0}
          minDistance={1.8}
          maxDistance={6.0}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.15}
          makeDefault
          onStart={() => {
            setIsUserInteracting(true);
            if (isLanding) {
              setShowHint(false);
            }
            if (!isLanding && activeVesselFocus !== 'default') {
              setVesselFocus('default');
            }
          }}
          onEnd={() => {
            setIsUserInteracting(false);
          }}
        />

        <CameraRig
          controlsRef={controlsRef}
          isUserInteracting={isUserInteracting}
          focus={selection ?? undefined}
          enableIntroSway={isLanding}
        />
      </Canvas>

      {/* LANDING OVERLAYS */}
      {isLanding ? (
        <>
          {/* Top-left: chip "Sample data" */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 2,
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--bds)',
              borderRadius: '3px',
              padding: '4px 8px',
              fontSize: '12px',
              color: 'var(--ink)',
              fontFamily: 'var(--fs)',
              pointerEvents: 'none',
              userSelect: 'none',
              lineHeight: 1.2,
            }}
          >
            Sample data
          </div>

          {/* Top-right: 36px Icon button (RotateCcw) */}
          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset view"
            title="Reset view"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 2,
              width: '36px',
              height: '36px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--bds)',
              borderRadius: '3px',
              color: 'var(--ink)',
              cursor: 'pointer',
              transition: 'background-color 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hov)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--panel)';
            }}
          >
            <RotateCcw style={{ width: '16px', height: '16px' }} />
          </button>

          {/* Bottom-left: Viewer hint chip or Help toggle icon */}
          {showHint ? (
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                zIndex: 2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--bds)',
                borderRadius: '3px',
                padding: '4px 8px',
                fontSize: '12px',
                color: 'var(--ink)',
                fontFamily: 'var(--fs)',
                pointerEvents: 'none',
                userSelect: 'none',
                lineHeight: 1.2,
              }}
            >
              <RotateCw style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              <span>
                {isTouchDevice
                  ? 'Swipe sideways to rotate · Tap an artery'
                  : 'Drag to rotate · Click an artery'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              aria-label="Show 3D controls help"
              title="Show 3D controls help"
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                zIndex: 2,
                width: '28px',
                height: '28px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--bds)',
                borderRadius: '3px',
                color: 'var(--ink)',
                cursor: 'pointer',
                transition: 'background-color 120ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hov)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--panel)';
              }}
            >
              <HelpCircle style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </>
      ) : (
        <>
          {/* Subtle Vessel Hover Inspection Chip for non-landing (Results) */}
          {hoveredVessel && (
            <div className="absolute top-4 left-4 z-[2] bg-black/75 backdrop-blur-md p-1.5 px-3 rounded-full border border-rose-900/50 flex items-center gap-2 text-[12px] text-rose-100 pointer-events-none shadow-md">
              <span>{hoveredVessel.replace('vessel_', '')} artery</span>
            </div>
          )}

          {/* Reset Camera View Button for Results */}
          <button
            type="button"
            onClick={handleResetView}
            className="absolute bottom-4 right-4 z-[2] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/85 text-rose-100 hover:text-white border border-rose-900/50 hover:border-rose-500/60 backdrop-blur-md text-[11px] font-mono transition-all duration-150 cursor-pointer shadow-lg active:scale-95"
            title="Reset 3D camera to default anatomical view"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
            <span>Reset View</span>
          </button>
        </>
      )}
    </div>
  );
};

export default HeartCanvas;
