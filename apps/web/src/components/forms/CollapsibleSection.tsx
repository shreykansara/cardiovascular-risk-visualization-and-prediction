import React from 'react';
import type { FeatureDefinition, FeatureSection } from '../../config/featureSchema';
import type { FieldMeta } from '../../types/wizard';
import { FormField } from './FormField';
import { Section } from '../ui/Section';

interface CollapsibleSectionProps {
  section: FeatureSection;
  features: FeatureDefinition[];
  inputs: Record<string, any>;
  fieldMeta: Record<string, FieldMeta>;
  onFieldChange: (key: any, value: any) => void;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  section,
  features,
  inputs,
  fieldMeta,
  onFieldChange,
  defaultOpen = true,
}) => {
  const totalCount = features.length;
  const filledCount = features.filter((f) => {
    const val = inputs[f.key];
    return val !== undefined && val !== null && val !== '';
  }).length;

  const countString = `${filledCount} of ${totalCount}`;

  return (
    <Section
      title={section}
      count={countString}
      collapsible
      defaultOpen={defaultOpen}
    >
      {/* Field grid: 3 columns at >=900px, 2 columns at 600 to 899px, 1 column below 600px; gap 10px */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '10px',
          paddingTop: '6px',
        }}
        className="field-grid"
      >
        {features.map((feature) => (
          <FormField
            key={feature.key}
            feature={feature}
            value={inputs[feature.key]}
            meta={fieldMeta[feature.key]}
            onChange={(val) => onFieldChange(feature.key, val)}
          />
        ))}
      </div>
    </Section>
  );
};

export default CollapsibleSection;
