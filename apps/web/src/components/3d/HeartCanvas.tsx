import React, { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { X } from 'lucide-react';
import { HeartModel } from './HeartModel';
import { CameraRig } from './CameraRig';
import { VesselLabel } from './VesselLabel';
import { usePatientStore } from '../../store/usePatientStore';
import { VIEWER_BG } from '../canvas/viewerConfig';
import { ViewerHint } from '../results/viewer/ViewerHint';
import { ViewerToolbar, PresetView } from '../results/viewer/ViewerToolbar';
import { IconButton } from '../ui/IconButton';
import { isWebGLAvailable } from './webglUtils';

// 3D Anchor positions for vessel labels
const LAD_POS = [-0.04, -0.15, 0.52] as const;
const LCX_POS = [0.43, -0.02, -0.05] as const;
const RCA_POS = [-0.56, -0.05, 0.02] as const;

// Anatomical surface normals for facing detection
const LAD_NORM = new THREE.Vector3(-0.2, 0.1, 0.95).normalize();
const LCX_NORM = new THREE.Vector3(0.85, 0.1, -0.4).normalize();
const RCA_NORM = new THREE.Vector3(-0.85, 0.1, 0.45).normalize();

// Approximate wipe easing cubic-bezier(0.2, 0.8, 0.2, 1.0)
function wipeEase(t: number): number {
  return 1 - Math.pow(1 - t, 3.2);
}

// Solid centered loading chip showing percentage
const LoaderChip: React.FC = () => {
  const { progress } = useProgress();
  const pct = Math.round(progress);
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--bds)',
        borderRadius: '3px',
        color: 'var(--ink)',
        fontFamily: 'var(--fs)',
        fontSize: '13px',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        zIndex: 20,
      }}
    >
      <span>Loading 3D heart…{pct > 0 && pct < 100 ? ` ${pct}%` : ''}</span>
    </div>
  );
};

// Module-level stable configurations to prevent WebGL context recreation
const GL_CONFIG = { antialias: true, alpha: false, powerPreference: 'high-performance' as const };
const CAMERA_CONFIG = { position: [0.0, 0.0, 3.1] as [number, number, number], fov: 40 };
const DPR_CONFIG: [number, number] = [1, 2];

// Synchronizes label 2D positions and hysteresis facing visibility directly via DOM refs
interface LabelSyncTrackerProps {
  ladRef: React.RefObject<HTMLDivElement>;
  lcxRef: React.RefObject<HTMLDivElement>;
  rcaRef: React.RefObject<HTMLDivElement>;
}

