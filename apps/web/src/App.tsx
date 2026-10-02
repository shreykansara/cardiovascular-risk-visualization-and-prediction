/**
 * AuraCor CAD-3D Root Application Component
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useEffect, useState } from 'react';
import { HeaderBar } from './components/common/HeaderBar';
import { DisclaimerModal } from './components/common/DisclaimerModal';
import { HeartCanvas } from './components/3d/HeartCanvas';
import { RiskOverview } from './components/dashboard/RiskOverview';
import { ShapWaterfall } from './components/dashboard/ShapWaterfall';
import { PatientForm } from './components/dashboard/PatientForm';
import { usePatientStore } from './store/usePatientStore';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const { runAnalysis, analysis, offlineMode } = usePatientStore();

  useEffect(() => {
    // Initial inference call on mount
    runAnalysis();
  }, [runAnalysis]);

  return (
    <div className="flex flex-col h-screen w-screen bg-surface-0 text-slate-100 overflow-hidden select-none font-sans">
      {/* Mandatory Clinical Safety Disclaimer Overlay */}
      <DisclaimerModal />

      {/* Global Telemetry Header Bar */}
      <HeaderBar
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      {/* Main Studio Viewport & Diagnostic Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* 3D Anatomical Digital Twin Viewport (60% on desktop) */}
        <section className="flex-1 relative h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-surface-0">
          <HeartCanvas />

          {/* Floating Clinical Summary Badge at bottom-left of 3D Canvas */}
          {analysis?.predictions && (
            <div className="absolute bottom-16 left-4 max-w-md hidden md:block z-10">
              <div className="glass-panel p-3.5 rounded-xl border border-slate-700/60 shadow-xl text-xs">
                <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[10px] font-bold uppercase mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Clinical Synthesis</span>
                </div>
                <p className="text-slate-300 leading-snug font-sans text-xs">
                  {analysis.predictions.clinical_summary}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Clinical Diagnostic Dashboard & XAI Panel (40% on desktop) */}
        <section className="w-full lg:w-[480px] xl:w-[540px] flex flex-col h-[50vh] lg:h-full bg-surface-1/50 overflow-y-auto">
          {/* Top: 4-Head Vessel Stenosis Matrix */}
          <div className="border-b border-slate-800/80 bg-surface-1/70 backdrop-blur-md">
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Diagnostic Stenosis Matrix
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Calibrated Posterior Probabilities
              </span>
            </div>
            <RiskOverview />
          </div>

          {/* Bottom: TreeSHAP Local Attributions */}
          <div className="flex-1 p-3 md:p-4 min-h-[360px]">
            <ShapWaterfall />
          </div>
        </section>

        {/* Collapsible Physiological Parameter Drawer */}
        <PatientForm
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      </main>
    </div>
  );
};

export default App;
