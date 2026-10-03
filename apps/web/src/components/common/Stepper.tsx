/**
 * Interactive Clinical Wizard Stepper & Progress Navigation
 * Displays Step 1 to 4 with status: active, completed, or locked.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Lock, ChevronRight, Activity } from 'lucide-react';
import { WIZARD_STEPS } from '../../types/wizard';
import { useWizardStore } from '../../store/useWizardStore';

export const Stepper: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isStepUnlocked, completedSteps } = useWizardStore();

  const currentStepDef =
    WIZARD_STEPS.find((s) => s.path === location.pathname) || WIZARD_STEPS[0];
  const currentStepNumber = currentStepDef.step;

  const progressPercentage = ((currentStepNumber - 1) / (WIZARD_STEPS.length - 1)) * 100;

  const handleStepClick = (targetPath: string, stepNumber: number) => {
    // Can only click if step is unlocked and not future locked
    if (isStepUnlocked(stepNumber)) {
      navigate(targetPath);
    }
  };

  return (
    <nav
      aria-label="Clinical Workflow Stepper"
      className="w-full bg-slate-900/80 border-b border-white/[0.08] backdrop-blur-xl px-4 py-2.5 sm:px-6 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Progress Badge */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.35)]">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-wide text-white flex items-center gap-1.5">
                Perfusion3D
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Twin
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-mono">
                Step {currentStepNumber} of {WIZARD_STEPS.length}: {currentStepDef.label}
              </p>
            </div>
          </div>

          {/* Mobile Step Counter Pill */}
          <div className="md:hidden flex items-center gap-1.5 text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30">
            <span>{Math.round(progressPercentage)}%</span>
          </div>
        </div>

        {/* Stepper Buttons (Desktop & Tablet) */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {WIZARD_STEPS.map((s, idx) => {
            const isActive = s.step === currentStepNumber;
            const isCompleted = completedSteps.includes(s.step) || s.step < currentStepNumber;
            const isUnlocked = isStepUnlocked(s.step);

            return (
              <React.Fragment key={s.id}>
                {idx > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:block" />
                )}

                <button
                  type="button"
                  onClick={() => handleStepClick(s.path, s.step)}
                  disabled={!isUnlocked}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-semibold'
                      : isCompleted && isUnlocked
                      ? 'bg-slate-800/80 text-emerald-300 hover:bg-slate-700/80 border border-emerald-500/30 cursor-pointer'
                      : 'bg-slate-900/40 text-slate-500 border border-white/[0.04] cursor-not-allowed opacity-60'
                  }`}
                  title={
                    !isUnlocked
                      ? 'Locked until prior step completed'
                      : isCompleted
                      ? `Return to ${s.label}`
                      : s.label
                  }
                >
                  {/* Step Status Icon */}
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 font-bold'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : !isUnlocked ? (
                      <Lock className="w-2.5 h-2.5" />
                    ) : (
                      s.step
                    )}
                  </span>

                  <span className="truncate max-w-[130px] sm:max-w-none">{s.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Stepper;
