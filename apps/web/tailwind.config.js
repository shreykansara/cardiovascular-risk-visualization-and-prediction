import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.resolve(__dirname, 'index.html'),
    path.resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./apps/web/index.html",
    "./apps/web/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Calm clinical dark color tokens (Task C2)
        'bg-base': '#0b0f17',
        'surface-base': '#131a26',
        'surface-raised': '#1c2637',
        'border-subtle': '#283548',
        'border-strong': '#384961',
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        'accent-blue': '#2563eb',
        'accent-blue-hover': '#1d4ed8',
        'risk-low': '#16a34a',
        'risk-moderate': '#d97706',
        'risk-high': '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace'],
      },
      boxShadow: {
        // Restrained clinical elevation - zero neon glows
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.07)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
      },
    },
  },
  plugins: [],
};
