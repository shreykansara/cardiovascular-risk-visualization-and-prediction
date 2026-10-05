import React from 'react';

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
  elementId?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  className = '',
  style,
  'aria-label': ariaLabel = 'Segmented options',
}: SegmentedControlProps<T>) {
  const heightToken = size === 'sm' ? 'var(--btn-sm)' : 'var(--btn-md)';
  const fontSize = size === 'sm' ? '12px' : '13px';
  const paddingX = size === 'sm' ? '12px' : '16px';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded overflow-hidden select-none ${className}`}
      style={{
        height: heightToken,
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--bds)',
        borderRadius: 'var(--radius)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {options.map((opt, idx) => {
        const isSelected = opt.id === value;
        return (
          <button
            key={opt.id}
            id={opt.elementId}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-pressed={isSelected}
            aria-label={opt.ariaLabel || opt.label}
            onClick={() => onChange(opt.id)}
            className="inline-flex items-center justify-center gap-1.5 transition-colors duration-100 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[var(--focus-offset)]"
            style={{
              height: '100%',
              padding: `0 ${paddingX}`,
              backgroundColor: isSelected ? 'var(--acc)' : 'transparent',
              color: isSelected ? 'var(--onacc)' : 'var(--ink)',
              fontFamily: 'var(--fs)',
              fontSize,
              fontWeight: isSelected ? 600 : 500,
              border: 'none',
              borderRight: idx < options.length - 1 ? '1px solid var(--bds)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: 'none',
              outline: 'none',
            }}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
