/**
 * Model Performance Validation Tab (Task 4.9, Task A1, Phase C)
 * Displays audited Accuracy, Precision, Recall, F1-Score, and ROC-AUC
 * alongside PR-AUC, Specificity, and Decision Threshold for CAD, LAD, LCX, RCA.
 * Read directly from verified evaluationMetrics.json.
 */

import React from 'react';
import { Award, ShieldCheck, Layers } from 'lucide-react';
import evaluationMetrics from '../../config/evaluationMetrics.json';

interface ModelMetricEntry {
  target: string;
  display_name: string;
  architecture: string;
  optimal_threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  specificity: number;
  sample_count: number;
}

const metricsList: ModelMetricEntry[] = Object.values(
  (evaluationMetrics as { models: Record<string, ModelMetricEntry> }).models
);

export const ModelPerformanceTab: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-md bg-[#131a26] border border-[#283548]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#283548] pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            <span>Calibrated Model Validation & Benchmark Metrics</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-mono-numbers mt-0.5">
            Evaluated via 5-Fold Stratified Cross-Validation on Z-Alizadeh Sani cohort (303 patients, 55 features).
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono-numbers text-green-400 bg-green-950/60 px-2.5 py-1 rounded border border-green-800/60 w-fit">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Strict Target Leakage Guard Verified</span>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="overflow-x-auto rounded-md border border-[#283548]">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-[#1c2637] text-slate-400 font-mono-numbers text-[10px] uppercase tracking-wider border-b border-[#283548]">
            <tr>
              <th className="p-2.5">Target Head</th>
              <th className="p-2.5">Architecture</th>
              <th className="p-2.5 text-right">Accuracy</th>
              <th className="p-2.5 text-right">Precision</th>
              <th className="p-2.5 text-right">Recall</th>
              <th className="p-2.5 text-right">F1-Score</th>
              <th className="p-2.5 text-right">ROC-AUC</th>
              <th className="p-2.5 text-right">PR-AUC</th>
              <th className="p-2.5 text-right">Specificity</th>
              <th className="p-2.5 text-right">Threshold</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#283548] bg-[#0b0f17] text-slate-200 font-mono-numbers">
            {metricsList.map((row) => (
              <tr key={row.target} className="hover:bg-[#131a26]/60 transition-colors">
                {/* Target */}
                <td className="p-2.5 font-sans font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{row.target}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal font-sans block ml-4">
                    {row.display_name}
                  </span>
                </td>

                {/* Architecture */}
                <td className="p-2.5 text-[11px] text-slate-300 font-sans">
                  {row.architecture}
                </td>

                {/* Accuracy */}
                <td className="p-2.5 text-right font-medium text-slate-200">
                  {(row.accuracy * 100).toFixed(1)}%
                </td>

                {/* Precision */}
                <td className="p-2.5 text-right font-medium text-slate-200">
                  {(row.precision * 100).toFixed(1)}%
                </td>

                {/* Recall */}
                <td className="p-2.5 text-right text-green-400 font-semibold">
                  {(row.recall * 100).toFixed(1)}%
                </td>

                {/* F1 */}
                <td className="p-2.5 text-right text-slate-200 font-medium">
                  {(row.f1_score * 100).toFixed(1)}%
                </td>

                {/* ROC-AUC */}
                <td className="p-2.5 text-right font-semibold text-blue-400">
                  {(row.roc_auc * 100).toFixed(1)}%
                </td>

                {/* PR-AUC */}
                <td className="p-2.5 text-right text-slate-400">
                  {(row.pr_auc * 100).toFixed(1)}%
                </td>

                {/* Specificity */}
                <td className="p-2.5 text-right text-slate-400">
                  {(row.specificity * 100).toFixed(1)}%
                </td>

                {/* Threshold */}
                <td className="p-2.5 text-right text-slate-400">
                  {row.optimal_threshold.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Validation Methodology Notes */}
      <div className="p-3.5 rounded-md bg-[#0b0f17] border border-[#283548] text-[11px] text-slate-400 leading-relaxed font-sans flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Evaluation Dataset Split & Methodology</span>
        </div>
        <p>
          Models were trained on 55 clinical features extracted from the extended Z-Alizadeh Sani cohort (303 patient records). Evaluation was conducted using repeated 5-fold stratified cross-validation on held-out folds. Probabilities are calibrated via sigmoid/isotonic regression to reflect empirical post-test Bayesian odds. Excluded targets (<code className="text-slate-300 font-mono-numbers">Cath</code>, <code className="text-slate-300 font-mono-numbers">CAD</code>, <code className="text-slate-300 font-mono-numbers">LAD</code>, <code className="text-slate-300 font-mono-numbers">LCX</code>, <code className="text-slate-300 font-mono-numbers">RCA</code>) were strictly segregated from the preprocessor pipeline to ensure zero data leakage.
        </p>
      </div>
    </div>
  );
};

export default ModelPerformanceTab;
