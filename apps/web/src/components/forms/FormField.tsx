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
    <div className="flex flex-col gap-1.5 p-3 rounded-md bg-[#131a26] border border-[#283548] hover:border-[#384961] transition-colors">
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

        {/* Source Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              source === 'extracted'
                ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                : source === 'unverified'
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                : 'bg-[#1c2637] text-slate-400 border-[#283548]'
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
            className={`w-full bg-[#0b0f17] rounded-md px-3 py-1.5 text-xs text-slate-100 font-mono-numbers border focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors ${
              hasError
                ? 'border-red-500/80 focus:ring-red-500'
                : isOutside
                ? 'border-amber-500/50 focus:border-blue-500'
                : 'border-[#283548] hover:border-[#384961] focus:border-blue-500'
            }`}
          />
        ) : feature.type === 'toggle' ? (
          <div className="flex gap-1 bg-[#0b0f17] p-1 rounded-md border border-[#283548]">
            {feature.options?.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors select-none cursor-pointer ${
                  String(value) === String(opt.value)
                    ? 'bg-[#1c2637] text-white border border-[#384961] font-semibold shadow-sm'
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
            className="w-full bg-[#0b0f17] rounded-md px-3 py-1.5 text-xs text-slate-200 border border-[#283548] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-500 transition-colors font-sans cursor-pointer"
          >
            {feature.options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#131a26] text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Reference Range & Inline Validation Hints */}
      <div className="flex items-center justify-between text-[10px] min-h-[16px] px-0.5">
        {hasError ? (
          <span className="text-red-400 flex items-center gap-1 font-sans">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {meta?.error}
          </span>
        ) : isOutside ? (
          <span className="text-amber-400/90 font-mono-numbers flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>Outside typical range: {feature.refDisplay}</span>
          </span>
        ) : (
          <span className="text-slate-500 font-mono-numbers">
            Ref: {feature.refDisplay}
          </span>
        )}
      </div>
    </div>
  );
};

export default FormField;
