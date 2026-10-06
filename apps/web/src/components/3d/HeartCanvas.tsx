import React, { useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { HeartModel } from './HeartModel';
import { CameraRig } from './CameraRig';
import { usePatientStore } from '../../store/usePatientStore';
import { RotateCcw } from 'lucide-react';

export const HeartCanvas: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const { activeVesselFocus, setVesselFocus } = usePatientStore();

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    setVesselFocus('default');
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ backgroundColor: '#180307' }}
    >
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0.0, 0.0, 3.1], fov: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#180307']} />

        {/* High-Luminance Studio Clinical Lighting System */}
        <ambientLight intensity={1.1} color="rgb(255, 255, 255)" />
        <directionalLight position={[3.5, 4.0, 3.5]} intensity={1.8} color="rgb(255, 255, 255)" />
        <directionalLight position={[-3.5, 1.5, 2.5]} intensity={0.9} color="rgb(226, 232, 240)" />
        <directionalLight position={[0.0, 3.0, -4.0]} intensity={1.0} color="rgb(203, 213, 225)" />
        <directionalLight position={[0.0, -3.0, 1.5]} intensity={0.4} color="rgb(255, 255, 255)" />

        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2 p-3 rounded bg-black/70 text-rose-200 text-[13px] border border-rose-900/50 backdrop-blur-md">
                <span className="spinner" />
                <span>Loading 3D model...</span>
              </div>
            </Html>
          }
        >
          <HeartModel onHoverVessel={setHoveredVessel} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={1.8}
          maxDistance={6.0}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.15}
          makeDefault
          onStart={() => {
            setIsUserInteracting(true);
            if (activeVesselFocus !== 'default') {
              setVesselFocus('default');
            }
          }}
          onEnd={() => {
            setIsUserInteracting(false);
          }}
        />

        <CameraRig controlsRef={controlsRef} isUserInteracting={isUserInteracting} />
      </Canvas>

      {/* Subtle Vessel Hover Inspection Chip */}
      {hoveredVessel && (
        <div className="absolute top-4 left-4 z-20 bg-black/75 backdrop-blur-md p-1.5 px-3 rounded-full border border-rose-900/50 flex items-center gap-2 text-[12px] text-rose-100 pointer-events-none shadow-md">
          <span>{hoveredVessel.replace('vessel_', '')} artery</span>
        </div>
      )}

      {/* Reset Camera View Button */}
      <button
        type="button"
        onClick={handleResetView}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/85 text-rose-100 hover:text-white border border-rose-900/50 hover:border-rose-500/60 backdrop-blur-md text-[11px] font-mono transition-all duration-150 cursor-pointer shadow-lg active:scale-95"
        title="Reset 3D camera to default anatomical view"
      >
        <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
        <span>Reset View</span>
      </button>
    </div>
  );
};

export default HeartCanvas;
