import React from 'react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  source?: 'manual' | 'extracted' | 'unverified';
  error?: string;
  inline?: boolean;
  selectClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  source,
  error,
  inline = false,
  selectClassName = '',
  value,
  onChange,
  disabled,
  className = '',
  ...props
}) => {
  if (inline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {label && (
          <label className="text-[13px] leading-[20px] font-medium text-text-muted whitespace-nowrap">
            {label}
          </label>
        )}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`h-[30px] bg-page text-text border ${
            error ? 'border-risk-high' : 'border-border'
          } rounded px-2 text-[13px] leading-[20px] focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 cursor-pointer ${selectClassName}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-[12px] leading-[16px] text-risk-high ml-2">{error}</span>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
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
      )}

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full h-[36px] bg-page text-text border ${
          error ? 'border-risk-high' : 'border-border'
        } rounded px-3 text-[14px] leading-[22px] focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 cursor-pointer ${selectClassName}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <span className="text-[12px] leading-[16px] text-risk-high mt-1">{error}</span>}
    </div>
  );
};
