/**
 * Subtle Regulatory Safety Floating Pill & Popover (AuraCor Spatial DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, ShieldCheck, X } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';

export const DisclaimerModal: React.FC = () => {
  const { disclaimerAccepted, acceptDisclaimer } = usePatientStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (disclaimerAccepted) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-sm pointer-events-auto select-none animate-cinema-bottom">
      <div className="ultra-glass rounded-2xl border border-white/10 p-3 shadow-2xl backdrop-blur-2xl transition-all">
        {/* Compact Pill State */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
            <span className="text-[11px] font-mono tracking-wide text-slate-300 font-medium">
              RESEARCH PROTOTYPE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] transition-all flex items-center gap-1"
            >
              <span>{isExpanded ? 'Hide' : 'Details'}</span>
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
            <button
              onClick={acceptDisclaimer}
              title="Acknowledge & Dismiss"
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Regulatory Details */}
        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2 text-[11px] text-slate-300 font-sans leading-relaxed">
            <p className="text-slate-400">
              <strong className="text-white">AuraCor CAD-3D</strong> is an investigational decision-support prototype. 3D ischemic color maps do not replace catheter angiography.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Strict zero target-leakage training verified</span>
            </div>
            <button
              onClick={acceptDisclaimer}
              className="w-full mt-1.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all"
            >
              Acknowledge & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
