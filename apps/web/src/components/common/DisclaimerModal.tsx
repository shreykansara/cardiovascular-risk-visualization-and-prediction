/**
 * Clinical Safety Disclaimer Modal (AuraCor DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { AlertTriangle, ShieldCheck, Stethoscope, ChevronRight } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';

export const DisclaimerModal: React.FC = () => {
  const { disclaimerAccepted, acceptDisclaimer } = usePatientStore();

  if (disclaimerAccepted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl glass-panel rounded-2xl p-6 md:p-8 border border-amber-500/40 shadow-2xl shadow-black">
        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                FDA / CE SaMD Class IIa Prototype Notice
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight mt-1">
              Clinical Decision-Support & Educational Boundary
            </h2>
          </div>
        </div>

        {/* Legal & Regulatory Content */}
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed bg-surface-2/60 p-4 rounded-xl border border-slate-700/50 mb-6 font-sans">
          <p>
            <strong className="text-white">AuraCor // CAD-3D</strong> is an investigational Artificial Intelligence and 3D WebGL anatomical digital twin platform engineered solely for <strong>clinical research, academic decision support, and physiological visualization</strong>.
          </p>

          <div className="space-y-2 border-t border-slate-700/60 pt-3 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Not a Diagnostic Tool:</strong> Predicted coronary artery stenosis probabilities and 3D vessel color maps <strong>DO NOT</strong> replace formal coronary angiography (invasive catheterization) or contrast-enhanced CT angiography.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Data Isolation:</strong> Models are trained with strict mathematical target leakage prevention (invasive catheterization findings and vessel stenosis labels are strictly excluded from inputs).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Human Oversight:</strong> Treatment protocols and surgical interventions must be confirmed independently by board-certified cardiologists.</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audited for Zero Target Leakage & Calibrated Probabilities</span>
          </div>
          <button
            onClick={acceptDisclaimer}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Acknowledge & Access Console</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
