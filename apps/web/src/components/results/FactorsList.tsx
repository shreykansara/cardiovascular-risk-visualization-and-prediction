import React from 'react';
import type { FeatureAttribution } from '../../types/clinical';
import { Bar } from '../ui/Bar';

interface FactorsListProps {
  features?: FeatureAttribution[];
  inputs: Record<string, any>;
  className?: string;
}

interface HumanFactor {
  key: string;
  name: string;
  value: string;
  direction: 'raises' | 'lowers';
  magnitude: number;
}

export const FactorsList: React.FC<FactorsListProps> = ({
  features = [],
  inputs,
  className = '',
}) => {
  // Normalize and merge factors per human terms & merge one-hot pairs
  const mergedMap = new Map<string, HumanFactor>();

  for (const f of features) {
    const rawName = f.feature_name || '';
    const shap = f.shap_value ?? 0;
    const direction: 'raises' | 'lowers' = (f.impact === 'INCREASES_RISK' || shap > 0) ? 'raises' : 'lowers';
    const magnitude = Math.abs(shap);

    let factorKey = rawName;
    let factorName = f.clinical_label || rawName;
    let humanValue = f.feature_value !== undefined ? String(f.feature_value) : '';

    const lower = rawName.toLowerCase();

    if (lower.includes('typical') && lower.includes('pain')) {
      factorKey = 'typical_angina';
      factorName = 'Typical exertional angina';
      const val = inputs['Typical Chest Pain'] ?? inputs['typical_chest_pain'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'present' : 'absent';
    } else if (lower.includes('atypical')) {
      factorKey = 'atypical_angina';
      factorName = 'Atypical chest pain';
      const val = inputs['Atypical'] ?? inputs['atypical'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'present' : 'absent';
    } else if (lower.includes('nonanginal') || lower.includes('non_anginal') || lower.includes('non-anginal')) {
      factorKey = 'non_anginal';
      factorName = 'Non-anginal chest pain';
      const val = inputs['Nonanginal'] ?? inputs['nonanginal'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'present' : 'absent';
    } else if (lower.includes('dm') || lower.includes('diabetes')) {
      factorKey = 'diabetes';
      factorName = 'Diabetes mellitus';
      const val = inputs['DM'] ?? inputs['dm'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'present' : 'absent';
    } else if (lower.includes('htn') || lower.includes('hypertension')) {
      factorKey = 'hypertension';
      factorName = 'Hypertension';
      const val = inputs['HTN'] ?? inputs['htn'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'present' : 'absent';
    } else if (lower.includes('smoker')) {
      factorKey = 'smoking';
      factorName = 'Smoking status';
      const val = inputs['Current Smoker'] ?? inputs['Current_Smoker'] ?? inputs['smoker'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'active smoker' : 'non-smoker';
    } else if (lower.includes('st elevation') || lower.includes('st_elevation')) {
      factorKey = 'st_elevation';
      factorName = 'ST-segment elevation';
      const val = inputs['St Elevation'] ?? inputs['St_Elevation'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'present' : 'absent';
    } else if (lower.includes('st depression') || lower.includes('st_depression')) {
      factorKey = 'st_depression';
      factorName = 'ST-segment depression';
      const val = inputs['St Depression'] ?? inputs['St_Depression'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'present' : 'absent';
    } else if (lower.includes('tinversion') || lower.includes('t_inversion')) {
      factorKey = 'tinversion';
      factorName = 'T-wave inversion';
      const val = inputs['Tinversion'] ?? inputs['tinversion'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'present' : 'absent';
    } else if (lower.includes('q wave') || lower.includes('q_wave')) {
      factorKey = 'q_wave';
      factorName = 'Pathological Q wave';
      const val = inputs['Q Wave'] ?? inputs['Q_Wave'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'present' : 'absent';
    } else if (lower.includes('rwma')) {
      factorKey = 'rwma';
      factorName = 'Regional wall motion abnormality';
      const val = inputs['Region RWMA'] ?? inputs['Region_RWMA'];
      humanValue = String(val) === '1' || String(val) === 'Y' ? 'present' : 'absent';
    } else if (lower === 'age') {
      factorKey = 'age';
      factorName = 'Age';
      humanValue = `${inputs['Age'] ?? humanValue} years`;
    } else if (lower === 'bp') {
      factorKey = 'bp';
      factorName = 'Systolic blood pressure';
      humanValue = `${inputs['BP'] ?? humanValue} mmHg`;
    } else if (lower === 'pr') {
      factorKey = 'pr';
      factorName = 'Resting heart rate';
      humanValue = `${inputs['PR'] ?? humanValue} beats/min`;
    } else if (lower === 'fbs') {
      factorKey = 'fbs';
      factorName = 'Fasting blood sugar';
      humanValue = `${inputs['FBS'] ?? humanValue} mg/dL`;
    } else if (lower === 'ef-tte' || lower === 'ef_tte' || lower === 'ef') {
      factorKey = 'ef';
      factorName = 'Ejection fraction';
      humanValue = `${inputs['EF-TTE'] ?? inputs['EF_TTE'] ?? humanValue}%`;
    } else if (lower === 'tg') {
      factorKey = 'tg';
      factorName = 'Triglycerides';
      humanValue = `${inputs['TG'] ?? humanValue} mg/dL`;
    } else if (lower === 'cr') {
      factorKey = 'cr';
      factorName = 'Serum creatinine';
      humanValue = `${inputs['CR'] ?? humanValue} mg/dL`;
    } else if (lower === 'ldl') {
      factorKey = 'ldl';
      factorName = 'LDL cholesterol';
      humanValue = `${inputs['LDL'] ?? humanValue} mg/dL`;
    } else if (lower === 'hdl') {
      factorKey = 'hdl';
      factorName = 'HDL cholesterol';
      humanValue = `${inputs['HDL'] ?? humanValue} mg/dL`;
    } else {
      if (humanValue === '1' || humanValue === 'Y') humanValue = 'present';
      else if (humanValue === '0' || humanValue === 'N') humanValue = 'absent';
    }

    if (!mergedMap.has(factorKey)) {
      mergedMap.set(factorKey, {
        key: factorKey,
        name: factorName,
        value: humanValue,
        direction,
        magnitude,
      });
    }
  }

  // Up to 5 rows
  const factors = Array.from(mergedMap.values()).slice(0, 5);
  const maxMag = Math.max(...factors.map((f) => f.magnitude), 0.001);

  return (
    <div className={`w-full ${className}`}>
      {/* Title "Factors influencing this result" (14px/600) */}
      <h3
        style={{
          fontFamily: 'var(--fs)',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--ink)',
          margin: 0,
        }}
      >
        Factors influencing this result
      </h3>

      {factors.length === 0 ? (
        <p
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '12px',
            color: 'var(--mut)',
            marginTop: '8px',
          }}
        >
          No significant contributing factors identified.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {factors.map((f, idx) => {
            const isRaises = f.direction === 'raises';
            const barColor = isRaises ? 'var(--high)' : 'var(--acc)';
            const directionWord = isRaises ? 'raises probability' : 'lowers probability';
            const widthRatio = (f.magnitude / maxMag);

            return (
              <div
                key={f.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '2px 10px',
                  marginTop: '9px',
                  fontSize: '12px',
                }}
              >
                {/* Left: factor name with value in human terms */}
                <div
                  style={{
                    fontFamily: 'var(--fs)',
                    color: 'var(--ink)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.name}: {f.value}
                </div>

                {/* Right: direction word (--mut) */}
                <div
                  style={{
                    fontFamily: 'var(--fs)',
                    color: 'var(--mut)',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {directionWord}
                </div>

                {/* Thin Bar spanning both columns */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Bar
                    value={widthRatio}
                    variant="thin"
                    fillColor={barColor}
                    animationIndex={5 + idx}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FactorsList;
