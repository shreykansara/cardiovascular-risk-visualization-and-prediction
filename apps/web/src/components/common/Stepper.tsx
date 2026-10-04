/**
 * Interactive Clinical Wizard Stepper & Progress Navigation (Phase C)
 * Displays Step 1 to 4 with clean clinical design tokens.
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
    if (isStepUnlocked(stepNumber)) {
      navigate(targetPath);
    }
  };

  return (
    <nav
      aria-label="Clinical Workflow Stepper"
      className="w-full bg-[#131a26] border-b border-[#283548] px-4 py-2.5 sm:px-6 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Progress Badge */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                Perfusion3D
                <span className="text-[10px] uppercase font-mono-numbers px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60">
                  DWS
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-mono-numbers">
                Step {currentStepNumber} of {WIZARD_STEPS.length}: {currentStepDef.label}
              </p>
            </div>
          </div>

          {/* Mobile Step Counter Pill */}
          <div className="md:hidden flex items-center gap-1.5 text-xs font-mono-numbers text-slate-300 bg-[#1c2637] px-2.5 py-1 rounded border border-[#283548]">
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#1c2637] text-white border border-[#384961] font-semibold'
                      : isCompleted && isUnlocked
                      ? 'bg-[#131a26] text-green-300 hover:bg-[#1c2637] border border-green-800/60'
                      : 'bg-[#0b0f17] text-slate-500 border border-[#283548]/50 cursor-not-allowed opacity-60'
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
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono-numbers shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold'
                        : isCompleted
                        ? 'bg-green-950/80 text-green-400 border border-green-700/60'
                        : 'bg-[#1c2637] text-slate-500'
                    }`}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
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
