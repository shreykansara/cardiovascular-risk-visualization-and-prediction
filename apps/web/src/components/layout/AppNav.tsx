import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WIZARD_STEPS } from '../../types/wizard';
import { useWizardStore } from '../../store/useWizardStore';
import { useTheme } from '../../hooks/useTheme';
import { Trace } from '../ui/Trace';
import { Button } from '../ui/Button';

export interface AppNavProps {
  // Optional override for design system preview
  forceStep?: number;
  forceState?: 'completed' | 'current' | 'upcoming' | 'hover' | 'focus';
}

export const AppNav: React.FC<AppNavProps> = ({ forceStep, forceState }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const resetSession = useWizardStore((s) => s.resetSession);
  const isStepUnlocked = useWizardStore((s) => s.isStepUnlocked);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const prevStepRef = useRef<number | null>(null);

  const [animatingSteps, setAnimatingSteps] = useState<{
    completedStep: number;
    currentStep: number;
  } | null>(null);

  // Determine current step
  const currentStepDef = WIZARD_STEPS.find((s) => s.path === location.pathname);
  const currentStepNumber = forceStep !== undefined
    ? forceStep
    : currentStepDef ? currentStepDef.step : 1;
  const isWizardStep = Boolean(currentStepDef) || forceStep !== undefined;

  // Step bar forward animation logic (Task 2.3)
  useEffect(() => {
    if (prevStepRef.current !== null && currentStepNumber > prevStepRef.current) {
      setAnimatingSteps({
        completedStep: prevStepRef.current,
        currentStep: currentStepNumber,
      });

      const timer = setTimeout(() => {
        setAnimatingSteps(null);
      }, 700);

      return () => clearTimeout(timer);
    }
    prevStepRef.current = currentStepNumber;
  }, [currentStepNumber]);

  const handleStepClick = (stepNumber: number, path: string) => {
    if (stepNumber < currentStepNumber || isStepUnlocked(stepNumber)) {
      navigate(path);
    }
  };

  const handleConfirmNewAssessment = () => {
    resetSession();
    try {
      sessionStorage.removeItem('perfusion3d-wizard-session');
    } catch (e) {
      // Ignore sessionStorage error
    }
    dialogRef.current?.close();
    navigate('/welcome');
  };

  return (
    <header className="app-chrome app-header">
      {/* Task 2.1 Visually-hidden Skip link, visible on focus */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <div className="app-header-inner">
        {/* Task 2.2 LEFT zone */}
        <div style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trace width={36} height={16} className="trace-initial" />
          <span
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            Perfusion3D
          </span>
        </div>

        {/* Task 2.3 CENTER zone (>=900px) */}
        <nav aria-label="Progress" className="nav-center-zone">
          <ol
            style={{
              display: 'flex',
              gap: '2px',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              height: '100%',
              alignItems: 'center',
            }}
          >
            {WIZARD_STEPS.map((s) => {
              const isCompleted = currentStepNumber > s.step;
              const isCurrent = currentStepNumber === s.step;
              const isUpcoming = currentStepNumber < s.step;

              // Animation class on forward transition
              let barAnimClass = '';
              if (animatingSteps) {
                if (s.step === animatingSteps.completedStep) {
                  barAnimClass = 'bar-grow';
                } else if (s.step === animatingSteps.currentStep) {
                  barAnimClass = 'bar-grow-delayed';
                }
              }

              let stateClass = 'upcoming';
              if (isCurrent) stateClass = 'current';
              else if (isCompleted) stateClass = 'completed';

              if (forceState) {
                stateClass = forceState;
              }

              return (
                <li key={s.step} style={{ height: '100%', display: 'flex' }}>
                  <button
                    type="button"
                    className={`nav-step-item-btn ${stateClass} ${barAnimClass}`}
                    onClick={() => handleStepClick(s.step, s.path)}
                    disabled={isCurrent || isUpcoming}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-disabled={isUpcoming ? 'true' : undefined}
                    tabIndex={isUpcoming ? -1 : 0}
                  >
                    <span className="nav-step-num">{s.step}</span>
                    <span>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Task 2.4 RIGHT zone */}
        <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* a) Theme control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              htmlFor="nav-theme-select"
              className="theme-label"
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '12px',
                color: 'var(--mut)',
              }}
            >
              Theme
            </label>
            <select
              id="nav-theme-select"
              aria-label="Theme"
              className="theme-select-control"
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              style={{
                height: '32px',
                width: '112px',
                fontFamily: 'var(--fs)',
                fontSize: '12px',
                backgroundColor: 'var(--panel)',
                color: 'var(--ink)',
                border: '1px solid var(--bds)',
                borderRadius: 'var(--radius)',
                padding: '0 8px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="system">System</option>
              <option value="light">Paper</option>
              <option value="dark">Monitor</option>
            </select>
          </div>

          {/* b) New assessment text button (shown only on steps 2-4 and >=900px) */}
          {isWizardStep && currentStepNumber >= 2 && currentStepNumber <= 4 && (
            <button
              type="button"
              className="nav-new-assessment-btn"
              onClick={() => dialogRef.current?.showModal()}
            >
              New assessment
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for New Assessment */}
      <dialog ref={dialogRef} className="nav-confirm-dialog">
        <h3
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '0 0 8px 0',
          }}
        >
          Start a new assessment?
        </h3>
        <p
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '13px',
            color: 'var(--mut)',
            margin: '0 0 20px 0',
            lineHeight: 1.45,
          }}
        >
          This clears all entered values and results from this session.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            variant="secondary"
            onClick={() => dialogRef.current?.close()}
            style={{ height: '32px' }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmNewAssessment}
            style={{ height: '32px' }}
          >
            Clear and start over
          </Button>
        </div>
      </dialog>
    </header>
  );
};

export default AppNav;
