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
      {/* Label above */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '3px' }}
      >
        <label
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '12px',
            fontWeight: 400,
            color: 'var(--mut)',
            lineHeight: '1.2',
          }}
        >
          {label}
        </label>
        {source && source !== 'manual' && (
          <span
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '11px',
              padding: '0 4px',
              border: '1px solid var(--bd)',
              borderRadius: '3px',
              color: 'var(--mut)',
              lineHeight: '16px',
            }}
          >
            {source === 'extracted' ? 'Extracted' : 'Unverified'}
          </span>
        )}
      </div>

      {/* Two adjacent bordered buttons: 34px high, outer corners 3px radius only, 13px */}
      <div className="flex items-center">
        {options.map((opt, idx) => {
          const isSelected = String(value) === String(opt.value);
          const isFirst = idx === 0;
          const isLast = idx === options.length - 1;

          const borderRadius = isFirst
            ? '3px 0 0 3px'
            : isLast
            ? '0 3px 3px 0'
            : '0';

          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              style={{
                flex: 1,
                height: '34px',
                padding: '0 12px',
                borderRadius,
                border: isSelected ? '1px solid var(--acc)' : '1px solid var(--bds)',
                marginLeft: isFirst ? '0' : '-1px',
                zIndex: isSelected ? 1 : 0,
                backgroundColor: isSelected ? 'var(--hov)' : 'var(--panel)',
                color: isSelected ? 'var(--acc)' : 'var(--ink)',
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                fontWeight: isSelected ? 600 : 400,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                outline: 'none',
                transition: 'all 120ms',
              }}
              className="focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[var(--focus-offset)]"
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Spacer to match Field caption height */}
      <div style={{ minHeight: '16px', marginTop: '3px' }} />
    </div>
  );
};
