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
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--page)',
        gmin: 'var(--gmin)',
        gmaj: 'var(--gmaj)',
        panel: 'var(--panel)',
        ink: 'var(--ink)',
        mut: 'var(--mut)',
        acc: 'var(--acc)',
        onacc: 'var(--onacc)',
        bd: 'var(--bd)',
        bds: 'var(--bds)',
        hov: 'var(--hov)',
        low: 'var(--low)',
        mod: 'var(--mod)',
        high: 'var(--high)',
        sheet: 'var(--sheet)',
        sheetink: 'var(--sheetink)',
        sheetmut: 'var(--sheetmut)',
        sbd: 'var(--sbd)',
      },
      fontFamily: {
        sans: ['var(--fs)'],
        mono: ['var(--fm)'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius)',
        md: 'var(--radius)',
        lg: 'var(--radius)',
      },
    },
  },
  plugins: [],
};
