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
      className="mb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
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
