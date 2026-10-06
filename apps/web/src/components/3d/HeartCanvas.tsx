import React, { useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { HeartModel } from './HeartModel';
import { CameraRig } from './CameraRig';
import { usePatientStore } from '../../store/usePatientStore';

export const HeartCanvas: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const { activeVesselFocus, setVesselFocus } = usePatientStore();

  return (
    <div className="relative w-full h-full bg-panel overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0.0, 0.0, 3.1], fov: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['rgb(246, 247, 249)']} />

        {/* High-Luminance Studio Clinical Lighting System */}
        <ambientLight intensity={1.1} color="rgb(255, 255, 255)" />
        <directionalLight position={[3.5, 4.0, 3.5]} intensity={1.8} color="rgb(255, 255, 255)" />
        <directionalLight position={[-3.5, 1.5, 2.5]} intensity={0.9} color="rgb(226, 232, 240)" />
        <directionalLight position={[0.0, 3.0, -4.0]} intensity={1.0} color="rgb(203, 213, 225)" />
        <directionalLight position={[0.0, -3.0, 1.5]} intensity={0.4} color="rgb(255, 255, 255)" />

        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2 p-3 rounded bg-page text-text-muted text-[13px] border border-border">
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
        <div className="absolute top-4 left-4 z-20 bg-page p-1.5 px-3 rounded border border-border flex items-center gap-2 text-[12px] text-text pointer-events-none">
          <span>{hoveredVessel.replace('vessel_', '')} artery</span>
        </div>
      )}
    </div>
  );
};

export default HeartCanvas;
