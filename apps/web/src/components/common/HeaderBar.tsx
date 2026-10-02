/**
 * Global Telemetry Header Bar (AuraCor DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { Activity, RotateCcw, Sliders, ShieldAlert, Cpu } from 'lucide-react';
import { usePatientStore, PATIENT_PROFILES } from '../../store/usePatientStore';
import type { PatientProfileKey } from '../../types/clinical';

interface HeaderBarProps {
  onToggleDrawer: () => void;
  isDrawerOpen: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onToggleDrawer, isDrawerOpen }) => {
  const {
    activeProfile,
    loadProfile,
    setVesselFocus,
    offlineMode,
    analysis,
    isLoading,
  } = usePatientStore();

  const latency = analysis?.latency_ms ?? 18.0;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-surface-1/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-30 select-none">
      {/* Brand Identity & Live Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">AuraCor</span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                CAD-3D
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide">
              MULTIMODAL ANATOMICAL TWIN
            </p>
          </div>
        </div>

        {/* Real-Time Telemetry Badge */}
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              offlineMode
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                offlineMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'
              }`}
            />
            <span>
              {offlineMode ? 'CALIBRATED SIMULATION' : 'FASTAPI INFERENCE'} // {latency.toFixed(1)}ms
            </span>
          </div>

          {isLoading && (
            <span className="text-xs font-mono text-cyan-400 animate-pulse">
              ANALYZING...
            </span>
          )}
        </div>
      </div>

      {/* Persistent Ambient Regulatory Notice */}
      <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-2/80 border border-amber-500/20 text-[11px] text-slate-300">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-mono text-amber-300/90 font-medium">RESEARCH PROTOTYPE</span>
        <span className="text-slate-400">— NOT FOR PRIMARY DIAGNOSIS</span>
      </div>

      {/* Preset Profiles & Drawer Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Quick Phenotype Loader */}
        <div className="hidden sm:flex items-center gap-1 bg-surface-2/70 p-1 rounded-xl border border-slate-700/50">
          {(['normal', 'high_risk_lad', 'triple_vessel'] as PatientProfileKey[]).map((key) => {
            const isActive = activeProfile === key;
            const labels: Record<PatientProfileKey, string> = {
              normal: 'Healthy Normal',
              high_risk_lad: 'LAD Ischemia',
              triple_vessel: 'Triple Vessel',
            };
            return (
              <button
                key={key}
                onClick={() => loadProfile(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {labels[key]}
              </button>
            );
          })}
        </div>

        {/* Anatomical Camera Reset */}
        <button
          onClick={() => setVesselFocus('default')}
          title="Reset Camera View"
          className="p-2 rounded-lg glass-btn hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Drawer Toggle */}
        <button
          onClick={onToggleDrawer}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold transition-all border ${
            isDrawerOpen
              ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/50 shadow-glow-cyan'
              : 'glass-btn hover:border-slate-600 text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">Clinical Parameters</span>
        </button>
      </div>
    </header>
  );
};
