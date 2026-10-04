import React, { useState } from 'react';
import {
  Button,
  Input,
  NumberInput,
  Select,
  Checkbox,
  Card,
  SectionHeader,
  Badge,
  Table,
  Tabs,
  Banner,
  Tooltip,
  Skeleton,
  Spinner,
} from '../components/ui';
import { ArrowLeft, Stethoscope, Activity, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DesignSystemPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('components');
  const [numVal, setNumVal] = useState(135);
  const [checked, setChecked] = useState(true);

  const sampleTableData = [
    { target: 'CAD', vessel: 'Overall Coronary Artery Disease', prob: 84.5, band: 'High' as const },
    { target: 'LAD', vessel: 'Left Anterior Descending', prob: 91.2, band: 'High' as const },
    { target: 'LCX', vessel: 'Left Circumflex', prob: 24.1, band: 'Low' as const },
    { target: 'RCA', vessel: 'Right Coronary Artery', prob: 22.8, band: 'Low' as const },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full gap-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#283548] pb-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Application</span>
          </button>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Perfusion3D Clinical Design System
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Calm, high-contrast, accessible UI primitives for clinical decision-support software.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'components', label: 'Component Library' },
            { id: 'tokens', label: 'Tokens & Palette' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'tokens' ? (
        <div className="flex flex-col gap-6">
          {/* Colors */}
          <Card header={<span className="text-xs font-semibold uppercase text-slate-300">Semantic Color Palette</span>}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <div className="h-14 rounded-md bg-[#0b0f17] border border-[#283548]" />
                <span className="text-xs font-medium text-slate-200">Base Background</span>
                <span className="text-[11px] font-mono text-slate-500">#0b0f17</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-14 rounded-md bg-[#131a26] border border-[#283548]" />
                <span className="text-xs font-medium text-slate-200">Surface Base</span>
                <span className="text-[11px] font-mono text-slate-500">#131a26</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-14 rounded-md bg-[#1c2637] border border-[#384961]" />
                <span className="text-xs font-medium text-slate-200">Surface Raised</span>
                <span className="text-[11px] font-mono text-slate-500">#1c2637</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-14 rounded-md bg-[#2563eb]" />
                <span className="text-xs font-medium text-slate-200">Clinical Blue (Primary)</span>
                <span className="text-[11px] font-mono text-slate-500">#2563eb</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#283548]">
              <span className="text-xs font-semibold uppercase text-slate-300 block mb-3">
                Calibrated Clinical Risk Bands
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-md bg-green-950/40 border border-green-800/60 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-semibold text-green-300">Low Risk (≤ 40%)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Normal / Non-obstructive</span>
                  <span className="text-[11px] font-mono text-green-400/80">#16a34a</span>
                </div>
                <div className="p-3 rounded-md bg-amber-950/40 border border-amber-800/60 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-amber-300">Moderate Risk (41% – 70%)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Borderline / Intermediate</span>
                  <span className="text-[11px] font-mono text-amber-400/80">#d97706</span>
                </div>
                <div className="p-3 rounded-md bg-red-950/40 border border-red-800/60 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs font-semibold text-red-300">High Risk (&gt; 70%)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Stenosis Suspected</span>
                  <span className="text-[11px] font-mono text-red-400/80">#dc2626</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Typography */}
          <Card header={<span className="text-xs font-semibold uppercase text-slate-300">Typography Scale</span>}>
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between border-b border-[#283548] pb-2">
                <span className="text-2xl font-semibold text-white">Header 2XL (24px, 600 weight)</span>
                <span className="text-xs font-mono text-slate-500">var(--text-2xl)</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-[#283548] pb-2">
                <span className="text-xl font-semibold text-white">Header XL (20px, 600 weight)</span>
                <span className="text-xs font-mono text-slate-500">var(--text-xl)</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-[#283548] pb-2">
                <span className="text-lg font-semibold text-slate-100">Header LG (18px, 600 weight)</span>
                <span className="text-xs font-mono text-slate-500">var(--text-lg)</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-[#283548] pb-2">
                <span className="text-md font-medium text-slate-200">Subheading MD (16px, 500 weight)</span>
                <span className="text-xs font-mono text-slate-500">var(--text-md)</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-[#283548] pb-2">
                <span className="text-sm font-normal text-slate-300">Body Base (14px, 400 weight)</span>
                <span className="text-xs font-mono text-slate-500">var(--text-base)</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-[#283548] pb-2">
                <span className="text-xs font-normal text-slate-400">Label Small (13px, 400 weight)</span>
                <span className="text-xs font-mono text-slate-500">var(--text-sm)</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-mono-numbers text-slate-400">
                  Tabular Monospace (11px, JetBrains Mono tnum): 123,456.78 mmHg / 94.2%
                </span>
                <span className="text-xs font-mono text-slate-500">var(--text-xs)</span>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Buttons */}
          <Card header={<span className="text-xs font-semibold uppercase text-slate-300">Buttons & Actions</span>}>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="primary" size="sm" leftIcon={<Activity className="w-3.5 h-3.5" />}>
                Small With Icon
              </Button>
              <Button variant="primary" isLoading>
                Loading State
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </Card>

          {/* Form Controls */}
          <Card header={<span className="text-xs font-semibold uppercase text-slate-300">Clinical Form Controls</span>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label="Patient ID"
                placeholder="PT-001"
                helperText="Hospital EHR identifier"
              />
              <NumberInput
                label="Systolic Blood Pressure"
                value={numVal}
                onChange={setNumVal}
                min={80}
                max={220}
                unitSuffix="mmHg"
                refRangeMin={90}
                refRangeMax={120}
                helperText="Amber dot indicates out of typical range"
              />
              <Select
                label="Chest Pain Presentation"
                options={[
                  { value: '0', label: 'Asymptomatic / None' },
                  { value: '1', label: 'Typical Angina' },
                  { value: '2', label: 'Atypical Angina' },
                ]}
                helperText="Diamond-Forrester clinical classification"
              />
              <div className="col-span-full pt-2">
                <Checkbox
                  label="Hypertension History (HTN)"
                  helperText="Patient currently treated with antihypertensive therapy"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
              </div>
            </div>
          </Card>

          {/* Badges & Status */}
          <Card header={<span className="text-xs font-semibold uppercase text-slate-300">Badges & Risk Bands</span>}>
            <div className="flex flex-wrap gap-3 items-center">
              <Badge riskLevel="Low">Low Risk (24%)</Badge>
              <Badge riskLevel="Moderate">Moderate Risk (58%)</Badge>
              <Badge riskLevel="High">High Risk (89%)</Badge>
              <Badge variant="blue">Clinical Blue</Badge>
              <Badge variant="neutral">Verified Schema</Badge>
            </div>
          </Card>

          {/* Table */}
          <Card
            header={
              <SectionHeader
                title="Vessel Ischemia Probability Table"
                subtitle="Calibrated predictions with right-aligned tabular numbers"
                action={<Badge variant="neutral">4 Targets</Badge>}
              />
            }
            padding="none"
          >
            <Table
              columns={[
                { key: 'target', header: 'Target', align: 'left' },
                { key: 'vessel', header: 'Anatomical Territory', align: 'left' },
                {
                  key: 'prob',
                  header: 'Calibrated Risk',
                  align: 'right',
                  isNumeric: true,
                  render: (row) => `${row.prob.toFixed(1)}%`,
                },
                {
                  key: 'band',
                  header: 'Classification',
                  align: 'center',
                  render: (row) => <Badge riskLevel={row.band} size="sm">{row.band}</Badge>,
                },
              ]}
              data={sampleTableData}
              keyExtractor={(row) => row.target}
            />
          </Card>

          {/* Banners & Alerts */}
          <div className="flex flex-col gap-3">
            <Banner variant="warning" title="Clinical Decision-Support Disclaimer">
              This system is an investigational AI prototype. Predictions do not constitute formal medical diagnosis or replace coronary angiography.
            </Banner>
            <Banner variant="info" title="Groq Llama 3.3 70B Active">
              Reports are generated in native JSON format via groq.com API with deterministic validation.
            </Banner>
          </div>

          {/* Tooltip & Skeletons */}
          <Card header={<span className="text-xs font-semibold uppercase text-slate-300">Interactive Helpers & Loading States</span>}>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>Ejection Fraction (EF-TTE)</span>
                <Tooltip content="Left ventricular ejection fraction measured via transthoracic echocardiography (Normal: 55-70%)." />
              </div>
              <div className="flex items-center gap-3">
                <Spinner size="sm" label="Calibrating..." />
                <Skeleton width={80} height={28} />
                <Skeleton width={140} height={28} />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
