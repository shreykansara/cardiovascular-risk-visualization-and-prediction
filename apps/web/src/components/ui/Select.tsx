import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  helperText,
  error,
  id,
  className = '',
  disabled,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-slate-300">
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          id={selectId}
          disabled={disabled}
          className={`w-full bg-[#131a26] text-slate-100 text-sm px-3 py-1.5 rounded-md border appearance-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-500 disabled:opacity-50 disabled:bg-[#0b0f17] pr-8 cursor-pointer ${
            error
              ? 'border-red-500/80 focus:ring-red-500'
              : 'border-[#283548] hover:border-[#384961]'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#131a26] text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Chevron */}
        <div className="absolute right-2.5 pointer-events-none text-slate-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-slate-500">{helperText}</span>
      ) : null}
    </div>
  );
};
