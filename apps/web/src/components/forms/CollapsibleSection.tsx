/**
 * Collapsible Clinical Section Container
 * Displays section title, completion counter, and expandable grid.
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
    <div className="w-full rounded-md bg-[#131a26] border border-[#283548] overflow-hidden transition-colors">
      {/* Section Header Accordion Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between gap-4 bg-[#1c2637] hover:bg-[#253248] transition-colors text-left select-none cursor-pointer border-b border-[#283548]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono shrink-0 ${
              isComplete
                ? 'bg-green-950/60 text-green-300 border border-green-800/60'
                : errorCount > 0
                ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                : 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
            }`}
          >
            {isComplete ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            ) : errorCount > 0 ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <span>{filledCount}</span>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">{section}</h2>
            <p className="text-[11px] text-slate-400 font-mono-numbers">
              {filledCount} of {totalCount} parameters configured
            </p>
          </div>
        </div>

        {/* Status Pill & Expand Caret */}
        <div className="flex items-center gap-2.5">
          <span
            className={`text-xs font-mono-numbers px-2 py-0.5 rounded-full border ${
              isComplete
                ? 'bg-green-950/60 text-green-300 border-green-800/60'
                : errorCount > 0
                ? 'bg-red-950/60 text-red-300 border-red-800/60'
                : 'bg-[#131a26] text-slate-400 border-[#283548]'
            }`}
          >
            {errorCount > 0
              ? `${errorCount} errors`
              : `${filledCount}/${totalCount} filled`}
          </span>

          <div className="p-1 rounded text-slate-400">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expandable Grid Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 bg-[#0b0f17]">
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
