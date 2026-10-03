/**
 * Vessel Stenosis Status Card (Tasks 4.3, 4.4, 4.5)
 * Displays predicted stenosis probability, category label, mini progress bar,
 * and handles bidirectional 3D twin vessel synchronization.
 */

import React from 'react';
import type { TargetPrediction } from '../../types/clinical';
import { Eye, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface VesselCardProps {
  vesselKey: 'cad' | 'lad' | 'lcx' | 'rca';
  title: string;
  subtitle: string;
  prediction?: TargetPrediction;
  isSelected: boolean;
  onSelect: () => void;
}

export const VesselCard: React.FC<VesselCardProps> = ({
  vesselKey,
  title,
  subtitle,
  prediction,
  isSelected,
  onSelect,
}) => {
  const prob = prediction?.probability ?? 0;
  const probPct = Math.round(prob * 1000) / 10;
  const colorHex = prediction?.color_hex || '#10B981';

  let tierLabel = 'Patent / Low Risk';
  let TierIcon = ShieldCheck;
  if (prob > 0.70) {
    tierLabel = 'Critical Ischemia';
    TierIcon = AlertOctagon;
  } else if (prob > 0.40) {
    tierLabel = 'Borderline Risk';
    TierIcon = AlertTriangle;
  }

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
      className={`p-4 rounded-2xl transition-all cursor-pointer select-none text-left border relative overflow-hidden ${
        isSelected
          ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50 scale-[1.01]'
          : 'bg-slate-900/50 border-white/[0.08] hover:border-white/[0.18] hover:bg-slate-900/70'
      }`}
    >
      {/* Active Focus Indicator Pip */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40">
          <Eye className="w-3 h-3" />
          <span>Focused</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between gap-2 pr-16">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span>{title}</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-mono truncate">{subtitle}</p>
        </div>
      </div>

      {/* Probability Display (Task 4.5: Labeled as 'predicted stenosis probability') */}
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
            Predicted Stenosis Probability
          </span>
          <span
            className="text-2xl font-mono font-bold tracking-tight"
            style={{ color: colorHex }}
          >
            {probPct.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: colorHex }}>
          <TierIcon className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono">{tierLabel}</span>
        </div>
      </div>

      {/* Probability Progress Bar */}
      <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden mt-2.5 border border-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, prob * 100))}%`,
            backgroundColor: colorHex,
            boxShadow: `0 0 10px ${colorHex}`,
          }}
        />
      </div>
    </div>
  );
};

export default VesselCard;
