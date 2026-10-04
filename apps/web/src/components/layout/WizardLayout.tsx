import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { WIZARD_STEPS } from '../../types/wizard';
import { FooterDisclaimer } from '../ui/FooterDisclaimer';
import { Select } from '../ui/Select';
import { Trace } from '../ui/Trace';
import { useTheme } from '../../hooks/useTheme';

export const WizardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [playClass, setPlayClass] = useState('play');

  const currentStepDef =
    WIZARD_STEPS.find((s) => s.path === location.pathname) || WIZARD_STEPS[0];
  const isWizardStep = WIZARD_STEPS.some((s) => s.path === location.pathname);
  const currentStepNumber = currentStepDef.step;

  // Find previous step if eligible for "Back"
  const prevStep = WIZARD_STEPS.find((s) => s.step === currentStepNumber - 1);
  const canGoBack = isWizardStep && currentStepNumber > 1 && Boolean(prevStep);

  // Replay rule: add play class when page first mounts after navigation
  useEffect(() => {
    setPlayClass('play');
  }, [location.pathname]);

  return (
    <div className={`ecg-grid min-h-screen w-full flex flex-col ${playClass}`}>
      {/* Task 4.2 Header: full width, background --panel, border-bottom 1px --bd, padding 10px 16px, flex space-between align center, gap 12px */}
      <header
        style={{
          width: '100%',
          backgroundColor: 'var(--panel)',
          borderBottom: '1px solid var(--bd)',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Left: brand "Perfusion3D" (15px/600) followed by 10px gap and a <Trace /> at 84x16 with header-draw animation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to="/welcome"
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--ink)',
              textDecoration: 'none',
            }}
          >
            Perfusion3D
          </Link>
          <Trace width={84} height={16} className="trace-header" />
        </div>

        {/* Right, in order: Theme Select, Back link (steps 2-4), Step text in mono 12px --mut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Theme Select: options System, Paper, Monitor */}
          <Select
            label="Theme"
            inline
            options={[
              { label: 'System', value: 'system' },
              { label: 'Paper', value: 'light' },
              { label: 'Monitor', value: 'dark' },
            ]}
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
          />

          {/* Small text link "Back" (13px, --acc) shown on steps 2 to 4 */}
          {canGoBack && prevStep && (
            <button
              type="button"
              onClick={() => navigate(prevStep.path)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                color: 'var(--acc)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Back
            </button>
          )}

          {/* Step text in mono 12px --mut: "Step N of 4: LABEL" */}
          {isWizardStep ? (
            <span
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '12px',
                color: 'var(--mut)',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              Step {currentStepNumber} of 4: {currentStepDef.label}
            </span>
          ) : location.pathname === '/model-info' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to="/results"
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '13px',
                  color: 'var(--acc)',
                  textDecoration: 'underline',
                }}
              >
                Back to results
              </Link>
              <span
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '12px',
                  color: 'var(--mut)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                Model information
              </span>
            </div>
          ) : location.pathname === '/design-system' ? (
            <span
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '12px',
                color: 'var(--mut)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Design system
            </span>
          ) : null}
        </div>
      </header>

      {/* Task 4.3 Progress rule directly under header (background --panel, padding 0 16px 10px, border-bottom 1px --bd) */}
      {isWizardStep && (
        <div
          style={{
            backgroundColor: 'var(--panel)',
            padding: '0 16px 10px',
            borderBottom: '1px solid var(--bd)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '2px',
            }}
          >
            {[1, 2, 3, 4].map((step) => {
              let segmentColor = 'var(--bd)'; // upcoming
              if (step < currentStepNumber) {
                segmentColor = 'var(--ink)'; // completed
              } else if (step === currentStepNumber) {
                segmentColor = 'var(--acc)'; // current
              }

              return (
                <div
                  key={step}
                  style={{
                    height: '3px',
                    backgroundColor: segmentColor,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Task 4.1 Main content container: max-width 1200px, margin auto, padding 18px 16px 16px (24px horizontal at >=768px) */}
      <main
        key={location.pathname}
        className="flex-1 w-full flex flex-col"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '18px 16px 16px',
        }}
      >
        <Outlet />
      </main>

      {/* Task 4.4 Footer */}
      <FooterDisclaimer />
    </div>
  );
};

export default WizardLayout;
