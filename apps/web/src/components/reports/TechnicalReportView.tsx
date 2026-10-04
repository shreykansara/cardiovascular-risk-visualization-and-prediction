import React from 'react';
import type { TechnicalReportData } from '../../types/wizard';
import { RiskLabel } from '../ui/RiskLabel';
import { riskLabel } from '../../config/riskBands';

interface TechnicalReportViewProps {
  report: TechnicalReportData;
}

export const TechnicalReportView: React.FC<TechnicalReportViewProps> = ({ report }) => {
  return (
    <article
      id="printable-report-sheet"
      className="w-full max-w-[800px] bg-page border border-border rounded p-12 text-text flex flex-col gap-8 mx-auto"
    >
      {/* 1. Header */}
      <header className="border-b border-border pb-4">
        <h1 className="text-[20px] leading-[28px] font-semibold text-text mb-1">
          {report.report_header.report_title}
        </h1>
        <div className="flex flex-wrap items-center justify-between text-[13px] leading-[20px] text-text-muted mt-2">
          <span>Model version: {report.report_header.model_version || 'Perfusion3D v1.0.0'}</span>
          <span>Date: {report.report_header.generation_date_time}</span>
          <span>Patient: {report.report_header.patient_age} years, {report.report_header.patient_sex}</span>
        </div>
      </header>

      {/* 2. Model Output Summary */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          1. Model output summary
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[13px] leading-[20px] font-medium text-text-muted">
              <th className="py-2 px-2">Target</th>
              <th className="py-2 px-2">Vessel / condition</th>
              <th className="py-2 px-2 text-right">Probability</th>
              <th className="py-2 px-2">Model classification</th>
              <th className="py-2 px-2">Risk band</th>
            </tr>
          </thead>
          <tbody>
            {report.model_output_summary.targets.map((tgt) => {
              const probPct = tgt.probability_pct ?? 0;
              const probFraction = probPct > 1.0 ? probPct / 100 : probPct;
              const classification = tgt.model_classification || (tgt.predicted_status ? tgt.predicted_status : (probPct >= 48 ? 'Positive' : 'Negative'));
              const band = tgt.risk_band || tgt.category || riskLabel(probFraction);

              return (
                <tr key={tgt.target} className="border-b border-border">
                  <td className="py-2 px-2 text-[14px] font-medium text-text">{tgt.target}</td>
                  <td className="py-2 px-2 text-[14px] text-text-muted">{tgt.display_name}</td>
                  <td className="py-2 px-2 text-[14px] text-right tabular-nums text-text font-medium">
                    {probPct.toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-[14px] text-text">{classification}</td>
                  <td className="py-2 px-2 text-[14px]">
                    <RiskLabel band={band} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* 3. Input Parameters */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          2. Clinical measurements
        </h2>
        {report.input_parameters.groups.map((grp) => (
          <div key={grp.group_name} className="flex flex-col gap-1">
            <h3 className="text-[13px] leading-[20px] font-medium text-text-muted">
              {grp.group_name}
            </h3>
            <table className="w-full text-left border-collapse mb-2">
              <tbody>
                {grp.parameters.map((p) => (
                  <tr key={p.name} className="border-b border-border text-[13px] leading-[20px]">
                    <td className="py-1.5 px-2 text-text">{p.name}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums font-medium text-text">
                      {p.value} {p.unit}
                    </td>
                    <td className="py-1.5 px-2 text-right text-text-muted">
                      {p.reference_range}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* 4. Parameters Outside Typical Range */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          3. Parameters outside typical reference range
        </h2>
        {report.parameters_outside_reference_range && report.parameters_outside_reference_range.length > 0 ? (
          <ul className="list-disc pl-5 text-[14px] leading-[22px] text-text flex flex-col gap-1">
            {report.parameters_outside_reference_range.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] leading-[22px] text-text-muted">
            All physiological parameters are within typical reference intervals.
          </p>
        )}
      </section>

      {/* 5. Contributing Factors & SHAP Attribution */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          4. Factors influencing model output
        </h2>
        {report.model_attribution.targets.map((tgt) => (
          <div key={tgt.target} className="flex flex-col gap-1 mb-3">
            <h3 className="text-[13px] leading-[20px] font-medium text-text-muted">
              Target: {tgt.target}
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[13px] leading-[20px] font-medium text-text-muted">
                  <th className="py-1.5 px-2">Factor</th>
                  <th className="py-1.5 px-2">Patient value</th>
                  <th className="py-1.5 px-2">Effect on probability</th>
                  <th className="py-1.5 px-2 text-right">SHAP value</th>
                </tr>
              </thead>
              <tbody>
                {tgt.top_features.map((f, fIdx) => (
                  <tr key={fIdx} className="border-b border-border text-[13px] leading-[20px]">
                    <td className="py-1.5 px-2 text-text font-medium">{f.feature}</td>
                    <td className="py-1.5 px-2 text-text-muted">{f.patient_value ?? f.input_value ?? '—'}</td>
                    <td className="py-1.5 px-2">
                      <span className={f.direction === 'INCREASES_RISK' ? 'text-risk-high font-medium' : 'text-accent font-medium'}>
                        {f.direction === 'INCREASES_RISK' ? 'Raises probability' : 'Lowers probability'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-text">
                      {f.shap_value.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* 6. Methodological Notes */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] leading-[24px] font-semibold text-text pb-1 border-b border-border">
          5. Methodological notes
        </h2>
        <ul className="list-disc pl-5 text-[13px] leading-[20px] text-text-muted flex flex-col gap-1">
          {report.methodological_notes.map((note, idx) => (
            <li key={idx}>{note}</li>
          ))}
        </ul>
      </section>

      {/* 7. Mandatory Disclaimer */}
      <section className="border-t border-border pt-4">
        <p className="text-[13px] leading-[20px] text-text-muted">
          {report.disclaimer}
        </p>
      </section>
    </article>
  );
};

export default TechnicalReportView;
