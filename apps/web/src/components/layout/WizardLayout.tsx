import React from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { WIZARD_STEPS } from '../../types/wizard';
import { useWizardStore } from '../../store/useWizardStore';
import { FooterDisclaimer } from '../ui/FooterDisclaimer';
import { Select } from '../ui/Select';
import { useTheme } from '../../hooks/useTheme';

export const WizardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { completedSteps } = useWizardStore();
  const { theme, setTheme } = useTheme();

  const currentStepDef =
    WIZARD_STEPS.find((s) => s.path === location.pathname) || WIZARD_STEPS[0];
  const isWizardStep = WIZARD_STEPS.some((s) => s.path === location.pathname);
  const currentStepNumber = currentStepDef.step;

  // Find previous step if eligible for "Back"
  const prevStep = WIZARD_STEPS.find((s) => s.step === currentStepNumber - 1);
  const canGoBack = isWizardStep && currentStepNumber > 1 && prevStep;

  return (
    <div className="min-h-screen w-full bg-page text-text flex flex-col font-sans">
      {/* 48px Header */}
      <header className="h-[48px] bg-page border-b border-border sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <Link to="/welcome" className="text-[16px] leading-[24px] font-semibold text-text hover:text-accent no-underline">
            Perfusion3D
          </Link>

          <div className="flex items-center gap-4">
            {canGoBack && (
              <button
                type="button"
                onClick={() => navigate(prevStep.path)}
                className="text-[13px] leading-[20px] text-accent hover:underline cursor-pointer border-0 bg-transparent p-0"
              >
                Back
              </button>
            )}

            {/* Task 3.5: Compact Theme Select */}
            <Select
              label="Theme"
              inline
              options={[
                { label: 'System', value: 'system' },
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ]}
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
            />

            {isWizardStep ? (
              <span className="text-[13px] leading-[20px] text-text-muted">
                Step {currentStepNumber} of 4: {currentStepDef.label}
              </span>
            ) : location.pathname === '/model-info' ? (
              <div className="flex items-center gap-3">
                <Link to="/results" className="text-[13px] leading-[20px] text-accent hover:underline">
                  Back to results
                </Link>
                <span className="text-[13px] leading-[20px] text-text-muted">
                  Model information
                </span>
              </div>
            ) : location.pathname === '/design-system' ? (
              <span className="text-[13px] leading-[20px] text-text-muted">
                Design system
              </span>
            ) : null}
          </div>
        </div>

        {/* 2px progress line divided into 4 equal segments */}
        {isWizardStep && (
          <div className="flex h-[2px] w-full">
            {[1, 2, 3, 4].map((step) => {
              let segmentColor = 'bg-border'; // upcoming
              if (step < currentStepNumber) {
                segmentColor = 'bg-text'; // done
              } else if (step === currentStepNumber) {
                segmentColor = 'bg-accent'; // current
              }

              return (
                <div
                  key={step}
                  className={`flex-1 h-full ${segmentColor}`}
                />
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>

      {/* Slim Persistent Footer Strip */}
      <FooterDisclaimer />
    </div>
  );
};

export default WizardLayout;
