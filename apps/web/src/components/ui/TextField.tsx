import React, { useState } from 'react';
import type { FieldMeta } from '../../types/wizard';
import { FieldSourceBadge } from '../forms/FieldSourceBadge';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  unit?: string;
  error?: string;
  referenceRange?: { min: number; max: number };
  referenceRangeText?: string;
  isOutOfRange?: boolean;
  source?: 'manual' | 'extracted' | 'unverified';
  meta?: FieldMeta;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  unit,
  error,
  referenceRange,
  referenceRangeText,
  isOutOfRange,
  source,
  meta,
  value,
  onFocus,
  onBlur,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const autoId = id || React.useId();

  // Determine out-of-range status
  let outOfRange = isOutOfRange;
  if (outOfRange === undefined && referenceRange && value !== undefined && value !== '') {
    const num = Number(value);
    if (!isNaN(num)) {
      outOfRange = num < referenceRange.min || num > referenceRange.max;
    }
  }

  // Format LO to HI
  const rangeStr = referenceRangeText || (referenceRange ? `${referenceRange.min} to ${referenceRange.max}` : null);
  const captionText = error
    ? error
    : outOfRange && rangeStr
    ? `Outside usual range (${rangeStr})`
    : rangeStr
    ? `Usual range: ${rangeStr}`
    : null;

  const showCaption = isFocused || Boolean(outOfRange) || Boolean(error);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Label above: 12px --mut, 3px gap */}
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
        {meta ? (
          <FieldSourceBadge meta={meta} />
        ) : source && source !== 'manual' ? (
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
        ) : null}
      </div>

      {/* Input wrapper: height 34px, border 1px solid --bds, radius 3px, background --panel, padding 0 8px, flex row */}
      <div
        className="flex items-center transition-colors"
        style={{
          height: '34px',
          border: isFocused ? '1px solid var(--acc)' : error ? '1px solid var(--high)' : '1px solid var(--bds)',
          borderRadius: '3px',
          backgroundColor: 'var(--panel)',
          padding: '0 8px',
          outline: isFocused ? '2px solid var(--acc)' : 'none',
          outlineOffset: '1px',
        }}
      >
        <input
          id={autoId}
          type={type}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--fm)',
            fontSize: '14px',
            fontWeight: 400,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
            padding: 0,
          }}
          {...props}
        />
        {unit && (
          <span
            style={{
              fontFamily: 'var(--fm)',
              fontSize: '12px',
              fontWeight: 400,
              color: 'var(--mut)',
              fontVariantNumeric: 'tabular-nums',
              marginLeft: '6px',
              flexShrink: 0,
              userSelect: 'none',
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Caption below: 11px --mut, min-height 16px, margin-top 3px, flex with 5px gap, 7px round dot in --mod */}
      <div
        style={{
          fontFamily: 'var(--fs)',
          fontSize: '11px',
          fontWeight: 400,
          color: error ? 'var(--high)' : 'var(--mut)',
          minHeight: '16px',
          marginTop: '3px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          opacity: showCaption ? 1 : 0,
          transition: 'opacity 120ms',
        }}
      >
        {outOfRange && !error && (
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--mod)',
              flexShrink: 0,
            }}
          />
        )}
        <span>{captionText || '\u00A0'}</span>
      </div>
    </div>
  );
};
