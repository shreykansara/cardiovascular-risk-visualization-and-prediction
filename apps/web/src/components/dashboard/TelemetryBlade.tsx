/**
 * Minimal Diagnostic Telemetry Blade (Perfusion3D Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Activity,
  Flame,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
  LocateFixed,
  BarChart3,
  Layers,
} from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import type { TargetVessel, RiskTier, TargetPrediction } from '../../types/clinical';

interface TelemetryBladeProps {
  onOpenParameters: () => void;
}

export const TelemetryBlade: React.FC<TelemetryBladeProps> = ({ onOpenParameters }) => {
  const { analysis, activeVesselFocus, setVesselFocus, isLoading } = usePatientStore();
  const [activeTab, setActiveTab] = useState<'shap' | 'narrative'>('shap');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedTarget, setSelectedTarget] = useState<TargetVessel>('CAD');
  const [hoveredFeature, setHoveredFeature] = useState<any | null>(null);

  // Sync internal selected target with 3D camera focus if a vessel is active
  useEffect(() => {
    if (activeVesselFocus === 'vessel_LAD') setSelectedTarget('LAD');
    else if (activeVesselFocus === 'vessel_LCX') setSelectedTarget('LCX');
    else if (activeVesselFocus === 'vessel_RCA') setSelectedTarget('RCA');
    else if (activeVesselFocus === 'default') setSelectedTarget('CAD');
  }, [activeVesselFocus]);

  const predictions = analysis?.predictions;
  const explanations = analysis?.explanations;
  const currentExp = explanations ? explanations[selectedTarget.toLowerCase()] : null;

  // Animated numbers for smooth roll-up on patient switch
  const cadProb = predictions ? predictions.overall_cad.probability * 100 : 0;
  const animatedCadProb = useAnimatedNumber(cadProb, 800, 1);

  const ladProb = predictions ? predictions.vessels.lad.probability * 100 : 0;
  const animatedLadProb = useAnimatedNumber(ladProb, 750, 0);

  const lcxProb = predictions ? predictions.vessels.lcx.probability * 100 : 0;
  const animatedLcxProb = useAnimatedNumber(lcxProb, 750, 0);

  const rcaProb = predictions ? predictions.vessels.rca.probability * 100 : 0;
  const animatedRcaProb = useAnimatedNumber(rcaProb, 750, 0);

  if (!predictions) {
    return (
      <aside className="w-80 md:w-96 ultra-glass rounded-2xl p-5 border border-white/10 shadow-2xl animate-pulse pointer-events-auto">
        <div className="h-6 w-28 bg-white/10 rounded-full mb-4" />
        <div className="h-16 w-full bg-white/5 rounded-xl mb-4" />
        <div className="h-24 w-full bg-white/5 rounded-xl" />
      </aside>
    );
  }

  const overallCad = predictions.overall_cad;
  const isStenosed = overallCad.stenosis_suspected;

  const vesselStrip: {
    key: string;
    target: TargetVessel;
    label: string;
    focusNode: string;
    probString: string;
    pred: TargetPrediction;
  }[] = [
    {
      key: 'lad',
      target: 'LAD',
      label: 'LAD',
      focusNode: 'vessel_LAD',
      probString: animatedLadProb,
      pred: predictions.vessels.lad,
    },
    {
      key: 'lcx',
      target: 'LCX',
      label: 'LCX',
      focusNode: 'vessel_LCX',
      probString: animatedLcxProb,
      pred: predictions.vessels.lcx,
    },
    {
      key: 'rca',
      target: 'RCA',
      label: 'RCA',
      focusNode: 'vessel_RCA',
      probString: animatedRcaProb,
      pred: predictions.vessels.rca,
    },
  ];

  // Maximum SHAP for proportional scaling
  const maxAbsShap = currentExp
    ? Math.max(...currentExp.top_features.map((f) => Math.abs(f.shap_value)), 0.05)
    : 0.1;

  const targetsList: TargetVessel[] = ['CAD', 'LAD', 'LCX', 'RCA'];

  return (
    <aside className="w-80 md:w-96 ultra-glass rounded-3xl border border-white/10 shadow-md  flex flex-col pointer-events-auto select-none transition-all duration-300 animate-cinema-right overflow-hidden">
      {/* 1. Sleek Compact Primary Cardiac Verdict (Hero Summary) */}
      <div className="p-4 sm:p-5 pb-3">
        {/* Top Header Pill Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse " />
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
              CARDIAC VERDICT
            </span>
          </div>

          {/* Risk Tier Badge */}
          <div
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 border ${
              overallCad.risk_tier === 'CRITICAL'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 '
                : overallCad.risk_tier === 'HIGH'
                ? 'bg-red-500/15 text-red-300 border-red-500/30'
                : overallCad.risk_tier === 'BORDERLINE'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 '
            }`}
          >
            {overallCad.risk_tier === 'CRITICAL' && <Flame className="w-3 h-3 text-rose-400" />}
            {overallCad.risk_tier === 'HIGH' && <AlertCircle className="w-3 h-3 text-red-400" />}
            {overallCad.risk_tier === 'LOW' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            <span>{overallCad.risk_tier}</span>
          </div>
        </div>

        {/* Primary Probability Roll-up */}
        <div className="flex items-baseline justify-between mb-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-mono font-extrabold tracking-tight text-white">
              {animatedCadProb}
            </span>
            <span className="text-lg font-mono text-slate-400 font-semibold">%</span>
          </div>

          <span className="text-xs font-medium text-slate-400 font-sans">
            {isStenosed ? (
              <span className="text-rose-400 font-semibold">Stenosis Suspected</span>
            ) : (
              <span className="text-emerald-400 font-semibold">Patent Vessels</span>
            )}
          </span>
        </div>

        {/* Diagnostic Subtitle */}
        <p className="text-[11px] text-slate-400/90 font-sans leading-snug line-clamp-2 mb-3">
          {predictions.clinical_summary}
        </p>

        {/* 3-Segment Micro Risk-Strip for LAD / LCX / RCA */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/5">
          {vesselStrip.map((v) => {
            const isVesselFocused = activeVesselFocus === v.focusNode;
            const thresholdPercent = Math.round(v.pred.optimal_threshold * 100);

            return (
              <button
                key={v.key}
                onClick={() => setVesselFocus(isVesselFocused ? 'default' : v.focusNode)}
                className={`p-2 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between ${
                  isVesselFocused
                    ? 'bg-white/10 border-cyan-400/60  '
                    : 'bg-white/[0.02] border-transparent hover:bg-white/[0.06] hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-bold text-slate-300">
                    {v.label}
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: v.pred.color_hex,
                      boxShadow: `0 0 6px ${v.pred.color_hex}`,
                    }}
                  />
                </div>

                <div className="font-mono text-sm font-bold text-white mb-1.5">
                  {v.probString}%
                </div>

                {/* Micro hairline progress indicator with threshold tick */}
                <div className="relative w-full h-1 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10"
                    style={{ left: `${thresholdPercent}%` }}
                    title={`Cutoff: ${thresholdPercent}%`}
                  />
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, v.pred.probability * 100)}%`,
                      backgroundColor: v.pred.color_hex,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion / Tab Section Divider & Controls */}
      <div className="border-t border-white/10 px-4 sm:px-5 py-2.5 flex items-center justify-between bg-white/[0.01]">
        {/* Minimal Tab Switchers */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-full border border-white/5">
          <button
            onClick={() => {
              setActiveTab('shap');
              setIsExpanded(true);
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
              activeTab === 'shap' && isExpanded
                ? 'bg-white/15 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TreeSHAP Insights
          </button>
          <button
            onClick={() => {
              setActiveTab('narrative');
              setIsExpanded(true);
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
              activeTab === 'narrative' && isExpanded
                ? 'bg-white/15 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Parameters
          </button>
        </div>

        {/* Expand / Minimize Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse Telemetry' : 'Expand Telemetry'}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Collapsible Drawer Content */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-4 max-h-[360px] overflow-y-auto space-y-3">
          {activeTab === 'shap' && currentExp && (
            <div className="space-y-3 pt-1">
              {/* Vessel Selector Pill Chips */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Target Vessel
                </span>
                <div className="flex items-center gap-1">
                  {targetsList.map((t) => {
                    const isTabActive = selectedTarget === t;
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          setSelectedTarget(t);
                          const nodeMap: Record<TargetVessel, string> = {
                            CAD: 'default',
                            LAD: 'vessel_LAD',
                            LCX: 'vessel_LCX',
                            RCA: 'vessel_RCA',
                          };
                          setVesselFocus(nodeMap[t]);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium transition-all ${
                          isTabActive
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                            : 'text-slate-400 hover:text-white bg-white/[0.03]'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Baseline vs Predicted Micro Chip */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-mono">
                <span className="text-slate-400">Baseline &phi;₀: {(currentExp.base_value * 100).toFixed(0)}%</span>
                <span className="text-cyan-300 font-semibold">
                  Pred: {(currentExp.predicted_probability * 100).toFixed(1)}%
                </span>
              </div>

              {/* Hairline Neon TreeSHAP Bars */}
              <div className="space-y-2">
                {currentExp.top_features.map((item, idx) => {
                  const isRiskElevating = item.impact === 'INCREASES_RISK';
                  const barWidthPercent = Math.min(
                    100,
                    (Math.abs(item.shap_value) / maxAbsShap) * 100
                  );

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredFeature(item)}
                      onMouseLeave={() => setHoveredFeature(null)}
                      className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] transition-all group relative cursor-pointer"
                    >
                      {/* Feature Label & Value */}
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium truncate pr-2 text-[11px]">
                          {item.clinical_label}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {item.feature_value}
                        </span>
                      </div>

                      {/* Hairline Divergent Bar */}
                      <div className="flex items-center gap-1.5 h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden">
                        {/* Protective Left Bar */}
                        <div className="flex-1 flex justify-end h-full">
                          {!isRiskElevating && (
                            <div
                              className="h-full rounded-full bg-slate-500  transition-all duration-300"
                              style={{ width: `${barWidthPercent}%` }}
                            />
                          )}
                        </div>

                        {/* Hairline Center Axis */}
                        <div className="w-0.5 h-full bg-white/30 shrink-0" />

                        {/* Risk Elevating Right Bar */}
                        <div className="flex-1 flex justify-start h-full">
                          {isRiskElevating && (
                            <div
                              className="h-full rounded-full bg-blue-600  transition-all duration-300"
                              style={{ width: `${barWidthPercent}%` }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Delta attribution label on hover or default */}
                      <div className="flex justify-between items-center text-[10px] font-mono mt-1 text-slate-400">
                        <span className="text-[9px] text-slate-400">
                          {isRiskElevating ? 'Elevates Ischemia' : 'Protective Factor'}
                        </span>
                        <span
                          className={`font-semibold ${
                            isRiskElevating ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {item.shap_value > 0
                            ? `+${item.shap_value.toFixed(3)}`
                            : item.shap_value.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'narrative' && (
            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                  Interactive Simulation
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Explore 55 physiological inputs including resting ECG leads, regional wall motion abnormalities (Echo), and lipid biomarkers with real-time calibrated re-inference.
                </p>
                <button
                  onClick={onOpenParameters}
                  className="w-full mt-2 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open 55 Clinical Parameters</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
