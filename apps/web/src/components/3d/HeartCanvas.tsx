import React, { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { HeartModel } from './HeartModel';
import { CameraRig } from './CameraRig';
import { usePatientStore } from '../../store/usePatientStore';
import { CAVITY_EDGE, CAVITY_LIGHTS } from '../canvas/cavityConfig';
import { CavityBackdrop } from '../canvas/CavityBackdrop';
import { ViewerHint } from '../results/viewer/ViewerHint';
import { ViewerToolbar, PresetView } from '../results/viewer/ViewerToolbar';
import { isWebGLAvailable } from './webglUtils';
import '../canvas/cavity.css';

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

// Scene environment setup: dark plum-brown fog & background
const CavitySceneSetup: React.FC = () => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(CAVITY_EDGE);
    const initialDist = camera.position.length();
    scene.fog = new THREE.Fog(CAVITY_EDGE, initialDist * 1.2, initialDist * 3.2);
  }, [scene, camera]);

  useFrame(() => {
    const dist = camera.position.length();
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = dist * 1.2;
      scene.fog.far = dist * 3.2;
    }
  });

  return null;
};

// Controller managing camera orientation, toolbar animations, and sway
interface CavityCameraControllerProps {
  controlsRef: React.RefObject<any>;
  animTarget: { azimuth: number; distance: number; duration: number; startTime: number } | null;
  onAnimComplete: () => void;
  isSwaying: boolean;
  swayProgress: number; // 0 to 1
  onCameraUpdate: (azimuth: number, distance: number) => void;
}

