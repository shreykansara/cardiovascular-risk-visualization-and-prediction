import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import { FEATURE_SCHEMA } from '../config/featureSchema';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    disclaimerAccepted,
    setDisclaimerAccepted,
    markStepCompleted,
    inputs,
    fieldMeta,
    completedSteps,
    resetSession,
  } = useWizardStore();

  const dialogRef = useRef<HTMLDialogElement>(null);

  // Check if store already holds entered values (Task 3.3.4)
  const isTouched = Object.values(fieldMeta).some((m) => m?.touched);
  const hasCompleted = completedSteps.length > 0;
  const hasEnteredValues = isTouched || hasCompleted;

  // Calculate N of 55 values entered
  const enteredCount = FEATURE_SCHEMA.filter(
    (f) => inputs[f.key] !== undefined && inputs[f.key] !== null && inputs[f.key] !== ''
  ).length;

  // If in-progress block is shown, acknowledgement is pre-ticked (persisted in store)
  useEffect(() => {
    if (hasEnteredValues && !disclaimerAccepted) {
      setDisclaimerAccepted(true);
    }
  }, [hasEnteredValues, disclaimerAccepted, setDisclaimerAccepted]);

  const handleStart = () => {
    if (!disclaimerAccepted) return;
    markStepCompleted(1);
    navigate('/enter-data');
  };

  const handleConfirmReset = () => {
    resetSession();
    try {
      sessionStorage.removeItem('perfusion3d-wizard-session');
    } catch (e) {
      // Ignore sessionStorage error
    }
    dialogRef.current?.close();
  };

  return (
    <div
      className="w-full mx-auto"
      style={{
        maxWidth: '720px',
        marginTop: '48px',
        marginBottom: '32px',
      }}
    >
      {/* Everything sits inside ONE Panel with padding 0 (Task 3.1) */}
      <Panel
        style={{
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Task 3.2 A. ECG strip band (wipes with --i: 0) */}
        <div
          className="wipe ecg-grid"
          style={{
            height: '64px',
            borderBottom: '1px solid var(--bd)',
            overflow: 'hidden',
            '--i': 0,
          } as React.CSSProperties}
        >
          <svg
            viewBox="0 0 720 64"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            aria-hidden="true"
            style={{ display: 'block' }}
          >
            <path
              pathLength="1"
              fill="none"
              stroke="var(--acc)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="1"
              d="M0 40 L90 40 L108 40 L116 30 L124 48 L132 40 L190 40 L208 40 L220 10 L234 58 L248 40 L330 40 L356 34 L376 40 L450 40 L468 40 L480 30 L488 48 L496 40 L540 40 L558 40 L570 10 L584 58 L598 40 L720 40"
              style={{
                animation: 'draw 1200ms var(--ease-draw) 200ms backwards',
              }}
            />
          </svg>
        </div>

        {/* Task 3.3 B. Body (wipes with --i: 1) */}
        <div
          className="wipe"
          style={{
            padding: '24px',
            '--i': 1,
          } as React.CSSProperties}
        >
          {/* 1. Title "Perfusion3D" (Sora 28px/36px, weight 600, --ink) */}
          <h1
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '28px',
              lineHeight: '36px',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Perfusion3D
          </h1>

          {/* 2. Lead sentence (margin-top 6px, 14px/1.5, --ink, max-width 56ch) */}
          <p
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '14px',
              lineHeight: 1.5,
              color: 'var(--ink)',
              maxWidth: '56ch',
              marginTop: '6px',
              marginBottom: 0,
            }}
          >
            Estimates the likelihood of coronary artery narrowing from clinical measurements and shows the result on a 3D heart.
          </p>

          {/* 3. "What happens next" block (margin-top 24px) */}
          <div style={{ marginTop: '24px' }}>
            <h2
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ink)',
                paddingBottom: '5px',
                borderBottom: '1px solid var(--bd)',
                margin: 0,
              }}
            >
              What happens next
            </h2>

            {/* 3 Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                {
                  num: '1',
                  title: 'Enter measurements',
                  desc: 'Fill in or check the clinical values.',
                },
                {
                  num: '2',
                  title: 'View the result',
                  desc: 'See the predicted probability for each artery on a 3D heart.',
                },
                {
                  num: '3',
                  title: 'Create reports',
                  desc: 'Get a clinician report and a plain-language patient report.',
                },
              ].map((row) => (
                <div
                  key={row.num}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid var(--bd)',
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--fm)',
                      fontSize: '12px',
                      color: 'var(--mut)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {row.num}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--fs)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                      }}
                    >
                      {row.title}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--fs)',
                        fontSize: '12px',
                        color: 'var(--mut)',
                        marginTop: '2px',
                      }}
                    >
                      {row.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. In-progress block (render ONLY when the store already holds entered values) */}
          {hasEnteredValues && (
            <div
              style={{
                marginTop: '20px',
                border: '1px solid var(--bd)',
                borderRadius: '3px',
                backgroundColor: 'var(--hov)',
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '13px',
                  color: 'var(--ink)',
                }}
              >
                An assessment is in progress: {enteredCount} of 55 values entered.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <Button
                  variant="primary"
                  onClick={() => navigate('/enter-data')}
                  style={{ height: '32px' }}
                >
                  Continue
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => dialogRef.current?.showModal()}
                  style={{ height: '32px' }}
                >
                  Start new
                </Button>
              </div>
            </div>
          )}

          {/* 5. Disclaimer block (margin-top 24px) */}
          <div
            style={{
              marginTop: '24px',
              border: '1px solid var(--bd)',
              borderRadius: '3px',
              backgroundColor: 'var(--hov)',
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '4px',
              }}
            >
              Decision support only
            </div>
            <p
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                lineHeight: 1.45,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Predictions are for decision-support and educational purposes only and are not a substitute for formal diagnostic imaging or professional medical evaluation.
            </p>
          </div>

          {/* 6. Acknowledgement row (margin-top 16px) */}
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              id="welcome-understand-checkbox"
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--acc)',
                cursor: 'pointer',
                margin: 0,
              }}
            />
            <label
              htmlFor="welcome-understand-checkbox"
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                color: 'var(--ink)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              I understand
            </label>
          </div>

          {/* 7. Action row (margin-top 20px) */}
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Button
              id="start-assessment-btn"
              variant="primary"
              disabled={!disclaimerAccepted}
              onClick={handleStart}
            >
              Start assessment
            </Button>
            {!disclaimerAccepted && (
              <span
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '11px',
                  color: 'var(--mut)',
                }}
              >
                Tick the box to continue
              </span>
            )}
          </div>
        </div>
      </Panel>

      {/* Confirmation Dialog for Start New from in-progress card */}
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
            onClick={handleConfirmReset}
            style={{ height: '32px' }}
          >
            Clear and start over
          </Button>
        </div>
      </dialog>
    </div>
  );
};

export default WelcomePage;
