import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { WIZARD_STEPS } from '../../types/wizard';
import { useWizardStore } from '../../store/useWizardStore';
import { useTheme } from '../../hooks/useTheme';
import { Trace } from '../ui/Trace';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { QuietButton } from '../ui/QuietButton';

export interface AppNavProps {
  // Optional override for design system preview
  forceStep?: number;
  forceState?: 'completed' | 'current' | 'upcoming' | 'hover' | 'focus';
}

export const AppNav: React.FC<AppNavProps> = ({ forceStep, forceState }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const reset = useWizardStore((s) => s.reset);
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
    : currentStepDef ? currentStepDef.step : 0;
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
    if (stepNumber === 1 || stepNumber < currentStepNumber || isStepUnlocked(stepNumber)) {
      navigate(path);
    }
  };

  const handleConfirmNewAssessment = () => {
    dialogRef.current?.close();
    navigate('/welcome', { replace: true });
    reset();
  };

  return (
    <header className="app-chrome app-header">
      {/* Task 2.1 Visually-hidden Skip link, visible on focus */}
      <a href="#main-content" className="skip-link app-chrome no-print">
        Skip to content
      </a>

      <div className="app-header-inner">
        {/* Task 2.2 LEFT zone */}
        <Link
          to="/"
          style={{
            justifySelf: 'start',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'inherit',
          }}
          aria-label="Perfusion3D Home"
        >
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
        </Link>

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
                    disabled={isCurrent || (isUpcoming && s.step !== 1 && !isStepUnlocked(s.step))}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-disabled={isUpcoming && s.step !== 1 && !isStepUnlocked(s.step) ? 'true' : undefined}
                    tabIndex={isUpcoming && s.step !== 1 && !isStepUnlocked(s.step) ? -1 : 0}
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
        <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* a) Theme toggle button */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="app-theme-toggle-btn"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'Paper' : 'Monitor'} theme`}
            title={`Switch to ${resolvedTheme === 'dark' ? 'Paper' : 'Monitor'} theme`}
            style={{
              width: '32px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--bds)',
              borderRadius: 'var(--radius)',
              color: 'var(--ink)',
              cursor: 'pointer',
              transition: 'background-color 140ms ease, border-color 140ms ease, transform 140ms ease',
            }}
          >
            {resolvedTheme === 'dark' ? (
              <Sun size={15} />
            ) : (
              <Moon size={15} />
            )}
          </button>

          {/* b) New assessment text button (shown only on steps 2-4 and >=900px) */}
          {isWizardStep && currentStepNumber >= 2 && currentStepNumber <= 4 && (
            <QuietButton
              size="sm"
              className="nav-new-assessment-btn"
              onClick={() => dialogRef.current?.showModal()}
            >
              New assessment
            </QuietButton>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for New Assessment */}
      <dialog ref={dialogRef} className="nav-confirm-dialog app-chrome no-print">
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
          <SecondaryButton
            size="sm"
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            onClick={handleConfirmNewAssessment}
          >
            Clear and start over
          </PrimaryButton>
        </div>
      </dialog>
    </header>
  );
};

export default AppNav;
