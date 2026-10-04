/**
 * Step 2: Clinical Data Entry & Parameter Verification Page (Task C7b)
 * Dynamically rendered from featureSchema.ts with 5 collapsible sections,
 * completion counters, disabled OCR upload button, sample loader, and predictive analysis trigger.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { useWizardStore } from '../store/useWizardStore';
import {
  FEATURE_SCHEMA,
  FEATURE_SECTIONS,
} from '../config/featureSchema';
import { CollapsibleSection } from '../components/forms/CollapsibleSection';
import { PATIENT_PROFILES } from '../store/usePatientStore';
import { Button, Card, Badge, Banner } from '../components/ui';

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

  const [selectedPreset, setSelectedPreset] = useState<string>('high_risk_lad');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  // Guard: Redirect to welcome if disclaimer not accepted
  React.useEffect(() => {
    if (!disclaimerAccepted) {
      navigate('/welcome', { replace: true });
    }
  }, [disclaimerAccepted, navigate]);

  // Overall form completeness calculation
  const totalFeatures = FEATURE_SCHEMA.length;
  const filledFeatures = FEATURE_SCHEMA.filter((f) => {
    const v = inputs[f.key];
    return v !== undefined && v !== null && v !== '';
  }).length;
  const errorFeatures = Object.values(fieldMeta).filter((m) => !!m?.error).length;
  const isFormReady = filledFeatures === totalFeatures && errorFeatures === 0;

  const handlePredict = async () => {
    const success = await predictPatient();
    if (success) {
      navigate('/results');
    }
  };

  const handleLoadPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    loadSamplePatient(presetKey);
    setShowPresetDropdown(false);
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 md:p-8 max-w-7xl mx-auto w-full gap-5">
      {/* Top Action Header Bar */}
      <Card variant="base" padding="md" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-numbers text-slate-400">
              <span>Clinical Verification Workflow</span>
              <span>•</span>
              <span className="text-blue-400 font-semibold">55 Target Parameters</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mt-1">
              Patient Clinical Data Entry
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Configure or verify physiological parameters across all 5 clinical groups prior to 3D twin inference.
            </p>
          </div>

          {/* Action Buttons: Disabled Upload + Sample Loader */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              disabled
              title="Automated document extraction pipeline coming in upcoming release"
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Upload report (coming soon)
            </Button>

            {/* Load sample patient Button & Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-400" />}
                rightIcon={<ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
              >
                Load sample patient
              </Button>

              {showPresetDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-md bg-[#1c2637] border border-[#283548] shadow-md p-1.5 z-50 animate-in fade-in duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono-numbers uppercase tracking-wider text-slate-400 border-b border-[#283548]">
                    Select Clinical Phenotype
                  </div>
                  {Object.entries(PATIENT_PROFILES).map(([key, profile]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleLoadPreset(key)}
                      className={`w-full text-left p-2.5 rounded text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${
                        selectedPreset === key
                          ? 'bg-[#131a26] text-blue-300 border border-[#384961]'
                          : 'text-slate-300 hover:bg-[#131a26]'
                      }`}
                    >
                      <span className="font-semibold text-white">{profile.name}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {profile.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Global Completion Status Banner */}
      <div className="w-full flex items-center justify-between p-3 rounded-md bg-[#131a26] border border-[#283548] text-xs font-mono-numbers">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Verification Progress:</span>
          <span className="text-slate-100 font-semibold">
            {filledFeatures} / {totalFeatures} Parameters Configured
          </span>
        </div>

        <div className="flex items-center gap-2">
          {errorFeatures > 0 ? (
            <span className="text-red-400 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {errorFeatures} invalid {errorFeatures === 1 ? 'field' : 'fields'}
            </span>
          ) : (
            <span className="text-green-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All parameters valid
            </span>
          )}
        </div>
      </div>

      {/* 5 Collapsible Sections in strict order */}
      <div className="flex flex-col gap-3.5">
        {FEATURE_SECTIONS.map((section) => {
          const sectionFeatures = FEATURE_SCHEMA.filter((f) => f.section === section);
          return (
            <CollapsibleSection
              key={section}
              section={section}
              features={sectionFeatures}
              inputs={inputs}
              fieldMeta={fieldMeta}
              onFieldChange={(key, val) => setFieldValue(key as any, val)}
              defaultOpen={true}
            />
          );
        })}
      </div>

      {/* Error message from inference if failed */}
      {analysisError && (
        <Banner variant="danger" title="Inference Error">
          {analysisError}
        </Banner>
      )}

      {/* Bottom Floating Execution Deck */}
      <div className="sticky bottom-4 z-40 w-full p-4 rounded-md bg-[#131a26] border border-[#283548] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isFormReady ? 'bg-green-500' : 'bg-amber-500'}`} />
          <span>
            {isFormReady
              ? 'All 55 parameters verified. Ready to compute spatial ischemia telemetry.'
              : 'Please complete and verify all required parameters before proceeding.'}
          </span>
        </div>

        {/* Predict Button */}
        <Button
          id="predict-twin-btn"
          variant="primary"
          size="md"
          onClick={handlePredict}
          disabled={!isFormReady || isAnalyzing}
          isLoading={isAnalyzing}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Predict & Visualize Twin
        </Button>
      </div>
    </div>
  );
};

export default DataEntryPage;
