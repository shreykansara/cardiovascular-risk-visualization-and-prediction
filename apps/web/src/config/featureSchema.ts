/**
 * Clinical Feature Schema & Reference Range Catalog
 * Built strictly from the 55 input features expected by the trained inference engine.
 * Leakage targets (LAD, LCX, RCA, Cath, CAD) are strictly excluded.
 */

import type { PatientData } from '../types/clinical';

export type FeatureSection =
  | 'Demographics'
  | 'Clinical Examination'
  | 'ECG'
  | 'Laboratory'
  | 'Echocardiography';

export const FEATURE_SECTIONS: FeatureSection[] = [
  'Demographics',
  'Clinical Examination',
  'ECG',
  'Laboratory',
  'Echocardiography',
];

export type InputWidgetType = 'number' | 'select' | 'toggle';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface FeatureDefinition {
  key: keyof PatientData;
  label: string;
  unit: string;
  section: FeatureSection;
  type: InputWidgetType;
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  refLow?: number;
  refHigh?: number;
  refDisplay: string;
  options?: SelectOption[];
  tooltip?: string;
  defaultValue: any;
}

export const FEATURE_SCHEMA: FeatureDefinition[] = [
  // =========================================================================
  // 1. DEMOGRAPHICS & ANTHROPOMETRICS (5 features)
  // =========================================================================
  {
    key: 'Age',
    label: 'Patient Age',
    unit: 'years',
    section: 'Demographics',
    type: 'number',
    required: true,
    min: 18,
    max: 110,
    step: 1,
    refLow: 18,
    refHigh: 75,
    refDisplay: '18 – 75 yrs',
    tooltip: 'Chronological age in completed years',
    defaultValue: 58,
  },
  {
    key: 'Sex',
    label: 'Biological Sex',
    unit: '',
    section: 'Demographics',
    type: 'toggle',
    required: true,
    refDisplay: 'Male / Female',
    options: [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' },
    ],
    defaultValue: 'Male',
  },
  {
    key: 'Weight',
    label: 'Body Weight',
    unit: 'kg',
    section: 'Demographics',
    type: 'number',
    required: true,
    min: 30,
    max: 250,
    step: 0.5,
    refLow: 50,
    refHigh: 90,
    refDisplay: '50 – 90 kg',
    tooltip: 'Measured naked/lightly clothed weight',
    defaultValue: 74,
  },
  {
    key: 'Length',
    label: 'Height / Length',
    unit: 'cm',
    section: 'Demographics',
    type: 'number',
    required: true,
    min: 100,
    max: 240,
    step: 0.5,
    refLow: 150,
    refHigh: 190,
    refDisplay: '150 – 190 cm',
    tooltip: 'Standing stadiometer height in centimeters',
    defaultValue: 165,
  },
  {
    key: 'BMI',
    label: 'Body Mass Index',
    unit: 'kg/m²',
    section: 'Demographics',
    type: 'number',
    required: true,
    min: 12,
    max: 65,
    step: 0.01,
    refLow: 18.5,
    refHigh: 24.9,
    refDisplay: '18.5 – 24.9 kg/m²',
    tooltip: 'Calculated as Weight (kg) / [Height (m)]²',
    defaultValue: 27.18,
  },

  // =========================================================================
  // 2. CLINICAL EXAMINATION & MEDICAL HISTORY (26 features)
  // =========================================================================
  {
    key: 'BP',
    label: 'Systolic Blood Pressure',
    unit: 'mmHg',
    section: 'Clinical Examination',
    type: 'number',
    required: true,
    min: 50,
    max: 260,
    step: 1,
    refLow: 90,
    refHigh: 120,
    refDisplay: '90 – 120 mmHg',
    tooltip: 'Resting seated brachial systolic pressure',
    defaultValue: 130,
  },
  {
    key: 'PR',
    label: 'Resting Pulse Rate',
    unit: 'bpm',
    section: 'Clinical Examination',
    type: 'number',
    required: true,
    min: 35,
    max: 220,
    step: 1,
    refLow: 60,
    refHigh: 100,
    refDisplay: '60 – 100 bpm',
    tooltip: 'Radial or apical resting heart rate',
    defaultValue: 72,
  },
  {
    key: 'DM',
    label: 'Diabetes Mellitus',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ],
    defaultValue: '0',
  },
  {
    key: 'HTN',
    label: 'Hypertension',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ],
    defaultValue: '1',
  },
  {
    key: 'Current Smoker',
    label: 'Current Smoker',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ],
    defaultValue: '0',
  },
  {
    key: 'EX-Smoker',
    label: 'Ex-Smoker',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ],
    defaultValue: '0',
  },
  {
    key: 'FH',
    label: 'Family History of CAD',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ],
    defaultValue: '0',
  },
  {
    key: 'Obesity',
    label: 'Clinical Obesity',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'CRF',
    label: 'Chronic Renal Failure',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'CVA',
    label: 'Cerebrovascular Accident',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Airway disease',
    label: 'Airway / Lung Disease',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Thyroid Disease',
    label: 'Thyroid Dysfunction',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'CHF',
    label: 'Congestive Heart Failure',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'DLP',
    label: 'Dyslipidemia',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Edema',
    label: 'Peripheral Edema',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ],
    defaultValue: '0',
  },
  {
    key: 'Weak Peripheral Pulse',
    label: 'Weak Peripheral Pulse',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Lung rales',
    label: 'Pulmonary Rales',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Systolic Murmur',
    label: 'Systolic Murmur',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Diastolic Murmur',
    label: 'Diastolic Murmur',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Typical Chest Pain',
    label: 'Typical Chest Pain',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ],
    defaultValue: '0',
  },
  {
    key: 'Dyspnea',
    label: 'Exertional Dyspnea',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Function Class',
    label: 'NYHA Functional Class',
    unit: 'class',
    section: 'Clinical Examination',
    type: 'select',
    required: true,
    refDisplay: 'Class 0',
    options: [
      { value: '0', label: 'Class 0: None / Asymptomatic' },
      { value: '1', label: 'Class I: Mild limitation with vigorous activity' },
      { value: '2', label: 'Class II: Moderate limitation with ordinary activity' },
      { value: '3', label: 'Class III: Severe limitation with minimal activity' },
    ],
    defaultValue: '0',
  },
  {
    key: 'Atypical',
    label: 'Atypical Angina',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Nonanginal',
    label: 'Non-Anginal Chest Pain',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Exertional CP',
    label: 'Exertional Chest Pain',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'LowTH Ang',
    label: 'Low-Threshold Angina',
    unit: '',
    section: 'Clinical Examination',
    type: 'toggle',
    required: true,
    refDisplay: 'No',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },

  // =========================================================================
  // 3. ELECTROCARDIOGRAM (ECG) FINDINGS (7 features)
  // =========================================================================
  {
    key: 'Q Wave',
    label: 'Pathologic Q-Wave',
    unit: '',
    section: 'ECG',
    type: 'toggle',
    required: true,
    refDisplay: 'Absent',
    options: [
      { value: '0', label: 'Absent' },
      { value: '1', label: 'Present' },
    ],
    defaultValue: '0',
  },
  {
    key: 'St Elevation',
    label: 'ST-Segment Elevation',
    unit: '',
    section: 'ECG',
    type: 'toggle',
    required: true,
    refDisplay: 'Absent',
    options: [
      { value: '0', label: 'Absent' },
      { value: '1', label: 'Present' },
    ],
    defaultValue: '0',
  },
  {
    key: 'St Depression',
    label: 'ST-Segment Depression',
    unit: '',
    section: 'ECG',
    type: 'toggle',
    required: true,
    refDisplay: 'Absent',
    options: [
      { value: '0', label: 'Absent' },
      { value: '1', label: 'Present' },
    ],
    defaultValue: '0',
  },
  {
    key: 'Tinversion',
    label: 'T-Wave Inversion',
    unit: '',
    section: 'ECG',
    type: 'toggle',
    required: true,
    refDisplay: 'Absent',
    options: [
      { value: '0', label: 'Absent' },
      { value: '1', label: 'Present' },
    ],
    defaultValue: '0',
  },
  {
    key: 'LVH',
    label: 'Left Ventricular Hypertrophy',
    unit: '',
    section: 'ECG',
    type: 'toggle',
    required: true,
    refDisplay: 'Absent',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'Poor R Progression',
    label: 'Poor R-Wave Progression',
    unit: '',
    section: 'ECG',
    type: 'toggle',
    required: true,
    refDisplay: 'Normal',
    options: [
      { value: 'N', label: 'No' },
      { value: 'Y', label: 'Yes' },
    ],
    defaultValue: 'N',
  },
  {
    key: 'BBB',
    label: 'Bundle Branch Block',
    unit: '',
    section: 'ECG',
    type: 'select',
    required: true,
    refDisplay: 'None',
    options: [
      { value: 'N', label: 'None' },
      { value: 'LBBB', label: 'Left Bundle Branch Block (LBBB)' },
      { value: 'RBBB', label: 'Right Bundle Branch Block (RBBB)' },
    ],
    defaultValue: 'N',
  },

  // =========================================================================
  // 4. LABORATORY BLOOD BIOMARKERS (14 features)
  // =========================================================================
  {
    key: 'FBS',
    label: 'Fasting Blood Sugar',
    unit: 'mg/dL',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 40,
    max: 600,
    step: 1,
    refLow: 70,
    refHigh: 99,
    refDisplay: '70 – 99 mg/dL',
    tooltip: 'Serum fasting glucose level',
    defaultValue: 98,
  },
  {
    key: 'CR',
    label: 'Serum Creatinine',
    unit: 'mg/dL',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 0.1,
    max: 15.0,
    step: 0.1,
    refLow: 0.6,
    refHigh: 1.2,
    refDisplay: '0.6 – 1.2 mg/dL',
    tooltip: 'Serum creatinine marker for renal clearance',
    defaultValue: 1.0,
  },
  {
    key: 'TG',
    label: 'Triglycerides',
    unit: 'mg/dL',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 20,
    max: 2000,
    step: 1,
    refLow: 50,
    refHigh: 150,
    refDisplay: '50 – 150 mg/dL',
    tooltip: 'Serum triglycerides',
    defaultValue: 122,
  },
  {
    key: 'LDL',
    label: 'Low-Density Lipoprotein (LDL)',
    unit: 'mg/dL',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 10,
    max: 500,
    step: 1,
    refLow: 50,
    refHigh: 100,
    refDisplay: '50 – 100 mg/dL',
    tooltip: 'Atherogenic low-density lipoprotein cholesterol',
    defaultValue: 100,
  },
  {
    key: 'HDL',
    label: 'High-Density Lipoprotein (HDL)',
    unit: 'mg/dL',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 5,
    max: 180,
    step: 1,
    refLow: 40,
    refHigh: 60,
    refDisplay: '40 – 60 mg/dL',
    tooltip: 'Cardioprotective high-density lipoprotein cholesterol',
    defaultValue: 39,
  },
  {
    key: 'BUN',
    label: 'Blood Urea Nitrogen',
    unit: 'mg/dL',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 2,
    max: 150,
    step: 1,
    refLow: 7,
    refHigh: 20,
    refDisplay: '7 – 20 mg/dL',
    tooltip: 'Serum urea nitrogen index',
    defaultValue: 16,
  },
  {
    key: 'ESR',
    label: 'Erythrocyte Sedimentation Rate',
    unit: 'mm/hr',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 1,
    max: 150,
    step: 1,
    refLow: 0,
    refHigh: 20,
    refDisplay: '0 – 20 mm/hr',
    tooltip: 'Non-specific systemic inflammation marker',
    defaultValue: 15,
  },
  {
    key: 'HB',
    label: 'Hemoglobin',
    unit: 'g/dL',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 5.0,
    max: 25.0,
    step: 0.1,
    refLow: 12.0,
    refHigh: 17.5,
    refDisplay: '12.0 – 17.5 g/dL',
    tooltip: 'Whole blood hemoglobin concentration',
    defaultValue: 13.2,
  },
  {
    key: 'K',
    label: 'Serum Potassium',
    unit: 'mEq/L',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 1.5,
    max: 9.0,
    step: 0.1,
    refLow: 3.5,
    refHigh: 5.0,
    refDisplay: '3.5 – 5.0 mEq/L',
    tooltip: 'Electrolyte potassium concentration',
    defaultValue: 4.2,
  },
  {
    key: 'Na',
    label: 'Serum Sodium',
    unit: 'mEq/L',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 100,
    max: 180,
    step: 1,
    refLow: 135,
    refHigh: 145,
    refDisplay: '135 – 145 mEq/L',
    tooltip: 'Electrolyte sodium concentration',
    defaultValue: 141,
  },
  {
    key: 'WBC',
    label: 'White Blood Cell Count',
    unit: '/mcL',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 1000,
    max: 50000,
    step: 100,
    refLow: 4000,
    refHigh: 11000,
    refDisplay: '4,000 – 11,000 /mcL',
    tooltip: 'Total leukocyte count',
    defaultValue: 7100,
  },
  {
    key: 'Lymph',
    label: 'Lymphocyte Percentage',
    unit: '%',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 1,
    max: 90,
    step: 1,
    refLow: 20,
    refHigh: 40,
    refDisplay: '20 – 40 %',
    tooltip: 'Lymphocyte leukocyte fraction',
    defaultValue: 32,
  },
  {
    key: 'Neut',
    label: 'Neutrophil Percentage',
    unit: '%',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 5,
    max: 95,
    step: 1,
    refLow: 40,
    refHigh: 70,
    refDisplay: '40 – 70 %',
    tooltip: 'Neutrophil granulocyte fraction',
    defaultValue: 60,
  },
  {
    key: 'PLT',
    label: 'Platelet Count',
    unit: 'x10³/mcL',
    section: 'Laboratory',
    type: 'number',
    required: true,
    min: 10,
    max: 1500,
    step: 5,
    refLow: 150,
    refHigh: 450,
    refDisplay: '150 – 450 x10³/mcL',
    tooltip: 'Circulating thrombocyte count',
    defaultValue: 210,
  },

  // =========================================================================
  // 5. ECHOCARDIOGRAPHY (3 features)
  // =========================================================================
  {
    key: 'EF-TTE',
    label: 'Ejection Fraction (TTE)',
    unit: '%',
    section: 'Echocardiography',
    type: 'number',
    required: true,
    min: 10,
    max: 85,
    step: 1,
    refLow: 55,
    refHigh: 70,
    refDisplay: '55 – 70 %',
    tooltip: 'Transthoracic echocardiographic left ventricular ejection fraction',
    defaultValue: 50,
  },
  {
    key: 'Region RWMA',
    label: 'Regional Wall Motion Abnormality',
    unit: 'score',
    section: 'Echocardiography',
    type: 'select',
    required: true,
    refDisplay: 'None (0)',
    options: [
      { value: '0', label: '0: None / Normal wall motion' },
      { value: '1', label: '1: Anterior Wall RWMA (LAD territory)' },
      { value: '2', label: '2: Inferior Wall RWMA (RCA territory)' },
      { value: '3', label: '3: Lateral Wall RWMA (LCX territory)' },
      { value: '4', label: '4: Septal / Multiple Wall RWMA' },
    ],
    defaultValue: '0',
  },
  {
    key: 'VHD',
    label: 'Valvular Heart Disease',
    unit: 'grade',
    section: 'Echocardiography',
    type: 'select',
    required: true,
    refDisplay: 'None',
    options: [
      { value: 'N', label: 'None (Normal)' },
      { value: 'mild', label: 'Mild valvulopathy' },
      { value: 'Moderate', label: 'Moderate valvulopathy' },
      { value: 'Severe', label: 'Severe valvulopathy' },
    ],
    defaultValue: 'N',
  },
];