const LabelSyncTracker: React.FC<LabelSyncTrackerProps> = ({ ladRef, lcxRef, rcaRef }) => {
  const tempVec = useRef(new THREE.Vector3());
  const facingVisRef = useRef({ lad: true, lcx: true, rca: true });

  useFrame(({ camera, size }) => {
    const camPos = camera.position;
    const camDir = camPos.clone().normalize();
    const v = tempVec.current;

    // 1. LAD
    v.set(LAD_POS[0], LAD_POS[1], LAD_POS[2]).project(camera);
    const ladX = (v.x * 0.5 + 0.5) * size.width;
    const ladY = (-v.y * 0.5 + 0.5) * size.height;
    const ladFacing = LAD_NORM.dot(camDir);
    // Hysteresis: hide below -0.1, show above 0.1
    if (ladFacing > 0.1) facingVisRef.current.lad = true;
    else if (ladFacing < -0.1) facingVisRef.current.lad = false;

    if (ladRef.current) {
      ladRef.current.style.transform = `translate3d(${Math.round(ladX)}px, ${Math.round(ladY)}px, 0)`;
      ladRef.current.style.opacity = facingVisRef.current.lad ? '1' : '0';
      ladRef.current.style.pointerEvents = facingVisRef.current.lad ? 'auto' : 'none';
    }

    // 2. LCX
    v.set(LCX_POS[0], LCX_POS[1], LCX_POS[2]).project(camera);
    const lcxX = (v.x * 0.5 + 0.5) * size.width;
    const lcxY = (-v.y * 0.5 + 0.5) * size.height;
    const lcxFacing = LCX_NORM.dot(camDir);
    if (lcxFacing > 0.1) facingVisRef.current.lcx = true;
    else if (lcxFacing < -0.1) facingVisRef.current.lcx = false;

    if (lcxRef.current) {
      lcxRef.current.style.transform = `translate3d(${Math.round(lcxX)}px, ${Math.round(lcxY)}px, 0)`;
      lcxRef.current.style.opacity = facingVisRef.current.lcx ? '1' : '0';
      lcxRef.current.style.pointerEvents = facingVisRef.current.lcx ? 'auto' : 'none';
    }

    // 3. RCA
    v.set(RCA_POS[0], RCA_POS[1], RCA_POS[2]).project(camera);
    const rcaX = (v.x * 0.5 + 0.5) * size.width;
    const rcaY = (-v.y * 0.5 + 0.5) * size.height;
    const rcaFacing = RCA_NORM.dot(camDir);
    if (rcaFacing > 0.1) facingVisRef.current.rca = true;
    else if (rcaFacing < -0.1) facingVisRef.current.rca = false;

    if (rcaRef.current) {
      rcaRef.current.style.transform = `translate3d(${Math.round(rcaX)}px, ${Math.round(rcaY)}px, 0)`;
      rcaRef.current.style.opacity = facingVisRef.current.rca ? '1' : '0';
      rcaRef.current.style.pointerEvents = facingVisRef.current.rca ? 'auto' : 'none';
    }
  });

  return null;
};

// Controller managing camera orientation and toolbar animations
interface CameraControllerProps {
  controlsRef: React.RefObject<any>;
  animTarget: { azimuth: number; distance: number; duration: number; startTime: number } | null;
  onAnimComplete: () => void;
  onCameraUpdate: (azimuth: number, distance: number) => void;
}

const CameraController: React.FC<CameraControllerProps> = ({
  controlsRef,
  animTarget,
  onAnimComplete,
  onCameraUpdate,
}) => {
  const { camera } = useThree();
  const startAzimuthRef = useRef(0);
  const startDistanceRef = useRef(3.1);
  const deltaAzimuthRef = useRef(0);
  const prevAnimTarget = useRef(animTarget);
  const lastReportedAz = useRef<number | null>(null);
  const lastReportedDist = useRef<number | null>(null);

  useEffect(() => {
    if (animTarget && animTarget !== prevAnimTarget.current) {
      prevAnimTarget.current = animTarget;
      const target = controlsRef.current?.target || new THREE.Vector3(0, 0, 0);
      const dx = camera.position.x - target.x;
      const dz = camera.position.z - target.z;
      const currentAz = Math.atan2(dx, dz);
      startAzimuthRef.current = currentAz;
      startDistanceRef.current = camera.position.distanceTo(target);

      let delta = animTarget.azimuth - currentAz;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      deltaAzimuthRef.current = delta;
    }
  }, [animTarget, camera, controlsRef]);

  useFrame(() => {
    const controls = controlsRef.current;
    const target = controls?.target || new THREE.Vector3(0, 0, 0);

    if (animTarget) {
      const now = performance.now();
      const elapsed = now - animTarget.startTime;
      const t = Math.min(1.0, Math.max(0.0, elapsed / animTarget.duration));
      const easedT = wipeEase(t);

      const az = startAzimuthRef.current + deltaAzimuthRef.current * easedT;
      const dist = startDistanceRef.current + (animTarget.distance - startDistanceRef.current) * easedT;

      camera.position.x = target.x + dist * Math.sin(az);
      camera.position.z = target.z + dist * Math.cos(az);
      camera.lookAt(target);

      if (controls) {
        controls.update();
      }

      if (t >= 1.0) {
        onAnimComplete();
      }
    }

    const curDx = camera.position.x - target.x;
    const curDz = camera.position.z - target.z;
    const curAzRad = Math.atan2(curDx, curDz);
    const curAzDeg = Math.round((curAzRad * 180) / Math.PI);
    const curDist = Math.round(camera.position.distanceTo(target) * 100) / 100;

    if (lastReportedAz.current !== curAzDeg || lastReportedDist.current !== curDist) {
      lastReportedAz.current = curAzDeg;
      lastReportedDist.current = curDist;
      onCameraUpdate(curAzDeg, curDist);
    }
  });

  return null;
};

