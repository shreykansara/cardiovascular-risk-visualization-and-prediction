/**
 * 3D Heart WebGL Viewport & Orbit Canvas (AuraCor Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { HeartModel } from './HeartModel';
import { CameraRig } from './CameraRig';
import { usePatientStore } from '../../store/usePatientStore';
import { Eye, Rotate3d, Focus } from 'lucide-react';

export const HeartCanvas: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const { activeVesselFocus, setVesselFocus, analysis } = usePatientStore();
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);

  const vessels = analysis?.predictions?.vessels;

  const vesselButtons = [
    { key: 'default', label: 'All Vessels', subtitle: 'Global Anatomy' },
    { key: 'vessel_LAD', label: 'LAD', subtitle: 'Anterior Wall' },
    { key: 'vessel_LCX', label: 'LCX', subtitle: 'Lateral Wall' },
    { key: 'vessel_RCA', label: 'RCA', subtitle: 'Inferior Wall' },
  ];

  return (
    <div className="relative w-full h-full bg-surface-0 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 0.3, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#070A10']} />

        {/* Studio Three-Point Clinical Lighting System */}
        {/* 1. Ambient Fill: Gentle slate ambiance to preserve deep muscle tones */}
        <ambientLight intensity={0.42} color="#94a3b8" />

        {/* 2. Key Directional Light: Soft anatomical key light from top-right */}
        <directionalLight position={[3.5, 4.5, 3.5]} intensity={1.15} color="#ffffff" />

        {/* 3. Fill Light: Cool clinical blue fill to reveal anatomical contours */}
        <directionalLight position={[-4.0, 1.5, 2.0]} intensity={0.5} color="#60a5fa" />

        {/* 4. Cyan Rim Backlight: High-impact clinical cyan edge light */}
        <directionalLight position={[0.0, 3.0, -4.5]} intensity={1.4} color="#06b6d4" />

        {/* 5. Floor Bounce: Soft upward fill preventing dark shadow wash */}
        <directionalLight position={[0.0, -4.0, 1.0]} intensity={0.25} color="#1e293b" />

        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl glass-panel text-slate-300 text-xs font-mono border border-slate-700/60 shadow-2xl">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading 3D Anatomy Digital Twin...</span>
              </div>
            </Html>
          }
        >
          {/* Natively centered anatomical digital twin at (0, 0, 0) */}
          <HeartModel onHoverVessel={setHoveredVessel} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={2.5}
          maxDistance={8.0}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.15}
          makeDefault
        />

        <CameraRig controlsRef={controlsRef} />
      </Canvas>

      {/* Viewport Top HUD: Anatomical Focus Selector Tabs */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1 rounded-xl glass-panel border border-slate-700/60 shadow-xl backdrop-blur-md">
        {vesselButtons.map((btn) => {
          const isActive = activeVesselFocus === btn.key;
          let indicatorColor = '#94a3b8';
          let probBadge = '';

          if (btn.key === 'vessel_LAD' && vessels?.lad) {
            indicatorColor = vessels.lad.color_hex;
            probBadge = `${(vessels.lad.probability * 100).toFixed(0)}%`;
          }
          if (btn.key === 'vessel_LCX' && vessels?.lcx) {
            indicatorColor = vessels.lcx.color_hex;
            probBadge = `${(vessels.lcx.probability * 100).toFixed(0)}%`;
          }
          if (btn.key === 'vessel_RCA' && vessels?.rca) {
            indicatorColor = vessels.rca.color_hex;
            probBadge = `${(vessels.rca.probability * 100).toFixed(0)}%`;
          }

          return (
            <button
              key={btn.key}
              onClick={() => setVesselFocus(btn.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-cyan-600/30 text-white border border-cyan-500/70 shadow-glow-cyan'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              {btn.key !== 'default' ? (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: indicatorColor }}
                />
              ) : (
                <Focus className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="font-semibold">{btn.label}</span>
              {probBadge && (
                <span className="font-mono text-[10px] text-slate-400 bg-slate-900/80 px-1 py-0.5 rounded">
                  {probBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hover Inspection Badge */}
      {hoveredVessel && (
        <div className="absolute top-4 right-4 z-10 glass-card p-2 px-3 rounded-xl border border-cyan-500/60 flex items-center gap-2 text-xs font-mono text-cyan-300 shadow-glow-cyan animate-in fade-in">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click to frame {hoveredVessel.replace('vessel_', '')}</span>
        </div>
      )}

      {/* Viewport Bottom HUD: Color Risk Legend & Interactive Hints */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Risk Color Gradient Legend */}
        <div className="glass-panel px-3 py-2 rounded-xl border border-slate-800/80 flex items-center gap-3.5 text-[11px] font-mono pointer-events-auto shadow-xl backdrop-blur-md">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            Stenosis Risk Tier
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-sm" />
            <span className="text-slate-300">Optimal (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-sm" />
            <span className="text-slate-300">Borderline (40-70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-sm animate-pulse" />
            <span className="text-slate-300">Critical (&ge;70%)</span>
          </div>
        </div>

        {/* 3D Navigation Controls Hint */}
        <div className="hidden md:flex items-center gap-2 glass-panel px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 font-mono shadow-md backdrop-blur-md">
          <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
          <span>Rotate: Left Click // Pan: Right Click // Zoom: Scroll</span>
        </div>
      </div>
    </div>
  );
};
