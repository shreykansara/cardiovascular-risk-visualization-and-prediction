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
        // AuraCor Surface Elevation System
        surface: {
          0: '#05070B', // Deep Obsidian Canvas Void
          1: '#0A0F1A', // Slate Obsidian Panels
          2: '#131C2E', // Deep Navy Cards
          3: '#1E293B', // Polished Obsidian Modals
        },
        // Clinical Risk Semantic Palette
        risk: {
          optimal: '#10B981',   // Normal / Unobstructed (Emerald)
          warning: '#F59E0B',   // Borderline / Moderate Stenosis (Amber)
          critical: '#EF4444',  // Critical Stenosis / Ischemia (Crimson)
        },
        // Telemetry & Diagnostic Accents
        telemetry: {
          cyan: '#06B6D4',
          blue: '#3B82F6',
          purple: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Roboto Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-optimal': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
        'glow-warning': '0 0 20px -5px rgba(245, 158, 11, 0.4)',
        'glow-critical': '0 0 25px -5px rgba(239, 68, 68, 0.5)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.4)',
        'glass-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
