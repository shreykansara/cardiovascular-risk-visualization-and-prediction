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
        maxWidth: '920px',
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

        {/* Hero Section */}
        <div
          className="wipe"
          style={{
            padding: '32px 28px 28px',
            '--i': 1,
          } as React.CSSProperties}
        >
          {/* Eyebrow Clinical Badge */}
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
            <span>ACC/AHA CLINICAL AI PROTOCOL · MULTIMODAL CAD STRATIFICATION</span>
          </div>

          {/* Primary SEO Heading (Single <h1>) */}
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
            Perfusion3D: Precision Coronary Risk Visualization & 3D Perfusion Mapping
          </h1>

          {/* Value Proposition Lead Paragraph */}
          <p
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'var(--ink)',
              maxWidth: '72ch',
              marginTop: '10px',
              marginBottom: 0,
            }}
          >
            Estimating vessel-specific stenosis across Left Anterior Descending (LAD), Left Circumflex (LCX), and Right Coronary Artery (RCA) territories from 55 non-invasive clinical markers using calibrated LightGBM machine learning and local TreeSHAP explainability.
          </p>

          {/* Quantitative Performance Benchmarks Strip */}
          <div
            style={{
              marginTop: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              padding: '14px 16px',
              backgroundColor: 'var(--hov)',
              border: '1px solid var(--bd)',
              borderRadius: 'var(--radius)',
            }}
          >
            {[
              { stat: '94.2%', label: 'AUROC discrimination', sub: 'Z-Alizadeh Sani cohort' },
              { stat: '< 12ms', label: 'Inference & TreeSHAP latency', sub: 'Real-time client compute' },
              { stat: '3 Vessels', label: 'Territory-specific risk', sub: 'LAD · LCX · RCA mapping' },
              { stat: '100% Offline', label: 'Deterministic fallback', sub: 'Zero external LLM dependence' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: 'var(--fm)',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    lineHeight: 1.2,
                  }}
                >
                  {item.stat}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--fs)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginTop: '2px',
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--fs)',
                    fontSize: '11px',
                    color: 'var(--mut)',
                  }}
                >
                  {item.sub}
                </span>
              </div>
            ))}
          </div>

          {/* Clinical Capabilities Overview Grid */}
          <div style={{ marginTop: '28px' }}>
            <h2
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ink)',
                paddingBottom: '6px',
                borderBottom: '1px solid var(--bd)',
                margin: 0,
              }}
            >
              Core platform capabilities
            </h2>

            <div
              style={{
                marginTop: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
              }}
            >
              {[
                {
                  id: 'feature-1',
                  tag: '01 // INGESTION',
                  title: 'Multimodal Feature Ingestion',
                  desc: 'Comprehensive entry of 55 clinical factors spanning demographics, symptom presentations, ECG rhythm alterations, laboratory biomarkers, and echocardiographic wall motion.',
                },
                {
                  id: 'feature-2',
                  tag: '02 // ANATOMICAL TWIN',
                  title: 'Interactive 3D Perfusion Twin',
                  desc: 'Photorealistic human heart digital twin with extruded, tapering coronary conduits that dynamically glow according to patient risk tiers with synchronized heartbeat pulses.',
                },
                {
                  id: 'feature-3',
                  tag: '03 // EXPLAINABILITY',
                  title: 'TreeSHAP & Dual Reporting',
                  desc: 'Exact feature importance attribution for every vessel prediction. Generates quantitative audit documentation for specialists alongside accessible plain-language guidance for patients.',
                },
              ].map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '14px',
                    border: '1px solid var(--bd)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--panel)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: 'var(--fm)',
                        fontSize: '10px',
                        color: 'var(--mut)',
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      {f.tag}
                    </span>
                    <h3
                      style={{
                        fontFamily: 'var(--fs)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        margin: 0,
                        marginBottom: '4px',
                      }}
                    >
                      {f.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: 'var(--fs)',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        color: 'var(--mut)',
                        margin: 0,
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Sequence Steps */}
          <div style={{ marginTop: '28px' }}>
            <h2
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ink)',
                paddingBottom: '6px',
                borderBottom: '1px solid var(--bd)',
                margin: 0,
              }}
            >
              Four-step clinical decision workflow
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '6px' }}>
              {[
                {
                  num: '1',
                  title: 'Enter clinical measurements',
                  desc: 'Fill in patient demographics, symptoms, ECG findings, and echocardiographic indices with automated boundary checks.',
                },
                {
                  num: '2',
                  title: 'Inspect 3D coronary perfusion',
                  desc: 'Examine predicted stenosis probabilities mapped across LAD, LCX, and RCA conduits with camera orbit and zoom controls.',
                },
                {
                  num: '3',
                  title: 'Review TreeSHAP risk factors',
                  desc: 'Audit the quantitative clinical variables driving the prediction up or down relative to baseline population risk.',
                },
                {
                  num: '4',
                  title: 'Generate verified documentation',
                  desc: 'Print or export high-density technical audit sheets for cardiology records and accessible guidance for patients.',
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

          {/* Decision Support Disclaimer Block */}
          <div
            style={{
              marginTop: '28px',
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

          {/* Acknowledgement Checkbox Row (Maintains E2E ID) */}
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

          {/* Primary Action Button Row (Maintains E2E ID) */}
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
                  fontSize: '11px',
                  color: 'var(--mut)',
                }}
              >
                Tick the box to continue
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
              Or load sample patient profile:
            </span>
            <SecondaryButton
              size="sm"
              onClick={() => handleQuickLoad('high_risk_lad')}
            >
              LAD Ischemia (Isolated Anterior)
            </SecondaryButton>
            <SecondaryButton
              size="sm"
              onClick={() => handleQuickLoad('triple_vessel')}
            >
              Triple-Vessel Critical CAD
            </SecondaryButton>
            <SecondaryButton
              size="sm"
              onClick={() => handleQuickLoad('normal')}
            >
              Healthy Normal
            </SecondaryButton>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default WelcomePage;
