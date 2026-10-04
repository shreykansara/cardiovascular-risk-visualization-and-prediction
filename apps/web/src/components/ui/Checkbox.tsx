import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled,
  className = '',
  id,
  ...props
}) => {
  const autoId = id || React.useId();

  return (
    <label
      htmlFor={autoId}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <input
        type="checkbox"
        id={autoId}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-2 focus:ring-2 cursor-pointer accent-accent"
        {...props}
      />
      {label && <span className="text-[14px] leading-[22px] text-text">{label}</span>}
    </label>
  );
};
