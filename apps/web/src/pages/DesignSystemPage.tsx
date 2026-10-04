import React, { useState } from 'react';
import {
  Panel,
  Button,
  TextField,
  NumberField,
  SegmentedChoice,
  Checkbox,
  Select,
  Section,
  DataTable,
  RiskLabel,
  Bar,
  Trace,
  Chip,
  Tabs,
  Skeleton,
} from '../components/ui';

interface ShowcasePanelProps {
  title: string;
  themeScope: 'light' | 'dark';
}

const ShowcasePanel: React.FC<ShowcasePanelProps> = ({ title, themeScope }) => {
  const [activeTab, setActiveTab] = useState('one');
  const [sbp, setSbp] = useState('145');
  const [chol, setChol] = useState('180');
  const [choiceVal, setChoiceVal] = useState('Yes');
  const [checkVal, setCheckVal] = useState(true);

  const sampleTableData = [
    { target: 'CAD', vessel: 'Coronary artery disease', prob: '62.0%', band: 'Moderate' as const },
    { target: 'LAD', vessel: 'Left anterior descending', prob: '84.6%', band: 'High' as const },
    { target: 'LCX', vessel: 'Left circumflex', prob: '24.1%', band: 'Low' as const },
  ];

  const tableColumns = [
    { header: 'Target', accessor: 'target' as const },
    { header: 'Vessel', accessor: 'vessel' as const },
    { header: 'Probability', accessor: 'prob' as const, isNumeric: true },
    {
      header: 'Risk band',
      accessor: (row: typeof sampleTableData[0]) => <RiskLabel band={row.band} />,
    },
  ];

  return (
    <div
      data-theme={themeScope}
      className="ecg-grid p-6 flex flex-col gap-6 w-full rounded"
      style={{
        borderRadius: '3px',
        border: '1px solid var(--bd)',
      }}
    >
      <Panel className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="type-page-title">{title}</span>
          <Trace width={64} height={14} />
        </div>
        <p className="type-caption">Theme scope: data-theme="{themeScope}"</p>
      </Panel>

      {/* 1. Tokens and Swatches */}
      <Panel>
        <Section title="Tokens">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {[
              ['--page', 'var(--page)'],
              ['--panel', 'var(--panel)'],
              ['--ink', 'var(--ink)'],
              ['--mut', 'var(--mut)'],
              ['--acc', 'var(--acc)'],
              ['--onacc', 'var(--onacc)'],
              ['--bd', 'var(--bd)'],
              ['--bds', 'var(--bds)'],
              ['--hov', 'var(--hov)'],
              ['--low', 'var(--low)'],
              ['--mod', 'var(--mod)'],
              ['--high', 'var(--high)'],
              ['--sheet', 'var(--sheet)'],
              ['--sheetink', 'var(--sheetink)'],
              ['--sheetmut', 'var(--sheetmut)'],
              ['--sbd', 'var(--sbd)'],
            ].map(([name, val]) => (
              <div
                key={name}
                style={{
                  border: '1px solid var(--bd)',
                  borderRadius: '3px',
                  padding: '6px',
                  backgroundColor: 'var(--panel)',
                }}
              >
                <div
                  style={{
                    height: '16px',
                    borderRadius: '3px',
                    border: '1px solid var(--bd)',
                    backgroundColor: val,
                    marginBottom: '4px',
                  }}
                />
                <span className="type-unit-count">{name}</span>
              </div>
            ))}
          </div>
        </Section>
      </Panel>

      {/* 2. Type Scale */}
      <Panel>
        <Section title="Type scale">
          <div className="flex flex-col gap-2 pt-2">
            <span className="type-result-num">62%</span>
            <span className="type-page-title">Page title 20px/600</span>
            <span className="type-report-title">Report title 18px/600</span>
            <span className="type-report-subheading">Report sub-heading 15px/600</span>
            <span className="type-brand">Brand 15px/600</span>
            <span className="type-section-heading">Section heading 14px/600</span>
            <span className="type-input-val">Input value mono 14px/400</span>
            <span className="type-body">Body 13px/1.45 regular text</span>
            <span className="type-button">Button text 13px/600</span>
            <span className="type-label">Label 12px/400</span>
            <span className="type-unit-count">Unit and counts 12px/400</span>
            <span className="type-caption">Caption 11px/400</span>
          </div>
        </Section>
      </Panel>

      {/* 3. Base Components */}
      <Panel>
        <Section title="Buttons and tabs">
          <div className="flex flex-col gap-4 pt-2">
            <Tabs
              tabs={[
                { id: 'one', label: 'Clinician report' },
                { id: 'two', label: 'Patient report' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="link">Link action</Button>
            </div>
          </div>
        </Section>
      </Panel>

      <Panel>
        <Section title="Form fields" count="3 of 3">
          <div className="flex flex-col gap-3 pt-2">
            <TextField
              label="Patient identifier"
              value="PT-2026-0881"
              onChange={() => {}}
            />
            <NumberField
              label="Systolic blood pressure (out of range)"
              unit="mmHg"
              value={sbp}
              onChange={(e) => setSbp(e.target.value)}
              referenceRange={{ min: 90, max: 120 }}
            />
            <NumberField
              label="Total cholesterol (within range)"
              unit="mg/dL"
              value={chol}
              onChange={(e) => setChol(e.target.value)}
              referenceRange={{ min: 125, max: 200 }}
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
            <SegmentedChoice
              label="Exertional angina"
              options={[
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ]}
              value={choiceVal}
              onChange={setChoiceVal}
            />
            <Checkbox
              label="Clinical decision support verification"
              checked={checkVal}
              onChange={(e) => setCheckVal(e.target.checked)}
            />
          </div>
        </Section>
      </Panel>

      <Panel>
        <Section title="Risk indicators, bars and traces">
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-4">
              <RiskLabel band="Low" />
              <RiskLabel band="Moderate" />
              <RiskLabel band="High" />
              <Chip label="Extracted" />
            </div>

            <div>
              <span className="type-caption">Probability bar (6px with markers and ticks)</span>
              <Bar value={0.62} variant="probability" />
            </div>

            <div>
              <span className="type-caption">Thin factor bar (4px)</span>
              <Bar value={0.8} variant="thin" fillColor="var(--high)" />
            </div>

            <div>
              <span className="type-caption">Static skeleton</span>
              <Skeleton width="100%" height={24} />
            </div>
          </div>
        </Section>
      </Panel>

      <Panel>
        <Section title="Data table">
          <DataTable
            columns={tableColumns}
            data={sampleTableData}
            keyExtractor={(item) => item.target}
          />
        </Section>
      </Panel>
    </div>
  );
};

export const DesignSystemPage: React.FC = () => {
  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6 pb-16 pt-4">
      <Panel>
        <h1 className="type-page-title">ECG paper design system</h1>
        <p className="type-caption mt-1">
          Dual-theme side by side comparison: Paper (Light) and Monitor (Dark).
        </p>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ShowcasePanel title="Paper" themeScope="light" />
        <ShowcasePanel title="Monitor" themeScope="dark" />
      </div>
    </div>
  );
};

export default DesignSystemPage;
