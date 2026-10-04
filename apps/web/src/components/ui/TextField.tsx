import React, { useState } from 'react';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  unit?: string;
  error?: string;
  referenceRange?: { min: number; max: number };
  referenceRangeText?: string;
  isOutOfRange?: boolean;
  source?: 'manual' | 'extracted' | 'unverified';
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  unit,
  error,
  referenceRange,
  referenceRangeText,
  isOutOfRange,
  source,
  value,
  onFocus,
  onBlur,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Check out-of-range if numeric value and referenceRange supplied
  let outOfRange = isOutOfRange;
  if (outOfRange === undefined && referenceRange && value !== undefined && value !== '') {
    const num = Number(value);
    if (!isNaN(num)) {
      outOfRange = num < referenceRange.min || num > referenceRange.max;
    }
  }

  const rangeDisplay = referenceRangeText || (referenceRange ? `${referenceRange.min} to ${referenceRange.max} ${unit || ''}`.trim() : null);

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

      <div className="relative flex items-center">
        <input
          className={`w-full h-[36px] bg-page text-text border ${
            error ? 'border-risk-high' : isFocused ? 'border-accent' : 'border-border'
          } rounded px-3 text-[14px] leading-[22px] focus:outline-none focus:ring-1 focus:ring-accent ${
            unit ? 'pr-12' : ''
          }`}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {unit && (
          <span className="absolute right-3 pointer-events-none text-[13px] leading-[20px] text-text-muted">
            {unit}
          </span>
        )}
      </div>

      {error ? (
        <span className="text-[12px] leading-[16px] text-risk-high mt-1">{error}</span>
      ) : (isFocused || outOfRange) && rangeDisplay ? (
        <div className="flex items-center gap-1.5 mt-1">
          {outOfRange && <span className="w-1.5 h-1.5 rounded-full bg-risk-moderate flex-shrink-0" />}
          <span className={`text-[12px] leading-[16px] ${outOfRange ? 'text-text-muted' : 'text-text-faint'}`}>
            {outOfRange ? `Outside typical range (${rangeDisplay})` : `Typical range: ${rangeDisplay}`}
          </span>
        </div>
      ) : null}
    </div>
  );
};
