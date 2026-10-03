/**
 * Plain-Language Patient Heart Health Summary View (Section B)
 * Formatted for patient readability (grade 6-8), friendly document structure,
 * short paragraphs, simple tables, whole percentages, and mandatory disclaimer.
 */

import React from 'react';
import type { PatientReportData } from '../../types/wizard';
import { Heart, Activity, ShieldAlert, CheckCircle, Info } from 'lucide-react';

interface PatientReportViewProps {
  report: PatientReportData;
}

export const PatientReportView: React.FC<PatientReportViewProps> = ({ report }) => {
  return (
    <article
      id="printable-patient-report"
      className="w-full bg-slate-900/90 rounded-2xl border border-white/[0.08] p-6 sm:p-8 md:p-10 text-slate-200 flex flex-col gap-8 shadow-2xl print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0 font-sans"
    >
      {/* 1. Title and Date */}
      <section className="border-b border-white/[0.08] pb-5 print:border-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 print:border-red-300 print:text-red-600">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white print:text-slate-950">
                {report.title_and_date.title}
              </h1>
              <p className="text-xs text-slate-400 font-mono print:text-slate-600">
                Prepared on {report.title_and_date.generation_date}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono w-fit print:border-slate-300 print:text-slate-700">
            <Activity className="w-3.5 h-3.5" />
            <span>Educational Digital Twin Summary</span>
          </div>
        </div>
      </section>

      {/* 2. What this summary is */}
      <section className="p-4 sm:p-5 rounded-xl bg-slate-950/40 print:bg-slate-50 border border-white/[0.06] print:border-slate-300">
        <h2 className="text-sm font-bold text-white print:text-slate-900 mb-1.5">
          What This Summary Is
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
          {report.what_this_summary_is}
        </p>
      </section>

      {/* 3. Overall Picture */}
      <section className="p-4 sm:p-5 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-white/[0.06] print:border-slate-300 flex flex-col gap-2">
        <h2 className="text-sm font-bold text-white print:text-slate-900">
          Overall Picture
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
          {report.overall_picture}
        </p>
      </section>

      {/* 4. Your Three Main Heart Arteries */}
      <section className="flex flex-col gap-3.5">
        <h2 className="text-sm font-bold text-white print:text-slate-900">
          Your Three Main Heart Arteries
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* LAD */}
          <div className="p-4 rounded-xl bg-slate-950/40 print:bg-slate-50 border border-white/[0.06] print:border-slate-300 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] print:border-slate-200 pb-2">
                <span className="font-bold text-white print:text-slate-900 text-xs">
                  {report.your_three_main_heart_arteries.lad.name || 'LAD Artery'}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400 print:text-slate-900">
                  {report.your_three_main_heart_arteries.lad.probability_pct}%
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed mt-2.5">
                {report.your_three_main_heart_arteries.lad.description}
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Risk Category: <strong className="text-slate-200 print:text-slate-900">{report.your_three_main_heart_arteries.lad.category}</strong>
            </div>
          </div>

          {/* LCX */}
          <div className="p-4 rounded-xl bg-slate-950/40 print:bg-slate-50 border border-white/[0.06] print:border-slate-300 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] print:border-slate-200 pb-2">
                <span className="font-bold text-white print:text-slate-900 text-xs">
                  {report.your_three_main_heart_arteries.lcx.name || 'LCX Artery'}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400 print:text-slate-900">
                  {report.your_three_main_heart_arteries.lcx.probability_pct}%
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed mt-2.5">
                {report.your_three_main_heart_arteries.lcx.description}
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Risk Category: <strong className="text-slate-200 print:text-slate-900">{report.your_three_main_heart_arteries.lcx.category}</strong>
            </div>
          </div>

          {/* RCA */}
          <div className="p-4 rounded-xl bg-slate-950/40 print:bg-slate-50 border border-white/[0.06] print:border-slate-300 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] print:border-slate-200 pb-2">
                <span className="font-bold text-white print:text-slate-900 text-xs">
                  {report.your_three_main_heart_arteries.rca.name || 'RCA Artery'}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400 print:text-slate-900">
                  {report.your_three_main_heart_arteries.rca.probability_pct}%
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed mt-2.5">
                {report.your_three_main_heart_arteries.rca.description}
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Risk Category: <strong className="text-slate-200 print:text-slate-900">{report.your_three_main_heart_arteries.rca.category}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Your Measurements */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-white print:text-slate-900">
          Your Health Measurements
        </h2>

        <div className="overflow-x-auto rounded-xl border border-white/[0.08] print:border-slate-300">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950/80 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono text-[10px] uppercase">
              <tr>
                <th className="p-3">Measurement</th>
                <th className="p-3">Your Value</th>
                <th className="p-3">Typical Range</th>
                <th className="p-3 text-right">Where You Are</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] print:divide-slate-200">
              {report.your_measurements.groups.map((group) => (
                <React.Fragment key={group.category_name}>
                  <tr className="bg-slate-950/60 print:bg-slate-100 font-semibold text-[11px] text-cyan-300 print:text-slate-800">
                    <td colSpan={4} className="p-2.5 px-3">
                      {group.category_name}
                    </td>
                  </tr>
                  {group.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                      <td className="p-3 text-slate-200 print:text-slate-900 font-medium">
                        {item.plain_name}
                      </td>
                      <td className="p-3 font-mono font-bold text-white print:text-slate-950">
                        {item.your_value}
                      </td>
                      <td className="p-3 font-mono text-slate-400 print:text-slate-600">
                        {item.typical_range}
                      </td>
                      <td className="p-3 text-right font-mono text-[11px]">
                        <span
                          className={
                            item.status === 'Within range'
                              ? 'text-emerald-400 print:text-green-700'
                              : 'text-amber-300 print:text-amber-700'
                          }
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. What Influenced the Prediction Most */}
      <section className="p-4 sm:p-5 rounded-xl bg-slate-950/50 print:bg-slate-50 border border-white/[0.06] print:border-slate-300 flex flex-col gap-2.5">
        <h2 className="text-sm font-bold text-white print:text-slate-900">
          What Influenced the Prediction Most
        </h2>
        <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 print:text-slate-800 leading-relaxed font-sans">
          {report.what_influenced_the_prediction_most.map((factor, idx) => (
            <li key={idx}>{factor}</li>
          ))}
        </ul>
      </section>

      {/* 7. About This Estimate */}
      <section className="p-4 sm:p-5 rounded-xl bg-slate-950/40 print:bg-slate-50 border border-white/[0.06] print:border-slate-300 flex flex-col gap-2">
        <h2 className="text-sm font-bold text-white print:text-slate-900">
          About This Estimate
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 print:text-slate-800 leading-relaxed">
          {report.about_this_estimate}
        </p>
      </section>

      {/* 8. Mandatory Disclaimer */}
      <footer className="border-t border-white/[0.08] pt-5 print:border-slate-300">
        <div className="p-4 rounded-xl bg-amber-500/10 print:bg-amber-50 border border-amber-500/30 print:border-amber-200 text-amber-200 print:text-amber-900 text-xs font-sans leading-relaxed flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block mb-0.5 text-amber-300 print:text-amber-950">
              Notice for Patients
            </strong>
            <p>{report.disclaimer}</p>
          </div>
        </div>
      </footer>
    </article>
  );
};

export default PatientReportView;
