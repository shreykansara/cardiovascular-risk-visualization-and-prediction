/**
 * Clinical Risk Bands & Thresholds Configuration (Task A2)
 *
 * Grounded in existing engine thresholds:
 * - Low: <= 40% (0.0 to 0.40)
 * - Moderate: 41% - 70% (0.401 to 0.70)
 * - High: > 70% (0.701 to 1.0)
 *
 * Words strictly standardized to: "low" | "moderate" | "high"
 */

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface RiskBand {
  level: RiskLevel;
  label: string; // 'Low' | 'Moderate' | 'High'
  minProb: number;
  maxProb: number;
  rangeDisplay: string;
  colorHex: string;
  colorRgb: [number, number, number];
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
}

export const RISK_BANDS: Record<RiskLevel, RiskBand> = {
  low: {
    level: 'low',
    label: 'Low',
    minProb: 0.0,
    maxProb: 0.40,
    rangeDisplay: '≤ 40%',
    colorHex: '#2F7D5B',
    colorRgb: [0.184, 0.490, 0.357],
    badgeBg: 'rgba(47, 125, 91, 0.1)',
    badgeBorder: 'rgba(47, 125, 91, 0.3)',
    badgeText: '#2F7D5B',
    description: 'Low probability of hemodynamically significant stenosis',
  },
  moderate: {
    level: 'moderate',
    label: 'Moderate',
    minProb: 0.40,
    maxProb: 0.70,
    rangeDisplay: '41% – 70%',
    colorHex: '#B7791F',
    colorRgb: [0.718, 0.475, 0.122],
    badgeBg: 'rgba(183, 121, 31, 0.1)',
    badgeBorder: 'rgba(183, 121, 31, 0.3)',
    badgeText: '#B7791F',
    description: 'Moderate probability of stenosis; clinical review suggested',
  },
  high: {
    level: 'high',
    label: 'High',
    minProb: 0.70,
    maxProb: 1.0,
    rangeDisplay: '> 70%',
    colorHex: '#B83232',
    colorRgb: [0.722, 0.196, 0.196],
    badgeBg: 'rgba(184, 50, 50, 0.1)',
    badgeBorder: 'rgba(184, 50, 50, 0.3)',
    badgeText: '#B83232',
    description: 'High probability of significant stenosis',
  },
};

export const RISK_LEVELS: RiskLevel[] = ['low', 'moderate', 'high'];

export function getRiskLevel(prob: number): RiskLevel {
  const p = Math.max(0.0, Math.min(1.0, prob));
  if (p <= 0.40) return 'low';
  if (p <= 0.70) return 'moderate';
  return 'high';
}

export function getRiskBand(prob: number): RiskBand {
  return RISK_BANDS[getRiskLevel(prob)];
}

export function getRiskLabel(prob: number): string {
  return getRiskBand(prob).label;
}

export function getRiskColorHex(prob: number): string {
  return getRiskBand(prob).colorHex;
}
