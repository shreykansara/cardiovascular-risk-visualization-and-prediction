import React, { useState } from 'react';
import type { FeatureDefinition } from '../../config/featureSchema';
import type { FieldMeta } from '../../types/wizard';
import { FIELD_HELP } from '../../content/glossary';
import { HelpTip } from '../ui/HelpTip';

export interface FieldAnatomyProps {
  feature: FeatureDefinition;
  value: any;
  meta?: FieldMeta;
  showAllErrors?: boolean;
  onChange: (value: any) => void;
}

export function getFieldErrorMessage(feature: FeatureDefinition, value: any): string | null {
  const isEmpty = value === undefined || value === null || value === '';
  if (feature.required && isEmpty) {
    return 'Required';
  }
  if (isEmpty) {
    return null;
  }
  if (feature.type === 'number') {
    const n = Number(value);
    if (isNaN(n)) {
      return 'Enter a number';
    }
    if (feature.min !== undefined && n < feature.min) {
      const unitStr = feature.unit ? ` ${feature.unit}` : '';
      return `Enter a value between ${feature.min} and ${feature.max}${unitStr}`;
    }
    if (feature.max !== undefined && n > feature.max) {
      const unitStr = feature.unit ? ` ${feature.unit}` : '';
      return `Enter a value between ${feature.min} and ${feature.max}${unitStr}`;
    }
  }
  return null;
}

