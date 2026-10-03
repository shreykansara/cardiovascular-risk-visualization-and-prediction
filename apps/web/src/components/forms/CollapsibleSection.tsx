/**
 * Collapsible Clinical Section Container
 * Displays section title, completion counter (e.g., '5/5 filled'), and expandable grid.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import type { FeatureDefinition, FeatureSection } from '../../config/featureSchema';
import type { FieldMeta } from '../../types/wizard';
import { FormField } from './FormField';

interface CollapsibleSectionProps {
  section: FeatureSection;
  features: FeatureDefinition[];
  inputs: Record<string, any>;
  fieldMeta: Record<string, FieldMeta>;
  onFieldChange: (key: string, value: any) => void;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  section,
  features,
  inputs,
  fieldMeta,
  onFieldChange,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Compute filled and valid counts
  const totalCount = features.length;
  const filledCount = features.filter((f) => {
    const val = inputs[f.key];
    return val !== undefined && val !== null && val !== '';
  }).length;

  const errorCount = features.filter((f) => !!fieldMeta[f.key as string]?.error).length;
  const isComplete = filledCount === totalCount && errorCount === 0;

  return (
    <div className="w-full rounded-2xl bg-slate-900/40 border border-white/[0.07] overflow-hidden transition-all duration-200">
      {/* Section Header Accordion Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between gap-4 bg-slate-900/60 hover:bg-slate-800/60 transition-colors text-left select-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono shrink-0 ${
              isComplete
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : errorCount > 0
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            {isComplete ? (
              <CheckCircle className="w-4 h-4" />
            ) : errorCount > 0 ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <span>{filledCount}</span>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">{section}</h2>
            <p className="text-[11px] text-slate-400 font-mono">
              {filledCount} of {totalCount} parameters configured
            </p>
          </div>
        </div>

        {/* Status Pill & Expand Caret */}
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
              isComplete
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : errorCount > 0
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-slate-800 text-slate-400 border-white/[0.08]'
            }`}
          >
            {errorCount > 0
              ? `${errorCount} errors`
              : `${filledCount}/${totalCount} filled`}
          </span>

          <div className="p-1 rounded-lg bg-slate-800/80 text-slate-400">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expandable Grid Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-slate-950/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {features.map((feat) => (
              <FormField
                key={feat.key}
                feature={feat}
                value={inputs[feat.key]}
                meta={fieldMeta[feat.key as string]}
                onChange={(val) => onFieldChange(feat.key as string, val)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
