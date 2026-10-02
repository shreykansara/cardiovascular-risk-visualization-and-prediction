/**
 * Anatomical Focus Floating Bottom Dock (AuraCor Spatial DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { Focus, Rotate3d } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';

export const BottomDock: React.FC = () => {
  const { activeVesselFocus, setVesselFocus, analysis } = usePatientStore();
  const vessels = analysis?.predictions?.vessels;

  const buttons = [
    { key: 'default', label: 'All Vessels', prob: null, color: '#38bdf8' },
    {
      key: 'vessel_LAD',
      label: 'LAD',
      fullName: 'Left Anterior Descending',
      prob: vessels?.lad ? Math.round(vessels.lad.probability * 100) : null,
      color: vessels?.lad?.color_hex ?? '#10b981',
      isCritical: vessels?.lad?.risk_tier === 'CRITICAL' || vessels?.lad?.risk_tier === 'HIGH',
    },
    {
      key: 'vessel_LCX',
      label: 'LCX',
      fullName: 'Left Circumflex',
      prob: vessels?.lcx ? Math.round(vessels.lcx.probability * 100) : null,
      color: vessels?.lcx?.color_hex ?? '#10b981',
      isCritical: vessels?.lcx?.risk_tier === 'CRITICAL' || vessels?.lcx?.risk_tier === 'HIGH',
    },
    {
      key: 'vessel_RCA',
      label: 'RCA',
      fullName: 'Right Coronary Artery',
      prob: vessels?.rca ? Math.round(vessels.rca.probability * 100) : null,
      color: vessels?.rca?.color_hex ?? '#10b981',
      isCritical: vessels?.rca?.risk_tier === 'CRITICAL' || vessels?.rca?.risk_tier === 'HIGH',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-2 pointer-events-none z-30 select-none animate-cinema-bottom">
      {/* Floating Segmented Vessel Dock */}
      <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full border border-white/10 bg-slate-950/60 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        {buttons.map((btn) => {
          const isActive = activeVesselFocus === btn.key;
          return (
            <button
              key={btn.key}
              onClick={() => setVesselFocus(btn.key)}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white font-semibold shadow-sm border border-white/15 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              {btn.key === 'default' ? (
                <Focus className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${btn.isCritical ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: btn.color,
                    boxShadow: `0 0 8px ${btn.color}90`,
                  }}
                />
              )}
              <span>{btn.label}</span>
              {btn.prob !== null && (
                <span className="font-mono text-[10px] text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded-full">
                  {btn.prob}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Micro Navigation Hint */}
      <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400/80 font-mono tracking-wider">
        <Rotate3d className="w-3 h-3 text-cyan-400/70" />
        <span>DRAG TO ORBIT // SCROLL TO ZOOM // CLICK VESSEL TO FRAME</span>
      </div>
    </div>
  );
};
