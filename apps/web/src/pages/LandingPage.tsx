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
      const navHeader = document.querySelector('.landing-nav-header');
      const headerHeight = navHeader ? navHeader.getBoundingClientRect().height : 56;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 12;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });

      const h2 = el.querySelector('h2');
      if (h2) {
        h2.setAttribute('tabindex', '-1');
        h2.focus({ preventScroll: true });
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
                    <Panel className="step-panel hover-lift flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--bd)]">
                          <div className="flex items-center gap-2">
                            <div className="step-number-box">{step.number}</div>
                            <span className="step-tag-text">{step.stepTag}</span>
                          </div>
                          <IconComponent className="w-4 h-4 text-[var(--acc)]" />
                        </div>
                        <h3 className="step-title">{step.title}</h3>
                        <p className="step-desc">{step.description}</p>
                      </div>
                      <div className="step-chips-wrap">
                        {step.modalities.map((m) => (
                          <span key={m.label} className="step-chip">
                            <span className="step-chip-label">{m.label}</span>
                            <span className="step-chip-count">{m.count}</span>
                          </span>
                        ))}
                      </div>
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
                  <div className="telemetry-badge">{LANDING_COPY.whatYouGet.rows[0].badge}</div>
                  <h3 className="what-title">{LANDING_COPY.whatYouGet.rows[0].title}</h3>
                  <p className="what-desc">{LANDING_COPY.whatYouGet.rows[0].description}</p>

                  {/* Perfusion Territory Table */}
                  <div className="mt-4 border border-[var(--bd)] rounded-[3px] overflow-hidden bg-[var(--hov)]">
                    <div className="px-3 py-1.5 bg-[var(--panel)] border-b border-[var(--bd)] flex items-center justify-between text-[11px] font-[var(--fm)] text-[var(--mut)]">
                      <span>TERRITORY AUDIT</span>
                      <span>PERFUSION MAPPING</span>
                    </div>
                    <div className="table-scroll-wrap overflow-x-auto w-full">
                      <table className="w-full text-left text-[11px] font-[var(--fs)]" style={{ minWidth: '320px' }}>
                        <tbody>
                          {LANDING_COPY.whatYouGet.rows[0].vessels.map((v) => (
                            <tr key={v.vessel} className="border-b border-[var(--bd)] last:border-b-0">
                              <td className="px-3 py-1.5 font-bold font-[var(--fm)] text-[var(--ink)]">{v.vessel}</td>
                              <td className="px-3 py-1.5 text-[var(--mut)]">{v.territory}</td>
                              <td className="px-3 py-1.5 text-right font-[var(--fm)] text-[var(--ink)]">{v.prob}</td>
                              <td className="px-3 py-1.5 text-right">
                                <span className={v.risk === 'High Risk' ? 'xai-badge-up' : 'xai-badge-down'}>
                                  {v.risk}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="what-preview-col">
                  <div {...({ inert: '' } as any)} aria-hidden="true">
                    <Panel className="what-preview-panel hover-lift flex flex-col justify-center gap-2">
                      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-[var(--bd)] text-[11px] font-[var(--fm)] text-[var(--mut)]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--low)] inline-block animate-pulse" />
                          <span>3D VASCULAR ENGINE</span>
                        </div>
                        <span>LAD · LCX · RCA MESH</span>
                      </div>
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

              {/* ROW 2: Explainable AI feature attribution (swapped desktop columns) */}
              <div className="what-row what-row-even">
                <div className="what-preview-col">
                  <div {...({ inert: '' } as any)} aria-hidden="true">
                    <Panel className="what-preview-panel hover-lift flex flex-col gap-2 p-3.5">
                      <div className="flex items-center justify-between border-b border-[var(--bd)] pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--acc)] inline-block" />
                          <span className="text-[12px] font-semibold text-[var(--ink)] font-[var(--fs)]">
                            Explainable AI (TreeSHAP) Feature Attribution
                          </span>
                        </div>
                        <span className="text-[10px] font-[var(--fm)] text-[var(--mut)]">LOCAL ATTRIBUTION Δ</span>
                      </div>
                      <div className="table-scroll-wrap overflow-x-auto w-full">
                        <table className="telemetry-table" style={{ minWidth: '460px' }}>
                          <thead>
                            <tr>
                              <th>Biomarker / Modality</th>
                              <th>Patient Value</th>
                              <th>Explainable AI Impact</th>
                              <th style={{ textAlign: 'right' }}>Direction</th>
                            </tr>
                          </thead>
                          <tbody>
                            {LANDING_COPY.whatYouGet.rows[1].factorsTable.map((f) => (
                              <tr key={f.feature}>
                                <td>
                                  <div className="flex items-center gap-1.5">
                                    <span className="feature-group-chip">{f.category}</span>
                                    <span className="font-medium text-[11px]">{f.feature}</span>
                                  </div>
                                </td>
                                <td className="font-[var(--fm)] text-[11px] text-[var(--mut)]">{f.patientVal}</td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <span className="font-[var(--fm)] font-semibold text-[11px] w-10">
                                      {f.impact}
                                    </span>
                                    <div className="w-16 h-1.5 bg-[var(--bd)] rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: f.barWidth,
                                          backgroundColor: f.isElevating ? 'var(--high)' : 'var(--low)',
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <span className={f.isElevating ? 'xai-badge-up' : 'xai-badge-down'}>
                                    {f.effect}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="pt-2 text-[11px] text-[var(--mut)] font-[var(--fs)] border-t border-[var(--bd)] flex items-center justify-between">
                        <span>Transparent directional attributions per patient</span>
                        <span className="font-[var(--fm)] text-[10px] text-[var(--acc)]">Σ Δ = +0.48 NET CAD</span>
                      </div>
                    </Panel>
                  </div>
                  <span className="what-caption">{LANDING_COPY.whatYouGet.rows[1].caption}</span>
                </div>

                <div className="what-text-col">
                  <div className="telemetry-badge">{LANDING_COPY.whatYouGet.rows[1].badge}</div>
                  <h3 className="what-title">{LANDING_COPY.whatYouGet.rows[1].title}</h3>
                  <p className="what-desc">{LANDING_COPY.whatYouGet.rows[1].description}</p>

                  <div className="mt-4 flex flex-col gap-2 font-[var(--fs)] text-[13px] text-[var(--mut)]">
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--acc)] font-bold">✓</span>
                      <span><strong>Exact mathematical Shapley values</strong> compute the relative positive or negative influence of each clinical measurement.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--acc)] font-bold">✓</span>
                      <span><strong>Zero black-box obscurity</strong> allows clinicians to verify why LAD stenosis probability reached 91.0%.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 3: Clinician audit & patient reports */}
              <div className="what-row">
                <div className="what-text-col">
                  <div className="telemetry-badge">{LANDING_COPY.whatYouGet.rows[2].badge}</div>
                  <h3 className="what-title">{LANDING_COPY.whatYouGet.rows[2].title}</h3>
                  <p className="what-desc">{LANDING_COPY.whatYouGet.rows[2].description}</p>

                  <div className="mt-4 flex flex-col gap-2 font-[var(--fs)] text-[13px] text-[var(--mut)]">
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--acc)] font-bold">•</span>
                      <span><strong>Clinician Diagnostic Audit:</strong> Comprehensive numerical probabilities, calibrated risk bands, and top Explainable AI drivers for each vessel.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--acc)] font-bold">•</span>
                      <span><strong>Patient Plain-Language Guide:</strong> Transparent summaries without clinical jargon, framing results for informed physician discussions.</span>
                    </div>
                  </div>
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
                          <div className="flex items-center gap-2">
                            <span
                              style={{
                                fontFamily: 'var(--fs)',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--s-ink)',
                              }}
                            >
                              Clinician Diagnostic Audit
                            </span>
                            <span
                              style={{
                                fontFamily: 'var(--fm)',
                                fontSize: '10px',
                                color: 'var(--s-acc)',
                                background: 'rgba(29, 63, 138, 0.08)',
                                padding: '1px 5px',
                                borderRadius: '2px',
                              }}
                            >
                              REPORT PREVIEW
                            </span>
                          </div>
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
                        <div className="table-scroll-wrap overflow-x-auto w-full">
                          <table
                            style={{
                              width: '100%',
                              minWidth: '420px',
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
                                <th style={{ padding: '4px 0', fontWeight: 500 }}>Target Vessel</th>
                                <th style={{ padding: '4px 0', textAlign: 'right', fontWeight: 500 }}>
                                  Probability
                                </th>
                                <th style={{ padding: '4px 0', textAlign: 'right', fontWeight: 500 }}>
                                  Risk band
                                </th>
                                <th style={{ padding: '4px 0', textAlign: 'right', fontWeight: 500 }}>
                                  Top Explainable AI Driver
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {LANDING_COPY.whatYouGet.rows[2].clinicianRows.map((r) => (
                                <tr
                                  key={r.target}
                                  style={{ borderBottom: '1px solid var(--s-bd)', color: 'var(--s-ink)' }}
                                >
                                  <td style={{ padding: '4px 0', fontWeight: 500 }}>{r.target}</td>
                                  <td
                                    style={{
                                      padding: '4px 0',
                                      textAlign: 'right',
                                      fontFamily: 'var(--fm)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {r.prob}
                                  </td>
                                  <td style={{ padding: '4px 0', textAlign: 'right' }}>
                                    <span
                                      style={{
                                        fontFamily: 'var(--fm)',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        padding: '1px 6px',
                                        borderRadius: '2px',
                                        color: r.band === 'High' ? 'var(--s-high)' : 'var(--s-low)',
                                        background:
                                          r.band === 'High' ? 'rgba(179, 21, 47, 0.08)' : 'rgba(31, 111, 69, 0.08)',
                                      }}
                                    >
                                      {r.band}
                                    </span>
                                  </td>
                                  <td
                                    style={{
                                      padding: '4px 0',
                                      textAlign: 'right',
                                      fontSize: '10px',
                                      color: 'var(--s-mut)',
                                    }}
                                  >
                                    {r.topXai}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div
                          style={{
                            marginTop: '10px',
                            paddingTop: '8px',
                            borderTop: '1px solid var(--s-bd)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '10px',
                            fontFamily: 'var(--fs)',
                            color: 'var(--s-mut)',
                          }}
                        >
                          <span>Dual-format: Full Clinician Audit & Plain Patient Summary</span>
                          <span style={{ fontFamily: 'var(--fm)', color: 'var(--s-acc)' }}>PDF / PRINT READY</span>
                        </div>
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
              {/* Left Column: Paragraphs + Architecture & Explainable AI Specifications Table */}
              <div className="about-text-col">
                {LANDING_COPY.about.paragraphs.map((para, i) => (
                  <p key={i} className="about-paragraph">{para}</p>
                ))}
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

                {/* Explainable AI & System Architecture Specifications Table */}
                <div className="mt-5 border border-[var(--bd)] rounded-[3px] overflow-hidden bg-[var(--panel)]">
                  <div className="px-3.5 py-2 bg-[var(--hov)] border-b border-[var(--bd)] flex items-center justify-between">
                    <span className="text-[12px] font-semibold font-[var(--fs)] text-[var(--ink)]">
                      Explainable AI & System Specifications
                    </span>
                    <span className="text-[10px] font-[var(--fm)] text-[var(--mut)]">
                      VALIDATION MATRIX
                    </span>
                  </div>
                  <div className="table-scroll-wrap overflow-x-auto w-full">
                    <table className="telemetry-table" style={{ minWidth: '420px' }}>
                      <tbody>
                        {LANDING_COPY.about.systemSpecs.map((s) => (
                          <tr key={s.component}>
                            <td className="font-semibold text-[11px] text-[var(--ink)] w-[32%]">
                              {s.component}
                            </td>
                            <td className="font-[var(--fm)] text-[11px] text-[var(--acc)]">
                              {s.spec}
                            </td>
                            <td className="text-[11px] text-[var(--mut)] text-right">
                              {s.role}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Decision support disclaimer block */}
              <div className="about-disclaimer-col">
                <div
                  className="hover-lift"
                  style={{
                    border: '1px solid var(--bd)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--panel)',
                    padding: '20px',
                  }}
                >
                  <div className="telemetry-badge">
                    CLINICAL DECISION SUPPORT
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      marginBottom: '8px',
                    }}
                  >
                    {LANDING_COPY.about.disclaimer.heading}
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '13px',
                      lineHeight: 1.55,
                      color: 'var(--ink)',
                      margin: '0 0 16px',
                    }}
                  >
                    {LANDING_COPY.about.disclaimer.body}
                  </p>

                  <div className="pt-3 border-t border-[var(--bd)] flex flex-col gap-2 text-[12px] font-[var(--fs)] text-[var(--mut)]">
                    <div className="flex items-center justify-between">
                      <span>Model Architecture</span>
                      <span className="font-[var(--fm)] text-[var(--ink)]">XGBoost Classifier</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Explainability Engine</span>
                      <span className="font-[var(--fm)] text-[var(--ink)]">TreeSHAP Local Δ</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Full Model Report</span>
                      <Link
                        to="/model-info"
                        className="font-[var(--fm)] text-[var(--acc)] underline"
                      >
                        Inspect documentation →
                      </Link>
                    </div>
                  </div>
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
          isolation: isolate;
          z-index: 1;
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
          min-height: 200px;
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

        .step-tag-text {
          font-family: var(--fm);
          font-size: 10px;
          letter-spacing: 0.04em;
          color: var(--mut);
        }

        .step-title {
          font-family: var(--fs);
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          margin: 10px 0 0;
        }

        .step-desc {
          font-family: var(--fs);
          font-size: 13px;
          line-height: 1.55;
          color: var(--mut);
          margin: 6px 0 0;
        }

        .step-chips-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--bd);
        }

        .step-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--hov);
          border: 1px solid var(--bd);
          border-radius: 3px;
          padding: 2px 7px;
          font-family: var(--fs);
          font-size: 11px;
        }

        .step-chip-label {
          color: var(--ink);
        }

        .step-chip-count {
          font-family: var(--fm);
          font-size: 10px;
          color: var(--acc);
          font-weight: 600;
        }

        /* What you get */
        .what-you-get-rows {
          display: flex;
          flex-direction: column;
        }

        .what-row {
          display: grid;
          grid-template-columns: minmax(0, 5fr) minmax(0, 6.2fr);
          gap: 36px;
          align-items: start;
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

        .telemetry-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--fm);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--acc);
          background: var(--hov);
          border: 1px solid var(--bd);
          border-radius: 3px;
          padding: 2px 8px;
          margin-bottom: 8px;
        }

        .feature-group-chip {
          display: inline-block;
          font-family: var(--fm);
          font-size: 9px;
          text-transform: uppercase;
          padding: 1px 4px;
          border-radius: 2px;
          background: var(--hov);
          color: var(--mut);
          border: 1px solid var(--bd);
        }

        .xai-badge-up {
          display: inline-block;
          font-family: var(--fm);
          font-size: 10px;
          font-weight: 600;
          color: var(--high);
          background: rgba(200, 29, 58, 0.08);
          border: 1px solid var(--high);
          border-radius: 2px;
          padding: 1px 6px;
          white-space: nowrap;
        }

        .xai-badge-down {
          display: inline-block;
          font-family: var(--fm);
          font-size: 10px;
          font-weight: 600;
          color: var(--low);
          background: rgba(46, 139, 87, 0.08);
          border: 1px solid var(--low);
          border-radius: 2px;
          padding: 1px 6px;
          white-space: nowrap;
        }

        .telemetry-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--fs);
          font-size: 12px;
        }

        .telemetry-table th {
          font-family: var(--fm);
          font-size: 10px;
          font-weight: 500;
          color: var(--mut);
          text-align: left;
          padding: 6px 8px;
          border-bottom: 1px solid var(--bd);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .telemetry-table td {
          padding: 6px 8px;
          border-bottom: 1px solid var(--bd);
          color: var(--ink);
          vertical-align: middle;
        }

        .telemetry-table tr:last-child td {
          border-bottom: none;
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
          min-height: 220px;
          height: auto;
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

        #how-it-works,
        #what-you-get,
        #about {
          scroll-margin-top: 68px;
        }

        .table-scroll-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
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

          .what-row {
            padding: 22px 0;
          }

          .what-preview-panel {
            padding: 12px;
          }

          .step-panel {
            padding: 16px;
          }

          .table-scroll-wrap::-webkit-scrollbar {
            height: 4px;
          }
        }

        /* Under 480px: Facts row labels 11px & tight spacing */
        @media (max-width: 479px) {
          .hero-band {
            padding: 24px 0 32px !important;
          }

          .facts-row {
            padding-top: 14px;
            margin-bottom: 16px;
          }

          .facts-cell {
            padding: 0 4px;
          }

          .facts-value {
            font-size: 19px;
          }

          .facts-label {
            font-size: 10.5px;
            line-height: 1.25;
          }

          .telemetry-table th,
          .telemetry-table td {
            padding: 4px 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
