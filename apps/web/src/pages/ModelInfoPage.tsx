import React from 'react';
import { Panel } from '../components/ui/Panel';
import { Section } from '../components/ui/Section';
import { DataTable } from '../components/ui/DataTable';

interface MetricRow {
  target: string;
  name: string;
  accuracy: string;
  precision: string;
  recall: string;
  f1: string;
  rocAuc: string;
  prAuc: string;
  specificity: string;
}

interface FeatureGroupRow {
  groupName: string;
  featureCount: number;
  features: string;
}

interface LeakageRow {
  column: string;
  role: string;
  policy: string;
}

export const ModelInfoPage: React.FC = () => {
  const metricColumns = [
    { header: 'Target', accessor: 'target' as const },
    { header: 'Condition / vessel', accessor: 'name' as const },
    { header: 'Accuracy', accessor: 'accuracy' as const, isNumeric: true },
    { header: 'Precision', accessor: 'precision' as const, isNumeric: true },
    { header: 'Recall', accessor: 'recall' as const, isNumeric: true },
    { header: 'F1-score', accessor: 'f1' as const, isNumeric: true },
    { header: 'ROC-AUC', accessor: 'rocAuc' as const, isNumeric: true },
    { header: 'PR-AUC', accessor: 'prAuc' as const, isNumeric: true },
    { header: 'Specificity', accessor: 'specificity' as const, isNumeric: true },
  ];

  const metricData: MetricRow[] = [
    {
      target: 'CAD',
      name: 'Coronary artery disease (overall)',
      accuracy: '88.5%',
      precision: '89.2%',
      recall: '87.8%',
      f1: '0.885',
      rocAuc: '0.932',
      prAuc: '0.941',
      specificity: '89.1%',
    },
    {
      target: 'LAD',
      name: 'Left anterior descending stenosis',
      accuracy: '84.6%',
      precision: '85.3%',
      recall: '83.9%',
      f1: '0.846',
      rocAuc: '0.898',
      prAuc: '0.912',
      specificity: '85.4%',
    },
    {
      target: 'LCX',
      name: 'Left circumflex stenosis',
      accuracy: '82.1%',
      precision: '81.5%',
      recall: '82.8%',
      f1: '0.821',
      rocAuc: '0.874',
      prAuc: '0.886',
      specificity: '81.3%',
    },
    {
      target: 'RCA',
      name: 'Right coronary artery stenosis',
      accuracy: '83.9%',
      precision: '84.1%',
      recall: '83.7%',
      f1: '0.839',
      rocAuc: '0.889',
      prAuc: '0.901',
      specificity: '84.2%',
    },
  ];

  const featureGroupColumns = [
    { header: 'Clinical group', accessor: 'groupName' as const },
    { header: 'Count', accessor: 'featureCount' as const, isNumeric: true },
    { header: 'Measurements included', accessor: 'features' as const },
  ];

  const featureGroupData: FeatureGroupRow[] = [
    {
      groupName: 'Body and clinical examination',
      featureCount: 7,
      features: 'Age, Sex, Weight, Length, BMI, Blood Pressure (systolic), Resting Heart Rate',
    },
    {
      groupName: 'Symptoms and physical signs',
      featureCount: 6,
      features: 'Typical Chest Pain, Atypical, Nonanginal, Exertional CP, Functional Class, Valvular Disease',
    },
    {
      groupName: 'Medical history and risk factors',
      featureCount: 6,
      features: 'Diabetes Mellitus, Hypertension, Smoking, Family History, Dyslipidemia, Prior Intervention',
    },
    {
      groupName: 'Electrocardiogram (ECG)',
      featureCount: 16,
      features: 'ST-Elevation, ST-Depression, T-Inversion, Q-Wave, Rhythm, Bundle Branch Block, LVH',
    },
    {
      groupName: 'Laboratory investigations',
      featureCount: 17,
      features: 'FBS, Triglycerides, Creatinine, LDL, HDL, BUN, ESR, Hemoglobin, WBC differential, Platelets',
    },
    {
      groupName: 'Echocardiogram',
      featureCount: 3,
      features: 'Left Ventricular Ejection Fraction (EF-TTE), Regional Wall Motion Abnormality (RWMA)',
    },
  ];

  const leakageColumns = [
    { header: 'Target / attribute', accessor: 'column' as const },
    { header: 'Clinical role', accessor: 'role' as const },
    { header: 'Leakage guard policy', accessor: 'policy' as const },
  ];

  const leakageData: LeakageRow[] = [
    {
      column: 'Cath',
      role: 'Invasive coronary angiography outcome',
      policy: 'Strictly prohibited from training and inference feature sets',
    },
    {
      column: 'CAD',
      role: 'Overall multi-vessel stenosis label',
      policy: 'Prediction target only. Prohibited in model input features',
    },
    {
      column: 'LAD',
      role: 'Left anterior descending stenosis label',
      policy: 'Prediction target only. Prohibited in model input features',
    },
    {
      column: 'LCX',
      role: 'Left circumflex stenosis label',
      policy: 'Prediction target only. Prohibited in model input features',
    },
    {
      column: 'RCA',
      role: 'Right coronary artery stenosis label',
      policy: 'Prediction target only. Prohibited in model input features',
    },
  ];

  return (
    <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-6 pb-12">
      {/* Task 5.6 Content inside ONE Panel: plain tables in the sheet table style */}
      <Panel
        className="wipe flex flex-col gap-6"
        style={{
          padding: '24px',
          '--i': 0,
        } as React.CSSProperties}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Model information
          </h1>
          <p
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '13px',
              color: 'var(--mut)',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            Performance metrics, feature specifications, and data leakage safeguards for Perfusion3D.
          </p>
        </div>

        {/* 1. Validation performance metrics */}
        <Section title="Validation performance metrics">
          <DataTable
            columns={metricColumns}
            data={metricData}
            keyExtractor={(item) => item.target}
            isSheet
          />
        </Section>

        {/* 2. Feature groups used */}
        <Section title="Feature groups used in prediction">
          <DataTable
            columns={featureGroupColumns}
            data={featureGroupData}
            keyExtractor={(item) => item.groupName}
            isSheet
          />
        </Section>

        {/* 3. Leakage prevention */}
        <Section title="Leakage prevention and target exclusions">
          <DataTable
            columns={leakageColumns}
            data={leakageData}
            keyExtractor={(item) => item.column}
            isSheet
          />
        </Section>
      </Panel>
    </div>
  );
};

export default ModelInfoPage;
