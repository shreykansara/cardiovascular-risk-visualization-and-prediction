/**
 * Step 1: Welcome & Clinical Safety Disclaimer Page
 * Presents platform overview, regulatory scope, and requires mandatory user acknowledgement.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, ArrowRight, Heart, Cpu, FileText, CheckCircle2 } from 'lucide-react';
import { useWizardStore } from '../store/useWizardStore';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { disclaimerAccepted, setDisclaimerAccepted } = useWizardStore();

  const handleStart = () => {
    if (!disclaimerAccepted) return;
    navigate('/enter-data');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full">
      {/* Hero Welcome Card */}
      <div className="w-full glass-card border border-white/[0.08] rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle Background Glow Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header Title */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mt-1">
              Perfusion<span className="text-cyan-400">3D</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium">
              Spatial Hemodynamic Ischemia & Coronary Digital Twin
            </p>
          </div>

          {/* Product Overview Paragraph */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-slate-300 text-sm leading-relaxed">
            <p>
              Perfusion3D is a clinical decision-support and spatial digital twin platform designed to evaluate multi-vessel coronary artery disease (CAD) risk across 55 physiological parameters. By coupling calibrated multi-head gradient-boosted ensembles with interactive 3D Catmull-Rom hemodynamic vascular conduits, the system estimates localized stenosis probabilities for the Left Anterior Descending (LAD), Left Circumflex (LCX), and Right Coronary (RCA) arteries alongside TreeSHAP feature attributions and structured clinical reports.
            </p>
          </div>

          {/* 3 Key Workflow Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-1">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-white/[0.06] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">55-Feature Engine</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Demographics, vitals, ECG, blood biomarkers, and echocardiography.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-white/[0.06] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">3D Vascular Twin</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Full 3D anatomical heart with color-coded stenosis probabilities.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-white/[0.06] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Automated Reports</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Doctor-facing technical report and plain-language patient summary.
                </p>
              </div>
            </div>
          </div>

          {/* Clinical Safety Disclaimer Section (Clearly Visible) */}
          <div className="flex flex-col gap-3 pt-2">
            <DisclaimerBanner />

            {/* Mandatory User Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/50 cursor-pointer transition-colors mt-2 select-none group">
              <div className="pt-0.5 shrink-0">
                <input
                  type="checkbox"
                  id="disclaimer-checkbox"
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400/50 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 bg-slate-800 cursor-pointer"
                />
              </div>
              <div className="text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-white group-hover:text-amber-200 transition-colors">
                  I understand and acknowledge the clinical safety terms.
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  I confirm this system will be utilized strictly for research, decision support, and educational exploration, and not as an autonomous diagnostic authority.
                </p>
              </div>
            </label>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] mt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Leakage Guard Enforced (Zero Target Contamination)</span>
            </div>

            <button
              type="button"
              id="start-wizard-btn"
              onClick={handleStart}
              disabled={!disclaimerAccepted}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                disclaimerAccepted
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] cursor-pointer hover:scale-[1.02]'
                  : 'bg-slate-800 text-slate-500 border border-white/[0.06] cursor-not-allowed opacity-60'
              }`}
            >
              <span>Begin Clinical Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
