/**
 * Clinician Technical Report View (Section A, Phase C)
 * Precision clinical document with numbered headings, structured tables,
 * SHAP attribution vectors, benchmark metrics, and mandatory disclaimer.
 */

import React from 'react';
import type { TechnicalReportData } from '../../types/wizard';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface TechnicalReportViewProps {
  report: TechnicalReportData;
}

export const TechnicalReportView: React.FC<TechnicalReportViewProps> = ({ report }) => {
  return (
    <article
      id="printable-technical-report"
      className="w-full bg-[#131a26] rounded-md border border-[#283548] p-6 sm:p-8 md:p-10 text-slate-200 flex flex-col gap-8 shadow-sm print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0 font-sans"
    >
      {/* 1. Report Header */}
      <section className="border-b border-[#283548] pb-5 print:border-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-blue-400 print:text-slate-600 block font-semibold">
              1. CLINICAL REPORT HEADER
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold text-white print:text-slate-950 mt-0.5 tracking-tight">
              {report.report_header.report_title}
            </h1>
            <p className="text-xs text-slate-400 font-mono-numbers mt-1 print:text-slate-600">
              System: {report.report_header.model_version}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono-numbers text-xs">
            <div className="text-slate-300 print:text-slate-800">
              Generated: <span className="text-white font-semibold print:text-slate-950">{report.report_header.generation_date_time}</span>
            </div>
            <div className="text-slate-400 print:text-slate-600 text-[11px] mt-0.5">
              Patient: <strong className="text-slate-200 print:text-slate-900">{report.report_header.patient_age} yo {report.report_header.patient_sex}</strong> (De-identified)
            </div>
          </div>
        </div>
      </section>

      {/* 2. Model Output Summary */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-mono-numbers uppercase tracking-wider text-blue-400 print:text-slate-700 font-semibold">
          2. MODEL OUTPUT SUMMARY (MULTI-HEAD STENOSIS EVALUATION)
        </h2>

        <div className="overflow-x-auto rounded-md border border-[#283548] print:border-slate-300">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#1c2637] print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono-numbers text-[10px] uppercase">
              <tr>
                <th className="p-2.5">Target Head</th>
                <th className="p-2.5">Vessel / Diagnosis</th>
                <th className="p-2.5">Predicted Status</th>
                <th className="p-2.5 text-right">Predicted Probability (%)</th>
                <th className="p-2.5 text-right">Risk Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#283548] bg-[#0b0f17] print:divide-slate-200 print:bg-white">
              {report.model_output_summary.targets.map((tgt) => (
                <tr key={tgt.target} className="hover:bg-[#131a26]/60 print:hover:bg-transparent">
                  <td className="p-2.5 font-mono-numbers font-semibold text-white print:text-slate-900">{tgt.target}</td>
                  <td className="p-2.5 text-slate-300 print:text-slate-800">{tgt.display_name}</td>
                  <td className="p-2.5 font-medium text-slate-200 print:text-slate-900">{tgt.predicted_status}</td>
                  <td className="p-2.5 text-right font-mono-numbers font-semibold text-slate-100 print:text-slate-900">
                    {tgt.probability_pct.toFixed(1)}%
                  </td>
                  <td className="p-2.5 text-right font-mono-numbers">
                    <Badge
                      riskLevel={tgt.category as any}
                      size="sm"
                    >
                      {tgt.category} Risk
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Input Parameters Table */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-mono-numbers uppercase tracking-wider text-blue-400 print:text-slate-700 font-semibold">
          3. INPUT PARAMETERS (55 VERIFIED PHYSIOLOGICAL ATTRIBUTES)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.input_parameters.groups.map((grp) => (
            <div
              key={grp.group_name}
              className="rounded-md border border-[#283548] bg-[#0b0f17] print:bg-slate-50 p-3.5 flex flex-col gap-2 print:border-slate-300"
            >
              <h3 className="text-xs font-semibold text-white print:text-slate-900 border-b border-[#283548] pb-1.5 print:border-slate-200">
                {grp.group_name}
              </h3>
              <div className="divide-y divide-[#283548]/60 print:divide-slate-200 text-xs font-mono-numbers">
                {grp.parameters.map((param) => (
                  <div key={param.name} className="py-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-300 print:text-slate-800 truncate">{param.name}</span>
                      {param.unit && (
                        <span className="text-[10px] text-slate-500">({param.unit})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-white print:text-slate-950">
                        {String(param.value)}
                      </span>
                      {param.within_range === false && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Outside reference range" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Parameters Outside Reference Range */}
      <section className="flex flex-col gap-2 p-4 rounded-md bg-[#0b0f17] border border-[#283548] print:bg-slate-50 print:border-slate-300 text-xs leading-relaxed text-slate-300">
        <h2 className="text-xs font-mono-numbers uppercase tracking-wider text-blue-400 font-semibold">
          4. PARAMETERS OUTSIDE REFERENCE RANGE
        </h2>
        <ul className="list-disc pl-4 space-y-1 font-mono-numbers">
          {report.parameters_outside_reference_range?.map((paramStr, i) => (
            <li key={i}>{paramStr}</li>
          ))}
        </ul>
      </section>

      {/* 5. Key Predictive Factors (TreeSHAP Attributions) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-mono-numbers uppercase tracking-wider text-blue-400 print:text-slate-700 font-semibold">
          5. KEY PREDICTIVE FACTORS (TREESHAP ATTRIBUTION ANALYSIS)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {report.model_attribution?.targets?.map((tgt) => (
            <div key={tgt.target} className="p-4 rounded-md bg-[#0b0f17] border border-[#283548] flex flex-col gap-2">
              <span className="text-xs font-semibold text-blue-400">
                {tgt.target} Top Predictive Factors
              </span>
              <ul className="divide-y divide-[#283548]/60 text-xs font-mono-numbers">
                {tgt.top_features?.map((f, i) => (
                  <li key={i} className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-200">{f.feature}</span>
                    <span className={f.direction === 'INCREASES_RISK' ? 'font-semibold text-blue-400' : 'font-semibold text-slate-400'}>
                      {f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(3)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Model Performance & Validation Context */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-mono-numbers uppercase tracking-wider text-blue-400 print:text-slate-700 font-semibold">
          6. MODEL VALIDATION BENCHMARKS (5-FOLD STRATIFIED CV)
        </h2>
        <div className="overflow-x-auto rounded-md border border-[#283548] print:border-slate-300">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#1c2637] text-slate-400 font-mono-numbers text-[10px] uppercase">
              <tr>
                <th className="p-2.5">Head</th>
                <th className="p-2.5 text-right">Accuracy</th>
                <th className="p-2.5 text-right">Precision</th>
                <th className="p-2.5 text-right">Recall</th>
                <th className="p-2.5 text-right">F1-Score</th>
                <th className="p-2.5 text-right">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#283548] bg-[#0b0f17] font-mono-numbers text-slate-200">
              {report.model_performance?.metrics?.map((m) => (
                <tr key={m.target}>
                  <td className="p-2.5 font-semibold text-white">{m.target}</td>
                  <td className="p-2.5 text-right">{m.accuracy != null ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}</td>
                  <td className="p-2.5 text-right">{m.precision != null ? `${(m.precision * 100).toFixed(1)}%` : '—'}</td>
                  <td className="p-2.5 text-right text-green-400">{(m.recall * 100).toFixed(1)}%</td>
                  <td className="p-2.5 text-right">{(m.f1_score * 100).toFixed(1)}%</td>
                  <td className="p-2.5 text-right font-semibold text-blue-400">{(m.roc_auc * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.model_performance?.split_notes && (
          <p className="text-[11px] text-slate-400 font-mono-numbers">{report.model_performance.split_notes}</p>
        )}
      </section>

      {/* 7. Methodological Notes */}
      <section className="flex flex-col gap-2 p-4 rounded-md bg-[#0b0f17] border border-[#283548] print:bg-slate-50 print:border-slate-300 text-xs leading-relaxed text-slate-300">
        <h2 className="text-xs font-mono-numbers uppercase tracking-wider text-blue-400 font-semibold">
          7. METHODOLOGICAL NOTES & LIMITATIONS
        </h2>
        <ul className="list-disc pl-4 space-y-1">
          {report.methodological_notes?.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </section>

      {/* 8. Mandatory Safety Disclaimer */}
      <section className="p-4 rounded-md bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>8. CLINICAL SAFETY DISCLAIMER</span>
        </div>
        <p>{report.disclaimer}</p>
      </section>
    </article>
  );
};

export default TechnicalReportView;
