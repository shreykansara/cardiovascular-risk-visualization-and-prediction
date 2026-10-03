/**
 * Step 3: Results & 3D Visualization Page (Stub for Phase 1 router initialization)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isStepUnlocked } = useWizardStore();

  React.useEffect(() => {
    if (!isStepUnlocked(3)) {
      navigate('/enter-data', { replace: true });
    }
  }, [isStepUnlocked, navigate]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="glass-card p-6 rounded-2xl border border-white/[0.08]">
        <h2 className="text-xl font-bold text-white">Step 3: Results & Digital Twin</h2>
        <p className="text-sm text-slate-400 mt-1">
          3D Coronary digital twin visualization and diagnostic telemetry.
        </p>
      </div>
    </div>
  );
};

export default ResultsPage;
