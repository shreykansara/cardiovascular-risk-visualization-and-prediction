/**
 * Model Performance Validation Tab (Task 4.9)
 * Displays audited ROC-AUC, PR-AUC, F1-Score, Recall, Specificity, and Accuracy
 * for all 4 trained clinical models across the Z-Alizadeh Sani cross-validation split.
 */

import React from 'react';
import { Award, CheckCircle, ShieldCheck, Database, Layers } from 'lucide-react';

interface ModelMetricRow {
  target: string;
  name: string;
  architecture: string;
  rocAuc: number;
  prAuc: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  threshold: number;
}

export const MODEL_METRICS_DATA: ModelMetricRow[] = [
  {
    target: 'CAD',
    name: 'Overall Coronary Artery Disease',
    architecture: 'RandomForest-120 (Balanced Subsample)',
    rocAuc: 0.923,
    prAuc: 0.966,
    recall: 0.944,
    f1Score: 0.913,
    accuracy: 0.885,
    threshold: 0.48,
  },
  {
    target: 'LAD',
    name: 'Left Anterior Descending Artery',
    architecture: 'RandomForest-120 (Balanced Subsample)',
    rocAuc: 0.853,
    prAuc: 0.883,
    recall: 0.915,
    f1Score: 0.844,
    accuracy: 0.827,
    threshold: 0.43,
  },
  {
    target: 'LCX',
    name: 'Left Circumflex Artery',
    architecture: 'RandomForest-120 (Balanced Subsample)',
    rocAuc: 0.735,
    prAuc: 0.615,
    recall: 0.916,
    f1Score: 0.649,
    accuracy: 0.714,
    threshold: 0.31,
  },
  {
    target: 'RCA',
    name: 'Right Coronary Artery',
    architecture: 'SoftVoting (LGBM + XGB + RF)',
    rocAuc: 0.738,
    prAuc: 0.627,
    recall: 0.895,
    f1Score: 0.639,
    accuracy: 0.721,
    threshold: 0.29,
  },
];

export const ModelPerformanceTab: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Calibrated Model Validation & Benchmark Metrics</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Evaluated via 5-Fold Stratified Cross-Validation on Z-Alizadeh Sani cohort (303 patients, 55 features).
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 w-fit">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Strict Target Leakage Guard Verified</span>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
            <tr>
              <th className="p-3">Target Head</th>
              <th className="p-3">Architecture</th>
              <th className="p-3 text-right">ROC-AUC</th>
              <th className="p-3 text-right">PR-AUC</th>
              <th className="p-3 text-right">Recall</th>
              <th className="p-3 text-right">F1-Score</th>
              <th className="p-3 text-right">Accuracy</th>
              <th className="p-3 text-right">Optimal Threshold</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-slate-200 font-mono">
            {MODEL_METRICS_DATA.map((row) => (
              <tr key={row.target} className="hover:bg-slate-800/40 transition-colors">
                {/* Target */}
                <td className="p-3 font-sans font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{row.target}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal font-sans block ml-4">
                    {row.name}
                  </span>
                </td>

                {/* Architecture */}
                <td className="p-3 text-[11px] text-slate-300 font-sans">
                  {row.architecture}
                </td>

                {/* ROC-AUC */}
                <td className="p-3 text-right font-bold text-cyan-300">
                  {(row.rocAuc * 100).toFixed(1)}%
                </td>

                {/* PR-AUC */}
                <td className="p-3 text-right text-slate-300">
                  {(row.prAuc * 100).toFixed(1)}%
                </td>

                {/* Recall */}
                <td className="p-3 text-right text-emerald-400 font-semibold">
                  {(row.recall * 100).toFixed(1)}%
                </td>

                {/* F1 */}
                <td className="p-3 text-right text-slate-200">
                  {(row.f1Score * 100).toFixed(1)}%
                </td>

                {/* Accuracy */}
                <td className="p-3 text-right text-slate-200">
                  {(row.accuracy * 100).toFixed(1)}%
                </td>

                {/* Threshold */}
                <td className="p-3 text-right text-slate-400">
                  {row.threshold.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Validation Methodology Notes */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06] text-[11px] text-slate-400 leading-relaxed font-sans flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Evaluation Dataset Split & Methodology</span>
        </div>
        <p>
          Models were trained on 55 clinical features extracted from the extended Z-Alizadeh Sani cohort (303 patient records). Evaluation was conducted using repeated 5-fold stratified cross-validation. Probabilities are calibrated via sigmoid/isotonic regression to reflect empirical post-test Bayesian odds. Excluded targets (<code className="text-cyan-300 font-mono">Cath</code>, <code className="text-cyan-300 font-mono">CAD</code>, <code className="text-cyan-300 font-mono">LAD</code>, <code className="text-cyan-300 font-mono">LCX</code>, <code className="text-cyan-300 font-mono">RCA</code>) were strictly segregated from the preprocessor pipeline to ensure zero data leakage.
        </p>
      </div>
    </div>
  );
};

export default ModelPerformanceTab;
