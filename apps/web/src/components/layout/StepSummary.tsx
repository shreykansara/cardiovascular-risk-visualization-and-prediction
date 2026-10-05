import React from 'react';
import { useLocation } from 'react-router-dom';
import { WIZARD_STEPS } from '../../types/wizard';

export const StepSummary: React.FC = () => {
  const location = useLocation();

  const currentStepDef = WIZARD_STEPS.find((s) => s.path === location.pathname);
  if (!currentStepDef) {
    return null;
  }

  const currentStepNumber = currentStepDef.step;

  return (
    <div className="app-chrome step-summary-bar">
      <div
        style={{
          fontFamily: 'var(--fm)',
          fontSize: '12px',
          color: 'var(--mut)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        Step {currentStepNumber} of 4: {currentStepDef.label}
      </div>
      <div className="step-summary-segments">
        {[1, 2, 3, 4].map((step) => {
          let segmentColor = 'var(--bd)';
          if (step < currentStepNumber) {
            segmentColor = 'var(--ink)';
          } else if (step === currentStepNumber) {
            segmentColor = 'var(--acc)';
          }

          return (
            <div
              key={step}
              className="step-summary-segment"
              style={{
                backgroundColor: segmentColor,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
