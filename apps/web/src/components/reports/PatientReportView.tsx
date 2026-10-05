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
      className="sheet wipe w-full"
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
        '--i': 0,
      } as React.CSSProperties}
    >
      {/* Header: Title and Date */}
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
          {report.title_and_date.title}
        </h1>
        <p
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '11px',
            color: 'var(--s-mut)',
            marginTop: '6px',
            margin: '6px 0 0',
          }}
        >
          Date: {report.title_and_date.generation_date}
        </p>
      </header>

      {/* 1. What this summary is */}
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
          1. What this summary is
        </h2>
        <p
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '13px',
            lineHeight: '1.45',
            color: 'var(--s-ink)',
            margin: '4px 0',
          }}
        >
          {report.what_this_summary_is}
        </p>
      </section>

      {/* 2. Overall picture */}
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
          2. Overall picture
        </h2>
        <p
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '13px',
            lineHeight: '1.45',
            color: 'var(--s-ink)',
            margin: '4px 0',
          }}
        >
          {report.overall_picture}
        </p>
      </section>

      {/* 3. Your three main heart arteries */}
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
          3. Your three main heart arteries
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { key: 'lad', vessel: report.your_three_main_heart_arteries.lad, defaultName: 'Left anterior descending (LAD) artery' },
            { key: 'lcx', vessel: report.your_three_main_heart_arteries.lcx, defaultName: 'Left circumflex (LCX) artery' },
            { key: 'rca', vessel: report.your_three_main_heart_arteries.rca, defaultName: 'Right coronary (RCA) artery' },
          ].map(({ key, vessel, defaultName }) => (
            <div
              key={key}
              style={{
                padding: '8px 0',
                borderBottom: '1px solid var(--s-bd)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--fs)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--s-ink)',
                  }}
                >
                  {vessel.name || defaultName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--fm)',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--s-ink)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {Math.round(vessel.probability_pct)}%
                  </span>
                  <RiskLabel band={vessel.category} variant="sheet" />
                </div>
              </div>
              <p
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  color: 'var(--s-mut)',
                  margin: '2px 0 0',
                }}
              >
                {vessel.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Your measurements */}
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
          4. Your measurements
        </h2>
        {report.your_measurements.groups.map((grp) => (
          <div key={grp.category_name} style={{ marginBottom: '8px' }}>
            <h3
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--s-mut)',
                margin: '8px 0 4px',
              }}
            >
              {grp.category_name}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--s-bd)' }}>
                  <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'left' }}>Measurement</th>
                  <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'right' }}>Your value</th>
                  <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'right' }}>Typical range</th>
                  <th style={{ fontFamily: 'var(--fs)', fontWeight: 500, color: 'var(--s-mut)', padding: '5px 0', textAlign: 'left', paddingLeft: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {grp.items.map((item) => (
                  <tr key={item.plain_name} style={{ borderBottom: '1px solid var(--s-bd)' }}>
                    <td style={{ fontFamily: 'var(--fs)', padding: '6px 0', color: 'var(--s-ink)' }}>{item.plain_name}</td>
                    <td style={{ fontFamily: 'var(--fm)', padding: '6px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--s-ink)' }}>{item.your_value}</td>
                    <td style={{ fontFamily: 'var(--fm)', padding: '6px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--s-mut)' }}>{item.typical_range}</td>
                    <td style={{ fontFamily: 'var(--fs)', padding: '6px 0 6px 12px', color: 'var(--s-mut)' }}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* 5. What influenced the prediction most */}
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
          5. What influenced the prediction most
        </h2>
        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
          {report.what_influenced_the_prediction_most.map((item, idx) => (
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
      </section>

      {/* 6. About this estimate */}
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
          6. About this estimate
        </h2>
        <p
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '13px',
            lineHeight: '1.45',
            color: 'var(--s-ink)',
            margin: '4px 0',
          }}
        >
          {report.about_this_estimate}
        </p>
      </section>

      {/* 7. Mandatory Disclaimer */}
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

export default PatientReportView;
