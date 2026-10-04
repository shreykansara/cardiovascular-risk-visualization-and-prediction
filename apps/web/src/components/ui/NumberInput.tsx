import React from 'react';

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unitSuffix?: string;
  refRangeMin?: number;
  refRangeMax?: number;
  helperText?: string;
  error?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unitSuffix,
  refRangeMin,
  refRangeMax,
  helperText,
  error,
  id,
  className = '',
  disabled,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const isOutOfRange =
    refRangeMin !== undefined &&
    refRangeMax !== undefined &&
    (value < refRangeMin || value > refRangeMax);

  const handleStep = (direction: 1 | -1) => {
    if (disabled) return;
    const nextVal = Math.round((value + direction * step) * 100) / 100;
    if (min !== undefined && nextVal < min) return;
    if (max !== undefined && nextVal > max) return;
    onChange(nextVal);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <span>{label}</span>
            {isOutOfRange && (
              <span
                className="w-2 h-2 rounded-full bg-amber-500 inline-block"
                title={`Outside typical reference range (${refRangeMin} - ${refRangeMax})`}
              />
            )}
          </label>
        )}
        {unitSuffix && <span className="text-[11px] font-mono text-slate-500">{unitSuffix}</span>}
      </div>

      <div className="relative flex items-center w-full">
        <input
          id={inputId}
          type="number"
          value={isNaN(value) ? '' : value}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            onChange(isNaN(parsed) ? 0 : parsed);
          }}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`w-full bg-[#131a26] text-slate-100 font-mono-numbers text-sm px-3 py-1.5 rounded-md border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-500 disabled:opacity-50 disabled:bg-[#0b0f17] pr-14 ${
            error
              ? 'border-red-500/80 focus:ring-red-500'
              : isOutOfRange
              ? 'border-amber-500/50'
              : 'border-[#283548] hover:border-[#384961]'
          } ${className}`}
          {...props}
        />

        {/* Step buttons */}
        <div className="absolute right-1 flex items-center gap-0.5">
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || (min !== undefined && value <= min)}
            onClick={() => handleStep(-1)}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1c2637] disabled:opacity-30 disabled:hover:bg-transparent"
          >
            -
          </button>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || (max !== undefined && value >= max)}
            onClick={() => handleStep(1)}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1c2637] disabled:opacity-30 disabled:hover:bg-transparent"
          >
            +
          </button>
        </div>
      </div>

      {/* Helper text or reference range */}
      <div className="flex items-center justify-between text-[11px]">
        {error ? (
          <span className="text-red-400">{error}</span>
        ) : (
          <span className="text-slate-500">{helperText}</span>
        )}
        {refRangeMin !== undefined && refRangeMax !== undefined && (
          <span className="text-slate-500 font-mono">
            Ref: {refRangeMin} – {refRangeMax}
          </span>
        )}
      </div>
    </div>
  );
};
