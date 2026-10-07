/**
 * Unified Patient & Wizard Session Store (Zustand + sessionStorage persistence)
 * Multimodal AI Hackathon 2026 - Perfusion3D
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CompleteAnalysisResponse, PatientData, VesselExplanation } from '../types/clinical';
import type { FieldMeta, FieldSource, PatientReportData, TechnicalReportData } from '../types/wizard';
import type {
  ExtractionResult,
  ReportSlotState,
  ReportType,
} from '../types/extraction';
import { REPORT_TOTALS } from '../types/extraction';
import { FEATURE_SCHEMA, getDefaultPatientData, validateFeatureValue } from '../config/featureSchema';
import { PATIENT_PROFILES, usePatientStore } from './usePatientStore';

// Clean up legacy storage keys on module startup
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('perfusion3d-wizard-session');
    localStorage.removeItem('perfusion3d-wizard-v2');
    sessionStorage.removeItem('perfusion3d-wizard-session');
  } catch (e) {
    // Ignore storage errors on startup
  }
}

interface WizardState {
  // --- Dirty Flag (Task 1.3) ---
  isDirty: boolean;

  // --- Step 1 State ---
  disclaimerAccepted: boolean;
  completedSteps: number[];

  // --- Step 2 Input State ---
  inputs: PatientData;
  fieldMeta: Record<string, FieldMeta>;
  isFormValid: boolean;

  // --- Reports Upload State (Phase 8) ---
  reports: Record<ReportType, ReportSlotState>;

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
  reportsHash: string | null;
  reportsPreparedAt: string | null;
  isGeneratingReports: boolean;
  reportGenerationError: string | null;

  // --- Actions ---
  setDisclaimerAccepted: (accepted: boolean) => void;
  setFieldValue: <K extends keyof PatientData>(key: K, value: PatientData[K]) => void;
  setFieldMeta: (key: string, meta: Partial<FieldMeta>) => void;
  setReportSlotState: (type: ReportType, slotState: Partial<ReportSlotState>) => void;
  applyExtraction: (type: ReportType, result: ExtractionResult) => void;
  removeReport: (type: ReportType) => void;
  validateAllFields: () => boolean;
  applyExtractedValues: (values: Partial<PatientData>, confidences?: Record<string, number>) => void;
  loadSamplePatient: (profileKey?: string) => void;
  predictPatient: () => Promise<boolean>;
  setTechnicalReport: (report: TechnicalReportData | null) => void;
  setPatientReport: (report: PatientReportData | null) => void;
  setReports: (clinician: TechnicalReportData, patient: PatientReportData, hash: string, preparedAt: string) => void;
  setVesselFocus: (focus: string) => void;
  isStepUnlocked: (stepNumber: number) => boolean;
  markStepCompleted: (stepNumber: number) => void;
  reset: () => void;
  resetSession: () => void;
}

export function initializeReportsState(): Record<ReportType, ReportSlotState> {
  return {
    ecg: {
      status: 'idle',
      progress: 0,
      filled: 0,
      total: REPORT_TOTALS.ecg,
      notFound: [],
      skipped: [],
      rejected: [],
      warnings: [],
    },
    echo: {
      status: 'idle',
      progress: 0,
      filled: 0,
      total: REPORT_TOTALS.echo,
      notFound: [],
      skipped: [],
      rejected: [],
      warnings: [],
    },
    lab: {
      status: 'idle',
      progress: 0,
      filled: 0,
      total: REPORT_TOTALS.lab,
      notFound: [],
      skipped: [],
      rejected: [],
      warnings: [],
    },
    ehr: {
      status: 'idle',
      progress: 0,
      filled: 0,
      total: REPORT_TOTALS.ehr,
      notFound: [],
      skipped: [],
      rejected: [],
      warnings: [],
    },
  };
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
      isDirty: false,
      disclaimerAccepted: false,
      completedSteps: [],

      inputs: getDefaultPatientData(),
      fieldMeta: initializeFieldMeta(),
      isFormValid: false,
      reports: initializeReportsState(),

      prediction: null,
      shapResult: null,
      analysisLatencyMs: null,
      isAnalyzing: false,
      analysisError: null,
      activeVesselFocus: 'default',

      technicalReport: null,
      patientReport: null,
      reportsHash: null,
      reportsPreparedAt: null,
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

        // Task 1.6: Recalculate BMI automatically if Weight or Length changes; never produce NaN or Infinity
        if (key === 'Weight' || key === 'Length') {
          const rawH = key === 'Length' ? Number(value) : Number(state.inputs.Length);
          const rawW = key === 'Weight' ? Number(value) : Number(state.inputs.Weight);
          if (rawH > 0 && rawW > 0 && !isNaN(rawH) && !isNaN(rawW)) {
            const h = rawH / 100.0;
            updatedInputs.BMI = Number((rawW / (h * h)).toFixed(2));
          } else {
            updatedInputs.BMI = null as any;
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
            confidence: null,
            fromReport: null,
            evidence: null,
            page: null,
            converted: false,
            derived: false,
            error,
            touched: true,
          },
        };

        set({ isDirty: true, inputs: updatedInputs, fieldMeta: updatedMeta });

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

      setReportSlotState: (type, slotState) => {
        set((state) => ({
          reports: {
            ...state.reports,
            [type]: {
              ...state.reports[type],
              ...slotState,
            },
          },
        }));
      },

      applyExtraction: (type, result) => {
        const state = get();
        const updatedInputs = { ...state.inputs };
        const updatedMeta = { ...state.fieldMeta };
        const defaultInputs = getDefaultPatientData();

        // 1. First remove the previous fields of this report type that are still unedited
        for (const feat of FEATURE_SCHEMA) {
          const k = feat.key;
          const meta = updatedMeta[k];
          if (meta && meta.fromReport === type && meta.source !== 'manual') {
            (updatedInputs as any)[k] = (defaultInputs as any)[k];
            updatedMeta[k] = {
              source: 'manual',
              confidence: null,
              error: null,
              touched: false,
              fromReport: null,
              evidence: null,
              page: null,
              converted: false,
              derived: false,
            };
            usePatientStore.getState().updatePatientField(k as any, (defaultInputs as any)[k]);
          }
        }

        // 2. For every returned field:
        // if form already has a value with source "manual", do NOT overwrite; add key to skipped
        const skipped: string[] = [];
        let appliedCount = 0;

        for (const [key, fieldData] of Object.entries(result.fields)) {
          const feat = FEATURE_SCHEMA.find((f) => f.key === key);
          if (!feat) continue;

          const currentMeta = updatedMeta[key];
          if (currentMeta && currentMeta.source === 'manual' && currentMeta.touched) {
            skipped.push(key);
            continue;
          }

          const val = fieldData.value;
          (updatedInputs as any)[key] = val;
          const err = validateFeatureValue(feat, val);

          updatedMeta[key] = {
            source: fieldData.confidence === 'high' ? 'extracted' : 'unverified',
            confidence: fieldData.confidence,
            fromReport: type,
            evidence: fieldData.evidence,
            page: fieldData.page,
            converted: fieldData.converted,
            derived: fieldData.derived,
            error: err,
            touched: true,
          };
          appliedCount++;

          usePatientStore.getState().updatePatientField(key as any, val as any);
        }

        // 3. Update reports slot
        const updatedReports = {
          ...state.reports,
          [type]: {
            status: 'done' as const,
            progress: 100,
            filled: appliedCount,
            total: REPORT_TOTALS[type],
            notFound: result.not_found || [],
            skipped,
            rejected: (result.rejected || []).map((r) => ({
              key: r.key,
              reason: r.reason,
              found: r.found,
            })),
            warnings: result.warnings || [],
            error: undefined,
            uploadedAt: new Date().toISOString(),
          },
        };

        set({
          isDirty: true,
          inputs: updatedInputs,
          fieldMeta: updatedMeta,
          reports: updatedReports,
        });
      },

      removeReport: (type) => {
        const state = get();
        const updatedInputs = { ...state.inputs };
        const updatedMeta = { ...state.fieldMeta };
        const defaultInputs = getDefaultPatientData();

        for (const feat of FEATURE_SCHEMA) {
          const k = feat.key;
          const meta = updatedMeta[k];
          if (meta && meta.fromReport === type && meta.source !== 'manual') {
            (updatedInputs as any)[k] = (defaultInputs as any)[k];
            updatedMeta[k] = {
              source: 'manual',
              confidence: null,
              error: null,
              touched: false,
              fromReport: null,
              evidence: null,
              page: null,
              converted: false,
              derived: false,
            };
            usePatientStore.getState().updatePatientField(k as any, (defaultInputs as any)[k]);
          }
        }

        const updatedReports = {
          ...state.reports,
          [type]: {
            status: 'idle' as const,
            progress: 0,
            filled: 0,
            total: REPORT_TOTALS[type],
            notFound: [],
            skipped: [],
            rejected: [],
            warnings: [],
            error: undefined,
            uploadedAt: undefined,
          },
        };

        set({
          inputs: updatedInputs,
          fieldMeta: updatedMeta,
          reports: updatedReports,
        });
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
          isDirty: true,
          inputs: data,
          fieldMeta: updatedMeta,
          isFormValid: true,
          reports: initializeReportsState(),
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

      setReports: (clinician, patient, hash, preparedAt) => {
        set({
          technicalReport: clinician,
          patientReport: patient,
          reportsHash: hash,
          reportsPreparedAt: preparedAt,
        });
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

      reset: () => {
        try {
          sessionStorage.removeItem('perfusion3d-wizard-v2');
        } catch (e) {
          // Ignore
        }
        set({
          isDirty: false,
          disclaimerAccepted: false,
          completedSteps: [],
          inputs: getDefaultPatientData(),
          fieldMeta: initializeFieldMeta(),
          isFormValid: false,
          reports: initializeReportsState(),
          prediction: null,
          shapResult: null,
          analysisLatencyMs: null,
          isAnalyzing: false,
          analysisError: null,
          activeVesselFocus: 'default',
          technicalReport: null,
          patientReport: null,
          reportsHash: null,
          reportsPreparedAt: null,
          isGeneratingReports: false,
          reportGenerationError: null,
        });
      },

      resetSession: () => {
        get().reset();
      },
    }),
    {
      name: 'perfusion3d-wizard-v2',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => {
        if (!state.isDirty) {
          return {} as any;
        }
        const sanitizedReports: Record<ReportType, ReportSlotState> = { ...state.reports };
        for (const t of ['ecg', 'echo', 'lab', 'ehr'] as ReportType[]) {
          const r = sanitizedReports[t];
          if (r && (r.status === 'uploading' || r.status === 'reading')) {
            sanitizedReports[t] = {
              ...r,
              status: 'idle',
              progress: 0,
            };
          }
        }

        return {
          isDirty: state.isDirty,
          disclaimerAccepted: state.disclaimerAccepted,
          completedSteps: state.completedSteps,
          inputs: state.inputs,
          fieldMeta: state.fieldMeta,
          reports: sanitizedReports,
          prediction: state.prediction,
          shapResult: state.shapResult,
          technicalReport: state.technicalReport,
          patientReport: state.patientReport,
          reportsHash: state.reportsHash,
          reportsPreparedAt: state.reportsPreparedAt,
        };
      },
    }
  )
);
