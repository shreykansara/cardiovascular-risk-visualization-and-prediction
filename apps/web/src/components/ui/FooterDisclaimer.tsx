import React from 'react';
import { Link } from 'react-router-dom';

export const MANDATORY_DISCLAIMER =
  'DECISION SUPPORT ONLY: This system is an investigational AI prototype for clinical decision support and research. Predictions and 3D visualizations DO NOT constitute formal medical diagnosis or replace invasive coronary angiography or diagnostic imaging.';

export const FooterDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <footer
      className={`w-full ${className}`}
      style={{
        backgroundColor: 'var(--panel)',
        borderTop: '1px solid var(--bd)',
        padding: '8px 16px',
        fontFamily: 'var(--fs)',
        fontSize: '11px',
        color: 'var(--mut)',
        lineHeight: '1.4',
        textAlign: 'center',
        marginTop: 'auto',
      }}
    >
      <div className="max-w-[1200px] mx-auto">
        <span>{MANDATORY_DISCLAIMER}</span>{' '}
        <Link
          to="/model-info"
          style={{
            color: 'var(--acc)',
            textDecoration: 'underline',
          }}
        >
          Model information
        </Link>
      </div>
    </footer>
  );
};