/**
 * Returns default PatientData populated from the schema defaults.
 */
export function getDefaultPatientData(): PatientData {
  const data: any = { patient_id: 'PT-NEW-01' };
  for (const f of FEATURE_SCHEMA) {
    data[f.key] = f.defaultValue;
  }
  return data as PatientData;
}

/**
 * Evaluates whether a numeric value is within the standard physiological reference range.
 * Returns true if within, false if outside, or null if non-numeric/no range.
 */
export function isWithinReferenceRange(feature: FeatureDefinition, value: any): boolean | null {
  if (feature.refLow === undefined && feature.refHigh === undefined) {
    // For categorical/binary features, compare against default expected normal
    if (feature.key === 'Sex') return true;
    if (feature.refDisplay === 'No' || feature.refDisplay === 'Absent' || feature.refDisplay === 'None') {
      const s = String(value);
      return s === '0' || s === 'N';
    }
    return true;
  }
  const n = Number(value);
  if (isNaN(n)) return null;
  if (feature.refLow !== undefined && n < feature.refLow) return false;
  if (feature.refHigh !== undefined && n > feature.refHigh) return false;
  return true;
}

/**
 * Validates a single feature value against type, min/max limits, and requiredness.
 * Returns an error string if invalid, or null if valid.
 */
export function validateFeatureValue(feature: FeatureDefinition, value: any): string | null {
  if (feature.required && (value === undefined || value === null || value === '')) {
    return `${feature.label} is required.`;
  }
  if (feature.type === 'number') {
    const n = Number(value);
    if (isNaN(n)) {
      return `Must be a valid number.`;
    }
    if (feature.min !== undefined && n < feature.min) {
      return `Value cannot be less than ${feature.min} ${feature.unit}.`;
    }
    if (feature.max !== undefined && n > feature.max) {
      return `Value cannot exceed ${feature.max} ${feature.unit}.`;
    }
  }
  return null;
}
