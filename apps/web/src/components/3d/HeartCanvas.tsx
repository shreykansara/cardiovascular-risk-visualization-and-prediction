/**
 * Fullscreen 3D Heart WebGL Viewport (Perfusion3D Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
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
    <div className="relative w-full h-full bg-[#05070B] overflow-hidden select-none animate-cinema-canvas">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0.0, 0.0, 3.1], fov: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#05070B']} />

        {/* High-Luminance Studio Clinical Lighting System */}
        {/* 1. Bright Clinical Ambient Fill */}
        <ambientLight intensity={1.25} color="#f8fafc" />

        {/* 2. Key Directional Light: Crisp white illumination */}
        <directionalLight position={[3.5, 4.0, 3.5]} intensity={2.2} color="#ffffff" />

        {/* 3. Anatomical Fill Light: Cool clinical fill */}
        <directionalLight position={[-3.5, 1.5, 2.5]} intensity={1.2} color="#93c5fd" />

        {/* 4. Cyan Rim Backlight: Institutional cyan edge glow */}
        <directionalLight position={[0.0, 3.0, -4.0]} intensity={1.8} color="#06b6d4" />

        {/* 5. Floor Bounce: Soft upward fill */}
        <directionalLight position={[0.0, -3.0, 1.5]} intensity={0.6} color="#e2e8f0" />

        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl ultra-glass text-slate-300 text-xs font-mono border border-white/10 shadow-2xl">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
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
        <div className="absolute top-20 left-6 z-20 ultra-glass p-2 px-3 rounded-full border border-cyan-400/40 flex items-center gap-2 text-xs font-mono text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.3)] animate-in fade-in duration-200 pointer-events-none">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click to focus {hoveredVessel.replace('vessel_', '')}</span>
        </div>
      )}
    </div>
  );
};
