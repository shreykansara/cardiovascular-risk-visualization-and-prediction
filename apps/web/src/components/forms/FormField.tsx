import React from 'react';
import type { FeatureDefinition } from '../../config/featureSchema';
import { isWithinReferenceRange } from '../../config/featureSchema';
import type { FieldMeta } from '../../types/wizard';
import { TextField } from '../ui/TextField';
import { NumberField } from '../ui/NumberField';
import { SegmentedChoice } from '../ui/SegmentedChoice';
import { Select } from '../ui/Select';

interface FormFieldProps {
  feature: FeatureDefinition;
  value: any;
  meta?: FieldMeta;
  onChange: (value: any) => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  feature,
  value,
  meta,
  onChange,
}) => {
  const isNumber = feature.type === 'number';
  const hasError = !!meta?.error && meta.touched;
  const withinRange = isWithinReferenceRange(feature, value);
  const isOutside = withinRange === false;
  // Task 2.4c: Show source chip ONLY when source is not "manual"
  const source = meta?.source && meta.source !== 'manual' ? meta.source : undefined;

  const rangeObj =
    feature.refLow !== undefined && feature.refHigh !== undefined
      ? { min: feature.refLow, max: feature.refHigh }
      : undefined;

  if (feature.type === 'select' && feature.options) {
    return (
      <Select
        id={`field-${feature.key}`}
        label={feature.label}
        source={source}
        meta={meta}
        value={value !== undefined && value !== null ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        options={feature.options}
        error={hasError ? meta?.error || undefined : undefined}
      />
    );
  }

  if (feature.type === 'toggle' && feature.options) {
    return (
      <SegmentedChoice
        label={feature.label}
        source={source}
        meta={meta}
        value={value !== undefined && value !== null ? value : ''}
        onChange={onChange}
        options={feature.options}
      />
    );
  }

  if (isNumber) {
    return (
      <NumberField
        id={`field-${feature.key}`}
        label={feature.label}
        unit={feature.unit}
        source={source}
        meta={meta}
        value={value !== undefined && value !== null ? value : ''}
        onChange={(e) => {
          const val = e.target.value === '' ? '' : Number(e.target.value);
          onChange(val);
        }}
        min={feature.min}
        max={feature.max}
        step={feature.step || 1}
        referenceRange={rangeObj}
        isOutOfRange={isOutside}
        error={hasError ? meta?.error || undefined : undefined}
      />
    );
  }

  return (
    <TextField
      id={`field-${feature.key}`}
      label={feature.label}
      unit={feature.unit}
      source={source}
      meta={meta}
      value={value !== undefined && value !== null ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      referenceRange={rangeObj}
      isOutOfRange={isOutside}
      error={hasError ? meta?.error || undefined : undefined}
    />
  );
};

export default FormField;
