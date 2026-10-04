import React from 'react';
import { Link } from 'react-router-dom';

export const MANDATORY_DISCLAIMER =
  'DECISION SUPPORT ONLY: This system is an investigational AI prototype for clinical decision support and research. Predictions and 3D visualizations DO NOT constitute formal medical diagnosis or replace invasive coronary angiography or diagnostic imaging.';

export const FooterDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <footer
      className={`w-full bg-panel border-t border-border py-2 px-6 text-center text-[13px] leading-[20px] text-text-muted mt-auto ${className}`}
    >
      <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-2">
        <span>{MANDATORY_DISCLAIMER}</span>
        <span className="text-border-strong">•</span>
        <Link
          to="/model-info"
          className="text-accent hover:text-accent-hover underline font-medium"
        >
          Model information
        </Link>
      </div>
    </footer>
  );
};
