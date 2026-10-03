/**
 * Perfusion3D Spatial Medical Experience Root
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useEffect, useState } from 'react';
import { HeaderBar } from './components/common/HeaderBar';
import { BottomDock } from './components/common/BottomDock';
import { DisclaimerModal } from './components/common/DisclaimerModal';
import { HeartCanvas } from './components/3d/HeartCanvas';
import { TelemetryBlade } from './components/dashboard/TelemetryBlade';
import { PatientForm } from './components/dashboard/PatientForm';
import { usePatientStore } from './store/usePatientStore';

export const App: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const { runAnalysis } = usePatientStore();

  useEffect(() => {
    // Initial inference call on mount
    runAnalysis();
  }, [runAnalysis]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070B] text-slate-100 select-none font-sans">
      {/* Layer 0: Full Viewport 3D Canvas (Heart is the central spatial hero) */}
      <div className="absolute inset-0 w-full h-full -z-0">
        <HeartCanvas />
      </div>

      {/* Layer 1: Spatial Floating HUD Overlay (pointer-events-none container) */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 md:p-6 overflow-hidden">
        {/* Top Center Floating Navigation Island */}
        <HeaderBar
          isDrawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        />

        {/* Right Floating Diagnostic Telemetry Blade */}
        <div className="absolute top-16 sm:top-20 right-3 sm:right-5 md:right-6 pointer-events-auto">
          <TelemetryBlade onOpenParameters={() => setIsDrawerOpen(true)} />
        </div>

        {/* Bottom Dock: Segmented Vessel Navigator */}
        <BottomDock />
      </div>

      {/* Floating Regulatory Disclaimer Pill (Bottom Left) */}
      <DisclaimerModal />

      {/* Collapsible Physiological Parameter Drawer */}
      <PatientForm
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default App;
