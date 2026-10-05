/**
 * Unified Patient & Wizard Session Store (Zustand + sessionStorage persistence)
 * Multimodal AI Hackathon 2026 - Perfusion3D
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CompleteAnalysisResponse, PatientData, VesselExplanation } from '../types/clinical';
import type { FieldMeta, FieldSource, PatientReportData, TechnicalReportData } from '../types/wizard';
import { FEATURE_SCHEMA, getDefaultPatientData, validateFeatureValue } from '../config/featureSchema';
import { PATIENT_PROFILES, usePatientStore } from './usePatientStore';

interface WizardState {
  // --- Step 1 State ---
  disclaimerAccepted: boolean;
  completedSteps: number[];

  // --- Step 2 Input State ---
  inputs: PatientData;
  fieldMeta: Record<string, FieldMeta>;
  isFormValid: boolean;

  // --- Step 3 Results State ---
  prediction: CompleteAnalysisResponse['predictions'] | null;
  shapResult: Record<string, VesselExplanation> | null;
  analysisLatencyMs: number | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  activeVesselFocus: string;

  // --- Step 4 Reports State ---
  technicalReport: TechnicalReportData | null;
  patientReport: PatientReportData | null;
  isGeneratingReports: boolean;
  reportGenerationError: string | null;

  // --- Actions ---
  setDisclaimerAccepted: (accepted: boolean) => void;
  setFieldValue: <K extends keyof PatientData>(key: K, value: PatientData[K]) => void;
  setFieldMeta: (key: string, meta: Partial<FieldMeta>) => void;
  validateAllFields: () => boolean;
  applyExtractedValues: (values: Partial<PatientData>, confidences?: Record<string, number>) => void;
  loadSamplePatient: (profileKey?: string) => void;
  predictPatient: () => Promise<boolean>;
  setTechnicalReport: (report: TechnicalReportData | null) => void;
  setPatientReport: (report: PatientReportData | null) => void;
  setVesselFocus: (focus: string) => void;
  isStepUnlocked: (stepNumber: number) => boolean;
  markStepCompleted: (stepNumber: number) => void;
  resetSession: () => void;
}

function initializeFieldMeta(): Record<string, FieldMeta> {
  const meta: Record<string, FieldMeta> = {};
  for (const f of FEATURE_SCHEMA) {
    meta[f.key] = {
      source: 'manual',
      confidence: null,
      error: null,
      touched: false,
    };
  }
  return meta;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      disclaimerAccepted: false,
      completedSteps: [],

      inputs: getDefaultPatientData(),
      fieldMeta: initializeFieldMeta(),
      isFormValid: true,

      prediction: null,
      shapResult: null,
      analysisLatencyMs: null,
      isAnalyzing: false,
      analysisError: null,
      activeVesselFocus: 'default',

      technicalReport: null,
      patientReport: null,
      isGeneratingReports: false,
      reportGenerationError: null,

      setDisclaimerAccepted: (accepted: boolean) => {
        set((state) => {
          const completed = accepted
            ? Array.from(new Set([...state.completedSteps, 1]))
            : state.completedSteps.filter((s) => s !== 1);
          return { disclaimerAccepted: accepted, completedSteps: completed };
        });
      },

      setFieldValue: (key, value) => {
        const state = get();
        const updatedInputs = { ...state.inputs, [key]: value };

        // Recalculate BMI automatically if Weight or Length changes
        if (key === 'Weight' || key === 'Length') {
          const h = (key === 'Length' ? Number(value) : state.inputs.Length) / 100.0;
          const w = key === 'Weight' ? Number(value) : state.inputs.Weight;
          if (h > 0) {
            updatedInputs.BMI = Number((w / (h * h)).toFixed(2));
          }
        }

        const feat = FEATURE_SCHEMA.find((f) => f.key === key);
        const error = feat ? validateFeatureValue(feat, value) : null;

        const currentMeta = state.fieldMeta[key as string] || { source: 'manual' };
        const updatedMeta = {
          ...state.fieldMeta,
          [key as string]: {
            ...currentMeta,
            source: 'manual' as FieldSource,
            error,
            touched: true,
          },
        };

        set({ inputs: updatedInputs, fieldMeta: updatedMeta });

        // Synchronize with existing usePatientStore so 3D viewer has fresh data
        usePatientStore.getState().updatePatientField(key, value);
      },

      setFieldMeta: (key, meta) => {
        set((state) => ({
          fieldMeta: {
            ...state.fieldMeta,
            [key]: {
              ...(state.fieldMeta[key] || { source: 'manual' }),
              ...meta,
            },
          },
        }));
      },

      validateAllFields: () => {
        const state = get();
        let valid = true;
        const newMeta = { ...state.fieldMeta };

        for (const feat of FEATURE_SCHEMA) {
          const val = state.inputs[feat.key];
          const err = validateFeatureValue(feat, val);
          newMeta[feat.key as string] = {
            ...(newMeta[feat.key as string] || { source: 'manual' }),
            error: err,
            touched: true,
          };
          if (err) {
            valid = false;
          }
        }

        set({ fieldMeta: newMeta, isFormValid: valid });
        return valid;
      },

      /**
       * Stub function for future automated document extraction.
       * Sets field source to 'extracted' and flags confidence.
       * TODO: Connect to OCR / Multimodal clinical report extraction pipeline.
       */
      applyExtractedValues: (values: Partial<PatientData>, confidences?: Record<string, number>) => {
        const state = get();
        const updatedInputs = { ...state.inputs, ...values };
        const updatedMeta = { ...state.fieldMeta };

        for (const [k, v] of Object.entries(values)) {
          const conf = confidences?.[k] ?? 0.85;
          const feat = FEATURE_SCHEMA.find((f) => f.key === k);
          const err = feat ? validateFeatureValue(feat, v) : null;
          updatedMeta[k] = {
            source: 'extracted',
            confidence: conf,
            error: err,
            touched: true,
          };
        }

        set({ inputs: updatedInputs, fieldMeta: updatedMeta });
      },

      loadSamplePatient: (profileKey: string = 'high_risk_lad') => {
        const preset = (PATIENT_PROFILES as any)[profileKey] || PATIENT_PROFILES.high_risk_lad;
        if (!preset) return;

        const data: PatientData = { ...preset.data };
        const updatedMeta = initializeFieldMeta();

        // Mark all loaded fields as verified manual
        for (const key of Object.keys(data)) {
          updatedMeta[key] = {
            source: 'manual',
            confidence: null,
            error: null,
            touched: true,
          };
        }

        set({
          inputs: data,
          fieldMeta: updatedMeta,
          isFormValid: true,
        });

        // Sync with usePatientStore
        usePatientStore.getState().setPatient(data);
      },

      predictPatient: async () => {
        const isValid = get().validateAllFields();
        if (!isValid) return false;

        const patientPayload = get().inputs;
        set({ isAnalyzing: true, analysisError: null });

        try {
          const res = await fetch('/api/v1/analyze?top_k=6', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientPayload),
          });

          if (!res.ok) {
            throw new Error(`Inference engine returned ${res.status}: ${res.statusText}`);
          }

          const completeAnalysis: CompleteAnalysisResponse = await res.json();

          set((state) => ({
            prediction: completeAnalysis.predictions,
            shapResult: completeAnalysis.explanations,
            analysisLatencyMs: completeAnalysis.latency_ms,
            isAnalyzing: false,
            analysisError: null,
            completedSteps: Array.from(new Set([...state.completedSteps, 1, 2])),
          }));

          // CRITICAL: Update existing usePatientStore so that HeartCanvas & HeartModel
          // seamlessly render real probabilities without modifying any 3D code!
          usePatientStore.setState({
            analysis: completeAnalysis,
            isCalculating: false,
            isLoading: false,
            patientData: patientPayload,
            patient: patientPayload,
          });

          return true;
        } catch (err: any) {
          console.error('[useWizardStore] Prediction error:', err);
          set({
            isAnalyzing: false,
            analysisError: err.message || 'Failed to communicate with prediction engine.',
          });
          return false;
        }
      },

      setTechnicalReport: (report) => {
        set({ technicalReport: report });
      },

      setPatientReport: (report) => {
        set({ patientReport: report });
      },

      setVesselFocus: (focus: string) => {
        set({ activeVesselFocus: focus });
        usePatientStore.getState().setVesselFocus(focus);
      },

      isStepUnlocked: (stepNumber: number) => {
        const state = get();
        if (stepNumber === 1) return true;
        if (stepNumber === 2) return state.disclaimerAccepted;
        if (stepNumber === 3) return state.disclaimerAccepted && state.prediction !== null;
        if (stepNumber === 4) return state.disclaimerAccepted && state.prediction !== null;
        return false;
      },

      markStepCompleted: (stepNumber: number) => {
        set((state) => ({
          completedSteps: Array.from(new Set([...state.completedSteps, stepNumber])),
        }));
      },

      resetSession: () => {
        set({
          disclaimerAccepted: false,
          completedSteps: [],
          inputs: getDefaultPatientData(),
          fieldMeta: initializeFieldMeta(),
          prediction: null,
          shapResult: null,
          technicalReport: null,
          patientReport: null,
          analysisError: null,
        });
      },
    }),
    {
      name: 'perfusion3d-wizard-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        disclaimerAccepted: state.disclaimerAccepted,
        completedSteps: state.completedSteps,
        inputs: state.inputs,
        fieldMeta: state.fieldMeta,
        prediction: state.prediction,
        shapResult: state.shapResult,
        technicalReport: state.technicalReport,
        patientReport: state.patientReport,
      }),
    }
  )
);
