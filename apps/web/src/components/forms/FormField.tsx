/**
 * Single Clinical Form Field with Source Badge, Unit Hint, and Reference Range Marker
 * Implements strict type checking, min/max limits, and neutral out-of-range indicators.
 */

import React from 'react';
import type { FeatureDefinition } from '../../config/featureSchema';
import { isWithinReferenceRange } from '../../config/featureSchema';
import type { FieldMeta } from '../../types/wizard';
import { Info, AlertCircle } from 'lucide-react';

interface FormFieldProps {
  feature: FeatureDefinition;
  value: any;
  meta?: FieldMeta;
  onChange: (value: any) => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  feature,
  value,
  meta,
  onChange,
}) => {
  const isNumber = feature.type === 'number';
  const hasError = !!meta?.error && meta.touched;
  const withinRange = isWithinReferenceRange(feature, value);
  const isOutside = withinRange === false;
  const source = meta?.source || 'manual';

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/40 border border-white/[0.05] hover:border-white/[0.1] transition-all">
      {/* Label, Source Badge & Unit Hint */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`field-${feature.key}`}
          className="text-xs font-medium text-slate-200 flex items-center gap-1.5 truncate"
          title={feature.tooltip || feature.label}
        >
          <span className="truncate">{feature.label}</span>
          {feature.unit && (
            <span className="text-[10px] text-slate-400 font-mono">({feature.unit})</span>
          )}
        </label>

        {/* Source Badge (Task 3.4) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded border ${
              source === 'extracted'
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                : source === 'unverified'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {source}
            {meta?.confidence != null && ` (${Math.round(meta.confidence * 100)}%)`}
          </span>
        </div>
      </div>

      {/* Input Control */}
      <div className="relative">
        {isNumber ? (
          <input
            id={`field-${feature.key}`}
            type="number"
            min={feature.min}
            max={feature.max}
            step={feature.step || 1}
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Number(e.target.value);
              onChange(val);
            }}
            className={`w-full bg-slate-950/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono border focus:outline-none focus:ring-1 transition-all ${
              hasError
                ? 'border-rose-500/60 focus:ring-rose-500/50'
                : isOutside
                ? 'border-slate-700 focus:ring-cyan-500/50 focus:border-cyan-500/50'
                : 'border-white/[0.08] focus:ring-cyan-500/50 focus:border-cyan-500/50'
            }`}
          />
        ) : feature.type === 'toggle' ? (
          <div className="flex gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-white/[0.08]">
            {feature.options?.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all ${
                  String(value) === String(opt.value)
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <select
            id={`field-${feature.key}`}
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-950/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-sans cursor-pointer"
          >
            {feature.options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Reference Range & Inline Validation Hints */}
      <div className="flex items-center justify-between text-[10px] min-h-[16px] px-0.5">
        {hasError ? (
          <span className="text-rose-400 flex items-center gap-1 font-sans">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {meta?.error}
          </span>
        ) : isOutside ? (
          /* Neutral out-of-range marker (Task 3.3: not an alarm, not advice) */
          <span className="text-slate-400 font-mono flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Outside typical range: {feature.refDisplay}</span>
          </span>
        ) : (
          <span className="text-slate-400 font-mono">
            Ref: {feature.refDisplay}
          </span>
        )}
      </div>
    </div>
  );
};

export default FormField;
