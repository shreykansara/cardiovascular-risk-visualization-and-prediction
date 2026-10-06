import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import { usePatientStore } from '../store/usePatientStore';
import { Panel } from '../components/ui/Panel';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';

// Lazy-load the 3D heart model for fast initial bundle parsing
const HeartCanvas = lazy(() => import('../components/3d/HeartCanvas'));

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setDisclaimerAccepted, markStepCompleted, loadSamplePatient } = useWizardStore();
  const { activeVesselFocus, setVesselFocus } = usePatientStore();

  const handleStart = () => {
    navigate('/welcome');
  };

  const handleQuickDemo = (presetKey: string) => {
    setDisclaimerAccepted(true);
    markStepCompleted(1);
    loadSamplePatient(presetKey);
    navigate('/results');
  };

  return (
    <div
      className="w-full mx-auto"
      style={{
        maxWidth: '1160px',
        marginTop: '16px',
        marginBottom: '48px',
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
            viewBox="0 0 1160 64"
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
              d="M0 40 L90 40 L108 40 L116 30 L124 48 L132 40 L190 40 L208 40 L220 10 L234 58 L248 40 L330 40 L356 34 L376 40 L450 40 L468 40 L480 30 L488 48 L496 40 L540 40 L558 40 L570 10 L584 58 L598 40 L680 40 L702 34 L722 40 L780 40 L798 40 L810 10 L824 58 L838 40 L920 40 L948 40 L960 10 L974 58 L988 40 L1060 40 L1082 34 L1102 40 L1160 40"
              style={{
                animation: 'draw 1200ms var(--ease-draw) 200ms backwards',
              }}
            />
          </svg>
        </div>

        {/* Hero Section: Split 2-Column (Copy on Left, Interactive 3D Heart on Right) */}
        <div
          className="wipe"
          style={{
            padding: '32px 28px',
            '--i': 1,
          } as React.CSSProperties}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Clinical Title, Value Proposition & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Eyebrow Clinical Badge */}
              <div>
                <span
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
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--acc)',
                      display: 'inline-block',
                    }}
                  />
                  <span>Clinical Perfusion Intelligence</span>
                  <span style={{ color: 'var(--bd)' }}>|</span>
                  <span>Multimodal AI Track A</span>
                </span>
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: 'clamp(26px, 3.2vw, 36px)',
                  fontWeight: 600,
                  lineHeight: 1.15,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                3D Coronary Perfusion & Multimodal Risk Intelligence
              </h1>

              {/* Subhead */}
              <p
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '14px',
                  lineHeight: 1.55,
                  color: 'var(--mut)',
                  margin: 0,
                  maxWidth: '520px',
                }}
              >
                Predict multi-vessel stenosis probabilities in under 45ms with real-time 3D anatomical twin visualization, transparent TreeSHAP attributions, and deterministic dual-persona clinical reporting.
              </p>

              {/* Primary Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <PrimaryButton onClick={handleStart} size="lg">
                  Launch Clinical Assessment
                </PrimaryButton>
                <SecondaryButton onClick={() => navigate('/model-info')} size="lg">
                  Explore Architecture
                </SecondaryButton>
              </div>

              {/* Quick Case Demo Loaders */}
              <div
                style={{
                  borderTop: '1px solid var(--bd)',
                  paddingTop: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--fs)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--mut)',
                  }}
                >
                  Instant clinical demo profiles:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('high_risk_lad')}
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '12px',
                      padding: '5px 10px',
                      backgroundColor: 'var(--hov)',
                      color: 'var(--ink)',
                      border: '1px solid var(--bd)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                    }}
                  >
                    High-Risk LAD (78%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('rca_ischemia')}
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '12px',
                      padding: '5px 10px',
                      backgroundColor: 'var(--hov)',
                      color: 'var(--ink)',
                      border: '1px solid var(--bd)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                    }}
                  >
                    Inferior RCA Ischemia (62%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('normal')}
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '12px',
                      padding: '5px 10px',
                      backgroundColor: 'var(--hov)',
                      color: 'var(--ink)',
                      border: '1px solid var(--bd)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                    }}
                  >
                    Healthy Normal (14%)
                  </button>
                </div>
              </div>

              {/* Benchmarks Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--bd)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--fm)',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    0.88 - 0.92
                  </div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '11px', color: 'var(--mut)' }}>
                    Calibrated AUC
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--fm)',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    &lt; 45 ms
                  </div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '11px', color: 'var(--mut)' }}>
                    Inference Latency
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--fm)',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    100%
                  </div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '11px', color: 'var(--mut)' }}>
                    Deterministic
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--fm)',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    Offline
                  </div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '11px', color: 'var(--mut)' }}>
                    EHR Privacy
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Heart Showcase Model */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: 'var(--fs)',
                  fontSize: '12px',
                  color: 'var(--mut)',
                }}
              >
                <span style={{ fontWeight: 500, color: 'var(--ink)' }}>
                  Interactive 3D Coronary Model
                </span>
                <span style={{ fontFamily: 'var(--fm)', fontSize: '11px' }}>
                  Drag to rotate • Pinch to zoom
                </span>
              </div>

              {/* 3D Heart Canvas Frame */}
              <div className="landing-heart-stage">
                <Suspense
                  fallback={
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--mut)',
                        fontFamily: 'var(--fs)',
                        fontSize: '13px',
                        gap: '8px',
                      }}
                    >
                      <span>Loading 3D anatomical coronary model...</span>
                    </div>
                  }
                >
                  <HeartCanvas />
                </Suspense>
              </div>

              {/* Vessel Quick-Focus Pills */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ fontFamily: 'var(--fs)', fontSize: '11px', color: 'var(--mut)' }}>
                  Inspect vessel:
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setVesselFocus('lad')}
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--bd)',
                      backgroundColor: activeVesselFocus === 'lad' ? 'var(--acc)' : 'var(--panel)',
                      color: activeVesselFocus === 'lad' ? 'var(--onacc)' : 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    LAD (Anterior)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVesselFocus('lcx')}
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--bd)',
                      backgroundColor: activeVesselFocus === 'lcx' ? 'var(--acc)' : 'var(--panel)',
                      color: activeVesselFocus === 'lcx' ? 'var(--onacc)' : 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    LCX (Lateral)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVesselFocus('rca')}
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--bd)',
                      backgroundColor: activeVesselFocus === 'rca' ? 'var(--acc)' : 'var(--panel)',
                      color: activeVesselFocus === 'rca' ? 'var(--onacc)' : 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    RCA (Inferior)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVesselFocus('default')}
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--bd)',
                      backgroundColor: activeVesselFocus === 'default' ? 'var(--hov)' : 'var(--panel)',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    Full Heart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Core Capabilities Grid */}
        <div
          className="wipe"
          style={{
            borderTop: '1px solid var(--bd)',
            padding: '28px',
            backgroundColor: 'var(--page)',
            '--i': 2,
          } as React.CSSProperties}
        >
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '0 0 6px',
              }}
            >
              Multimodal Clinical Risk Architecture
            </h2>
            <p
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                color: 'var(--mut)',
                margin: 0,
              }}
            >
              Engineered for sub-100ms decision support with zero-hallucination deterministic safeguards.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '11px',
                  color: 'var(--acc)',
                  fontWeight: 600,
                }}
              >
                01. 3D SPATIAL PERFUSION
              </div>
              <h3
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                Interactive Coronary Twin
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
                Real-time WebGL rendering visualizes stenosis probabilities mapped to specific arterial beds with anatomical position markers.
              </p>
            </div>

            {/* Card 2 */}
            <div
              style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '11px',
                  color: 'var(--acc)',
                  fontWeight: 600,
                }}
              >
                02. 4-HEAD CALIBRATION
              </div>
              <h3
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                Independent Risk Heads
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
                Separate calibrated gradient boosted classifiers for Overall CAD, LAD, LCX, and RCA with Platt scaling and isotonic calibration.
              </p>
            </div>

            {/* Card 3 */}
            <div
              style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '11px',
                  color: 'var(--acc)',
                  fontWeight: 600,
                }}
              >
                03. TREESHAP EXPLAINABILITY
              </div>
              <h3
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                Transparent Attributions
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
                Local Shapley feature attributions quantify positive and negative clinical drivers for every single vessel prediction.
              </p>
            </div>

            {/* Card 4 */}
            <div
              style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '11px',
                  color: 'var(--acc)',
                  fontWeight: 600,
                }}
              >
                04. DUAL REPORTING
              </div>
              <h3
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                Deterministic Reporting
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
                Standardized 7-section Clinician report and 8-section plain-language Patient report rendered offline with zero LLM hallucinations.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Clinical Diagnostic Matrix */}
        <div
          className="wipe"
          style={{
            borderTop: '1px solid var(--bd)',
            padding: '28px',
            '--i': 3,
          } as React.CSSProperties}
        >
          <div style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '0 0 4px',
              }}
            >
              Model Validation & Benchmark Metrics
            </h2>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '12px', color: 'var(--mut)' }}>
              Evaluated on 303 cohort subjects with catheterization ground truth (Z-Alizadeh Sani protocol).
            </div>
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                <th style={{ fontFamily: 'var(--fs)', fontWeight: 600, color: 'var(--mut)', padding: '6px 0', textAlign: 'left' }}>Target Head</th>
                <th style={{ fontFamily: 'var(--fs)', fontWeight: 600, color: 'var(--mut)', padding: '6px 0', textAlign: 'left' }}>Anatomical Territory</th>
                <th style={{ fontFamily: 'var(--fs)', fontWeight: 600, color: 'var(--mut)', padding: '6px 0', textAlign: 'right' }}>ROC-AUC</th>
                <th style={{ fontFamily: 'var(--fs)', fontWeight: 600, color: 'var(--mut)', padding: '6px 0', textAlign: 'right' }}>Brier Score</th>
                <th style={{ fontFamily: 'var(--fs)', fontWeight: 600, color: 'var(--mut)', padding: '6px 0', textAlign: 'right' }}>Threshold</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                <td style={{ fontFamily: 'var(--fs)', fontWeight: 600, padding: '8px 0', color: 'var(--ink)' }}>CAD</td>
                <td style={{ fontFamily: 'var(--fs)', padding: '8px 0', color: 'var(--mut)' }}>Overall Coronary Artery Disease</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--ink)' }}>0.918</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--ink)' }}>0.114</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--mut)' }}>0.48</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                <td style={{ fontFamily: 'var(--fs)', fontWeight: 600, padding: '8px 0', color: 'var(--ink)' }}>LAD</td>
                <td style={{ fontFamily: 'var(--fs)', padding: '8px 0', color: 'var(--mut)' }}>Left Anterior Descending Artery</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--ink)' }}>0.887</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--ink)' }}>0.138</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--mut)' }}>0.40</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                <td style={{ fontFamily: 'var(--fs)', fontWeight: 600, padding: '8px 0', color: 'var(--ink)' }}>LCX</td>
                <td style={{ fontFamily: 'var(--fs)', padding: '8px 0', color: 'var(--mut)' }}>Left Circumflex Artery</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--ink)' }}>0.892</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--ink)' }}>0.142</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--mut)' }}>0.40</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                <td style={{ fontFamily: 'var(--fs)', fontWeight: 600, padding: '8px 0', color: 'var(--ink)' }}>RCA</td>
                <td style={{ fontFamily: 'var(--fs)', padding: '8px 0', color: 'var(--mut)' }}>Right Coronary Artery</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--ink)' }}>0.895</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--ink)' }}>0.129</td>
                <td style={{ fontFamily: 'var(--fm)', padding: '8px 0', textAlign: 'right', color: 'var(--mut)' }}>0.40</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: Workflow Overview Strip */}
        <div
          className="wipe"
          style={{
            borderTop: '1px solid var(--bd)',
            padding: '24px 28px',
            backgroundColor: 'var(--page)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            '--i': 4,
          } as React.CSSProperties}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              Begin clinical risk assessment
            </div>
            <div
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '12px',
                color: 'var(--mut)',
              }}
            >
              Step-by-step guided workflow with physiological boundary validation.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <PrimaryButton onClick={handleStart}>
              Start Assessment
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/design-system')}>
              Design System
            </SecondaryButton>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default LandingPage;
