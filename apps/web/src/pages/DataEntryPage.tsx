import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import {
  FEATURE_SCHEMA,
  FEATURE_SECTIONS,
} from '../config/featureSchema';
import { CollapsibleSection } from '../components/forms/CollapsibleSection';
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
    isAnalyzing,
    analysisError,
  } = useWizardStore();

  const [attentionNotice, setAttentionNotice] = useState<string | null>(null);

  // Guard: Redirect to welcome if disclaimer not accepted
  React.useEffect(() => {
    if (!disclaimerAccepted) {
      navigate('/welcome', { replace: true });
    }
  }, [disclaimerAccepted, navigate]);

  // Overall form completeness calculation
  const totalFeatures = FEATURE_SCHEMA.length;
  const missingFeatures = FEATURE_SCHEMA.filter((f) => {
    const v = inputs[f.key];
    return v === undefined || v === null || v === '';
  });
  const errorEntries = Object.entries(fieldMeta).filter(([_, m]) => !!m?.error);
  const attentionCount = missingFeatures.length + errorEntries.length;
  const isFormReady = attentionCount === 0;

  const handlePredict = async () => {
    const success = await predictPatient();
    if (success) {
      navigate('/results');
    }
  };

  const handleAttentionClick = () => {
    if (errorEntries.length > 0) {
      const [key, meta] = errorEntries[0];
      const feat = FEATURE_SCHEMA.find((f) => f.key === key);
      setAttentionNotice(`${feat?.label || key}: ${meta.error}`);
    } else if (missingFeatures.length > 0) {
      const firstMissing = missingFeatures[0];
      setAttentionNotice(`${firstMissing.label} is required`);
    } else {
      setAttentionNotice(null);
    }
  };

  const sampleOptions = [
    { label: 'Load sample patient...', value: '' },
    { label: 'Sample patient: Low risk', value: 'normal' },
    { label: 'Sample patient: High risk (LAD)', value: 'high_risk_lad' },
    { label: 'Sample patient: Moderate risk (RCA)', value: 'rca_ischemia' },
    { label: 'Sample patient: High risk (Multivessel)', value: 'triple_vessel' },
  ];

  return (
    <div className="flex-1 flex flex-col w-full pb-16">
      {/* Title & Top Right Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-page-title text-text">
            Clinical measurements
          </h1>
          <p className="text-body text-text-muted mt-1">
            Enter clinical and diagnostic measurements or load a sample patient to evaluate coronary risk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <Button
            variant="link"
            disabled
            className="text-text-muted cursor-not-allowed no-underline"
          >
            Upload report (coming soon)
          </Button>

          <div className="w-[260px]">
            <Select
              options={sampleOptions}
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  loadSamplePatient(val);
                  setAttentionNotice(null);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Sections list */}
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

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-page border-t border-border py-3 px-4 md:px-8 z-40">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {attentionCount > 0 ? (
              <button
                type="button"
                onClick={handleAttentionClick}
                className="text-[13px] leading-[20px] text-text-muted hover:text-text cursor-pointer underline border-0 bg-transparent p-0 text-left"
              >
                {attentionCount} {attentionCount === 1 ? 'field needs' : 'fields need'} attention
              </button>
            ) : (
              <span className="text-[13px] leading-[20px] text-risk-low">
                All measurements complete
              </span>
            )}

            {attentionNotice && (
              <span className="text-[12px] leading-[16px] text-risk-high">
                ({attentionNotice})
              </span>
            )}

            {analysisError && (
              <span className="text-[12px] leading-[16px] text-risk-high">
                {analysisError}
              </span>
            )}
          </div>

          <Button
            id="predict-button"
            variant="primary"
            onClick={handlePredict}
            isLoading={isAnalyzing}
            disabled={!isFormReady}
          >
            Predict
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataEntryPage;