// Error Boundary for WebGL / Model loading failures
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: any) {
    console.error('HeartCanvas 3D Error:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: VIEWER_BG,
            color: 'var(--ink)',
            fontFamily: 'var(--fs)',
            fontSize: '13px',
            zIndex: 30,
          }}
        >
          <span>The 3D view could not be loaded.</span>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry();
            }}
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '13px',
              color: 'var(--acc)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px 8px',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Test hook exposing Three scene and camera for automated test audits
const SceneTestHook: React.FC = () => {
  const { scene, camera } = useThree();
  useEffect(() => {
    (window as any).__THREE_SCENE__ = scene;
    (window as any).__THREE_CAMERA__ = camera;
  }, [scene, camera]);
  return null;
};

export const HeartCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);

  const ladLabelRef = useRef<HTMLDivElement>(null);
  const lcxLabelRef = useRef<HTMLDivElement>(null);
  const rcaLabelRef = useRef<HTMLDivElement>(null);

  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Camera angles & test hooks
  const [currentAzimuth, setCurrentAzimuth] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(3.1);

  // Camera animation target for toolbar & zoom
  const [animTarget, setAnimTarget] = useState<{
    azimuth: number;
    distance: number;
    duration: number;
    startTime: number;
  } | null>(null);

  const [retryKey, setRetryKey] = useState(0);

  const { analysis, activeVesselFocus, setVesselFocus } = usePatientStore();

  // Vessel data extraction for labels
  const vesselsPred = analysis?.predictions?.vessels;
  const ladPred = vesselsPred?.lad;
  const ladProb = ladPred?.probability ?? 0.142;
  const ladColorHex = ladPred?.color_hex ?? '#10B981';
  const ladRiskText = `${(ladProb * 100).toFixed(1)}%`;
  const isLadSelected = activeVesselFocus === 'vessel_LAD';

  const lcxPred = vesselsPred?.lcx;
  const lcxProb = lcxPred?.probability ?? 0.114;
  const lcxColorHex = lcxPred?.color_hex ?? '#10B981';
  const lcxRiskText = `${(lcxProb * 100).toFixed(1)}%`;
  const isLcxSelected = activeVesselFocus === 'vessel_LCX';

  const rcaPred = vesselsPred?.rca;
  const rcaProb = rcaPred?.probability ?? 0.127;
  const rcaColorHex = rcaPred?.color_hex ?? '#10B981';
  const rcaRiskText = `${(rcaProb * 100).toFixed(1)}%`;
  const isRcaSelected = activeVesselFocus === 'vessel_RCA';

  // WebGL availability check
  const webGLSupported = isWebGLAvailable();

  // Mark user interaction to dismiss hint
  const registerInteraction = useCallback(() => {
    setHasInteracted(true);
  }, []);

  // Preset view selection (Front | Left | Back | Right)
  const handleSelectView = (view: PresetView) => {
    registerInteraction();
    let targetAz = 0;
    if (view === 'Front') targetAz = 0;
    else if (view === 'Right') targetAz = Math.PI / 2; // +90 deg
    else if (view === 'Back') targetAz = Math.PI; // 180 deg
    else if (view === 'Left') targetAz = -Math.PI / 2; // -90 deg

    setAnimTarget({
      azimuth: targetAz,
      distance: currentDistance,
      duration: 350,
      startTime: performance.now(),
    });
  };

  const handleZoomIn = () => {
    registerInteraction();
    const newDist = Math.max(1.8, currentDistance * 0.85);
    setAnimTarget({
      azimuth: (currentAzimuth * Math.PI) / 180,
      distance: newDist,
      duration: 200,
      startTime: performance.now(),
    });
  };

  const handleZoomOut = () => {
    registerInteraction();
    const newDist = Math.min(6.0, currentDistance * 1.15);
    setAnimTarget({
      azimuth: (currentAzimuth * Math.PI) / 180,
      distance: newDist,
      duration: 200,
      startTime: performance.now(),
    });
  };

  const handleResetView = () => {
    registerInteraction();
    setAnimTarget({
      azimuth: 0,
      distance: 3.1,
      duration: 500,
      startTime: performance.now(),
    });
    setVesselFocus('default');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      registerInteraction();
      const newAz = ((currentAzimuth - 15) * Math.PI) / 180;
      setAnimTarget({ azimuth: newAz, distance: currentDistance, duration: 150, startTime: performance.now() });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      registerInteraction();
      const newAz = ((currentAzimuth + 15) * Math.PI) / 180;
      setAnimTarget({ azimuth: newAz, distance: currentDistance, duration: 150, startTime: performance.now() });
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      handleZoomIn();
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      handleZoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      handleResetView();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setVesselFocus('default');
    }
  };

  const handleSelectVessel = (vesselName: string) => {
    setVesselFocus(activeVesselFocus === vesselName ? 'default' : vesselName);
  };

  const handlePointerOver = (vesselName: string) => {
    document.body.style.cursor = 'pointer';
    setHoveredVessel(vesselName);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
    setHoveredVessel(null);
  };

  const selectedVesselName = activeVesselFocus !== 'default' && activeVesselFocus !== 'all' && activeVesselFocus !== 'free'
    ? activeVesselFocus.replace('vessel_', '')
    : null;

  if (!webGLSupported) {
    return (
      <div
        role="alert"
        style={{
          width: '100%',
          height: '340px',
          backgroundColor: VIEWER_BG,
          border: '1px solid var(--bd)',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink)',
          fontFamily: 'var(--fs)',
          fontSize: '13px',
          textAlign: 'center',
        }}
      >
        3D view is not supported on this device.
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        id="viewer-cavity-container"
        tabIndex={0}
        role="group"
        aria-label="3D heart. Arrow keys rotate, plus and minus zoom, zero resets the view, Escape clears the selection."
        data-view-azimuth={Math.round(currentAzimuth)}
        data-view-distance={currentDistance.toFixed(2)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPointerDown={() => {
          registerInteraction();
          setIsDragging(true);
        }}
        onPointerUp={() => setIsDragging(false)}
        onWheel={() => registerInteraction()}
        style={{
          width: '100%',
          height: 'clamp(300px, 52dvh, 420px)',
          backgroundColor: VIEWER_BG,
          border: '1px solid var(--bd)',
          borderRadius: '3px',
          overflow: 'hidden',
          position: 'relative',
          touchAction: 'pan-y',
          cursor: isDragging ? 'grabbing' : (hoveredVessel ? 'pointer' : 'grab'),
          outline: isFocused ? '2px solid var(--acc)' : 'none',
          outlineOffset: '-2px',
          userSelect: 'none',
        }}
      >
        <CanvasErrorBoundary
          key={retryKey}
          onRetry={() => setRetryKey((k) => k + 1)}
        >
          {/* 3D WebGL Canvas */}
          <Canvas
            camera={CAMERA_CONFIG}
            dpr={DPR_CONFIG}
            gl={GL_CONFIG}
          >
            {/* Flat deep-red background */}
            <color attach="background" args={[VIEWER_BG]} />

            <SceneTestHook />

            {/* High-Luminance Studio Clinical Lighting System (Baseline look) */}
            <ambientLight intensity={1.35} color="rgb(255, 255, 255)" />
            <directionalLight position={[3.5, 4.0, 3.5]} intensity={1.1} color="rgb(255, 255, 255)" />
            <directionalLight position={[-3.5, 1.5, 2.5]} intensity={0.7} color="rgb(226, 232, 240)" />
            <directionalLight position={[0.0, 3.0, -4.0]} intensity={8.0} color="rgb(203, 213, 225)" />
            <directionalLight position={[0.0, -3.0, 1.5]} intensity={0.5} color="rgb(255, 255, 255)" />

            <Suspense fallback={null}>
              <HeartModel
                onHoverVessel={setHoveredVessel}
              />
            </Suspense>

            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.08}
              rotateSpeed={0.8}
              zoomSpeed={0.8}
              enablePan={false}
              minDistance={1.8}
              maxDistance={6.0}
              maxPolarAngle={Math.PI * 0.85}
              minPolarAngle={Math.PI * 0.15}
              makeDefault
              onStart={() => {
                registerInteraction();
                setIsUserInteracting(true);
                if (activeVesselFocus !== 'default') {
                  setVesselFocus('default');
                }
              }}
              onEnd={() => {
                setIsUserInteracting(false);
              }}
            />

            <CameraRig
              controlsRef={controlsRef}
              isUserInteracting={isUserInteracting || animTarget !== null}
            />

            <CameraController
              controlsRef={controlsRef}
              animTarget={animTarget}
              onAnimComplete={() => setAnimTarget(null)}
              onCameraUpdate={(az, dist) => {
                setCurrentAzimuth(az);
                setCurrentDistance(dist);
              }}
            />

            <LabelSyncTracker
              ladRef={ladLabelRef}
              lcxRef={lcxLabelRef}
              rcaRef={rcaLabelRef}
            />
          </Canvas>
        </CanvasErrorBoundary>

        {/* Stable HTML Labels Overlay */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 10 }}
        >
          <VesselLabel
            ref={ladLabelRef}
            vesselKey="vessel_LAD"
            code="LAD"
            riskDotColor={ladColorHex}
            riskText={ladRiskText}
            placement="below"
            isSelected={isLadSelected}
            onSelect={() => handleSelectVessel('vessel_LAD')}
            onPointerOver={() => handlePointerOver('vessel_LAD')}
            onPointerOut={handlePointerOut}
          />
          <VesselLabel
            ref={lcxLabelRef}
            vesselKey="vessel_LCX"
            code="LCX"
            riskDotColor={lcxColorHex}
            riskText={lcxRiskText}
            placement="right"
            isSelected={isLcxSelected}
            onSelect={() => handleSelectVessel('vessel_LCX')}
            onPointerOver={() => handlePointerOver('vessel_LCX')}
            onPointerOut={handlePointerOut}
          />
          <VesselLabel
            ref={rcaLabelRef}
            vesselKey="vessel_RCA"
            code="RCA"
            riskDotColor={rcaColorHex}
            riskText={rcaRiskText}
            placement="left"
            isSelected={isRcaSelected}
            onSelect={() => handleSelectVessel('vessel_RCA')}
            onPointerOver={() => handlePointerOver('vessel_RCA')}
            onPointerOut={handlePointerOut}
          />
        </div>

        {/* Loading chip suspended fallback in DOM */}
        <Suspense fallback={<LoaderChip />}>
          <div style={{ display: 'none' }} />
        </Suspense>

        {/* ViewerHint */}
        <ViewerHint hasInteracted={hasInteracted} />

        {/* Selected-vessel chip at top-left (8px from edges) with 24px icon button to clear */}
        {selectedVesselName && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              zIndex: 20,
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--bds)',
              borderRadius: '3px',
              padding: '2px 4px 2px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--fs)',
              fontSize: '12px',
              color: 'var(--ink)',
              userSelect: 'none',
            }}
          >
            <span>{selectedVesselName} artery</span>
            <IconButton
              size="xs"
              variant="quiet"
              aria-label="Clear selection"
              title="Clear selection"
              onClick={() => setVesselFocus('default')}
            >
              <X size={14} />
            </IconButton>
          </div>
        )}
      </div>

      {/* ViewerToolbar directly below canvas */}
      <ViewerToolbar
        currentAzimuth={currentAzimuth}
        onSelectView={handleSelectView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />
    </div>
  );
};

export default HeartCanvas;
