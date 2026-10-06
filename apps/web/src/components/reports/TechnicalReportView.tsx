import React from 'react';
import type { TechnicalReportData } from '../../types/wizard';
import { RiskLabel } from '../ui/RiskLabel';
import { riskLabel } from '../../config/riskBands';
import { useWizardStore } from '../../store/useWizardStore';
import { FEATURE_SCHEMA } from '../../config/featureSchema';

interface TechnicalReportViewProps {
  report: TechnicalReportData;
}

function getResolvedPatientValue(
  f: {
    feature: string;
    patient_value?: string | number;
    input_value?: string | number;
    feature_value?: string | number;
    value?: string | number;
  },
  report: TechnicalReportData,
  inputs?: Record<string, any>
): string {
  // 1. Direct explicit non-empty, non-dash value in feature item
  for (const candidate of [f.patient_value, (f as any).feature_value, (f as any).value, f.input_value]) {
    if (candidate !== undefined && candidate !== null) {
      const s = String(candidate).trim();
      if (s !== '' && s !== '—' && s !== '-') {
        return s;
      }
    }
  }

  const featLower = (f.feature || '').toLowerCase();

  // 2. Look up from report.input_parameters groups
  if (report.input_parameters?.groups) {
    for (const grp of report.input_parameters.groups) {
      for (const p of grp.parameters) {
        const pLower = p.name.toLowerCase();
        const isMatch =
          featLower.includes(pLower) ||
          pLower.includes(featLower) ||
          (pLower === 'typical chest pain' && featLower.includes('typical')) ||
          (pLower === 'region rwma' && (featLower.includes('rwma') || featLower.includes('wall motion'))) ||
          (pLower === 'ef-tte' && (featLower.includes('ejection') || featLower.includes('ef'))) ||
          (pLower === 'st elevation' && featLower.includes('st elevation')) ||
          (pLower === 'st depression' && featLower.includes('st depression')) ||
          (pLower === 'tinversion' && (featLower.includes('t-wave') || featLower.includes('tinversion'))) ||
          (pLower === 'htn' && (featLower.includes('hypertension') || featLower.includes('htn'))) ||
          (pLower === 'dm' && (featLower.includes('diabetes') || featLower.includes('dm'))) ||
          (pLower === 'current smoker' && (featLower.includes('smoker') || featLower.includes('tobacco')));

        if (isMatch && p.value !== undefined && p.value !== null && String(p.value).trim() !== '' && String(p.value).trim() !== '—') {
          return p.unit ? `${p.value} ${p.unit}`.trim() : String(p.value);
        }
      }
    }
  }

  // 3. Fallback to wizard store inputs
  if (inputs) {
    for (const def of FEATURE_SCHEMA) {
      const keyLower = def.key.toLowerCase();
      const labelLower = def.label.toLowerCase();
      const isMatch =
        featLower.includes(keyLower) ||
        featLower.includes(labelLower) ||
        keyLower.includes(featLower) ||
        (def.key === 'Typical Chest Pain' && featLower.includes('typical')) ||
        (def.key === 'Region RWMA' && (featLower.includes('rwma') || featLower.includes('wall motion'))) ||
        (def.key === 'EF-TTE' && (featLower.includes('ejection') || featLower.includes('ef'))) ||
        (def.key === 'St Elevation' && featLower.includes('st elevation')) ||
        (def.key === 'St Depression' && featLower.includes('st depression')) ||
        (def.key === 'Tinversion' && (featLower.includes('t-wave') || featLower.includes('tinversion'))) ||
        (def.key === 'HTN' && (featLower.includes('hypertension') || featLower.includes('htn'))) ||
        (def.key === 'DM' && (featLower.includes('diabetes') || featLower.includes('dm'))) ||
        (def.key === 'Current Smoker' && (featLower.includes('smoker') || featLower.includes('tobacco'))) ||
        (def.key === 'EX-Smoker' && featLower.includes('ex-smoker')) ||
        (def.key === 'FH' && featLower.includes('family history')) ||
        (def.key === 'Obesity' && featLower.includes('obesity')) ||
        (def.key === 'CRF' && (featLower.includes('renal') || featLower.includes('crf'))) ||
        (def.key === 'CVA' && (featLower.includes('stroke') || featLower.includes('cva'))) ||
        (def.key === 'Function Class' && (featLower.includes('functional class') || featLower.includes('nyha')));

      if (isMatch) {
        const val = inputs[def.key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const valStr = String(val);
          if (def.key === 'Region RWMA') {
            const rwmaMap: Record<string, string> = {
              '0': 'Normal (0)',
              '1': 'Anterior (1)',
              '2': 'Inferior (2)',
              '3': 'Lateral (3)',
              '4': 'Septal (4)',
            };
            return rwmaMap[valStr] || valStr;
          }
          if (['DM', 'HTN', 'Current Smoker', 'EX-Smoker', 'FH', 'Edema', 'Typical Chest Pain', 'Q Wave', 'St Elevation', 'St Depression', 'Tinversion'].includes(def.key)) {
            return valStr === '1' ? 'Present (1)' : 'Absent (0)';
          }
          if (['Obesity', 'CRF', 'CVA', 'Airway disease', 'Thyroid Disease', 'CHF', 'DLP', 'Weak Peripheral Pulse', 'Lung rales', 'Systolic Murmur', 'Diastolic Murmur', 'Dyspnea', 'Atypical', 'Nonanginal', 'Exertional CP', 'LowTH Ang', 'LVH', 'Poor R Progression'].includes(def.key)) {
            return (valStr === 'Y' || valStr === '1') ? 'Present (Yes)' : 'Absent (No)';
          }
          if (def.key === 'Function Class') {
            return valStr !== '0' ? `Class ${valStr}` : 'Class 0';
          }
          if (def.unit) {
            return `${valStr} ${def.unit}`.trim();
          }
          return valStr;
        }
      }
    }
  }

  return '—';
}

export const TechnicalReportView: React.FC<TechnicalReportViewProps> = ({ report }) => {
  const storeInputs = useWizardStore((s) => s.inputs);
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
                    <td style={{ fontFamily: 'var(--fs)', padding: '6px 0 6px 8px', color: 'var(--s-ink)', fontWeight: 500 }}>
                      {getResolvedPatientValue(f, report, storeInputs)}
                    </td>
                    <td style={{ fontFamily: 'var(--fs)', padding: '6px 0 6px 8px', color: 'var(--s-ink)' }}>
                      {f.direction === 'INCREASES_RISK' || f.shap_value > 0 ? 'Raises probability' : 'Lowers probability'}
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
