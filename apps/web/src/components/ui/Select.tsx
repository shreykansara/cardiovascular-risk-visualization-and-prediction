import React, { useState } from 'react';

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
  id,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const autoId = id || React.useId();

  if (inline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {label && (
          <label
            htmlFor={autoId}
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '12px',
              color: 'var(--mut)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </label>
        )}
        <select
          id={autoId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            height: '34px',
            backgroundColor: 'var(--panel)',
            color: 'var(--ink)',
            border: isFocused ? '1px solid var(--acc)' : error ? '1px solid var(--high)' : '1px solid var(--bds)',
            borderRadius: '3px',
            padding: '0 8px',
            fontFamily: 'var(--fs)',
            fontSize: '13px',
            outline: isFocused ? '2px solid var(--acc)' : 'none',
            outlineOffset: '1px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            ...style,
          }}
          className={selectClassName}
          {...props}
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '11px',
              color: 'var(--high)',
              marginLeft: '6px',
            }}
          >
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: '3px' }}
        >
          <label
            htmlFor={autoId}
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
      )}

      <select
        id={autoId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          height: '34px',
          backgroundColor: 'var(--panel)',
          color: 'var(--ink)',
          border: isFocused ? '1px solid var(--acc)' : error ? '1px solid var(--high)' : '1px solid var(--bds)',
          borderRadius: '3px',
          padding: '0 8px',
          fontFamily: 'var(--fs)',
          fontSize: '13px',
          outline: isFocused ? '2px solid var(--acc)' : 'none',
          outlineOffset: '1px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          ...style,
        }}
        className={selectClassName}
        {...props}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div
        style={{
          fontFamily: 'var(--fs)',
          fontSize: '11px',
          color: 'var(--high)',
          minHeight: '16px',
          marginTop: '3px',
          opacity: error ? 1 : 0,
        }}
      >
        {error || '\u00A0'}
      </div>
    </div>
  );
};
