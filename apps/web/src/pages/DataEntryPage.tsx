/**
 * Step 2: Clinical Data Entry & Parameter Verification Page
 * Dynamically rendered from featureSchema.ts with 5 collapsible sections,
 * completion counters, disabled OCR upload button, sample loader, and predictive analysis trigger.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  UserCheck,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useWizardStore } from '../store/useWizardStore';
import {
  FEATURE_SCHEMA,
  FEATURE_SECTIONS,
  type FeatureSection,
} from '../config/featureSchema';
import { CollapsibleSection } from '../components/forms/CollapsibleSection';
import { PATIENT_PROFILES } from '../store/usePatientStore';

export const DataEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    disclaimerAccepted,
    inputs,
    fieldMeta,
    setFieldValue,
    validateAllFields,
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
      <div className="glass-card p-4 sm:p-6 rounded-2xl border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>Clinical Verification Workflow</span>
            <span>•</span>
            <span>55 Target Features</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Patient Clinical Data Entry
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Configure or verify physiological parameters across all 5 clinical groups prior to 3D twin inference.
          </p>
        </div>

        {/* Action Buttons: Disabled Upload + Sample Loader */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Task 3.5: Disabled "Upload report (coming soon)" button */}
          <button
            type="button"
            disabled
            title="Automated document extraction pipeline coming in upcoming release"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-900/60 text-slate-500 border border-white/[0.06] cursor-not-allowed opacity-70"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload report (coming soon)</span>
          </button>

          {/* Task 3.6: "Load sample patient" Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load sample patient</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {showPresetDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                  Select Clinical Phenotype
                </div>
                {Object.entries(PATIENT_PROFILES).map(([key, profile]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleLoadPreset(key)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                      selectedPreset === key
                        ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
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

      {/* Global Completion Status Banner */}
      <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.06] text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Total Verification Progress:</span>
          <span className="text-cyan-300 font-semibold">
            {filledFeatures} / {totalFeatures} Parameters Configured
          </span>
        </div>

        <div className="flex items-center gap-2">
          {errorFeatures > 0 ? (
            <span className="text-rose-400 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {errorFeatures} invalid {errorFeatures === 1 ? 'field' : 'fields'}
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All inputs valid
            </span>
          )}
        </div>
      </div>

      {/* 5 Collapsible Sections in strict order (Task 3.2) */}
      <div className="flex flex-col gap-4">
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
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Bottom Floating Execution Deck */}
      <div className="sticky bottom-4 z-40 w-full glass-card p-4 rounded-2xl border border-white/[0.1] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <span>
            {isFormReady
              ? 'All 55 parameters verified. Ready to compute spatial ischemia telemetry.'
              : 'Please complete and verify all required parameters before proceeding.'}
          </span>
        </div>

        {/* Task 3.7: Predict Button */}
        <button
          type="button"
          id="predict-twin-btn"
          onClick={handlePredict}
          disabled={!isFormReady || isAnalyzing}
          className={`flex items-center gap-2.5 px-7 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            isFormReady && !isAnalyzing
              ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] cursor-pointer hover:scale-[1.02]'
              : 'bg-slate-800 text-slate-500 border border-white/[0.06] cursor-not-allowed opacity-60'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
              <span>Evaluating Multi-Head Models...</span>
            </>
          ) : (
            <>
              <span>Predict & Visualize Twin</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DataEntryPage;
