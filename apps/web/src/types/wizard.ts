/**
 * Wizard Navigation, State & Report Type Definitions
 * Perfusion3D: Clinical Digital Twin & Reporting System
 */

import type { CompleteAnalysisResponse, PatientData } from './clinical';

export type WizardStepId = 'welcome' | 'enter-data' | 'results' | 'reports';

export interface StepDefinition {
  step: number;
  id: WizardStepId;
  path: string;
  label: string;
  shortDescription: string;
}

export const WIZARD_STEPS: StepDefinition[] = [
  {
    step: 1,
    id: 'welcome',
    path: '/welcome',
    label: 'Welcome & Disclaimer',
    shortDescription: 'Safety & System Overview',
  },
  {
    step: 2,
    id: 'enter-data',
    path: '/enter-data',
    label: 'Clinical Data Entry',
    shortDescription: 'Parameters & Verification',
  },
  {
    step: 3,
    id: 'results',
    path: '/results',
    label: 'Results & Visual Twin',
    shortDescription: '3D Hemodynamics & SHAP',
  },
  {
    step: 4,
    id: 'reports',
    path: '/reports',
    label: 'Clinical Reports',
    shortDescription: 'Technical & Patient Reports',
  },
];

export type FieldSource = 'manual' | 'extracted' | 'unverified';

export interface FieldMeta {
  source: FieldSource;
  confidence?: number | null;
  error?: string | null;
  touched?: boolean;
}

export interface GeneratedReportSection {
  title: string;
  content?: string;
  table?: Record<string, any>[];
  items?: string[];
  raw?: any;
}

export interface TechnicalReportData {
  report_header: {
    report_title: string;
    generation_date_time: string;
    model_version: string;
    patient_age: number;
    patient_sex: string;
  };
  model_output_summary: {
    targets: Array<{
      target: string;
      display_name: string;
      predicted_status: string;
      probability_pct: number;
      category: 'Low' | 'Moderate' | 'High';
    }>;
  };
  input_parameters: {
    groups: Array<{
      group_name: string;
      parameters: Array<{
        name: string;
        value: string | number;
        unit: string;
        reference_range: string;
        within_range: boolean;
      }>;
    }>;
  };
  parameters_outside_reference_range: string[];
  model_attribution: {
    targets: Array<{
      target: string;
      top_features: Array<{
        feature: string;
        shap_value: number;
        input_value?: string | number;
        patient_value?: string | number;
        direction: 'INCREASES_RISK' | 'DECREASES_RISK';
      }>;
    }>;
  };
  model_performance: {
    metrics: Array<{
      target: string;
      accuracy?: number;
      precision?: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
    }>;
    split_notes: string;
  };
  methodological_notes: string[];
  disclaimer: string;
}

export interface PatientReportData {
  title_and_date: {
    title: string;
    generation_date: string;
  };
  what_this_summary_is: string;
  overall_picture: string;
  your_three_main_heart_arteries: {
    lad: { name?: string; description: string; probability_pct: number; category: string };
    lcx: { name?: string; description: string; probability_pct: number; category: string };
    rca: { name?: string; description: string; probability_pct: number; category: string };
  };
  your_measurements: {
    groups: Array<{
      category_name: string;
      items: Array<{
        plain_name: string;
        your_value: string;
        typical_range: string;
        status: 'Within range' | 'Above typical range' | 'Below typical range';
      }>;
    }>;
  };
  what_influenced_the_prediction_most: string[];
  about_this_estimate: string;
  disclaimer: string;
}
