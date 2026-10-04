import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import {
  FEATURE_SCHEMA,
  FEATURE_SECTIONS,
  isWithinReferenceRange,
} from '../config/featureSchema';
import { CollapsibleSection } from '../components/forms/CollapsibleSection';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';

export const DataEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    disclaimerAccepted,
    inputs,
    fieldMeta,
    setFieldValue,
    loadSamplePatient,
    predictPatient,
  } = useWizardStore();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Guard: Redirect to welcome if disclaimer not accepted
  React.useEffect(() => {
    if (!disclaimerAccepted) {
      navigate('/welcome', { replace: true });
    }
  }, [disclaimerAccepted, navigate]);

  // Validation logic
  const { missingFeatures, errorEntries, outOfRangeCount } = useMemo(() => {
    const missing = FEATURE_SCHEMA.filter((f) => {
      const v = inputs[f.key];
      return f.required && (v === undefined || v === null || v === '');
    });

    const errors = Object.entries(fieldMeta).filter(([_, m]) => Boolean(m?.error));

    const outOfRange = FEATURE_SCHEMA.filter((f) => {
      const v = inputs[f.key];
      return isWithinReferenceRange(f, v) === false;
    }).length;

    return {
      missingFeatures: missing,
      errorEntries: errors,
      outOfRangeCount: outOfRange,
    };
  }, [inputs, fieldMeta]);

  // Determine first validation problem if any
  let firstProblem: string | null = null;
  if (errorEntries.length > 0) {
    const [key, meta] = errorEntries[0];
    const feat = FEATURE_SCHEMA.find((f) => f.key === key);
    firstProblem = `${feat?.label || key}: ${meta.error}`;
  } else if (missingFeatures.length > 0) {
    firstProblem = `${missingFeatures[0].label} is required`;
  }

  const isFormValid = !firstProblem;

  // Predict handler with ECG Transition Overlay
  const handlePredict = async () => {
    if (!isFormValid || isTransitioning) return;
    setPredictError(null);
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
        setPredictError('Prediction failed to complete.');
      }
    } catch (err: any) {
      setIsTransitioning(false);
      setPredictError(err?.message || 'Prediction failed.');
    }
  };

  const sampleOptions = [
    { label: 'Load sample patient', value: '' },
    { label: 'Sample patient: Low risk', value: 'normal' },
    { label: 'Sample patient: High risk (LAD)', value: 'high_risk_lad' },
    { label: 'Sample patient: Moderate risk (RCA)', value: 'rca_ischemia' },
    { label: 'Sample patient: High risk (Multivessel)', value: 'triple_vessel' },
  ];

  // Out of range status message
  const rangeStatusText =
    outOfRangeCount === 0
      ? 'All values within typical range'
      : outOfRangeCount === 1
      ? '1 value outside typical range'
      : `${outOfRangeCount} values outside typical range`;

  return (
    <div className="w-full relative flex-1 flex flex-col">
      {/* Task 5.3 Predict Transition Full-Screen Overlay */}
      {isTransitioning && (
        <div
          className="ecg-grid fixed inset-0 z-50 flex flex-col items-center justify-center"
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

      {/* Task 5.2a: Wrap entire page body in ONE Panel with padding 18px 20px */}
      <Panel
        className="wipe w-full flex flex-col"
        style={{
          padding: '18px 20px',
          '--i': 0,
        } as React.CSSProperties}
      >
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            {/* Title "Clinical data" (20px/600, margin-bottom 2px) */}
            <h1
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '2px',
                margin: 0,
              }}
            >
              Clinical data
            </h1>
            {/* Helper line (13px --mut, margin-bottom 14px) */}
            <p
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                color: 'var(--mut)',
                marginBottom: '14px',
                marginTop: '2px',
              }}
            >
              Enter or check each measurement before predicting.
            </p>
          </div>

          {/* Right aligned on title row */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              disabled
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                color: 'var(--mut)',
                opacity: 0.5,
                cursor: 'not-allowed',
                padding: 0,
              }}
            >
              Upload report (coming soon)
            </button>

            <Select
              options={sampleOptions}
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  loadSamplePatient(val);
                  setPredictError(null);
                }
              }}
            />
          </div>
        </div>

        {/* Task 5.2c: Sections in this order: Demographics, Clinical examination, ECG, Laboratory, Echocardiography */}
        <div className="flex flex-col gap-2">
          {FEATURE_SECTIONS.map((section, idx) => {
            const sectionFeatures = FEATURE_SCHEMA.filter((f) => f.section === section);
            return (
              <CollapsibleSection
                key={section}
                section={section}
                features={sectionFeatures}
                inputs={inputs}
                fieldMeta={fieldMeta}
                onFieldChange={setFieldValue}
                defaultOpen={idx === 0 || idx === 1}
              />
            );
          })}
        </div>

        {/* Task 5.2g: Sticky bottom bar (position sticky, bottom 0, background --panel, border-top 1px --bd, margin 16px -20px -18px, padding 10px 16px, flex space-between) */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'var(--panel)',
            borderTop: '1px solid var(--bd)',
            margin: '16px -20px -18px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
          }}
        >
          {/* Left status text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {predictError ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--high)',
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--fs)',
                    fontSize: '12px',
                    color: 'var(--ink)',
                  }}
                >
                  {predictError}
                </span>
                <button
                  type="button"
                  onClick={handlePredict}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    fontFamily: 'var(--fs)',
                    fontSize: '12px',
                    color: 'var(--acc)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Try again
                </button>
              </div>
            ) : firstProblem ? (
              <span
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '12px',
                  color: 'var(--high)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {firstProblem}
              </span>
            ) : (
              <span
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '12px',
                  color: 'var(--mut)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {rangeStatusText}
              </span>
            )}
          </div>

          {/* Right: primary Button "Predict" */}
          <Button
            id="predict-button"
            variant="primary"
            onClick={handlePredict}
            disabled={!isFormValid || isTransitioning}
          >
            Predict
          </Button>
        </div>
      </Panel>
    </div>
  );
};

export default DataEntryPage;
