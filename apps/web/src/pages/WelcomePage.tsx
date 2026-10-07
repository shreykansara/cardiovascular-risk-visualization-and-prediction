import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import { Panel } from '../components/ui/Panel';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    disclaimerAccepted,
    setDisclaimerAccepted,
    markStepCompleted,
    loadSamplePatient,
  } = useWizardStore();

  const handleStart = () => {
    if (!disclaimerAccepted) return;
    markStepCompleted(1);
    navigate('/enter-data');
  };

  const handleQuickLoad = (presetKey: string) => {
    setDisclaimerAccepted(true);
    markStepCompleted(1);
    loadSamplePatient(presetKey);
    navigate('/enter-data');
  };

  return (
    <div
      className="w-full mx-auto"
      style={{
        maxWidth: '820px',
        marginTop: '28px',
        marginBottom: '40px',
      }}
    >
      {/* Main Container Panel with ECG Header */}
      <Panel
        style={{
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Animated ECG Rhythm Strip Header Banner */}
        <div
          className="wipe ecg-grid ecg-strip-band"
          style={{
            height: '64px',
            borderBottom: '1px solid var(--bd)',
            overflow: 'hidden',
            '--i': 0,
          } as React.CSSProperties}
        >
          <svg
            viewBox="0 0 920 64"
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
              d="M0 40 L90 40 L108 40 L116 30 L124 48 L132 40 L190 40 L208 40 L220 10 L234 58 L248 40 L330 40 L356 34 L376 40 L450 40 L468 40 L480 30 L488 48 L496 40 L540 40 L558 40 L570 10 L584 58 L598 40 L680 40 L702 34 L722 40 L780 40 L798 40 L810 10 L824 58 L838 40 L920 40"
              style={{
                animation: 'draw 1200ms var(--ease-draw) 200ms backwards',
              }}
            />
          </svg>
        </div>

        {/* Welcome Section */}
        <div
          className="wipe"
          style={{
            padding: '32px 28px 28px',
            '--i': 1,
          } as React.CSSProperties}
        >
          {/* Eyebrow Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--fm)',
              fontSize: '11px',
              color: 'var(--mut)',
              backgroundColor: 'var(--hov)',
              border: '1px solid var(--bd)',
              borderRadius: 'var(--radius)',
              padding: '3px 8px',
              marginBottom: '14px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--low)',
                display: 'inline-block',
              }}
            />
            <span>HEART HEALTH ASSESSMENT · STEP 1 OF 4</span>
          </div>

          {/* Primary Heading */}
          <h1
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '26px',
              lineHeight: '34px',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Welcome to Perfusion3D
          </h1>

          {/* Customer-friendly Lead Paragraph */}
          <p
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '14.5px',
              lineHeight: 1.6,
              color: 'var(--ink)',
              maxWidth: '68ch',
              marginTop: '10px',
              marginBottom: 0,
              opacity: 0.9,
            }}
          >
            A visual way to explore heart artery health and prepare for your doctor&apos;s appointment. Enter routine health measurements or upload test reports to see an interactive 3D model of your heart&apos;s main arteries.
          </p>

          {/* Customer Orientation: 3 Simple Steps */}
          <div style={{ marginTop: '24px' }}>
            <h2
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ink)',
                paddingBottom: '6px',
                borderBottom: '1px solid var(--bd)',
                margin: '0 0 12px 0',
              }}
            >
              What to expect
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              {[
                {
                  step: '1',
                  title: 'Enter measurements',
                  desc: 'Add numbers like blood pressure and cholesterol, or upload your ECG and echo reports.',
                },
                {
                  step: '2',
                  title: 'Explore your 3D heart',
                  desc: 'Rotate a 3D heart color-coded to show the estimated chance of narrowing in each artery.',
                },
                {
                  step: '3',
                  title: 'Review and share',
                  desc: 'See which health factors influenced your results, and print a clear summary for your doctor.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    padding: '14px 16px',
                    border: '1px solid var(--bd)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--panel)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--fm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--acc)',
                        backgroundColor: 'var(--hov)',
                        border: '1px solid var(--bd)',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.step}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--fs)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                      }}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      color: 'var(--mut)',
                      margin: 0,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Support Disclaimer Block */}
          <div
            style={{
              marginTop: '24px',
              border: '1px solid var(--bd)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--hov)',
              padding: '14px 16px',
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
              Important notice
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

          {/* Acknowledgement Checkbox Row */}
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

          {/* Primary Action Button Row */}
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <PrimaryButton
              id="start-assessment-btn"
              size="lg"
              disabled={!disclaimerAccepted}
              onClick={handleStart}
            >
              Start assessment
            </PrimaryButton>

            {!disclaimerAccepted && (
              <span
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '12px',
                  color: 'var(--mut)',
                }}
              >
                Check the box above to continue
              </span>
            )}
          </div>

          {/* Sample Profiles Quick-Launch Section */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--bd)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '12px',
                color: 'var(--mut)',
                marginRight: '4px',
              }}
            >
              Or explore with sample data:
            </span>
            <SecondaryButton
              size="sm"
              onClick={() => handleQuickLoad('normal')}
            >
              Lower risk sample
            </SecondaryButton>
            <SecondaryButton
              size="sm"
              onClick={() => handleQuickLoad('rca_ischemia')}
            >
              Moderate risk sample
            </SecondaryButton>
            <SecondaryButton
              size="sm"
              onClick={() => handleQuickLoad('high_risk_lad')}
            >
              Higher risk sample
            </SecondaryButton>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default WelcomePage;
