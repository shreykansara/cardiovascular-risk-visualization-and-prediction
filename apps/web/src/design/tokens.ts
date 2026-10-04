/**
 * Perfusion3D Typed Design Tokens (Task C2)
 * Runtime constants matching CSS tokens for programmatic usage.
 */

export const colors = {
  bg: {
    base: '#0b0f17',
  },
  surface: {
    base: '#131a26',
    raised: '#1c2637',
  },
  border: {
    subtle: '#283548',
    strong: '#384961',
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    muted: '#64748b',
  },
  accent: {
    blue: '#2563eb',
    blueHover: '#1d4ed8',
    blueSubtle: 'rgba(37, 99, 235, 0.12)',
    blueBorder: 'rgba(37, 99, 235, 0.35)',
  },
  risk: {
    low: {
      color: '#16a34a',
      bg: 'rgba(22, 163, 74, 0.12)',
      border: 'rgba(22, 163, 74, 0.35)',
      text: '#4ade80',
    },
    moderate: {
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.12)',
      border: 'rgba(217, 119, 6, 0.35)',
      text: '#fbbf24',
    },
    high: {
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      border: 'rgba(220, 38, 38, 0.35)',
      text: '#f87171',
    },
  },
} as const;

export const typography = {
  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Roboto Mono', monospace",
  },
  sizes: {
    xs: { size: '11px', lineHeight: '16px' },
    sm: { size: '13px', lineHeight: '18px' },
    base: { size: '14px', lineHeight: '20px' },
    md: { size: '16px', lineHeight: '24px' },
    lg: { size: '18px', lineHeight: '26px' },
    xl: { size: '20px', lineHeight: '28px' },
    '2xl': { size: '24px', lineHeight: '32px' },
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
} as const;

export const radii = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
} as const;

export const transitions = {
  fast: '150ms ease-in-out',
} as const;
