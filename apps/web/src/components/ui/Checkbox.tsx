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
  style,
  ...props
}) => {
  const autoId = id || React.useId();

  return (
    <label
      htmlFor={autoId}
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      style={{
        fontFamily: 'var(--fs)',
        fontSize: '13px',
        color: 'var(--ink)',
        ...style,
      }}
    >
      <input
        type="checkbox"
        id={autoId}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '3px',
          border: '1px solid var(--bds)',
          accentColor: 'var(--acc)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outlineOffset: '1px',
        }}
        className="focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[var(--focus-offset)]"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
};
