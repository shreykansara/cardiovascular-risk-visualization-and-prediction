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
      className="sheet w-full"
      style={{
        backgroundColor: 'var(--s-bg)',
        color: 'var(--s-ink)',
        border: '1px solid var(--s-bd)',
        borderRadius: '3px',
        maxWidth: '720px',
        margin: '16px auto',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--s-bd)', paddingBottom: '12px' }}>
        {/* Title 18px/600 */}
        <h1
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--s-ink)',
            margin: 0,
          }}
        >
          {report.report_header.report_title}
        </h1>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            fontFamily: 'var(--fs)',
            fontSize: '11px',
            color: 'var(--s-mut)',
            marginTop: '6px',
            gap: '8px',
          }}
        >
          <span>Model version: {report.report_header.model_version || 'Perfusion3D v1.0.0'}</span>
          <span>Date: {report.report_header.generation_date_time}</span>
          <span>Patient: {report.report_header.patient_age} years, {report.report_header.patient_sex}</span>
        </div>
      </header>

      {/* 1. Model Output Summary */}
      <section>
        <h2
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--s-ink)',
            margin: '16px 0 6px',
          }}
        >
          1. Model output summary
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--s-bd)' }}>
              <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'left' }}>Target</th>
              <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'left' }}>Vessel / condition</th>
              <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'right' }}>Probability</th>
              <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'left', paddingLeft: '12px' }}>Model classification</th>
              <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'left', paddingLeft: '12px' }}>Risk band</th>
            </tr>
          </thead>
          <tbody>
            {report.model_output_summary.targets.map((tgt) => {
              const probPct = tgt.probability_pct ?? 0;
              const probFraction = probPct > 1.0 ? probPct / 100 : probPct;
              const classification = tgt.model_classification || (tgt.predicted_status ? tgt.predicted_status : (probPct >= 48 ? 'Positive' : 'Negative'));
              const band = tgt.risk_band || tgt.category || riskLabel(probFraction);

              return (
                <tr key={tgt.target} style={{ borderBottom: '1px solid var(--s-bd)' }}>
                  <td style={{ fontFamily: 'var(--fs)', padding: '6px 0', color: 'var(--s-ink)', fontWeight: 500 }}>{tgt.target}</td>
                  <td style={{ fontFamily: 'var(--fs)', padding: '6px 0', color: 'var(--s-mut)' }}>{tgt.display_name}</td>
                  <td style={{ fontFamily: 'var(--fm)', padding: '6px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--s-ink)' }}>
                    {probPct.toFixed(1)}%
                  </td>
                  <td style={{ fontFamily: 'var(--fs)', padding: '6px 0 6px 12px', color: 'var(--s-ink)' }}>{classification}</td>
                  <td style={{ fontFamily: 'var(--fs)', padding: '6px 0 6px 12px' }}>
                    <RiskLabel band={band} variant="sheet" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* 2. Clinical measurements */}
      <section>
        <h2
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--s-ink)',
            margin: '16px 0 6px',
          }}
        >
          2. Clinical measurements
        </h2>
        {report.input_parameters.groups.map((grp) => (
          <div key={grp.group_name} style={{ marginBottom: '8px' }}>
            <h3
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--s-mut)',
                margin: '8px 0 4px',
              }}
            >
              {grp.group_name}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <tbody>
                {grp.parameters.map((p) => (
                  <tr key={p.name} style={{ borderBottom: '1px solid var(--s-bd)' }}>
                    <td style={{ fontFamily: 'var(--fs)', padding: '6px 0', color: 'var(--s-ink)' }}>{p.name}</td>
                    <td style={{ fontFamily: 'var(--fm)', padding: '6px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--s-ink)' }}>
                      {p.value} {p.unit}
                    </td>
                    <td style={{ fontFamily: 'var(--fm)', padding: '6px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--s-mut)' }}>
                      {p.reference_range}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* 3. Parameters Outside Typical Reference Range */}
      <section>
        <h2
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--s-ink)',
            margin: '16px 0 6px',
          }}
        >
          3. Parameters outside typical reference range
        </h2>
        {report.parameters_outside_reference_range && report.parameters_outside_reference_range.length > 0 ? (
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            {report.parameters_outside_reference_range.map((item, idx) => (
              <li
                key={idx}
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '13px',
                  lineHeight: '1.45',
                  color: 'var(--s-ink)',
                  margin: '4px 0',
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '13px',
              lineHeight: '1.45',
              color: 'var(--s-mut)',
              margin: '4px 0',
            }}
          >
            All physiological parameters are within typical reference intervals.
          </p>
        )}
      </section>

      {/* 4. Contributing Factors */}
      <section>
        <h2
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--s-ink)',
            margin: '16px 0 6px',
          }}
        >
          4. Factors influencing model output
        </h2>
        {report.model_attribution.targets.map((tgt) => (
          <div key={tgt.target} style={{ marginBottom: '10px' }}>
            <h3
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--s-mut)',
                margin: '8px 0 4px',
              }}
            >
              Target: {tgt.target}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--s-bd)' }}>
                  <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'left' }}>Factor</th>
                  <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'left', paddingLeft: '8px' }}>Patient value</th>
                  <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'left', paddingLeft: '8px' }}>Effect on probability</th>
                  <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'right' }}>SHAP value</th>
                </tr>
              </thead>
              <tbody>
                {tgt.top_features.map((f, fIdx) => (
                  <tr key={fIdx} style={{ borderBottom: '1px solid var(--s-bd)' }}>
                    <td style={{ fontFamily: 'var(--fs)', padding: '6px 0', color: 'var(--s-ink)', fontWeight: 500 }}>{f.feature}</td>
                    <td style={{ fontFamily: 'var(--fs)', padding: '6px 0 6px 8px', color: 'var(--s-mut)' }}>{f.patient_value ?? f.input_value ?? '—'}</td>
                    <td style={{ fontFamily: 'var(--fs)', padding: '6px 0 6px 8px', color: 'var(--s-ink)' }}>
                      {f.direction === 'INCREASES_RISK' ? 'Raises probability' : 'Lowers probability'}
                    </td>
                    <td style={{ fontFamily: 'var(--fm)', padding: '6px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--s-ink)' }}>
                      {f.shap_value.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* 5. Methodological Notes */}
      <section>
        <h2
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--s-ink)',
            margin: '16px 0 6px',
          }}
        >
          5. Methodological notes
        </h2>
        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
          {report.methodological_notes.map((note, idx) => (
            <li
              key={idx}
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                lineHeight: '1.45',
                color: 'var(--s-mut)',
                margin: '4px 0',
              }}
            >
              {note}
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Mandatory Disclaimer */}
      <section style={{ borderTop: '1px solid var(--s-bd)', paddingTop: '12px' }}>
        <p
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '11px',
            lineHeight: '1.4',
            color: 'var(--s-mut)',
            margin: '4px 0',
          }}
        >
          {report.disclaimer}
        </p>
      </section>
    </article>
  );
};

export default TechnicalReportView;
