import React from 'react';
import { FEATURE_SCHEMA, isWithinReferenceRange } from '../../config/featureSchema';
import { DataTable } from '../ui/DataTable';

interface PhysiologicalBreakdownTableProps {
  patientInputs: Record<string, any>;
}

interface MeasurementRow {
  key: string;
  name: string;
  valueDisplay: string;
  referenceRange: string;
  status: string;
  isOutside: boolean;
}

export const PhysiologicalBreakdownTable: React.FC<PhysiologicalBreakdownTableProps> = ({
  patientInputs,
}) => {
  const rows: MeasurementRow[] = FEATURE_SCHEMA.map((feat) => {
    const rawVal = patientInputs[feat.key];
    const within = isWithinReferenceRange(feat, rawVal);
    const isOutside = within === false;

    let valueStr = rawVal !== undefined && rawVal !== null && rawVal !== '' ? String(rawVal) : '—';
    if (feat.type === 'toggle') {
      valueStr = String(rawVal) === '1' || String(rawVal) === 'Y' ? 'Present' : 'Absent';
    } else if (feat.unit && valueStr !== '—') {
      valueStr = `${valueStr} ${feat.unit}`;
    }

    return {
      key: feat.key,
      name: feat.label,
      valueDisplay: valueStr,
      referenceRange: feat.refDisplay || '—',
      status: isOutside ? 'Outside typical range' : 'Within range',
      isOutside,
    };
  });

  const columns = [
    { header: 'Measurement', accessor: 'name' as const },
    { header: 'Patient value', accessor: 'valueDisplay' as const, isNumeric: true },
    { header: 'Typical range', accessor: 'referenceRange' as const },
    {
      header: 'Status',
      accessor: (row: MeasurementRow) => (
        <span className={row.isOutside ? 'text-text-muted font-medium' : 'text-text-faint'}>
          {row.isOutside && <span className="inline-block w-1.5 h-1.5 rounded-full bg-risk-moderate mr-1.5" />}
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(item) => item.key}
      />
    </div>
  );
};

export default PhysiologicalBreakdownTable;
