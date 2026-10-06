import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ClipboardList, Heart, FileText } from 'lucide-react';
import { useWizardStore } from '../store/useWizardStore';
import { LANDING_COPY } from '../content/landing';
import landingSamples from '../content/landingSamples.json';

import { Container } from '../components/landing/Container';
import { Band } from '../components/landing/Band';
import { GridStrip } from '../components/landing/GridStrip';
import { Reveal } from '../components/landing/Reveal';

import { Panel } from '../components/ui/Panel';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { QuietButton } from '../components/ui/QuietButton';
import { SegmentedControl, SegmentedOption } from '../components/ui/SegmentedControl';
import { Bar } from '../components/ui/Bar';
import { RiskLabel } from '../components/ui/RiskLabel';
import { VesselCard } from '../components/results/VesselCard';
import { VIEWER_BG } from '../components/canvas/viewerConfig';

// Lazy-load 3D Canvas
const HeartCanvas = lazy(() => import('../components/3d/HeartCanvas'));

type VesselFocusOption = 'full' | 'lad' | 'lcx' | 'rca';
type SampleOptionId = 'normal' | 'rca_ischemia' | 'high_risk_lad';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // State: Default sample is high_risk_lad (Higher risk sample) so first view shows red artery
  const [selectedSampleId, setSelectedSampleId] = useState<SampleOptionId>('high_risk_lad');
  const [vesselFocus, setVesselFocus] = useState<VesselFocusOption>('full');

  // Find currently selected sample
  const currentSample = useMemo(() => {
    return (
      landingSamples.find((s) => s.id === selectedSampleId) ||
      landingSamples[2] // fallback to high_risk_lad
    );
  }, [selectedSampleId]);

  // Map 3D selection key to local vesselFocus and vice versa
  const handleSelectVesselFrom3D = (vesselKey: string | null) => {
    if (!vesselKey) {
      setVesselFocus('full');
    } else if (vesselKey === 'vessel_LAD' || vesselKey === 'LAD' || vesselKey === 'lad') {
      setVesselFocus('lad');
    } else if (vesselKey === 'vessel_LCX' || vesselKey === 'LCX' || vesselKey === 'lcx') {
      setVesselFocus('lcx');
    } else if (vesselKey === 'vessel_RCA' || vesselKey === 'RCA' || vesselKey === 'rca') {
      setVesselFocus('rca');
    }
  };

  const currentSelectionFor3D = useMemo(() => {
    switch (vesselFocus) {
      case 'lad':
        return 'vessel_LAD';
      case 'lcx':
        return 'vessel_LCX';
      case 'rca':
        return 'vessel_RCA';
      default:
        return 'default';
    }
  }, [vesselFocus]);

  // Readout calculations
  const readoutData = useMemo(() => {
    const copy = LANDING_COPY.hero.heart.readout[vesselFocus];
    let prob = currentSample.cad;
    if (vesselFocus === 'lad') prob = currentSample.lad;
    else if (vesselFocus === 'lcx') prob = currentSample.lcx;
    else if (vesselFocus === 'rca') prob = currentSample.rca;

    return {
      key: copy.key,
      name: copy.name,
      description: copy.description,
      probability: prob,
      ratio: prob / 100,
      formattedProb: prob.toFixed(1),
    };
  }, [vesselFocus, currentSample]);

  // Sample radio options
  const sampleOptions: SegmentedOption<SampleOptionId>[] = useMemo(
    () => [
      { id: 'normal', label: 'Lower risk sample' },
      { id: 'rca_ischemia', label: 'Moderate risk sample' },
      { id: 'high_risk_lad', label: 'Higher risk sample' },
    ],
    []
  );

  // Vessel selector radio options
  const vesselOptions: SegmentedOption<VesselFocusOption>[] = useMemo(
    () => [
      { id: 'full', label: 'Full heart' },
      { id: 'lad', label: 'LAD' },
      { id: 'lcx', label: 'LCX' },
      { id: 'rca', label: 'RCA' },
    ],
    []
  );

  // Action handlers
  const handleStartAssessment = () => {
    useWizardStore.getState().reset();
    navigate('/welcome');
  };

  const handleOpenSampleInApp = () => {
    useWizardStore.getState().loadSamplePatient(currentSample.id);
    navigate('/welcome');
  };

  const handleScrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      const h2 = el.querySelector('h2');
      if (h2) {
        h2.focus();
      }
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* ======================================================== */}
      {/* HERO BAND                                                */}
      {/* ======================================================== */}
      <Band className="hero-band" style={{ padding: '42px 0 48px' }}>
        <Container>
          <div className="hero-layout-grid">
            {/* LEFT / CONTENT COLUMN */}
            <div className="hero-text-col fade-up" style={{ '--i': 0 } as React.CSSProperties}>
              {/* Task 4.1: H1 */}
              <h1 className="hero-h1">{LANDING_COPY.hero.title}</h1>

              {/* Task 4.2: Lead Paragraph */}
              <p className="hero-lead">{LANDING_COPY.hero.lead}</p>

              {/* Task 4.3: Button Row */}
              <div className="hero-btn-row">
                <PrimaryButton
                  size="lg"
                  onClick={handleStartAssessment}
                  className="hero-start-btn interactive-btn"
                  rightIcon={<ArrowRight size={16} className="btn-arrow-icon" />}
                >
                  {LANDING_COPY.hero.startAssessment}
                </PrimaryButton>

                <SecondaryButton
                  size="lg"
                  onClick={handleScrollToHowItWorks}
                  className="hero-how-btn interactive-btn"
                  rightIcon={<ChevronDown size={16} />}
                >
                  {LANDING_COPY.hero.howItWorks}
                </SecondaryButton>
              </div>

              {/* Task 4.4: Facts Row */}
              <div className="facts-row">
                {LANDING_COPY.hero.facts.map((fact, idx) => (
                  <div key={idx} className="facts-cell">
                    <span className="facts-value">{fact.value}</span>
                    <span className="facts-label">{fact.label}</span>
                  </div>
                ))}
              </div>

              {/* Task 4.5: Sample Patient Block */}
              <div className="sample-block">
                <h3 className="sample-heading">{LANDING_COPY.hero.sampleBlock.heading}</h3>
                <p className="sample-helper">{LANDING_COPY.hero.sampleBlock.helper}</p>

                <div className="sample-controls-row">
                  <SegmentedControl<SampleOptionId>
                    options={sampleOptions}
                    value={selectedSampleId}
                    onChange={(id) => setSelectedSampleId(id)}
                    aria-label="Sample patient"
                    className="sample-segmented-ctrl"
                  />
                </div>

                <div className="sample-action-row">
                  <QuietButton
                    size="sm"
                    onClick={handleOpenSampleInApp}
                    className="sample-open-btn"
                    rightIcon={<ArrowRight size={14} className="btn-arrow-icon" />}
                  >
                    {LANDING_COPY.hero.sampleBlock.openInApp}
                  </QuietButton>
                </div>

                <span className="sample-caption">{LANDING_COPY.hero.sampleBlock.caption}</span>
              </div>
            </div>

            {/* RIGHT / 3D HEART COLUMN */}
            <div className="hero-heart-col scale-in" style={{ '--i': 1 } as React.CSSProperties}>
              {/* Task 4.6: Heart Panel */}
              <div className="heart-panel-container">
                <Suspense
                  fallback={
                    <div
                      className="w-full h-full flex items-center justify-center select-none"
                      style={{ backgroundColor: VIEWER_BG }}
                    >
                      <div className="loading-chip">{LANDING_COPY.hero.heart.loadingChip}</div>
                    </div>
                  }
                >
                  <HeartCanvas
                    results={currentSample}
                    selection={currentSelectionFor3D}
                    onSelect={handleSelectVesselFrom3D}
                    isLanding={true}
                  />
                </Suspense>
              </div>

              {/* Task 4.9: Vessel Selector */}
              <div className="vessel-selector-row">
                <span className="inspect-label">{LANDING_COPY.hero.heart.inspectLabel}</span>
                <SegmentedControl<VesselFocusOption>
                  options={vesselOptions}
                  value={vesselFocus}
                  onChange={(val) => {
                    if (val === vesselFocus) return;
                    setVesselFocus(val);
                  }}
                  aria-label="Inspect vessel"
                  className="vessel-segmented-ctrl"
                />
              </div>

              {/* Task 4.10: Readout Card */}
              <Panel
                className="readout-card hover-lift"
                aria-live="polite"
                style={{
                  minHeight: '104px',
                  padding: '13px 16px',
                  marginTop: '10px',
                }}
              >
                {/* Row 1: Name and Probability with RiskLabel */}
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {vesselFocus === 'full' ? (
                      <span className="readout-title-full">{readoutData.name}</span>
                    ) : (
                      <>
                        <span className="readout-title-key">{readoutData.key}</span>
                        <span className="readout-title-sub">{readoutData.name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <span className="readout-prob-value">
                      {readoutData.formattedProb}%
                    </span>
                    <RiskLabel probability={readoutData.ratio} />
                  </div>
                </div>

                {/* Row 2: Description (max 2 lines) */}
                <p className="readout-desc">{readoutData.description}</p>

                {/* Row 3: Probability Bar */}
                <div className="mt-2.5">
                  <Bar
                    key={`${selectedSampleId}-${vesselFocus}`}
                    value={readoutData.ratio}
                    variant="probability"
                  />
                </div>
              </Panel>
            </div>
          </div>
        </Container>
      </Band>

      {/* GridStrip between Hero and How it works */}
      <GridStrip />

      {/* ======================================================== */}
      {/* PHASE 5: HOW IT WORKS                                    */}
      {/* ======================================================== */}
      <Band variant="alt" id="how-it-works" style={{ padding: '56px 0' }}>
        <Container>
          <Reveal variant="fade-up">
            <h2 id="how-it-works-h2" tabIndex={-1} className="section-h2">
              {LANDING_COPY.howItWorks.heading}
            </h2>
            <p className="section-subline">{LANDING_COPY.howItWorks.subline}</p>

            <div className="how-it-works-grid">
              {LANDING_COPY.howItWorks.steps.map((step, idx) => {
                const IconComponent =
                  idx === 0 ? ClipboardList : idx === 1 ? Heart : FileText;
                return (
                  <Reveal key={step.number} staggerIndex={idx} variant="fade-up">
                    <Panel className="step-panel hover-lift">
                      <div className="flex items-center justify-between">
                        <div className="step-number-box">{step.number}</div>
                        <IconComponent className="w-5 h-5 text-[var(--acc)]" />
                      </div>
                      <h3 className="step-title">{step.title}</h3>
                      <p className="step-desc">{step.description}</p>
                    </Panel>
                  </Reveal>
                );
              })}
            </div>
          </Reveal>
        </Container>
      </Band>

      {/* ======================================================== */}
      {/* PHASE 6: WHAT YOU GET                                    */}
      {/* ======================================================== */}
      <Band id="what-you-get" style={{ padding: '56px 0' }}>
        <Container>
          <Reveal variant="fade-up">
            <h2 id="what-you-get-h2" tabIndex={-1} className="section-h2">
              {LANDING_COPY.whatYouGet.heading}
            </h2>

            <div className="what-you-get-rows">
              {/* ROW 1: 3D view of each artery */}
              <div className="what-row">
                <div className="what-text-col">
                  <h3 className="what-title">{LANDING_COPY.whatYouGet.rows[0].title}</h3>
                  <p className="what-desc">{LANDING_COPY.whatYouGet.rows[0].description}</p>
                </div>
                <div className="what-preview-col">
                  <div {...({ inert: '' } as any)} aria-hidden="true">
                    <Panel className="what-preview-panel hover-lift flex flex-col justify-center">
                      <VesselCard
                        vesselKey="lad"
                        vesselCode="LAD"
                        fullName="Left anterior descending"
                        prediction={{
                          target: 'LAD',
                          display_name: 'LAD',
                          probability: 0.91,
                          binary_class: 1,
                          stenosis_suspected: true,
                          risk_tier: 'HIGH',
                          optimal_threshold: 0.5,
                          color_hex: 'var(--high)',
                          color_rgb: [179, 21, 47],
                          emissive_pulse: true,
                        }}
                        isSelected={false}
                        onSelect={() => {}}
                        animationIndex={1}
                      />
                      <VesselCard
                        vesselKey="lcx"
                        vesselCode="LCX"
                        fullName="Left circumflex"
                        prediction={{
                          target: 'LCX',
                          display_name: 'LCX',
                          probability: 0.244,
                          binary_class: 0,
                          stenosis_suspected: false,
                          risk_tier: 'LOW',
                          optimal_threshold: 0.5,
                          color_hex: 'var(--low)',
                          color_rgb: [31, 111, 69],
                          emissive_pulse: false,
                        }}
                        isSelected={false}
                        onSelect={() => {}}
                        animationIndex={2}
                      />
                      <VesselCard
                        vesselKey="rca"
                        vesselCode="RCA"
                        fullName="Right coronary"
                        prediction={{
                          target: 'RCA',
                          display_name: 'RCA',
                          probability: 0.228,
                          binary_class: 0,
                          stenosis_suspected: false,
                          risk_tier: 'LOW',
                          optimal_threshold: 0.5,
                          color_hex: 'var(--low)',
                          color_rgb: [31, 111, 69],
                          emissive_pulse: false,
                        }}
                        isSelected={false}
                        onSelect={() => {}}
                        animationIndex={3}
                      />
                    </Panel>
                  </div>
                  <span className="what-caption">{LANDING_COPY.whatYouGet.rows[0].caption}</span>
                </div>
              </div>

              {/* ROW 2: The factors behind each result (swapped desktop columns) */}
              <div className="what-row what-row-even">
                <div className="what-preview-col">
                  <div {...({ inert: '' } as any)} aria-hidden="true">
                    <Panel className="what-preview-panel hover-lift flex flex-col justify-center gap-3 px-4">
                      {LANDING_COPY.whatYouGet.rows[1].exampleFactors.map((f) => (
                        <div key={f.name} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[12px] font-[var(--fs)]">
                            <span className="text-[var(--ink)] font-medium">{f.name}</span>
                            <span className="text-[var(--mut)]">{f.direction}</span>
                          </div>
                          <div className="w-full h-1 bg-[var(--bd)] overflow-hidden">
                            <div
                              className="h-full bg-[var(--high)]"
                              style={{ width: f.barWidth }}
                            />
                          </div>
                        </div>
                      ))}
                    </Panel>
                  </div>
                  <span className="what-caption">{LANDING_COPY.whatYouGet.rows[1].caption}</span>
                </div>
                <div className="what-text-col">
                  <h3 className="what-title">{LANDING_COPY.whatYouGet.rows[1].title}</h3>
                  <p className="what-desc">{LANDING_COPY.whatYouGet.rows[1].description}</p>
                </div>
              </div>

              {/* ROW 3: Two reports */}
              <div className="what-row">
                <div className="what-text-col">
                  <h3 className="what-title">{LANDING_COPY.whatYouGet.rows[2].title}</h3>
                  <p className="what-desc">{LANDING_COPY.whatYouGet.rows[2].description}</p>
                </div>
                <div className="what-preview-col">
                  <div {...({ inert: '' } as any)} aria-hidden="true">
                    <Panel
                      className="what-preview-panel hover-lift !p-0"
                      style={{
                        backgroundColor: 'var(--s-bg)',
                        border: '1px solid var(--s-bd)',
                        borderRadius: '3px',
                      }}
                    >
                      <div style={{ padding: '14px 16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            borderBottom: '1px solid var(--s-bd)',
                            paddingBottom: '6px',
                            marginBottom: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--fs)',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: 'var(--s-ink)',
                            }}
                          >
                            Clinician report
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--fm)',
                              fontSize: '11px',
                              color: 'var(--s-mut)',
                            }}
                          >
                            Model outputs
                          </span>
                        </div>
                        <table
                          style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '11px',
                            fontFamily: 'var(--fs)',
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                borderBottom: '1px solid var(--s-bd)',
                                color: 'var(--s-mut)',
                                textAlign: 'left',
                              }}
                            >
                              <th style={{ padding: '4px 0', fontWeight: 500 }}>Target</th>
                              <th style={{ padding: '4px 0', textAlign: 'right', fontWeight: 500 }}>
                                Probability
                              </th>
                              <th style={{ padding: '4px 0', textAlign: 'right', fontWeight: 500 }}>
                                Risk band
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid var(--s-bd)', color: 'var(--s-ink)' }}>
                              <td style={{ padding: '4px 0', fontWeight: 500 }}>CAD</td>
                              <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'var(--fm)' }}>
                                94.4%
                              </td>
                              <td style={{ padding: '4px 0', textAlign: 'right' }}>High</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--s-bd)', color: 'var(--s-ink)' }}>
                              <td style={{ padding: '4px 0', fontWeight: 500 }}>LAD</td>
                              <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'var(--fm)' }}>
                                91.0%
                              </td>
                              <td style={{ padding: '4px 0', textAlign: 'right' }}>High</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--s-bd)', color: 'var(--s-ink)' }}>
                              <td style={{ padding: '4px 0', fontWeight: 500 }}>LCX</td>
                              <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'var(--fm)' }}>
                                24.4%
                              </td>
                              <td style={{ padding: '4px 0', textAlign: 'right' }}>Low</td>
                            </tr>
                            <tr style={{ color: 'var(--s-ink)' }}>
                              <td style={{ padding: '4px 0', fontWeight: 500 }}>RCA</td>
                              <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'var(--fm)' }}>
                                22.8%
                              </td>
                              <td style={{ padding: '4px 0', textAlign: 'right' }}>Low</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  </div>
                  <span className="what-caption">{LANDING_COPY.whatYouGet.rows[2].caption}</span>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Band>

      {/* GridStrip between What you get and About */}
      <GridStrip />

      {/* ======================================================== */}
      {/* PHASE 6: ABOUT THE RESULTS                               */}
      {/* ======================================================== */}
      <Band variant="alt" id="about" style={{ padding: '56px 0' }}>
        <Container>
          <Reveal variant="fade-up">
            <h2 id="about-h2" tabIndex={-1} className="section-h2">
              {LANDING_COPY.about.heading}
            </h2>

            <div className="about-grid">
              {/* Left Column: 5 Paragraphs */}
              <div className="about-text-col">
                <p className="about-paragraph">{LANDING_COPY.about.paragraphs[0]}</p>
                <p className="about-paragraph">{LANDING_COPY.about.paragraphs[1]}</p>
                <p className="about-paragraph">{LANDING_COPY.about.paragraphs[2]}</p>
                <p className="about-paragraph">{LANDING_COPY.about.paragraphs[3]}</p>
                <p className="about-paragraph">
                  {LANDING_COPY.about.technicalTextPre}
                  <Link
                    to="/model-info"
                    style={{
                      color: 'var(--acc)',
                      textDecoration: 'underline',
                    }}
                  >
                    {LANDING_COPY.about.technicalLinkText}
                  </Link>
                  {LANDING_COPY.about.technicalTextPost}
                </p>
              </div>

              {/* Right Column: Decision support disclaimer block from Welcome */}
              <div className="about-disclaimer-col">
                <div
                  className="hover-lift"
                  style={{
                    border: '1px solid var(--bd)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--panel)',
                    padding: '18px 20px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      marginBottom: '6px',
                    }}
                  >
                    {LANDING_COPY.about.disclaimer.heading}
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: 'var(--ink)',
                      margin: 0,
                    }}
                  >
                    {LANDING_COPY.about.disclaimer.body}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Band>

      {/* ======================================================== */}
      {/* PHASE 6: FINAL CALL TO ACTION                            */}
      {/* ======================================================== */}
      <Band className="final-cta-band" style={{ padding: '52px 0' }}>
        <Container>
          <Reveal variant="fade-up">
            <div className="final-cta-box">
              <h2 className="final-cta-h2">{LANDING_COPY.cta.heading}</h2>
              <p className="final-cta-sub">{LANDING_COPY.cta.text}</p>
              <PrimaryButton
                size="lg"
                onClick={handleStartAssessment}
                className="final-cta-btn interactive-btn"
                rightIcon={<ArrowRight size={16} className="btn-arrow-icon" />}
              >
                {LANDING_COPY.cta.button}
              </PrimaryButton>
            </div>
          </Reveal>
        </Container>
      </Band>

      {/* Scoped CSS for refined proportions, responsive layout, and organic micro-animations */}
      <style>{`
        /* Hero Grid Layout with Golden Proportions */
        .hero-layout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
          gap: 40px;
          align-items: start;
        }

        .hero-text-col {
          display: flex;
          flex-direction: column;
        }

        .hero-heart-col {
          display: flex;
          flex-direction: column;
        }

        /* Hero Typography */
        .hero-h1 {
          font-family: var(--fs);
          font-size: 38px;
          line-height: 46px;
          font-weight: 600;
          color: var(--ink);
          margin: 0 0 14px;
          letter-spacing: -0.015em;
        }

        .hero-lead {
          font-family: var(--fs);
          font-size: 15.5px;
          line-height: 25px;
          color: var(--ink);
          opacity: 0.92;
          max-width: 48ch;
          margin: 0 0 22px;
        }

        .hero-btn-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        /* Interactive Buttons with Micro-Lift and Arrow Slide */
        .interactive-btn {
          transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), background-color 140ms ease, border-color 140ms ease !important;
        }

        .interactive-btn:hover {
          transform: translateY(-1.5px);
        }

        .interactive-btn:active {
          transform: scale(0.985) translateY(0);
        }

        .interactive-btn:hover .btn-arrow-icon {
          transform: translateX(3px);
        }

        .btn-arrow-icon {
          transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Facts Row */
        .facts-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          padding-top: 18px;
          border-top: 1px solid var(--bd);
          margin-bottom: 22px;
        }

        .facts-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 12px;
          border-right: 1px solid var(--bd);
        }

        .facts-cell:first-child {
          padding-left: 0;
        }

        .facts-cell:last-child {
          border-right: none;
          padding-right: 0;
        }

        .facts-value {
          font-family: var(--fm);
          font-size: 22px;
          line-height: 1.1;
          font-weight: 500;
          color: var(--ink);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }

        .facts-label {
          font-family: var(--fs);
          font-size: 11.5px;
          color: var(--mut);
          line-height: 1.3;
          margin-top: 2px;
        }

        /* Sample Patient Block */
        .sample-block {
          margin-top: 20px;
          border-top: 1px solid var(--bd);
          padding-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sample-heading {
          font-family: var(--fs);
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          margin: 0 0 3px;
        }

        .sample-helper {
          font-family: var(--fs);
          font-size: 12px;
          color: var(--mut);
          margin: 0 0 8px;
        }

        .sample-controls-row {
          display: flex;
          width: 100%;
        }

        .sample-segmented-ctrl {
          width: 100%;
          height: 36px;
        }

        .sample-segmented-ctrl button {
          flex: 1;
          padding: 0 8px;
          font-size: 11.5px;
          transition: background-color 140ms ease, color 140ms ease;
        }

        .sample-action-row {
          margin-top: 4px;
        }

        .sample-caption {
          font-family: var(--fs);
          font-size: 11px;
          color: var(--mut);
          margin-top: 4px;
        }

        /* 3D Heart Panel */
        .heart-panel-container {
          position: relative;
          width: 100%;
          height: 470px;
          background-color: ${VIEWER_BG};
          border: 1px solid var(--bd);
          border-radius: 3px;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
        }

        @media (min-width: 1200px) {
          .heart-panel-container {
            height: 480px;
          }
        }

        @media (max-width: 1099px) and (min-width: 768px) {
          .heart-panel-container {
            height: 410px;
          }
        }

        @media (max-width: 767px) {
          .heart-panel-container {
            height: clamp(280px, 44dvh, 350px);
          }
        }

        @media (max-height: 500px) and (orientation: landscape) {
          .heart-panel-container {
            height: max(240px, 75dvh);
          }
        }

        .loading-chip {
          background-color: var(--panel);
          border: 1px solid var(--bds);
          border-radius: 3px;
          padding: 6px 12px;
          font-size: 12px;
          color: var(--ink);
          font-family: var(--fs);
          font-weight: 500;
        }

        /* Vessel Selector Row */
        .vessel-selector-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
          width: 100%;
        }

        .inspect-label {
          font-family: var(--fs);
          font-size: 12px;
          color: var(--mut);
          font-weight: 500;
          flex-shrink: 0;
        }

        .vessel-segmented-ctrl {
          flex: 1;
          height: 36px;
        }

        .vessel-segmented-ctrl button {
          flex: 1;
          font-size: 12px;
          transition: background-color 140ms ease, color 140ms ease;
        }

        /* Readout Card */
        .readout-card {
          margin-top: 10px;
          transition: border-color 180ms ease, transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .readout-title-full {
          font-family: var(--fs);
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink);
        }

        .readout-title-key {
          font-family: var(--fs);
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink);
        }

        .readout-title-sub {
          font-family: var(--fs);
          font-size: 12px;
          color: var(--mut);
        }

        .readout-prob-value {
          font-family: var(--fm);
          font-size: 22px;
          line-height: 1;
          font-weight: 500;
          color: var(--ink);
          font-variant-numeric: tabular-nums;
        }

        .readout-desc {
          font-family: var(--fs);
          font-size: 12.5px;
          line-height: 1.48;
          color: var(--mut);
          margin: 6px 0 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Tactile Hover Lift for Panels */
        .hover-lift {
          transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease, box-shadow 220ms ease;
        }

        .hover-lift:hover {
          transform: translateY(-2px);
          border-color: var(--acc);
        }

        /* Section Commons */
        .section-h2 {
          font-family: var(--fs);
          font-size: 24px;
          line-height: 32px;
          font-weight: 600;
          color: var(--ink);
          margin: 0;
          outline: none;
        }

        .section-subline {
          font-family: var(--fs);
          font-size: 14px;
          color: var(--mut);
          margin: 4px 0 24px;
        }

        /* How it works */
        .how-it-works-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .step-panel {
          padding: 18px 20px;
          height: 100%;
        }

        .step-number-box {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--bd);
          border-radius: 3px;
          font-family: var(--fm);
          font-size: 12px;
          color: var(--mut);
        }

        .step-title {
          font-family: var(--fs);
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          margin: 12px 0 0;
        }

        .step-desc {
          font-family: var(--fs);
          font-size: 13px;
          line-height: 1.55;
          color: var(--mut);
          margin: 6px 0 0;
        }

        /* What you get */
        .what-you-get-rows {
          display: flex;
          flex-direction: column;
        }

        .what-row {
          display: grid;
          grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
          gap: 36px;
          align-items: center;
          padding: 30px 0;
          border-bottom: 1px solid var(--bd);
        }

        .what-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .what-row:first-child {
          padding-top: 14px;
        }

        .what-title {
          font-family: var(--fs);
          font-size: 16px;
          font-weight: 600;
          color: var(--ink);
          margin: 0 0 6px;
        }

        .what-desc {
          font-family: var(--fs);
          font-size: 14px;
          line-height: 22px;
          color: var(--mut);
          max-width: 48ch;
          margin: 0;
        }

        .what-preview-panel {
          height: 210px;
          padding: 14px;
          overflow: hidden;
        }

        .what-caption {
          display: block;
          font-family: var(--fs);
          font-size: 11px;
          color: var(--mut);
          margin-top: 6px;
        }

        /* About */
        .about-grid {
          display: grid;
          grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
          gap: 32px;
          align-items: start;
        }

        .about-paragraph {
          font-family: var(--fs);
          font-size: 14px;
          line-height: 22px;
          color: var(--ink);
          max-width: 58ch;
          margin: 0 0 12px;
        }

        /* Final CTA */
        .final-cta-box {
          max-width: 480px;
          margin: 0 auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .final-cta-h2 {
          font-family: var(--fs);
          font-size: 24px;
          line-height: 32px;
          font-weight: 600;
          color: var(--ink);
          margin: 0;
        }

        .final-cta-sub {
          font-family: var(--fs);
          font-size: 14px;
          color: var(--mut);
          margin: 6px 0 20px;
        }

        /* ======================================================== */
        /* RESPONSIVE OVERRIDES                                      */
        /* ======================================================== */

        /* Under 1000px: Hero becomes 1 column, heart column FIRST */
        @media (max-width: 999px) {
          .hero-layout-grid {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .hero-heart-col {
            order: 1;
            width: 100%;
          }

          .hero-text-col {
            order: 2;
            width: 100%;
          }
        }

        /* Under 900px: How it works & What you get & About stack */
        @media (max-width: 899px) {
          .how-it-works-grid {
            grid-template-columns: 1fr;
          }

          .what-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .what-row-even .what-preview-col {
            order: 2;
          }

          .what-row-even .what-text-col {
            order: 1;
          }

          .about-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        /* Under 768px: Mobile sizing & 44px touch targets */
        @media (max-width: 767px) {
          .hero-h1 {
            font-size: 28px;
            line-height: 36px;
          }

          .section-h2 {
            font-size: 20px;
            line-height: 28px;
          }

          .hero-btn-row {
            flex-direction: column;
            width: 100%;
          }

          .hero-start-btn,
          .hero-how-btn,
          .final-cta-btn {
            width: 100%;
            min-height: 44px;
          }

          .inspect-label {
            display: none;
          }

          .vessel-selector-row {
            width: 100%;
          }

          .vessel-segmented-ctrl {
            width: 100%;
            height: 44px;
          }

          .vessel-segmented-ctrl button {
            flex: 1;
            min-height: 44px;
          }

          .sample-segmented-ctrl {
            width: 100%;
            height: 44px;
          }

          .sample-segmented-ctrl button {
            flex: 1;
            min-height: 44px;
          }

          .sample-open-btn {
            min-height: 44px;
          }
        }

        /* Under 480px: Facts row labels 11px */
        @media (max-width: 479px) {
          .facts-label {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
