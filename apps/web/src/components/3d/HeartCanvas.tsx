/**
 * 3D Heart WebGL Viewport & Orbit Canvas (AuraCor DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Html } from '@react-three/drei';
import { HeartModel } from './HeartModel';
import { CameraRig } from './CameraRig';
import { usePatientStore } from '../../store/usePatientStore';
import { Eye, Info, Rotate3d, Sparkles } from 'lucide-react';

export const HeartCanvas: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const { activeVesselFocus, setVesselFocus, analysis } = usePatientStore();
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);

  const vessels = analysis?.predictions?.vessels;

  const vesselButtons = [
    { key: 'default', label: 'All Vessels' },
    { key: 'vessel_LAD', label: 'LAD (Anterior)' },
    { key: 'vessel_LCX', label: 'LCX (Lateral)' },
    { key: 'vessel_RCA', label: 'RCA (Inferior)' },
  ];

  return (
    <div className="relative w-full h-full bg-surface-0 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 0.5, 4.2], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#070A10']} />

        {/* Studio Clinical Lighting System */}
        <ambientLight intensity={0.75} color="#cbd5e1" />
        <directionalLight position={[4, 5, 4]} intensity={1.6} color="#ffffff" />
        <directionalLight position={[-4, 2, 2]} intensity={0.8} color="#38bdf8" />
        <directionalLight position={[0, -3, -4]} intensity={0.9} color="#818cf8" />

        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl glass-panel text-slate-300 text-xs font-mono">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading 3D Anatomy...</span>
              </div>
            </Html>
          }
        >
          <Center top position={[0, -0.15, 0]}>
            <HeartModel onHoverVessel={setHoveredVessel} />
          </Center>
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={1.8}
          maxDistance={7.5}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.15}
          makeDefault
        />

        <CameraRig controlsRef={controlsRef} />
      </Canvas>

      {/* Viewport Top HUD: Anatomical Region Focus Selector */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1 rounded-xl glass-panel border border-slate-700/60 shadow-lg">
        {vesselButtons.map((btn) => {
          const isActive = activeVesselFocus === btn.key;
          let indicatorColor = 'bg-slate-500';
          if (btn.key === 'vessel_LAD' && vessels?.lad) indicatorColor = vessels.lad.color_hex;
          if (btn.key === 'vessel_LCX' && vessels?.lcx) indicatorColor = vessels.lcx.color_hex;
          if (btn.key === 'vessel_RCA' && vessels?.rca) indicatorColor = vessels.rca.color_hex;

          return (
            <button
              key={btn.key}
              onClick={() => setVesselFocus(btn.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-cyan-600/30 text-white border border-cyan-500/60 shadow-glow-cyan'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {btn.key !== 'default' && (
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: indicatorColor }}
                />
              )}
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hover Tooltip Overlay in Viewport */}
      {hoveredVessel && (
        <div className="absolute top-4 right-4 z-10 glass-card p-2.5 rounded-xl border border-cyan-500/50 flex items-center gap-2 text-xs font-mono text-cyan-300 shadow-glow-cyan animate-in fade-in">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>CLICK TO INSPECT {hoveredVessel.replace('vessel_', '')}</span>
        </div>
      )}

      {/* Viewport Bottom HUD: Color Risk Legend & Interactive Hints */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Risk Color Gradient Legend */}
        <div className="glass-panel px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-4 text-[11px] font-mono pointer-events-auto shadow-md">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Stenosis Risk</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span className="text-slate-300">Normal (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span className="text-slate-300">Borderline (40-70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span className="text-slate-300">Critical (&gt;70%)</span>
          </div>
        </div>

        {/* 3D Navigation Hint */}
        <div className="hidden md:flex items-center gap-2 glass-panel px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 font-mono">
          <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
          <span>Left-Drag: Rotate // Right-Drag: Pan // Scroll: Zoom</span>
        </div>
      </div>
    </div>
  );
};