const CavityCameraController: React.FC<CavityCameraControllerProps> = ({
  controlsRef,
  animTarget,
  onAnimComplete,
  isSwaying,
  swayProgress,
  onCameraUpdate,
}) => {
  const { camera } = useThree();
  const startAzimuthRef = useRef(0);
  const startDistanceRef = useRef(3.1);
  const deltaAzimuthRef = useRef(0);
  const prevAnimTarget = useRef(animTarget);

  // Initialize start parameters when animTarget changes
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

  useFrame((_, delta) => {
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
    } else if (isSwaying) {
      // Intro sway: +10 deg -> -10 deg -> 0 deg over 2400ms
      const swayAngleRad = (10 * Math.PI / 180) * Math.sin(2 * Math.PI * swayProgress);
      const dist = camera.position.distanceTo(target);
      camera.position.x = target.x + dist * Math.sin(swayAngleRad);
      camera.position.z = target.z + dist * Math.cos(swayAngleRad);
      camera.lookAt(target);
      if (controls) {
        controls.update();
      }
    }

    // Always report current camera azimuth and distance
    const curDx = camera.position.x - target.x;
    const curDz = camera.position.z - target.z;
    const curAzRad = Math.atan2(curDx, curDz);
    const curAzDeg = (curAzRad * 180) / Math.PI;
    const curDist = camera.position.distanceTo(target);

    onCameraUpdate(curAzDeg, curDist);
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
            backgroundColor: CAVITY_EDGE,
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

export const HeartCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);

  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Performance guards: visible canvas and visible tab
  const [isCanvasVisible, setIsCanvasVisible] = useState(true);
  const [isTabActive, setIsTabActive] = useState(true);

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

  // Intro sway state
  const [isSwaying, setIsSwaying] = useState(false);
  const [swayProgress, setSwayProgress] = useState(0);
  const swayStartTimeRef = useRef<number | null>(null);
  const swayRafRef = useRef<number | null>(null);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const { activeVesselFocus, setVesselFocus } = usePatientStore();

  // WebGL availability check
  const webGLSupported = isWebGLAvailable();

  // Visibility and tab monitoring (Task 2.8)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibility = () => {
      setIsTabActive(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let observer: IntersectionObserver | null = null;
    if (containerRef.current && window.IntersectionObserver) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]) {
            setIsCanvasVisible(entries[0].isIntersecting);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      observer?.disconnect();
    };
  }, []);

  // One-shot intro sway (Task 2.7 e)
  const cancelSway = useCallback(() => {
    if (isSwaying) {
      setIsSwaying(false);
      if (swayRafRef.current !== null) {
        cancelAnimationFrame(swayRafRef.current);
        swayRafRef.current = null;
      }
    }
  }, [isSwaying]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSwayed = sessionStorage.getItem('perfusion3d-sway');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasSwayed && !prefersReducedMotion && isCanvasVisible && isTabActive) {
      sessionStorage.setItem('perfusion3d-sway', 'true');
      setIsSwaying(true);
      swayStartTimeRef.current = performance.now();

      const animateSway = (now: number) => {
        if (!swayStartTimeRef.current) return;
        const elapsed = now - swayStartTimeRef.current;
        const duration = 2400; // 2400ms duration
        const u = Math.min(1.0, elapsed / duration);
        setSwayProgress(u);

        if (u < 1.0) {
          swayRafRef.current = requestAnimationFrame(animateSway);
        } else {
          setIsSwaying(false);
          swayRafRef.current = null;
        }
      };

      swayRafRef.current = requestAnimationFrame(animateSway);
    }

    return () => {
      if (swayRafRef.current !== null) {
        cancelAnimationFrame(swayRafRef.current);
      }
    };
  }, [isCanvasVisible, isTabActive]);

  // Mark user interaction to dismiss hint & cancel sway
  const registerInteraction = useCallback(() => {
    cancelSway();
    setHasInteracted(true);
  }, [cancelSway]);

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
      duration: 500,
      startTime: performance.now(),
    });
  };

  // Zoom step changes distance by 15% over 200ms
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
    if (activeVesselFocus !== 'default') {
      setVesselFocus('default');
    }
    setAnimTarget({
      azimuth: 0,
      distance: 3.1,
      duration: 500,
      startTime: performance.now(),
    });
  };

  // Keyboard navigation (Task 2.7 g)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    registerInteraction();
    const degToRad = Math.PI / 180;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      // Rotate left by 5 degrees
      const newAz = ((currentAzimuth - 5) * degToRad);
      setAnimTarget({
        azimuth: newAz,
        distance: currentDistance,
        duration: 120,
        startTime: performance.now(),
      });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      // Rotate right by 5 degrees
      const newAz = ((currentAzimuth + 5) * degToRad);
      setAnimTarget({
        azimuth: newAz,
        distance: currentDistance,
        duration: 120,
        startTime: performance.now(),
      });
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

  if (!webGLSupported) {
    return (
      <div
        role="alert"
        style={{
          width: '100%',
          height: 'clamp(300px, 52dvh, 420px)',
          backgroundColor: CAVITY_EDGE,
          border: '1px solid var(--bd)',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink)',
          fontFamily: 'var(--fs)',
          fontSize: '13px',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        3D view is not supported on this device.
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* 3D Recessed Cavity Container (Task 2.3 a) */}
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
          backgroundColor: CAVITY_EDGE,
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
            camera={{ position: [0.0, 0.0, 3.1], fov: 40 }}
            dpr={[1, 2]}
            frameloop={isCanvasVisible && isTabActive ? 'always' : 'never'}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          >
            {/* Dark plum-brown background & fog */}
            <CavitySceneSetup />

            {/* Cavity lighting system (Task 2.3 d) */}
            <directionalLight
              position={CAVITY_LIGHTS.key.position}
              intensity={CAVITY_LIGHTS.key.intensity}
              color={CAVITY_LIGHTS.key.color}
            />
            <directionalLight
              position={CAVITY_LIGHTS.fill.position}
              intensity={CAVITY_LIGHTS.fill.intensity}
              color={CAVITY_LIGHTS.fill.color}
            />
            <directionalLight
              position={CAVITY_LIGHTS.rim.position}
              intensity={CAVITY_LIGHTS.rim.intensity}
              color={CAVITY_LIGHTS.rim.color}
            />
            <pointLight
              position={CAVITY_LIGHTS.glow.position}
              intensity={CAVITY_LIGHTS.glow.intensity}
              color={CAVITY_LIGHTS.glow.color}
              distance={6}
            />

            {/* Inverted Ellipsoid Cavity Backdrop (Task 2.3 b) */}
            <CavityBackdrop boundingCenter={[0.0, -0.08, 0.0]} boundingRadius={0.85} />

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
              isUserInteracting={isUserInteracting || animTarget !== null || isSwaying}
            />

            <CavityCameraController
              controlsRef={controlsRef}
              animTarget={animTarget}
              onAnimComplete={() => setAnimTarget(null)}
              isSwaying={isSwaying}
              swayProgress={swayProgress}
              onCameraUpdate={(az, dist) => {
                setCurrentAzimuth(az);
                setCurrentDistance(dist);
              }}
            />
          </Canvas>
        </CanvasErrorBoundary>

        {/* Loading chip suspended fallback in DOM (Task 2.7 h) */}
        <Suspense fallback={<LoaderChip />}>
          <div style={{ display: 'none' }} />
        </Suspense>

        {/* Vignette Overlay (Task 2.3 e) */}
        <div className="cavity-vignette" />

        {/* ViewerHint (Task 2.7 a) */}
        <ViewerHint hasInteracted={hasInteracted} />

        {/* Subtle Vessel Hover Inspection Chip */}
        {hoveredVessel && (
          <div
            className="absolute top-4 left-4 z-20 p-1.5 px-3 rounded flex items-center gap-2 text-[12px] pointer-events-none"
            style={{
              backgroundColor: 'var(--panel)',
              color: 'var(--ink)',
              border: '1px solid var(--bds)',
              fontFamily: 'var(--fs)',
            }}
          >
            <span>{hoveredVessel.replace('vessel_', '')} artery</span>
          </div>
        )}
      </div>

      {/* ViewerToolbar directly below cavity (Task 2.7 b) */}
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
