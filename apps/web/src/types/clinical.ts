/**
 * Clinical Type Definitions & Data Contracts
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 * Synchronized with FastAPI Pydantic v2 schemas in apps/api/app/schemas/
 */

export type RiskTier = 'LOW' | 'BORDERLINE' | 'HIGH' | 'CRITICAL';
export type TargetVessel = 'CAD' | 'LAD' | 'LCX' | 'RCA';
export type ImpactDirection = 'INCREASES_RISK' | 'DECREASES_RISK';

export interface PatientData {
  patient_id?: string;
  Age: number;
  Weight: number;
  Length: number;
  Sex: 'Male' | 'Female';
  BMI: number;
  DM: string;
  HTN: string;
  'Current Smoker': string;
  'EX-Smoker': string;
  FH: string;
  Obesity: 'Y' | 'N';
  CRF: 'Y' | 'N';
  CVA: 'Y' | 'N';
  'Airway disease': 'Y' | 'N';
  'Thyroid Disease': 'Y' | 'N';
  CHF: 'Y' | 'N';
  DLP: 'Y' | 'N';
  BP: number;
  PR: number;
  Edema: string;
  'Weak Peripheral Pulse': 'Y' | 'N';
  'Lung rales': 'Y' | 'N';
  'Systolic Murmur': 'Y' | 'N';
  'Diastolic Murmur': 'Y' | 'N';
  'Typical Chest Pain': string;
  Dyspnea: 'Y' | 'N';
  'Function Class': string;
  Atypical: 'Y' | 'N';
  Nonanginal: 'Y' | 'N';
  'Exertional CP': 'Y' | 'N';
  'LowTH Ang': 'Y' | 'N';
  'Q Wave': string;
  'St Elevation': string;
  'St Depression': string;
  Tinversion: string;
  LVH: 'Y' | 'N';
  'Poor R Progression': 'Y' | 'N';
  BBB: 'N' | 'LBBB' | 'RBBB';
  FBS: number;
  CR: number;
  TG: number;
  LDL: number;
  HDL: number;
  BUN: number;
  ESR: number;
  HB: number;
  K: number;
  Na: number;
  WBC: number;
  Lymph: number;
  Neut: number;
  PLT: number;
  'EF-TTE': number;
  'Region RWMA': string;
  VHD: 'N' | 'mild' | 'Moderate' | 'Severe';
}

export interface TargetPrediction {
  target: TargetVessel;
  display_name: string;
  probability: number;
  binary_class: number;
  stenosis_suspected: bool;
  risk_tier: RiskTier;
  optimal_threshold: number;
  color_hex: string;
  color_rgb: [number, number, number];
  emissive_pulse: bool;
}

export interface PredictionResponse {
  patient_id?: string;
  timestamp: string;
  overall_cad: TargetPrediction;
  vessels: {
    lad: TargetPrediction;
    lcx: TargetPrediction;
    rca: TargetPrediction;
  };
  high_risk_vessels: string[];
  clinical_summary: string;
  disclaimer: string;
}

export interface FeatureAttribution {
  feature_name: string;
  clinical_label: string;
  feature_value: string;
  shap_value: number;
  impact: ImpactDirection;
  absolute_importance: number;
}

export interface VesselExplanation {
  target: TargetVessel;
  display_name: string;
  base_value: number;
  predicted_probability: number;
  top_features: FeatureAttribution[];
}

export interface CompleteAnalysisResponse {
  patient_id?: string;
  timestamp: string;
  predictions: PredictionResponse;
  explanations: Record<string, VesselExplanation>;
  latency_ms: number;
  disclaimer: string;
}

export type PatientProfileKey = 'normal' | 'high_risk_lad' | 'triple_vessel';
