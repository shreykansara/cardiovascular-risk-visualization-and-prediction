/**
 * Single source of truth for clinical risk bands
 * Standardized to: "Low" | "Moderate" | "High"
 * Mapped directly to ECG Paper tokens: --low, --mod, --high
 */

export type RiskLevel = 'Low' | 'Moderate' | 'High';
export type RiskBand = RiskLevel;

export interface RiskBandConfig {
  label: RiskLevel;
  minProb: number;
  maxProb: number;
  rangeDisplay: string;
  tokenColor: string;
}

export const RISK_BANDS: Record<RiskLevel, RiskBandConfig> = {
  Low: {
    label: 'Low',
    minProb: 0.0,
    maxProb: 0.40,
    rangeDisplay: 'under 40%',
    tokenColor: 'var(--low)',
  },
  Moderate: {
    label: 'Moderate',
    minProb: 0.40,
    maxProb: 0.70,
    rangeDisplay: '40 to 70%',
    tokenColor: 'var(--mod)',
  },
  High: {
    label: 'High',
    minProb: 0.70,
    maxProb: 1.0,
    rangeDisplay: 'over 70%',
    tokenColor: 'var(--high)',
  },
};

export function riskLabel(probability: number): RiskLevel {
  const p = Math.max(0.0, Math.min(1.0, probability));
  if (p < 0.40) return 'Low';
  if (p <= 0.70) return 'Moderate';
  return 'High';
}

export function getRiskBand(probability: number): RiskBandConfig {
  return RISK_BANDS[riskLabel(probability)];
}

export const getRiskLabel = riskLabel;
export const getRiskLevel = (prob: number) => riskLabel(prob).toLowerCase();
export const getRiskColorToken = (prob: number) => {
  const l = riskLabel(prob);
  if (l === 'Low') return 'var(--low)';
  if (l === 'Moderate') return 'var(--mod)';
  return 'var(--high)';
};
export const getRiskColorHex = getRiskColorToken;
