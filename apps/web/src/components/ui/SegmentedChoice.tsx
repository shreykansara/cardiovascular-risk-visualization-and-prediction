import React from 'react';

export interface SegmentedChoiceOption {
  label: string;
  value: string | number;
}

export interface SegmentedChoiceProps {
  label: string;
  options: [SegmentedChoiceOption, SegmentedChoiceOption] | SegmentedChoiceOption[];
  value: string | number;
  onChange: (value: any) => void;
  source?: 'manual' | 'extracted' | 'unverified';
  className?: string;
  disabled?: boolean;
}

export const SegmentedChoice: React.FC<SegmentedChoiceProps> = ({
  label,
  options,
  value,
  onChange,
  source,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[13px] leading-[20px] font-medium text-text-muted">
          {label}
        </label>
        {source && source !== 'manual' && (
          <span className="text-[11px] leading-[16px] px-1.5 py-0.5 border border-border text-text-faint rounded">
            {source === 'extracted' ? 'Extracted' : 'Unverified'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {options.map((opt) => {
          const isSelected = String(value) === String(opt.value);
          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`flex-1 h-[36px] px-3 border rounded text-[14px] leading-[22px] font-medium cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-accent-subtle text-accent border-accent'
                  : 'bg-page text-text border-border hover:bg-panel'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
