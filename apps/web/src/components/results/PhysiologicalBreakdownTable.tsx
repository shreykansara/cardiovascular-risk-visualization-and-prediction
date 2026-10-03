/**
 * Physiological Feature Breakdown Table (Task 4.8)
 * Shows feature name, patient value, unit, reference range, within/outside range marker,
 * and relative contribution (% of total absolute SHAP) for the selected target.
 * Sortable by relative contribution, feature name, or value.
 */

import React, { useState, useMemo } from 'react';
import type { VesselExplanation } from '../../types/clinical';
import { FEATURE_SCHEMA, isWithinReferenceRange } from '../../config/featureSchema';
import { ArrowUpDown, Check, AlertCircle, Info } from 'lucide-react';

interface BreakdownRow {
  key: string;
  name: string;
  value: any;
  unit: string;
  refDisplay: string;
  withinRange: boolean | null;
  shapValue: number;
  absShap: number;
  relativePct: number;
  direction: 'INCREASES_RISK' | 'DECREASES_RISK';
}

interface PhysiologicalBreakdownTableProps {
  explanation?: VesselExplanation;
  patientInputs: Record<string, any>;
  targetName: string;
}

export const PhysiologicalBreakdownTable: React.FC<PhysiologicalBreakdownTableProps> = ({
  explanation,
  patientInputs,
  targetName,
}) => {
  const [sortField, setSortField] = useState<'relativePct' | 'name' | 'value'>('relativePct');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Build combined rows from FEATURE_SCHEMA + explanation SHAP features
  const rows: BreakdownRow[] = useMemo(() => {
    const topFeatures = explanation?.top_features || [];
    const totalAbsShap = topFeatures.reduce((acc, f) => acc + Math.abs(f.shap_value), 0) || 1.0;

    return FEATURE_SCHEMA.map((feat) => {
      const pVal = patientInputs[feat.key];
      const shapMatch = topFeatures.find((f) => f.feature_name === feat.key || f.clinical_label?.startsWith(feat.label));
      const shapVal = shapMatch ? shapMatch.shap_value : 0;
      const absShap = Math.abs(shapVal);
      const relativePct = (absShap / totalAbsShap) * 100;
      const within = isWithinReferenceRange(feat, pVal);

      return {
        key: feat.key,
        name: feat.label,
        value: pVal,
        unit: feat.unit,
        refDisplay: feat.refDisplay,
        withinRange: within,
        shapValue: shapVal,
        absShap,
        relativePct,
        direction: shapMatch?.impact || (shapVal >= 0 ? 'INCREASES_RISK' : 'DECREASES_RISK'),
      };
    });
  }, [explanation, patientInputs]);

  // Sort rows
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (sortField === 'relativePct') {
        return sortAsc ? a.relativePct - b.relativePct : b.relativePct - a.relativePct;
      }
      if (sortField === 'name') {
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortField === 'value') {
        const nA = Number(a.value) || 0;
        const nB = Number(b.value) || 0;
        return sortAsc ? nA - nB : nB - nA;
      }
      return 0;
    });
  }, [rows, sortField, sortAsc]);

  const handleToggleSort = (field: 'relativePct' | 'name' | 'value') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Physiological Breakdown & Risk Attribution</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {targetName}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Parameters mapped against reference ranges and relative SHAP model contribution.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
            <tr>
              <th
                className="p-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleToggleSort('name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Parameter</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="p-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleToggleSort('value')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Patient Value</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3">Reference Range</th>
              <th className="p-3">Status</th>
              <th
                className="p-3 cursor-pointer hover:text-white transition-colors text-right"
                onClick={() => handleToggleSort('relativePct')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Relative SHAP %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-slate-200">
            {sortedRows.map((r) => {
              const hasShap = r.relativePct > 0;
              const isIncrease = r.direction === 'INCREASES_RISK';

              return (
                <tr key={r.key} className="hover:bg-slate-800/40 transition-colors">
                  {/* Parameter Name */}
                  <td className="p-3 font-medium text-slate-200">
                    <span>{r.name}</span>
                    {r.unit && (
                      <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                        ({r.unit})
                      </span>
                    )}
                  </td>

                  {/* Patient Value */}
                  <td className="p-3 font-mono text-white font-semibold">
                    {String(r.value)}
                  </td>

                  {/* Reference Range */}
                  <td className="p-3 font-mono text-slate-400 text-[11px]">
                    {r.refDisplay}
                  </td>

                  {/* Within / Outside Range Marker (Task 4.8) */}
                  <td className="p-3 text-[11px] font-mono">
                    {r.withinRange === true ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Check className="w-3 h-3" />
                        <span>Within range</span>
                      </span>
                    ) : r.withinRange === false ? (
                      <span className="inline-flex items-center gap-1 text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span>Outside typical</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  {/* Relative Contribution (% of total absolute SHAP) */}
                  <td className="p-3 text-right font-mono">
                    {hasShap ? (
                      <span
                        className={`font-semibold ${
                          isIncrease ? 'text-rose-400' : 'text-cyan-400'
                        }`}
                      >
                        {r.relativePct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-600">&lt; 0.1%</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PhysiologicalBreakdownTable;
