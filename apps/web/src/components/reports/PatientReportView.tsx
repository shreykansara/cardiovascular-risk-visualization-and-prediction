import React from 'react';
import type { PatientReportData } from '../../types/wizard';
import { RiskLabel } from '../ui/RiskLabel';

interface PatientReportViewProps {
  report: PatientReportData;
}

export const PatientReportView: React.FC<PatientReportViewProps> = ({ report }) => {
  return (
    <article
      id="printable-report-sheet"
      className="w-full max-w-[800px] bg-page border border-border rounded p-12 text-text flex flex-col gap-8 mx-auto"
    >
      {/* 1. Title and Date */}
      <header className="border-b border-border pb-4">
        <h1 className="text-[20px] leading-[28px] font-semibold text-text mb-1">
          {report.title_and_date.title}
        </h1>
        <p className="text-[13px] leading-[20px] text-text-muted">
          Date: {report.title_and_date.generation_date}
        </p>
      </header>

      {/* 2. What this summary is */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          1. What this summary is
        </h2>
        <p className="text-[14px] leading-[22px] text-text">
          {report.what_this_summary_is}
        </p>
      </section>

      {/* 3. Overall picture */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          2. Overall picture
        </h2>
        <p className="text-[14px] leading-[22px] text-text">
          {report.overall_picture}
        </p>
      </section>

      {/* 4. Your three main heart arteries */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          3. Your three main heart arteries
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { key: 'lad', vessel: report.your_three_main_heart_arteries.lad, defaultName: 'Left anterior descending (LAD) artery' },
            { key: 'lcx', vessel: report.your_three_main_heart_arteries.lcx, defaultName: 'Left circumflex (LCX) artery' },
            { key: 'rca', vessel: report.your_three_main_heart_arteries.rca, defaultName: 'Right coronary (RCA) artery' },
          ].map(({ key, vessel, defaultName }) => (
            <div key={key} className="py-2.5 border-b border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[14px] font-medium text-text">
                  {vessel.name || defaultName}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[14px] tabular-nums font-semibold text-text">
                    {Math.round(vessel.probability_pct)}%
                  </span>
                  <RiskLabel band={vessel.category} />
                </div>
              </div>
              <p className="text-[13px] leading-[20px] text-text-muted mt-1">
                {vessel.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Your measurements */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          4. Your measurements
        </h2>
        {report.your_measurements.groups.map((grp) => (
          <div key={grp.category_name} className="flex flex-col gap-1">
            <h3 className="text-[13px] leading-[20px] font-medium text-text-muted">
              {grp.category_name}
            </h3>
            <table className="w-full text-left border-collapse mb-2">
              <thead>
                <tr className="border-b border-border text-[13px] leading-[20px] font-medium text-text-muted">
                  <th className="py-1.5 px-2">Measurement</th>
                  <th className="py-1.5 px-2 text-right">Your value</th>
                  <th className="py-1.5 px-2 text-right">Typical range</th>
                  <th className="py-1.5 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {grp.items.map((item) => (
                  <tr key={item.plain_name} className="border-b border-border text-[13px] leading-[20px]">
                    <td className="py-1.5 px-2 text-text">{item.plain_name}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums font-medium text-text">{item.your_value}</td>
                    <td className="py-1.5 px-2 text-right text-text-muted">{item.typical_range}</td>
                    <td className="py-1.5 px-2 text-text-muted">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* 6. What influenced the prediction most */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          5. What influenced the prediction most
        </h2>
        <ul className="list-disc pl-5 text-[14px] leading-[22px] text-text flex flex-col gap-1">
          {report.what_influenced_the_prediction_most.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>

      {/* 7. About this estimate */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          6. About this estimate
        </h2>
        <p className="text-[14px] leading-[22px] text-text">
          {report.about_this_estimate}
        </p>
      </section>

      {/* 8. Mandatory Disclaimer */}
      <section className="border-t border-border pt-4">
        <p className="text-[13px] leading-[20px] text-text-muted">
          {report.disclaimer}
        </p>
      </section>
    </article>
  );
};

export default PatientReportView;
