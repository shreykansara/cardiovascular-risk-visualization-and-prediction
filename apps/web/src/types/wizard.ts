/**
 * Wizard Navigation, State & Report Type Definitions
 * Perfusion3D: Clinical Risk Assessment & Reporting System
 */

import type { CompleteAnalysisResponse, PatientData } from './clinical';

export type WizardStepId = 'welcome' | 'enter-data' | 'results' | 'reports';

export interface StepDefinition {
  step: number;
  id: WizardStepId;
  path: string;
  label: string;
}

export const WIZARD_STEPS: StepDefinition[] = [
  {
    step: 1,
    id: 'welcome',
    path: '/welcome',
    label: 'Welcome',
  },
  {
    step: 2,
    id: 'enter-data',
    path: '/enter-data',
    label: 'Clinical data',
  },
  {
    step: 3,
    id: 'results',
    path: '/results',
    label: 'Results',
  },
  {
    step: 4,
    id: 'reports',
    path: '/reports',
    label: 'Reports',
  },
];

export type FieldSource = 'manual' | 'extracted' | 'unverified';

export interface FieldMeta {
  source: FieldSource;
  confidence?: number | null;
  error?: string | null;
  touched?: boolean;
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
      model_classification?: string;
      risk_band?: 'Low' | 'Moderate' | 'High';
      predicted_status?: string;
      probability_pct: number;
      category?: 'Low' | 'Moderate' | 'High';
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
  methodological_notes: string[];
  disclaimer: string;
  source?: string;
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
  source?: string;
}
