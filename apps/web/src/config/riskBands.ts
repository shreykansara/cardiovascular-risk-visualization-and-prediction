/**
 * Single source of truth for clinical risk bands (Task 2.7)
 * Strictly standardized to: "Low" | "Moderate" | "High"
 */

export type RiskLevel = 'Low' | 'Moderate' | 'High';
export type RiskBand = RiskLevel;

export interface RiskBandConfig {
  label: RiskLevel;
  minProb: number;
  maxProb: number;
  rangeDisplay: string;
  tokenColor: string;
  tokenBg: string;
}

export const RISK_BANDS: Record<RiskLevel, RiskBandConfig> = {
  Low: {
    label: 'Low',
    minProb: 0.0,
    maxProb: 0.40,
    rangeDisplay: '≤ 40%',
    tokenColor: 'var(--risk-low)',
    tokenBg: 'var(--risk-low-bg)',
  },
  Moderate: {
    label: 'Moderate',
    minProb: 0.40,
    maxProb: 0.70,
    rangeDisplay: '41% – 70%',
    tokenColor: 'var(--risk-moderate)',
    tokenBg: 'var(--risk-moderate-bg)',
  },
  High: {
    label: 'High',
    minProb: 0.70,
    maxProb: 1.0,
    rangeDisplay: '> 70%',
    tokenColor: 'var(--risk-high)',
    tokenBg: 'var(--risk-high-bg)',
  },
};

export function riskLabel(probability: number): RiskLevel {
  const p = Math.max(0.0, Math.min(1.0, probability));
  if (p <= 0.40) return 'Low';
  if (p <= 0.70) return 'Moderate';
  return 'High';
}

export function getRiskBand(probability: number): RiskBandConfig {
  return RISK_BANDS[riskLabel(probability)];
}

// Backward-compatibility aliases during refactor
export const getRiskLabel = riskLabel;
export const getRiskLevel = (prob: number) => riskLabel(prob).toLowerCase();
export const getRiskColorHex = (prob: number) => {
  const l = riskLabel(prob);
  if (l === 'Low') return 'rgb(46, 125, 79)';
  if (l === 'Moderate') return 'rgb(178, 106, 0)';
  return 'rgb(179, 38, 30)';
};
