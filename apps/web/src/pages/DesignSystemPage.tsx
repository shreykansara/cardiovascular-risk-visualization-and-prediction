import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { NumberField } from '../components/ui/NumberField';
import { SegmentedChoice } from '../components/ui/SegmentedChoice';
import { Checkbox } from '../components/ui/Checkbox';
import { Select } from '../components/ui/Select';
import { Section } from '../components/ui/Section';
import { DataTable } from '../components/ui/DataTable';
import { RiskLabel } from '../components/ui/RiskLabel';
import { Chip } from '../components/ui/Chip';
import { Tabs } from '../components/ui/Tabs';
import { FooterDisclaimer } from '../components/ui/FooterDisclaimer';
import { Skeleton } from '../components/ui/Skeleton';

export const DesignSystemPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('components');
  const [textVal, setTextVal] = useState('58');
  const [choiceVal, setChoiceVal] = useState('Y');
  const [checkVal, setCheckVal] = useState(true);

  const sampleTableData = [
    { target: 'CAD', vessel: 'Coronary artery disease (overall)', prob: '88.5%', band: 'High' as const },
    { target: 'LAD', vessel: 'Left anterior descending stenosis', prob: '84.6%', band: 'High' as const },
    { target: 'LCX', vessel: 'Left circumflex stenosis', prob: '24.1%', band: 'Low' as const },
    { target: 'RCA', vessel: 'Right coronary artery stenosis', prob: '43.2%', band: 'Moderate' as const },
  ];

  const tableColumns = [
    { header: 'Target', accessor: 'target' as const },
    { header: 'Condition / vessel', accessor: 'vessel' as const },
    { header: 'Predicted probability', accessor: 'prob' as const, isNumeric: true },
    {
      header: 'Risk band',
      accessor: (row: typeof sampleTableData[0]) => <RiskLabel band={row.band} />,
    },
  ];

  return (
    <div className="w-full max-w-[1000px] flex flex-col gap-10 pb-16">
      {/* Title & Nav Tabs */}
      <div>
        <h1 className="text-page-title text-text">
          Clinical paper design system
        </h1>
        <p className="text-body text-text-muted mt-1">
          Calm, white, quiet, precise, trustworthy UI tokens and accessible component library.
        </p>
        <div className="mt-4">
          <Tabs
            tabs={[
              { id: 'components', label: 'Component library' },
              { id: 'tokens', label: 'Tokens and color palette' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {activeTab === 'components' ? (
        <div className="flex flex-col gap-10">
          {/* 1. Buttons */}
          <Section title="Buttons and actions">
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button variant="primary">Primary button</Button>
              <Button variant="primary" isLoading>Loading primary</Button>
              <Button variant="primary" disabled>Disabled primary</Button>
              <Button variant="secondary">Secondary button</Button>
              <Button variant="secondary" disabled>Disabled secondary</Button>
              <Button variant="link">Text link action</Button>
            </div>
          </Section>

          {/* 2. Text and Number Fields */}
          <Section title="Form inputs and numeric fields">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <TextField
                label="Standard text field"
                placeholder="Enter value..."
                value="Clinical note"
                onChange={() => {}}
              />
              <NumberField
                label="Systolic blood pressure"
                unit="mmHg"
                value={textVal}
                onChange={(v) => setTextVal(String(v))}
                referenceRange={{ min: 90, max: 120 }}
              />
              <NumberField
                label="Field with error"
                unit="mg/dL"
                value="300"
                error="Value exceeds maximum allowable threshold"
                onChange={() => {}}
              />
              <NumberField
                label="Out-of-range indicator"
                unit="mg/dL"
                value="145"
                referenceRange={{ min: 70, max: 99 }}
                onChange={() => {}}
              />
              <TextField
                label="Extracted source attribute"
                source="extracted"
                value="62 beats/min"
                onChange={() => {}}
              />
              <Select
                label="Selection menu"
                options={[
                  { label: 'Normal sinus rhythm', value: 'sinus' },
                  { label: 'Atrial fibrillation', value: 'afib' },
                ]}
                value="sinus"
                onChange={() => {}}
              />
            </div>
          </Section>

          {/* 3. Segmented Choices & Checkboxes */}
          <Section title="Segmented choices and checkboxes">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <SegmentedChoice
                label="Typical exertional angina"
                options={[
                  { label: 'Yes', value: 'Y' },
                  { label: 'No', value: 'N' },
                ]}
                value={choiceVal}
                onChange={setChoiceVal}
              />
              <div className="flex flex-col gap-2 pt-2">
                <Checkbox
                  label="I understand this system is an investigational decision-support prototype."
                  checked={checkVal}
                  onChange={(e) => setCheckVal(e.target.checked)}
                />
                <Checkbox
                  label="Disabled checkbox item"
                  checked={false}
                  disabled
                />
              </div>
            </div>
          </Section>

          {/* 4. Risk Labels & Chips */}
          <Section title="Risk indicators and chips">
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <RiskLabel band="Low" />
              <RiskLabel band="Moderate" />
              <RiskLabel band="High" />
              <Chip label="Sample patient" />
              <Chip label="Extracted" />
              <Chip label="Unverified" />
            </div>
          </Section>

          {/* 5. Data Tables */}
          <Section title="Data tables with hairline rules">
            <div className="pt-2">
              <DataTable
                columns={tableColumns}
                data={sampleTableData}
                keyExtractor={(item) => item.target}
              />
            </div>
          </Section>

          {/* 6. Static Skeletons and Spinners */}
          <Section title="Loading states and skeletons">
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center gap-3">
                <span className="spinner" />
                <span className="text-[14px] text-text-muted">Loading indicator spinner (600ms)</span>
              </div>
              <Skeleton height={20} width="60%" />
              <Skeleton height={20} width="100%" />
              <Skeleton height={20} width="80%" />
            </div>
          </Section>

          {/* 7. Persistent Footer Disclaimer */}
          <Section title="Footer disclaimer component">
            <div className="pt-2">
              <FooterDisclaimer />
            </div>
          </Section>
        </div>
      ) : (
        /* Tokens & Palette View */
        <div className="flex flex-col gap-8">
          <Section title="Surfaces and borders">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 border border-border rounded bg-page">
                <p className="text-[13px] font-medium text-text">--page</p>
                <p className="text-[12px] text-text-muted">Canvas surface</p>
              </div>
              <div className="p-4 border border-border rounded bg-panel">
                <p className="text-[13px] font-medium text-text">--panel</p>
                <p className="text-[12px] text-text-muted">Secondary surface</p>
              </div>
              <div className="p-4 border border-border-strong rounded bg-page">
                <p className="text-[13px] font-medium text-text">--border</p>
                <p className="text-[12px] text-text-muted">Standard boundary</p>
              </div>
              <div className="p-4 border border-border-strong rounded bg-panel">
                <p className="text-[13px] font-medium text-text">--border-strong</p>
                <p className="text-[12px] text-text-muted">Strong boundary</p>
              </div>
            </div>
          </Section>

          <Section title="Text color hierarchy">
            <div className="flex flex-col gap-2 pt-2">
              <p className="text-[16px] text-text font-medium">--text: Primary document text</p>
              <p className="text-[14px] text-text-muted font-normal">--text-muted: Labels, headers, captions</p>
              <p className="text-[13px] text-text-faint font-normal">--text-faint: Subtle secondary information</p>
            </div>
          </Section>

          <Section title="Clinical risk tokens">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded border border-border bg-risk-low-bg">
                <p className="text-[14px] font-semibold text-risk-low">--risk-low</p>
                <p className="text-[12px] text-text-muted">Low probability (≤ 40%)</p>
              </div>
              <div className="p-4 rounded border border-border bg-risk-moderate-bg">
                <p className="text-[14px] font-semibold text-risk-moderate">--risk-moderate</p>
                <p className="text-[12px] text-text-muted">Moderate probability (41% - 70%)</p>
              </div>
              <div className="p-4 rounded border border-border bg-risk-high-bg">
                <p className="text-[14px] font-semibold text-risk-high">--risk-high</p>
                <p className="text-[12px] text-text-muted">High probability (&gt; 70%)</p>
              </div>
            </div>
          </Section>

          <Section title="Accent tokens">
            <div className="flex items-center gap-4 pt-2">
              <div className="px-4 py-2 rounded bg-accent text-white font-medium text-[14px]">
                --accent
              </div>
              <div className="px-4 py-2 rounded bg-accent-subtle text-accent border border-accent font-medium text-[14px]">
                --accent-subtle
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
};

export default DesignSystemPage;
