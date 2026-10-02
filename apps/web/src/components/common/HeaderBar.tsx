/**
 * Floating Island Header Bar (AuraCor Spatial DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { Activity, RotateCcw, Sliders, Sparkles } from 'lucide-react';
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

  const latency = analysis?.latency_ms ?? 14.8;

  const presets: { key: PatientProfileKey; label: string }[] = [
    { key: 'normal', label: 'Healthy' },
    { key: 'high_risk_lad', label: 'LAD Ischemia' },
    { key: 'triple_vessel', label: 'Triple Vessel' },
  ];

  return (
    <header className="w-full flex justify-center items-center pointer-events-none z-30 select-none animate-cinema-top">
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3.5 px-3.5 sm:px-5 py-2 rounded-full border border-white/10 bg-slate-950/55 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all">
        {/* Brand Mark */}
        <div className="flex items-center gap-2 pr-1 sm:pr-2">
          <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-white font-sans">
              AuraCor
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/10">
              CAD-3D
            </span>
          </div>
        </div>

        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        {/* Preset Phenotype Selectors */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/5">
          {presets.map(({ key, label }) => {
            const isActive = activeProfile === key;
            return (
              <button
                key={key}
                onClick={() => loadProfile(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-sm border border-white/15 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="w-px h-4 bg-white/10 hidden md:block" />

        {/* Unobtrusive Telemetry Status Indicator */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              offlineMode
                ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
            }`}
          />
          <span className="text-slate-400">
            {isLoading
              ? 'Inferring...'
              : offlineMode
              ? `Simulated // ${latency.toFixed(1)}ms`
              : `FastAPI // ${latency.toFixed(1)}ms`}
          </span>
        </div>

        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        {/* Tactical Actions */}
        <div className="flex items-center gap-1.5">
          {/* Camera Reset */}
          <button
            onClick={() => setVesselFocus('default')}
            title="Reset Camera View"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Drawer Toggle */}
          <button
            onClick={onToggleDrawer}
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all border ${
              isDrawerOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Parameters</span>
          </button>
        </div>
      </div>
    </header>
  );
};
