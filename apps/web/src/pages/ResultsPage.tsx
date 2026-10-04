/**
 * Step 3: Results, 3D Coronary Digital Twin & Diagnostic Insights Page
 * Layout: 3D WebGL viewer on the left (60%), clinical diagnostic telemetry on the right (40%).
 * Bidirectional selection sync with 3D Catmull-Rom conduits, TreeSHAP bar chart, and model metrics.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BarChart3,
  Table as TableIcon,
  Award,
  AlertTriangle,
  FileText,
  Eye,
  Crosshair,
} from 'lucide-react';
import { useWizardStore } from '../store/useWizardStore';
import { HeartCanvas } from '../components/3d/HeartCanvas';
import { ColorScaleLegend } from '../components/results/ColorScaleLegend';
import { VesselCard } from '../components/results/VesselCard';
import { ShapAttributionChart } from '../components/results/ShapAttributionChart';
import { PhysiologicalBreakdownTable } from '../components/results/PhysiologicalBreakdownTable';
import { ModelPerformanceTab } from '../components/results/ModelPerformanceTab';

type TelemetryTab = 'shap' | 'breakdown' | 'metrics';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    prediction,
    shapResult,
    inputs,
    activeVesselFocus,
    setVesselFocus,
    analysisLatencyMs,
  } = useWizardStore();

  const [activeTab, setActiveTab] = useState<TelemetryTab>('shap');

  // Empty state guard (Task 4.10): if no prediction exists yet
  if (!prediction) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="glass-card p-8 rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white">No Prediction Telemetry Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please complete patient clinical data verification and execute model inference to generate the 3D coronary twin.
          </p>
          <button
            type="button"
            onClick={() => navigate('/enter-data')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            <span>Enter Patient Parameters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Determine currently focused target vessel for SHAP & breakdown
  // activeVesselFocus is 'default' | 'vessel_LAD' | 'vessel_LCX' | 'vessel_RCA'
  const currentTarget = useMemo(() => {
    if (activeVesselFocus === 'vessel_LAD') return 'LAD';
    if (activeVesselFocus === 'vessel_LCX') return 'LCX';
    if (activeVesselFocus === 'vessel_RCA') return 'RCA';
    return 'CAD';
  }, [activeVesselFocus]);

  const currentExplanation = useMemo(() => {
    if (!shapResult) return undefined;
    const key = currentTarget.toLowerCase();
    return shapResult[key];
  }, [shapResult, currentTarget]);

  // Overall CAD Header data
  const overallCad = prediction.overall_cad;
  const cadProbPct = (overallCad.probability * 100).toFixed(1);
  const cadIschemic = overallCad.stenosis_suspected;

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 md:p-6 max-w-7xl mx-auto w-full gap-5">
      {/* Top Telemetry Header */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              cadIschemic
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white">
                Multi-Vessel Ischemia Diagnostic Assessment
              </h1>
              {analysisLatencyMs && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-white/[0.06]">
                  {analysisLatencyMs} ms latency
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Overall CAD Assessment: {cadIschemic ? 'Ischemic Stenosis Suspected' : 'Optimal Hemodynamic Perfusion'}
            </p>
          </div>
        </div>

        {/* Task 4.11: Generate Reports Button */}
        <button
          type="button"
          id="generate-reports-btn"
          onClick={() => navigate('/reports')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] shrink-0 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Clinical Reports</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Two-Column Viewport: 3D Left (60%), Telemetry Right (40%) (Task 4.1) */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch min-h-[680px]">
        {/* ===================== LEFT: 3D VIEWER CONTAINER (60%) ===================== */}
        <div className="w-full lg:w-[60%] min-h-[480px] lg:min-h-[700px] relative rounded-2xl overflow-hidden glass-card border border-white/[0.08] flex flex-col shadow-2xl">
          {/* Top Overlaid Color Scale Legend (Task 4.2) */}
          <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
            <ColorScaleLegend />
          </div>

          {/* Authentic 3D WebGL Canvas (Mounted unchanged) */}
          <div className="w-full h-full flex-1 relative -z-0">
            <HeartCanvas />
          </div>

          {/* Floating Vessel Selector Toolbar (Bottom Overlaid) */}
          <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-auto bg-slate-900/80 p-2 rounded-xl backdrop-blur-md border border-white/[0.08]">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Focus:</span>
              <button
                type="button"
                onClick={() => setVesselFocus('default')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeVesselFocus === 'default'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Global Heart
              </button>
              <button
                type="button"
                onClick={() => setVesselFocus('vessel_LAD')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeVesselFocus === 'vessel_LAD'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LAD Artery
              </button>
              <button
                type="button"
                onClick={() => setVesselFocus('vessel_LCX')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeVesselFocus === 'vessel_LCX'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LCX Artery
              </button>
              <button
                type="button"
                onClick={() => setVesselFocus('vessel_RCA')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeVesselFocus === 'vessel_RCA'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                RCA Artery
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono shrink-0">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Click 3D vessel to isolate</span>
            </div>
          </div>
        </div>

        {/* ===================== RIGHT: CLINICAL DASHBOARD (40%) ===================== */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4 overflow-y-auto">
          {/* Header Card: Overall CAD Status (Task 4.4) */}
          <div
            onClick={() => setVesselFocus('default')}
            className={`p-4 rounded-2xl glass-card border transition-all cursor-pointer ${
              activeVesselFocus === 'default'
                ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                : 'border-white/[0.08] hover:border-white/[0.18]'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px]">
                Overall CAD Status
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                  cadIschemic
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {cadIschemic ? 'Ischemic Risk Detected' : 'Patent / Low Risk'}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
                  Predicted CAD Probability
                </span>
                <span
                  className="text-3xl font-mono font-bold tracking-tight"
                  style={{ color: overallCad.color_hex }}
                >
                  {cadProbPct}%
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Threshold: {(overallCad.optimal_threshold * 100).toFixed(0)}%
              </span>
            </div>

            <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden mt-3 border border-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, overallCad.probability * 100))}%`,
                  backgroundColor: overallCad.color_hex,
                }}
              />
            </div>
          </div>

          {/* 3 Vessel Cards (LAD, LCX, RCA) (Task 4.4 & 4.5) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <VesselCard
              vesselKey="lad"
              title="LAD"
              subtitle="Left Anterior Descending"
              prediction={prediction.vessels.lad}
              isSelected={activeVesselFocus === 'vessel_LAD'}
              onSelect={() =>
                setVesselFocus(activeVesselFocus === 'vessel_LAD' ? 'default' : 'vessel_LAD')
              }
            />

            <VesselCard
              vesselKey="lcx"
              title="LCX"
              subtitle="Left Circumflex"
              prediction={prediction.vessels.lcx}
              isSelected={activeVesselFocus === 'vessel_LCX'}
              onSelect={() =>
                setVesselFocus(activeVesselFocus === 'vessel_LCX' ? 'default' : 'vessel_LCX')
              }
            />

            <VesselCard
              vesselKey="rca"
              title="RCA"
              subtitle="Right Coronary"
              prediction={prediction.vessels.rca}
              isSelected={activeVesselFocus === 'vessel_RCA'}
              onSelect={() =>
                setVesselFocus(activeVesselFocus === 'vessel_RCA' ? 'default' : 'vessel_RCA')
              }
            />
          </div>

          {/* Telemetry Tabs (SHAP / Breakdown / Performance) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-white/[0.06] text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('shap')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                activeTab === 'shap'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)] border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>SHAP Drivers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('breakdown')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                activeTab === 'breakdown'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)] border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Physiological Table</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                activeTab === 'metrics'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)] border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Model Metrics</span>
            </button>
          </div>

          {/* Active Tab View */}
          <div className="flex-1">
            {activeTab === 'shap' && (
              <ShapAttributionChart
                targetName={currentTarget}
                explanation={currentExplanation}
              />
            )}

            {activeTab === 'breakdown' && (
              <PhysiologicalBreakdownTable
                targetName={currentTarget}
                explanation={currentExplanation}
                patientInputs={inputs}
              />
            )}

            {activeTab === 'metrics' && <ModelPerformanceTab />}
          </div>

          {/* Action button leading to /reports (Task 4.11) */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/enter-data')}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              &larr; Edit Clinical Data
            </button>
            <button
              type="button"
              id="generate-reports-btn"
              onClick={() => navigate('/reports')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              <span>Generate Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
