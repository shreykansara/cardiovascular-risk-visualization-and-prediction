import React from 'react';
import { RISK_BANDS } from '../../config/riskBands';

export const ColorScaleLegend: React.FC = () => {
  const bands = [
    {
      label: `${RISK_BANDS.Low.label}, ${RISK_BANDS.Low.rangeDisplay}`,
      color: 'var(--low)',
    },
    {
      label: `${RISK_BANDS.Moderate.label}, ${RISK_BANDS.Moderate.rangeDisplay}`,
      color: 'var(--mod)',
    },
    {
      label: `${RISK_BANDS.High.label}, ${RISK_BANDS.High.rangeDisplay}`,
      color: 'var(--high)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        marginTop: '8px',
      }}
    >
      {bands.map((band, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div
            style={{
              height: '3px',
              backgroundColor: band.color,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '11px',
              color: 'var(--mut)',
              lineHeight: '1.2',
            }}
          >
            {band.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ColorScaleLegend;
