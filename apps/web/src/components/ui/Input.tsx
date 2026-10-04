import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  unitSuffix?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  unitSuffix,
  id,
  className = '',
  disabled,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-slate-300 flex items-center justify-between"
        >
          <span>{label}</span>
          {unitSuffix && <span className="text-[11px] font-mono text-slate-500">{unitSuffix}</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <input
          id={inputId}
          disabled={disabled}
          className={`w-full bg-[#131a26] text-slate-100 text-sm px-3 py-1.5 rounded-md border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-500 disabled:opacity-50 disabled:bg-[#0b0f17] ${
            error
              ? 'border-red-500/80 focus:ring-red-500'
              : 'border-[#283548] hover:border-[#384961]'
          } ${unitSuffix ? 'pr-14' : ''} ${className}`}
          {...props}
        />
        {unitSuffix && (
          <div className="absolute right-2.5 pointer-events-none text-xs text-slate-400 font-mono">
            {unitSuffix}
          </div>
        )}
      </div>

      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-slate-500">{helperText}</span>
      ) : null}
    </div>
  );
};
