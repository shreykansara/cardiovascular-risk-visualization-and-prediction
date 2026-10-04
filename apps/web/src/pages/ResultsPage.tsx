/**
 * Step 3: Results, 3D Coronary Digital Twin & Diagnostic Insights Page (Task C7c)
 * Layout: 3D WebGL viewer on the left (60%), clinical diagnostic telemetry on the right (40%).
 * Bidirectional selection sync with 3D Catmull-Rom conduits, TreeSHAP bar chart, and model metrics.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Table as TableIcon,
  Award,
  FileText,
  Crosshair,
} from 'lucide-react';
import { useWizardStore } from '../store/useWizardStore';
import { HeartCanvas } from '../components/3d/HeartCanvas';
import { ColorScaleLegend } from '../components/results/ColorScaleLegend';
import { VesselCard } from '../components/results/VesselCard';
import { ShapAttributionChart } from '../components/results/ShapAttributionChart';
import { PhysiologicalBreakdownTable } from '../components/results/PhysiologicalBreakdownTable';
import { ModelPerformanceTab } from '../components/results/ModelPerformanceTab';
import { Button, Card, Badge, Tabs } from '../components/ui';

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

  // Empty state guard: if no prediction exists yet
  if (!prediction) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <Card variant="base" padding="lg" className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-white">No Prediction Telemetry Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please complete patient clinical data verification and execute model inference to generate the 3D coronary twin.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/enter-data')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Enter Patient Parameters
          </Button>
        </Card>
      </div>
    );
  }

  // Determine currently focused target vessel for SHAP & breakdown
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
      <Card variant="base" padding="md" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${
                cadIschemic
                  ? 'bg-red-950/60 text-red-400 border-red-800/60'
                  : 'bg-green-950/60 text-green-400 border-green-800/60'
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                  Multi-Vessel Ischemia Diagnostic Assessment
                </h1>
                {analysisLatencyMs && (
                  <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded bg-[#1c2637] text-slate-300 border border-[#283548]">
                    {analysisLatencyMs} ms latency
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono-numbers mt-0.5">
                Overall CAD Assessment: {cadIschemic ? 'Ischemic Stenosis Suspected' : 'Optimal Hemodynamic Perfusion'}
              </p>
            </div>
          </div>

          <Button
            id="header-generate-reports-btn"
            variant="primary"
            size="md"
            onClick={() => navigate('/reports')}
            leftIcon={<FileText className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Generate Clinical Reports
          </Button>
        </div>
      </Card>

      {/* Main Two-Column Viewport: 3D Left (60%), Telemetry Right (40%) */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch min-h-[680px]">
        {/* ===================== LEFT: 3D VIEWER CONTAINER (60%) ===================== */}
        <div className="w-full lg:w-[60%] min-h-[480px] lg:min-h-[700px] relative rounded-md overflow-hidden bg-[#0b0f17] border border-[#283548] flex flex-col shadow-sm">
          {/* Top Overlaid Color Scale Legend */}
          <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
            <ColorScaleLegend />
          </div>

          {/* Authentic 3D WebGL Canvas */}
          <div className="w-full h-full flex-1 relative -z-0">
            <HeartCanvas />
          </div>

          {/* Floating Vessel Selector Toolbar (Bottom Overlaid) */}
          <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-auto bg-[#131a26]/95 p-2 rounded-md border border-[#283548] shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono-numbers">
              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Focus:</span>
              <button
                type="button"
                onClick={() => setVesselFocus('default')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeVesselFocus === 'default'
                    ? 'bg-[#1c2637] text-white border border-[#384961] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Global Heart
              </button>
              <button
                type="button"
                onClick={() => setVesselFocus('vessel_LAD')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeVesselFocus === 'vessel_LAD'
                    ? 'bg-[#1c2637] text-white border border-[#384961] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LAD Artery
              </button>
              <button
                type="button"
                onClick={() => setVesselFocus('vessel_LCX')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeVesselFocus === 'vessel_LCX'
                    ? 'bg-[#1c2637] text-white border border-[#384961] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LCX Artery
              </button>
              <button
                type="button"
                onClick={() => setVesselFocus('vessel_RCA')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeVesselFocus === 'vessel_RCA'
                    ? 'bg-[#1c2637] text-white border border-[#384961] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                RCA Artery
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono-numbers shrink-0">
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Click 3D vessel to isolate</span>
            </div>
          </div>
        </div>

        {/* ===================== RIGHT: CLINICAL DASHBOARD (40%) ===================== */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4 overflow-y-auto">
          {/* Header Card: Overall CAD Status */}
          <div
            onClick={() => setVesselFocus('default')}
            className={`p-4 rounded-md bg-[#131a26] border transition-colors cursor-pointer ${
              activeVesselFocus === 'default'
                ? 'border-blue-500 ring-1 ring-blue-500'
                : 'border-[#283548] hover:border-[#384961]'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono-numbers text-slate-400 uppercase tracking-wider text-[10px]">
                Overall CAD Status
              </span>
              <Badge riskLevel={cadIschemic ? 'High' : 'Low'}>
                {cadIschemic ? 'Ischemic Risk Detected' : 'Patent / Low Risk'}
              </Badge>
            </div>

            <div className="flex items-baseline justify-between mt-2.5">
              <div>
                <span className="text-[10px] uppercase font-mono-numbers text-slate-400 block tracking-wider">
                  Predicted CAD Probability
                </span>
                <span
                  className="text-3xl font-mono-numbers font-bold tracking-tight"
                  style={{ color: overallCad.color_hex }}
                >
                  {cadProbPct}%
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono-numbers">
                Threshold: {(overallCad.optimal_threshold * 100).toFixed(0)}%
              </span>
            </div>

            <div className="w-full bg-[#0b0f17] h-2 rounded-full overflow-hidden mt-3 border border-[#283548]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, overallCad.probability * 100))}%`,
                  backgroundColor: overallCad.color_hex,
                }}
              />
            </div>
          </div>

          {/* 3 Vessel Cards (LAD, LCX, RCA) */}
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

          {/* Telemetry Tabs */}
          <Tabs
            tabs={[
              { id: 'shap', label: 'SHAP Drivers', icon: <BarChart3 className="w-3.5 h-3.5" /> },
              { id: 'breakdown', label: 'Physiological Table', icon: <TableIcon className="w-3.5 h-3.5" /> },
              { id: 'metrics', label: 'Model Metrics', icon: <Award className="w-3.5 h-3.5" /> },
            ]}
            activeTab={activeTab}
            onChange={(t) => setActiveTab(t as TelemetryTab)}
            className="w-full justify-stretch"
          />

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

          {/* Action button leading to /reports */}
          <div className="pt-3 border-t border-[#283548] flex items-center justify-between gap-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/enter-data')}
            >
              &larr; Edit Clinical Data
            </Button>
            <Button
              id="generate-reports-btn"
              variant="primary"
              size="md"
              onClick={() => navigate('/reports')}
              leftIcon={<FileText className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Generate Reports
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
