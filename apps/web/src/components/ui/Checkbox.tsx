import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  helperText?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  helperText,
  id,
  className = '',
  disabled,
  checked,
  ...props
}) => {
  const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex items-start gap-2.5 select-none">
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className={`w-4 h-4 rounded bg-[#131a26] border border-[#283548] text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-[#0b0f17] disabled:opacity-50 cursor-pointer ${className}`}
          {...props}
        />
      </div>
      <div className="flex flex-col">
        <label
          htmlFor={checkboxId}
          className={`text-xs font-medium cursor-pointer ${
            disabled ? 'text-slate-500 cursor-not-allowed' : 'text-slate-300 hover:text-white'
          }`}
        >
          {label}
        </label>
        {helperText && <span className="text-[11px] text-slate-500">{helperText}</span>}
      </div>
    </div>
  );
};
