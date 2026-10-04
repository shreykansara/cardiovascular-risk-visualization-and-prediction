/**
 * Fullscreen 3D Heart WebGL Viewport (Perfusion3D Clinical DLS)
 * Seamlessly integrated into deep neutral #0b0f17 canvas container.
 */

import React, { useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { HeartModel } from './HeartModel';
import { CameraRig } from './CameraRig';
import { usePatientStore } from '../../store/usePatientStore';
import { Eye } from 'lucide-react';

export const HeartCanvas: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const { activeVesselFocus, setVesselFocus } = usePatientStore();

  return (
    <div className="relative w-full h-full bg-[#0b0f17] overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0.0, 0.0, 3.1], fov: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#0b0f17']} />

        {/* High-Luminance Studio Clinical Lighting System */}
        {/* 1. Bright Clinical Ambient Fill */}
        <ambientLight intensity={1.25} color="#f8fafc" />

        {/* 2. Key Directional Light: Crisp illumination */}
        <directionalLight position={[3.5, 4.0, 3.5]} intensity={2.2} color="#ffffff" />

        {/* 3. Anatomical Fill Light: Soft clinical fill */}
        <directionalLight position={[-3.5, 1.5, 2.5]} intensity={1.1} color="#94a3b8" />

        {/* 4. Neutral Rim Backlight */}
        <directionalLight position={[0.0, 3.0, -4.0]} intensity={1.2} color="#cbd5e1" />

        {/* 5. Floor Bounce: Soft upward fill */}
        <directionalLight position={[0.0, -3.0, 1.5]} intensity={0.5} color="#e2e8f0" />

        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2.5 p-3.5 rounded-md bg-[#131a26] text-slate-300 text-xs font-mono-numbers border border-[#283548] shadow-sm">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading Anatomical Twin...</span>
              </div>
            </Html>
          }
        >
          {/* Authentic medical human heart digital twin positioned at (0, 0, 0) */}
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
        <div className="absolute top-16 left-4 z-20 bg-[#131a26]/95 p-1.5 px-3 rounded-md border border-[#283548] flex items-center gap-2 text-xs font-mono-numbers text-slate-200 shadow-sm pointer-events-none">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>Click to focus {hoveredVessel.replace('vessel_', '')}</span>
        </div>
      )}
    </div>
  );
};
