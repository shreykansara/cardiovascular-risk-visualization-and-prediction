import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import {
  FEATURE_SCHEMA,
  type FeatureDefinition,
} from '../config/featureSchema';
import { PATIENT_PROFILES } from '../store/usePatientStore';
import { Panel } from '../components/ui/Panel';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { QuietButton } from '../components/ui/QuietButton';
import { InlineLink } from '../components/ui/InlineLink';
import { FieldAnatomy, getFieldErrorMessage } from '../components/forms/FieldAnatomy';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SectionConfig {
  id: string;
  name: string;
  features: FeatureDefinition[];
}

const SECTIONS_CONFIG: { id: string; name: string; sectionKey: string }[] = [
  { id: 'demographics', name: 'Demographics', sectionKey: 'Demographics' },
  { id: 'clinical-examination', name: 'Clinical examination', sectionKey: 'Clinical Examination' },
  { id: 'ecg', name: 'ECG', sectionKey: 'ECG' },
  { id: 'laboratory', name: 'Laboratory', sectionKey: 'Laboratory' },
  { id: 'echocardiography', name: 'Echocardiography', sectionKey: 'Echocardiography' },
];

export const DataEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    disclaimerAccepted,
    isDirty,
    inputs,
    fieldMeta,
    analysisError,
    setFieldValue,
    loadSamplePatient,
    predictPatient,
    reset,
    setDisclaimerAccepted,
  } = useWizardStore();

  const [samplePatientLoaded, setSamplePatientLoaded] = useState(false);
  const [selectedSampleKey, setSelectedSampleKey] = useState('');
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [hasAttemptedPredict, setHasAttemptedPredict] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('demographics');

  const clearDialogRef = useRef<HTMLDialogElement>(null);

  // Track expanded state for each of the 5 sections (Task 5.5: on mobile <600px, only first section expanded)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
    if (isMobile) {
      return {
        demographics: true,
        'clinical-examination': false,
        ecg: false,
        laboratory: false,
        echocardiography: false,
      };
    }
    return {
      demographics: true,
      'clinical-examination': true,
      ecg: true,
      laboratory: true,
      echocardiography: true,
    };
  });

  // Guard: Redirect to welcome if disclaimer not accepted
  useEffect(() => {
    if (!disclaimerAccepted) {
      navigate('/welcome', { replace: true });
    }
  }, [disclaimerAccepted, navigate]);

  // Group features by section
  const sections: SectionConfig[] = useMemo(() => {
    return SECTIONS_CONFIG.map(({ id, name, sectionKey }) => ({
      id,
      name,
      features: FEATURE_SCHEMA.filter((f) => f.section === sectionKey),
    }));
  }, []);

  // Compute metrics per Task 4.8:
  // "entered" = fields with a value
  // "outside typical range" = number fields outside LO..HI but within hard limits
  // "need attention" = fields that are required and empty or invalid
  const metrics = useMemo(() => {
    let enteredTotal = 0;
    let outsideTotal = 0;
    const invalidFields: { key: string; sectionId: string; label: string }[] = [];

    const sectionMetrics: Record<
      string,
      { entered: number; total: number; hasInvalid: boolean; hasOutOfRange: boolean }
    > = {};

    sections.forEach((sec) => {
      let secEntered = 0;
      let secHasInvalid = false;
      let secHasOutOfRange = false;

      sec.features.forEach((f) => {
        const val = inputs[f.key];
        const isEntered = val !== undefined && val !== null && val !== '';
        if (isEntered) {
          secEntered++;
          enteredTotal++;
        }

        const errMsg = getFieldErrorMessage(f, val);
        if (errMsg) {
          secHasInvalid = true;
          invalidFields.push({ key: String(f.key), sectionId: sec.id, label: f.label });
        }

        if (f.type === 'number' && f.refLow !== undefined && f.refHigh !== undefined && isEntered && !errMsg) {
          const n = Number(val);
          if (!isNaN(n) && (n < f.refLow || n > f.refHigh)) {
            secHasOutOfRange = true;
            outsideTotal++;
          }
        }
      });

      sectionMetrics[sec.id] = {
        entered: secEntered,
        total: sec.features.length,
        hasInvalid: secHasInvalid,
        hasOutOfRange: secHasOutOfRange,
      };
    });

    return {
      enteredTotal,
      outsideTotal,
      invalidFields,
      sectionMetrics,
    };
  }, [sections, inputs]);

  // IntersectionObserver for tracking active section in sidebar
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by top position to pick most visible
          visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveSectionId(visibleEntries[0].target.id.replace('section-', ''));
        }
      },
      {
        rootMargin: '-80px 0px -50% 0px',
        threshold: [0, 0.2, 0.5],
      }
    );

    sections.forEach((sec) => {
      const el = document.getElementById(`section-${sec.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  // Field change handler: editing removes "Sample patient" chip (Task 4.7)
  const handleFieldChange = (key: any, val: any) => {
    setSamplePatientLoaded(false);
    setFieldValue(key, val);
  };

  // Sample patient selection (Task 1.7)
  const handleSelectSample = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    if (key) {
      loadSamplePatient(key);
      setSamplePatientLoaded(true);
      setShowAllErrors(false);
      setHasAttemptedPredict(false);
    }
    setSelectedSampleKey('');
  };

  const handleConfirmClearForm = () => {
    reset();
    setDisclaimerAccepted(true);
    setSamplePatientLoaded(false);
    setSelectedSampleKey('');
    setShowAllErrors(false);
    setHasAttemptedPredict(false);
    clearDialogRef.current?.close();
  };

  // Toggle single section
  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Collapse all / Expand all toggle (Task 4.2)
  const allExpanded = Object.values(expandedSections).every(Boolean);
  const handleToggleAll = () => {
    const nextState = !allExpanded;
    const updated: Record<string, boolean> = {};
    sections.forEach((s) => {
      updated[s.id] = nextState;
    });
    setExpandedSections(updated);
  };

  // Scroll to section helper
  const scrollToSection = (secId: string) => {
    setExpandedSections((prev) => ({ ...prev, [secId]: true }));
    const el = document.getElementById(`section-${secId}`);
    if (el) {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
      // Focus heading or button
      const headerBtn = el.querySelector('button');
      headerBtn?.focus();
    }
  };

  // Focus first invalid field helper (Task 4.9)
  const focusFirstInvalid = () => {
    setShowAllErrors(true);
    if (metrics.invalidFields.length > 0) {
      const first = metrics.invalidFields[0];
      setExpandedSections((prev) => ({ ...prev, [first.sectionId]: true }));
      setTimeout(() => {
        const inputEl = document.getElementById(`field-${first.key}`);
        if (inputEl) {
          const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          inputEl.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
          inputEl.focus();
        }
      }, 50);
    }
  };

  // Predict button click (Task 1.8: mark all errors, scroll & focus first invalid, make NO api call)
  const handlePredictClick = async () => {
    setHasAttemptedPredict(true);
    if (metrics.invalidFields.length > 0) {
      focusFirstInvalid();
      return;
    }

    if (isTransitioning) return;
    setIsTransitioning(true);

    try {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const minDelay = prefersReduced ? 0 : 1650;

      const [success] = await Promise.all([
        predictPatient(),
        new Promise((resolve) => setTimeout(resolve, minDelay)),
      ]);

      if (success) {
        setIsTransitioning(false);
        navigate('/results');
      } else {
        setIsTransitioning(false);
      }
    } catch (err) {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col relative">
      {/* Predict Transition Overlay */}
      {isTransitioning && (
        <div
          className="ecg-grid fixed inset-0 z-50 flex flex-col items-center justify-center no-print"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
          }}
        >
          <svg
            viewBox="0 0 680 120"
            preserveAspectRatio="none"
            style={{
              width: '92%',
              height: '120px',
              maxWidth: '900px',
              overflow: 'visible',
            }}
          >
            <path
              pathLength="1"
              d="M0 70 L120 70 L140 70 L150 50 L160 90 L170 70 L230 70 L250 70 L262 28 L276 112 L290 70 L350 70 L380 62 L400 70 L470 70 L490 70 L500 50 L510 90 L520 70 L580 70 L600 70 L612 28 L626 112 L640 70 L680 70"
              fill="none"
              stroke="var(--acc)"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="1"
              style={{
                animation: 'draw 1500ms var(--ease-draw) both',
              }}
            />
          </svg>
          <span
            style={{
              fontFamily: 'var(--fm)',
              fontSize: '12px',
              color: 'var(--mut)',
              marginTop: '10px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            Estimating…
          </span>
        </div>
      )}

      {/* Analysis Error Alert */}
      {analysisError && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--crit, #EF4444)',
            borderRadius: '3px',
            padding: '12px 16px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--fs)',
            fontSize: '13px',
            color: 'var(--ink)',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--crit, #EF4444)', flexShrink: 0 }} />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Task 4.2 Header Panel (full width, wipe --i: 0) */}
      <Panel
        className="wipe w-full"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
          '--i': 0,
        } as React.CSSProperties}
      >
        {/* Left: Title + optional Sample Patient chip + caption */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Clinical data
            </h1>
            {samplePatientLoaded && (
              <span
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '11px',
                  border: '1px solid var(--bds)',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  color: 'var(--mut)',
                  lineHeight: '1',
                }}
              >
                Sample patient
              </span>
            )}
          </div>
          <p
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '13px',
              color: 'var(--mut)',
              margin: '2px 0 0 0',
            }}
          >
            Enter each measurement, or load a sample patient.
          </p>
        </div>

        {/* Right: Upload report disabled button + Sample patient select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SecondaryButton
            size="sm"
            disabled
            title="Available in a later version"
          >
            Upload report (coming soon)
          </SecondaryButton>

          <select
            id="sample-patient-select"
            value={selectedSampleKey}
            onChange={handleSelectSample}
            aria-label="Load sample patient"
            style={{
              height: '32px',
              width: '200px',
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
            <option value="">Load sample patient</option>
            {Object.entries(PATIENT_PROFILES).map(([key, prof]) => (
              <option key={key} value={key}>
                Sample: {prof.name}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      {/* Task 4.4 Section strip for mobile/tablet <900px (sticky top 48px) */}
      <Panel
        className="section-strip-mobile app-chrome"
        style={{
          position: 'sticky',
          top: '48px',
          height: '44px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          zIndex: 8,
          marginBottom: '14px',
        }}
      >
        {sections.map((sec) => {
          const isActive = activeSectionId === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(sec.id)}
              style={{
                height: '44px',
                padding: '0 12px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--acc)' : '2px solid transparent',
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--ink)' : 'var(--mut)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {sec.name}
            </button>
          );
        })}
      </Panel>

      {/* Collapse all / Expand all and Clear form buttons placed above form column */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        <QuietButton
          size="sm"
          onClick={handleToggleAll}
        >
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </QuietButton>
        <QuietButton
          size="sm"
          id="clear-form-button"
          disabled={!isDirty}
          onClick={() => clearDialogRef.current?.showModal()}
        >
          Clear form
        </QuietButton>
      </div>

      {/* Two-column layout: Sidebar 240px + Form column (1fr), gap 14px (Task 4.1) */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
          width: '100%',
          paddingBottom: '24px',
        }}
      >
        {/* Task 4.3 Sidebar (>=900px, sticky top 72px, wipe --i: 1) */}
        <Panel
          className="sidebar-desktop wipe"
          style={{
            position: 'sticky',
            top: '72px',
            padding: '12px 0',
            width: '240px',
            flexShrink: 0,
            '--i': 1,
          } as React.CSSProperties}
        >
          {/* Heading */}
          <div
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '12px',
              color: 'var(--mut)',
              padding: '0 14px 8px 14px',
            }}
          >
            Sections
          </div>

          {/* 5 Row buttons */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sections.map((sec) => {
              const isActive = activeSectionId === sec.id;
              const secMet = metrics.sectionMetrics[sec.id] || {
                entered: 0,
                total: sec.features.length,
                hasInvalid: false,
                hasOutOfRange: false,
              };

              let dotColor = null;
              if (hasAttemptedPredict && secMet.hasInvalid) {
                dotColor = 'var(--high)';
              } else if (secMet.hasOutOfRange) {
                dotColor = 'var(--mod)';
              }

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  style={{
                    height: '40px',
                    padding: '0 14px',
                    border: 'none',
                    borderLeft: isActive ? '3px solid var(--acc)' : '3px solid transparent',
                    backgroundColor: isActive ? 'var(--hov)' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'background-color 120ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--hov)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 400,
                      color: 'var(--ink)',
                    }}
                  >
                    {sec.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {dotColor && (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: dotColor,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: 'var(--fm)',
                        fontSize: '12px',
                        color: 'var(--mut)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {secMet.entered} of {secMet.total}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 1px --bd divider with 8px vertical margin */}
          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--bd)',
              margin: '8px 0',
            }}
          />

          {/* Overall block */}
          <div style={{ padding: '0 14px 4px 14px' }}>
            <div
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '12px',
                color: 'var(--mut)',
                marginBottom: '2px',
              }}
            >
              Entered
            </div>
            <div
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '14px',
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
                marginBottom: '6px',
              }}
            >
              {metrics.enteredTotal} of {FEATURE_SCHEMA.length}
            </div>
            {/* 4px thin Bar */}
            <div
              style={{
                height: '4px',
                backgroundColor: 'var(--bd)',
                borderRadius: '3px',
                overflow: 'hidden',
                width: '100%',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (metrics.enteredTotal / FEATURE_SCHEMA.length) * 100)}%`,
                  backgroundColor: 'var(--acc)',
                  transition: 'width 180ms var(--ease-wipe)',
                }}
              />
            </div>
          </div>
        </Panel>

        {/* Form Column (1fr) */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {sections.map((sec, secIdx) => {
            const isExpanded = Boolean(expandedSections[sec.id]);
            const secMet = metrics.sectionMetrics[sec.id] || {
              entered: 0,
              total: sec.features.length,
            };

            return (
              <Panel
                key={sec.id}
                id={`section-${sec.id}`}
                className="wipe w-full"
                style={{
                  padding: 0,
                  scrollMarginTop: '80px',
                  overflow: 'hidden',
                  '--i': 2 + secIdx,
                } as React.CSSProperties}
              >
                {/* Section Header Button */}
                <button
                  type="button"
                  className="section-panel-header"
                  aria-expanded={isExpanded}
                  onClick={() => toggleSection(sec.id)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isExpanded ? '1px solid var(--bd)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--fs)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    {sec.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--fm)',
                        fontSize: '12px',
                        color: 'var(--mut)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {secMet.entered} of {secMet.total}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={16} color="var(--mut)" />
                    ) : (
                      <ChevronDown size={16} color="var(--mut)" />
                    )}
                  </div>
                </button>

                {/* Section Body */}
                {isExpanded && (
                  <div style={{ padding: '16px' }}>
                    <div className="section-field-grid">
                      {sec.features.map((feature) => (
                        <FieldAnatomy
                          key={feature.key}
                          feature={feature}
                          value={inputs[feature.key]}
                          meta={fieldMeta[feature.key]}
                          showAllErrors={showAllErrors}
                          onChange={(val) => handleFieldChange(feature.key, val)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      </div>

      {/* Task 4.9 Sticky action bar at the bottom */}
      <div
        className="app-chrome sticky-action-bar"
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 5,
          width: 'calc(100% + 32px)',
          backgroundColor: 'var(--panel)',
          borderTop: '1px solid var(--bd)',
          marginLeft: '-16px',
          marginRight: '-16px',
          marginBottom: '-16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '10px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left status group (mono 12px --mut, parts joined by " · ") */}
          <div
            style={{
              fontFamily: 'var(--fm)',
              fontSize: '12px',
              color: 'var(--mut)',
              fontVariantNumeric: 'tabular-nums',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            <span>
              {metrics.enteredTotal === FEATURE_SCHEMA.length
                ? `All ${FEATURE_SCHEMA.length} entered`
                : `${metrics.enteredTotal} of ${FEATURE_SCHEMA.length} entered`}
            </span>
            {metrics.outsideTotal > 0 && (
              <>
                <span>·</span>
                <span>{metrics.outsideTotal} outside typical range</span>
              </>
            )}
            {hasAttemptedPredict && metrics.invalidFields.length > 0 && (
              <>
                <span>·</span>
                <InlineLink
                  onClick={focusFirstInvalid}
                  style={{
                    fontFamily: 'var(--fm)',
                    fontSize: '12px',
                  }}
                >
                  {metrics.invalidFields.length} need attention
                </InlineLink>
              </>
            )}
          </div>

          {/* Right group: Back + Predict */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SecondaryButton
              size="md"
              onClick={() => navigate('/welcome')}
            >
              Back
            </SecondaryButton>
            <PrimaryButton
              id="predict-button"
              size="lg"
              onClick={handlePredictClick}
            >
              Predict
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Clear Form (Task 1.7) */}
      <dialog ref={clearDialogRef} className="nav-confirm-dialog app-chrome no-print">
        <h3
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '0 0 8px 0',
          }}
        >
          Clear all values?
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
          This removes every value you entered.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <SecondaryButton
            size="sm"
            onClick={() => clearDialogRef.current?.close()}
          >
            Cancel
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            onClick={handleConfirmClearForm}
          >
            Clear values
          </PrimaryButton>
        </div>
      </dialog>
    </div>
  );
};

export default DataEntryPage;
