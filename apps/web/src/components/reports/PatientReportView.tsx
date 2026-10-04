/**
 * Plain-Language Patient Heart Health Summary View (Section B, Phase C)
 * Formatted for patient readability (grade 6-8), friendly document structure,
 * short paragraphs, simple tables, whole percentages, and mandatory disclaimer.
 */

import React from 'react';
import type { PatientReportData } from '../../types/wizard';
import { Heart, Activity, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface PatientReportViewProps {
  report: PatientReportData;
}

export const PatientReportView: React.FC<PatientReportViewProps> = ({ report }) => {
  return (
    <article
      id="printable-patient-report"
      className="w-full bg-[#131a26] rounded-md border border-[#283548] p-6 sm:p-8 md:p-10 text-slate-200 flex flex-col gap-8 shadow-sm print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0 font-sans"
    >
      {/* 1. Title and Date */}
      <section className="border-b border-[#283548] pb-5 print:border-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-blue-950/60 text-blue-400 flex items-center justify-center shrink-0 border border-blue-800/60 print:border-blue-300 print:text-blue-600">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white print:text-slate-950 tracking-tight">
                {report.title_and_date.title}
              </h1>
              <p className="text-xs text-slate-400 font-mono-numbers print:text-slate-600">
                Prepared on {report.title_and_date.generation_date}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/60 text-xs font-mono-numbers w-fit print:border-slate-300 print:text-slate-700">
            <Activity className="w-3.5 h-3.5" />
            <span>Educational Digital Twin Summary</span>
          </div>
        </div>
      </section>

      {/* 2. What this summary is */}
      <section className="p-4 sm:p-5 rounded-md bg-[#0b0f17] print:bg-slate-50 border border-[#283548] print:border-slate-300">
        <h2 className="text-sm font-semibold text-white print:text-slate-900 mb-1.5">
          What This Summary Is
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
          {report.what_this_summary_is}
        </p>
      </section>

      {/* 3. Overall Picture */}
      <section className="p-4 sm:p-5 rounded-md bg-[#0b0f17] print:bg-slate-50 border border-[#283548] print:border-slate-300 flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-white print:text-slate-900">
          Overall Picture
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
          {report.overall_picture}
        </p>
      </section>

      {/* 4. Your Three Main Heart Arteries */}
      <section className="flex flex-col gap-3.5">
        <h2 className="text-sm font-semibold text-white print:text-slate-900">
          Your Three Main Heart Arteries
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* LAD */}
          <div className="p-4 rounded-md bg-[#0b0f17] print:bg-slate-50 border border-[#283548] print:border-slate-300 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-[#283548] print:border-slate-200 pb-2">
                <span className="font-semibold text-white print:text-slate-900 text-xs">
                  {report.your_three_main_heart_arteries.lad.name || 'LAD Artery'}
                </span>
                <span className="text-xs font-mono-numbers font-semibold text-blue-400 print:text-slate-900">
                  {report.your_three_main_heart_arteries.lad.probability_pct}%
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed mt-2">
                {report.your_three_main_heart_arteries.lad.description || (report.your_three_main_heart_arteries.lad as any).what_this_means}
              </p>
            </div>
            <div className="pt-2 border-t border-[#283548] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Risk Band</span>
              <Badge riskLevel={report.your_three_main_heart_arteries.lad.category as any} size="sm">
                {report.your_three_main_heart_arteries.lad.category} Risk
              </Badge>
            </div>
          </div>

          {/* LCX */}
          <div className="p-4 rounded-md bg-[#0b0f17] print:bg-slate-50 border border-[#283548] print:border-slate-300 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-[#283548] print:border-slate-200 pb-2">
                <span className="font-semibold text-white print:text-slate-900 text-xs">
                  {report.your_three_main_heart_arteries.lcx.name || 'LCX Artery'}
                </span>
                <span className="text-xs font-mono-numbers font-semibold text-blue-400 print:text-slate-900">
                  {report.your_three_main_heart_arteries.lcx.probability_pct}%
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed mt-2">
                {report.your_three_main_heart_arteries.lcx.description || (report.your_three_main_heart_arteries.lcx as any).what_this_means}
              </p>
            </div>
            <div className="pt-2 border-t border-[#283548] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Risk Band</span>
              <Badge riskLevel={report.your_three_main_heart_arteries.lcx.category as any} size="sm">
                {report.your_three_main_heart_arteries.lcx.category} Risk
              </Badge>
            </div>
          </div>

          {/* RCA */}
          <div className="p-4 rounded-md bg-[#0b0f17] print:bg-slate-50 border border-[#283548] print:border-slate-300 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-[#283548] print:border-slate-200 pb-2">
                <span className="font-semibold text-white print:text-slate-900 text-xs">
                  {report.your_three_main_heart_arteries.rca.name || 'RCA Artery'}
                </span>
                <span className="text-xs font-mono-numbers font-semibold text-blue-400 print:text-slate-900">
                  {report.your_three_main_heart_arteries.rca.probability_pct}%
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed mt-2">
                {report.your_three_main_heart_arteries.rca.description || (report.your_three_main_heart_arteries.rca as any).what_this_means}
              </p>
            </div>
            <div className="pt-2 border-t border-[#283548] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Risk Band</span>
              <Badge riskLevel={report.your_three_main_heart_arteries.rca.category as any} size="sm">
                {report.your_three_main_heart_arteries.rca.category} Risk
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Your Measurements */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white print:text-slate-900">
          Your Key Measurements
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {report.your_measurements.groups.map((group) => (
            <div
              key={group.category_name}
              className="p-3.5 rounded-md bg-[#0b0f17] print:bg-slate-50 border border-[#283548] print:border-slate-300 flex flex-col gap-2"
            >
              <h3 className="text-xs font-semibold text-slate-200 print:text-slate-800 border-b border-[#283548] pb-1.5 print:border-slate-200">
                {group.category_name}
              </h3>
              <div className="divide-y divide-[#283548]/60 print:divide-slate-200 text-xs font-mono-numbers">
                {group.items.map((item) => (
                  <div key={item.plain_name} className="py-1.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-sans text-slate-300 print:text-slate-700 block">
                        {item.plain_name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono-numbers">
                        Typical: {item.typical_range}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-white print:text-slate-900 block">
                        {item.your_value}
                      </span>
                      <span
                        className={`text-[10px] ${
                          item.status.toLowerCase().includes('within')
                            ? 'text-green-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. What Influenced the Prediction Most */}
      <section className="p-4 sm:p-5 rounded-md bg-[#0b0f17] print:bg-slate-50 border border-[#283548] print:border-slate-300 flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-white print:text-slate-900">
          What Influenced Your Numbers Most
        </h2>
        <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-300 print:text-slate-800">
          {report.what_influenced_the_prediction_most.map((factor, i) => (
            <li key={i}>{factor}</li>
          ))}
        </ul>
      </section>

      {/* 7. About This Estimate */}
      <section className="p-4 rounded-md bg-[#0b0f17] print:bg-slate-50 border border-[#283548] print:border-slate-300 text-xs text-slate-300 print:text-slate-700 leading-relaxed flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>How This Estimate Works</span>
        </div>
        <p>{report.about_this_estimate}</p>
      </section>

      {/* 8. Mandatory Disclaimer */}
      <section className="p-4 rounded-md bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Important Medical Disclaimer</span>
        </div>
        <p>{report.disclaimer}</p>
      </section>
    </article>
  );
};

export default PatientReportView;
