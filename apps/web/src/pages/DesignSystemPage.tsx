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
import { Skeleton } from '../components/ui/Skeleton';

interface ShowcasePanelProps {
  title: string;
  themeScope: 'light' | 'dark';
}

const ShowcasePanel: React.FC<ShowcasePanelProps> = ({ title, themeScope }) => {
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
    { header: 'Probability', accessor: 'prob' as const, isNumeric: true },
    {
      header: 'Risk band',
      accessor: (row: typeof sampleTableData[0]) => <RiskLabel band={row.band} />,
    },
  ];

  return (
    <div
      data-theme={themeScope}
      className="p-6 bg-page text-text border border-border rounded flex flex-col gap-8 w-full"
    >
      <div className="border-b border-border pb-3">
        <h2 className="text-[18px] leading-[26px] font-semibold text-text">
          {title}
        </h2>
        <p className="text-[13px] leading-[20px] text-text-muted mt-0.5">
          Theme scope: data-theme="{themeScope}"
        </p>
      </div>

      {/* 1. Surfaces & Tokens */}
      <Section title="Surfaces and borders">
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 border border-border rounded bg-page">
            <p className="text-[13px] font-medium text-text">--page</p>
            <p className="text-[12px] text-text-muted">Canvas surface</p>
          </div>
          <div className="p-3 border border-border rounded bg-panel">
            <p className="text-[13px] font-medium text-text">--panel</p>
            <p className="text-[12px] text-text-muted">Secondary surface</p>
          </div>
          <div className="p-3 border border-border-strong rounded bg-page">
            <p className="text-[13px] font-medium text-text">--border</p>
            <p className="text-[12px] text-text-muted">Hairline divider</p>
          </div>
          <div className="p-3 border border-border-strong rounded bg-panel">
            <p className="text-[13px] font-medium text-text">--border-strong</p>
            <p className="text-[12px] text-text-muted">Boundaries</p>
          </div>
        </div>
      </Section>

      {/* 2. Text Hierarchy */}
      <Section title="Typography and text tokens">
        <div className="flex flex-col gap-1.5 pt-2">
          <p className="text-[15px] text-text font-medium">--text: Primary clinical document copy</p>
          <p className="text-[13px] text-text-muted">--text-muted: Labels, table headers, unit captions</p>
          <p className="text-[12px] text-text-faint">--text-faint: Secondary notes and timestamps</p>
        </div>
      </Section>

      {/* 3. Risk Stratification */}
      <Section title="Risk stratification tokens">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded border border-border bg-risk-low-bg">
            <p className="text-[13px] font-semibold text-risk-low">Low risk</p>
            <p className="text-[12px] text-text-muted">≤ 40% probability</p>
          </div>
          <div className="p-3 rounded border border-border bg-risk-moderate-bg">
            <p className="text-[13px] font-semibold text-risk-moderate">Moderate risk</p>
            <p className="text-[12px] text-text-muted">41% – 70% probability</p>
          </div>
          <div className="p-3 rounded border border-border bg-risk-high-bg">
            <p className="text-[13px] font-semibold text-risk-high">High risk</p>
            <p className="text-[12px] text-text-muted">&gt; 70% probability</p>
          </div>
        </div>
      </Section>

      {/* 4. Buttons */}
      <Section title="Buttons and actions">
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="primary">Primary</Button>
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="secondary" disabled>Disabled</Button>
          <Button variant="link">Link action</Button>
        </div>
      </Section>

      {/* 5. Inputs */}
      <Section title="Form inputs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <TextField
            label="Patient identifier"
            value="PT-2026-0881"
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
            label="Total cholesterol"
            unit="mg/dL"
            value="240"
            referenceRange={{ min: 125, max: 200 }}
            onChange={() => {}}
          />
          <Select
            label="Clinical rhythm"
            options={[
              { label: 'Normal sinus rhythm', value: 'sinus' },
              { label: 'Atrial fibrillation', value: 'afib' },
            ]}
            value="sinus"
            onChange={() => {}}
          />
        </div>
      </Section>

      {/* 6. Choices & Checkbox */}
      <Section title="Segmented choices and checkboxes">
        <div className="flex flex-col gap-4 pt-2">
          <SegmentedChoice
            label="Typical exertional angina"
            options={[
              { label: 'Yes', value: 'Y' },
              { label: 'No', value: 'N' },
            ]}
            value={choiceVal}
            onChange={setChoiceVal}
          />
          <Checkbox
            label="Decision-support verification confirmed"
            checked={checkVal}
            onChange={(e) => setCheckVal(e.target.checked)}
          />
        </div>
      </Section>

      {/* 7. Risk Indicators & Chips */}
      <Section title="Risk indicators and chips">
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <RiskLabel band="Low" />
          <RiskLabel band="Moderate" />
          <RiskLabel band="High" />
          <Chip label="Sample patient" />
          <Chip label="Extracted" />
        </div>
      </Section>

      {/* 8. Data Table */}
      <Section title="Data table with hairline rules">
        <div className="pt-2">
          <DataTable
            columns={tableColumns}
            data={sampleTableData}
            keyExtractor={(item) => item.target}
          />
        </div>
      </Section>

      {/* 9. Skeletons and Spinners */}
      <Section title="Loading states">
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="spinner" />
            <span className="text-[13px] text-text-muted">Loading indicator (600ms)</span>
          </div>
          <Skeleton height={20} width="60%" />
          <Skeleton height={20} width="100%" />
        </div>
      </Section>
    </div>
  );
};

export const DesignSystemPage: React.FC = () => {
  return (
    <div className="w-full max-w-[1200px] flex flex-col gap-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-page-title text-text">
          Clinical paper design system
        </h1>
        <p className="text-body text-text-muted mt-1">
          Side-by-side comparison of Light and Dark themes with identical DOM structures and tokens.
        </p>
      </div>

      {/* Side-by-Side Dual Theme Showcase (Task 3.10) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <ShowcasePanel title="Light theme" themeScope="light" />
        <ShowcasePanel title="Dark theme" themeScope="dark" />
      </div>
    </div>
  );
};

export default DesignSystemPage;
