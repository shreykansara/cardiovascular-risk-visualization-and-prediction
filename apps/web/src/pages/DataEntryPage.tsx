/**
 * Step 2: Clinical Data Entry / Review Page (Stub for Phase 1 router initialization)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';

export const DataEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const { disclaimerAccepted } = useWizardStore();

  React.useEffect(() => {
    if (!disclaimerAccepted) {
      navigate('/welcome', { replace: true });
    }
  }, [disclaimerAccepted, navigate]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="glass-card p-6 rounded-2xl border border-white/[0.08]">
        <h2 className="text-xl font-bold text-white">Step 2: Clinical Data Entry</h2>
        <p className="text-sm text-slate-400 mt-1">
          Review and enter patient physiological parameters.
        </p>
      </div>
    </div>
  );
};

export default DataEntryPage;