export const FieldAnatomy: React.FC<FieldAnatomyProps> = ({
  feature,
  value,
  meta,
  showAllErrors = false,
  onChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);

  const isNumber = feature.type === 'number';
  const autoId = `field-${feature.key}`;

  // Error evaluation (Task 4.6)
  const errorMessage = getFieldErrorMessage(feature, value);
  const showError = (isBlurred || showAllErrors || meta?.touched) && Boolean(errorMessage);

  // Range evaluation (NUMBER fields only)
  let isOutsideTypical = false;
  let rangeStr = '';
  if (isNumber && feature.refLow !== undefined && feature.refHigh !== undefined) {
    rangeStr = `${feature.refLow} to ${feature.refHigh}`;
    if (value !== undefined && value !== null && value !== '' && !errorMessage) {
      const n = Number(value);
      if (!isNaN(n) && (n < feature.refLow || n > feature.refHigh)) {
        isOutsideTypical = true;
      }
    }
  }

  // Row 1: Source chip (only when not manual)
  const source = meta?.source && meta.source !== 'manual' ? meta.source : null;
  const helpText = FIELD_HELP[feature.key];

  return (
    <div className="flex flex-col w-full">
      {/* Row 1: Label, HelpTip and Source chip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '3px',
          minHeight: '18px',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <label
            htmlFor={autoId}
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '12px',
              color: 'var(--mut)',
              lineHeight: 1.2,
            }}
          >
            {feature.label}
          </label>
          {helpText && (
            <HelpTip text={helpText} label={`About ${feature.label}`} />
          )}
        </div>
        {source && (
          <span
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '11px',
              padding: '0 6px',
              border: '1px solid var(--bds)',
              borderRadius: '3px',
              color: 'var(--mut)',
              lineHeight: '16px',
            }}
          >
            {source === 'extracted' ? 'From report' : 'Check'}
          </span>
        )}
      </div>

      {/* Row 2: Control (34px high) */}
      <div style={{ height: '34px', position: 'relative' }}>
        {isNumber ? (
          /* NumberField */
          <div
            style={{
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--panel)',
              border: showError
                ? '1px solid var(--high)'
                : isFocused
                ? '1px solid var(--acc)'
                : '1px solid var(--bds)',
              borderRadius: '3px',
              padding: '0 8px',
              outline: isFocused ? 'var(--focus)' : 'none',
              outlineOffset: 'var(--focus-offset)',
              transition: 'border-color 120ms',
            }}
          >
            <input
              id={autoId}
              type="number"
              value={value !== undefined && value !== null ? value : ''}
              min={feature.min}
              max={feature.max}
              step={feature.step || 1}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                setIsBlurred(true);
              }}
              onChange={(e) => {
                const v = e.target.value === '' ? '' : Number(e.target.value);
                onChange(v);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                height: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--fm)',
                fontSize: '14px',
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
                padding: 0,
              }}
            />
            {feature.unit && (
              <span
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '12px',
                  color: 'var(--mut)',
                  fontVariantNumeric: 'tabular-nums',
                  marginLeft: '6px',
                  flexShrink: 0,
                  userSelect: 'none',
                }}
              >
                {feature.unit}
              </span>
            )}
          </div>
        ) : feature.type === 'toggle' && feature.options ? (
          /* SegmentedChoice (Yes/No and Male/Female) */
          <div style={{ display: 'flex', alignItems: 'center', height: '34px' }}>
            {feature.options.map((opt, idx) => {
              const hasValue = value !== undefined && value !== null && value !== '';
              const isSelected = hasValue && String(value) === String(opt.value);
              const isFirst = idx === 0;
              const isLast = idx === (feature.options?.length ?? 0) - 1;

              const borderRadius = isFirst
                ? '3px 0 0 3px'
                : isLast
                ? '0 3px 3px 0'
                : '0';

              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  id={isFirst ? autoId : undefined}
                  aria-pressed={isSelected ? 'true' : 'false'}
                  onClick={() => onChange(opt.value)}
                  onBlur={() => setIsBlurred(true)}
                  style={{
                    flex: 1,
                    height: '34px',
                    padding: '0 12px',
                    borderRadius,
                    border: showError
                      ? '1px solid var(--high)'
                      : isSelected
                      ? '1px solid var(--acc)'
                      : '1px solid var(--bds)',
                    marginLeft: isFirst ? '0' : '-1px',
                    zIndex: isSelected ? 2 : 1,
                    backgroundColor: isSelected ? 'var(--hov)' : 'var(--panel)',
                    color: isSelected ? 'var(--acc)' : 'var(--ink)',
                    fontFamily: 'var(--fs)',
                    fontSize: '13px',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 120ms, background-color 120ms',
                  }}
                  className="focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[var(--focus-offset)]"
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          /* Categorical Select */
          <select
            id={autoId}
            value={value !== undefined && value !== null ? value : ''}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setIsBlurred(true);
            }}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              height: '34px',
              backgroundColor: 'var(--panel)',
              color: 'var(--ink)',
              border: showError
                ? '1px solid var(--high)'
                : isFocused
                ? '1px solid var(--acc)'
                : '1px solid var(--bds)',
              borderRadius: '3px',
              padding: '0 8px',
              fontFamily: 'var(--fs)',
              fontSize: '13px',
              outline: isFocused ? 'var(--focus)' : 'none',
              outlineOffset: 'var(--focus-offset)',
              cursor: 'pointer',
            }}
          >
            <option value="" disabled>Select</option>
            {feature.options?.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Row 3: Caption (min-height 16px, margin-top 3px, 11px, flex, gap 5px) */}
      <div
        style={{
          minHeight: '16px',
          marginTop: '3px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontFamily: 'var(--fs)',
          fontSize: '11px',
        }}
      >
        {showError ? (
          /* Errors replace the caption: 7px --high dot + message in --ink 11px */
          <>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--high)',
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--ink)' }}>{errorMessage}</span>
          </>
        ) : isNumber && isOutsideTypical ? (
          /* NUMBER fields only: outside typical range with 7px --mod dot */
          <>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--mod)',
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--mut)' }}>
              Outside usual range ({rangeStr})
            </span>
          </>
        ) : isNumber && isFocused && rangeStr ? (
          /* NUMBER fields only: usual range shown while focused */
          <span style={{ color: 'var(--mut)' }}>
            Usual range: {rangeStr}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default FieldAnatomy;
