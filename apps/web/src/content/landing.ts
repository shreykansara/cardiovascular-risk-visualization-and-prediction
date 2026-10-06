import { FEATURE_SCHEMA } from '../config/featureSchema';
import { RISK_BANDS } from '../config/riskBands';

export const featureCount = FEATURE_SCHEMA.length; // Interpolated (55)
export const lowThreshold = Math.round(RISK_BANDS.Low.maxProb * 100); // Interpolated (40)
export const highThreshold = Math.round(RISK_BANDS.High.minProb * 100); // Interpolated (70)

export const LANDING_COPY = {
  nav: {
    wordmark: 'Perfusion3D',
    links: [
      { id: 'how-it-works', label: 'How it works' },
      { id: 'what-you-get', label: 'What you get' },
      { id: 'about', label: 'About the results' },
    ],
    themeLabel: 'Theme',
    startAssessment: 'Start assessment',
    startAssessmentShort: 'Start',
  },
  hero: {
    title: 'Coronary artery risk, shown on a 3D heart',
    lead: 'Enter clinical measurements to see the predicted probability of narrowing in the three main coronary arteries, along with the Explainable AI factors that influenced each result.',
    startAssessment: 'Start assessment',
    howItWorks: 'How it works',
    facts: [
      { value: String(featureCount), label: 'measurements entered' },
      { value: '4', label: 'predicted probabilities' },
      { value: '2', label: 'printable reports' },
    ],
    sampleBlock: {
      heading: 'Try a sample patient',
      helper: 'Pick a sample to see the heart and the numbers change.',
      openInApp: 'Open this sample in the app',
      caption: 'Sample data. These results are not for a real patient.',
    },
    heart: {
      sampleDataChip: 'Sample data',
      resetView: 'Reset view',
      desktopHint: 'Drag to rotate · Click an artery',
      touchHint: 'Swipe sideways to rotate · Tap an artery',
      helpAriaLabel: 'Show 3D controls help',
      loadingChip: 'Loading 3D heart…',
      unsupportedChip: '3D view is not supported on this device.',
      inspectLabel: 'Inspect',
      vessels: [
        { id: 'full', label: 'Full heart' },
        { id: 'lad', label: 'LAD' },
        { id: 'lcx', label: 'LCX' },
        { id: 'rca', label: 'RCA' },
      ],
      readout: {
        full: {
          key: 'CAD',
          name: 'Coronary artery disease',
          description: 'Overall predicted probability of coronary artery disease for this sample.',
        },
        lad: {
          key: 'LAD',
          name: 'Left anterior descending',
          description: 'Runs down the front of the heart and supplies much of the left side of the heart muscle.',
        },
        lcx: {
          key: 'LCX',
          name: 'Left circumflex',
          description: 'Wraps around the left side of the heart and supplies the side and back of the heart muscle.',
        },
        rca: {
          key: 'RCA',
          name: 'Right coronary',
          description: 'Runs along the right side of the heart and supplies the right side and the lower part of the heart.',
        },
      },
    },
  },
  howItWorks: {
    heading: 'How it works',
    subline: 'Three steps from multimodal clinical measurements to explainable reports.',
    steps: [
      {
        number: '1',
        stepTag: 'PHASE 01 // MULTIMODAL INTAKE',
        title: 'Enter clinical measurements',
        description: `Enter ${featureCount} clinical biomarkers across five modalities or load an instant patient sample.`,
        modalities: [
          { label: 'Demographics', count: '6' },
          { label: 'Symptoms', count: '11' },
          { label: 'ECG Leads', count: '7' },
          { label: 'Biochemistry', count: '12' },
          { label: 'Echocardiogram', count: '19' },
        ],
      },
      {
        number: '2',
        stepTag: 'PHASE 02 // EXPLAINABLE AI INFERENCE',
        title: 'Explainable AI & 3D mapping',
        description: 'Explore predicted stenosis probabilities across the coronary tree, mapped directly on the 3D heart with TreeSHAP Explainable AI decomposition.',
        modalities: [
          { label: 'Supervised Gradient Boosting', count: 'Model' },
          { label: 'Explainable AI (TreeSHAP)', count: 'XAI' },
          { label: 'Coronary Mesh Projection', count: '3D' },
        ],
      },
      {
        number: '3',
        stepTag: 'PHASE 03 // CLINICAL DECISION SUPPORT',
        title: 'Review structured reports',
        description: 'Generate a high-density clinician audit with Explainable AI attribution tables and an accessible plain-language patient summary.',
        modalities: [
          { label: 'Clinician Diagnostic Audit', count: 'CDS' },
          { label: 'Plain-Language Patient Guide', count: 'Clear' },
          { label: 'Zero Data Retention', count: 'Private' },
        ],
      },
    ],
  },
  whatYouGet: {
    heading: 'What you get',
    rows: [
      {
        id: 'arteries',
        badge: 'ANATOMICAL TELEMETRY',
        title: 'A 3D view of each artery',
        description: 'Rotate the heart and select an artery to see its predicted probability, anatomical perfusion territory, and calibrated risk level.',
        caption: 'Sample data · Interactive 3D vascular model',
        vessels: [
          { vessel: 'LAD', name: 'Left anterior descending', territory: 'Anterior wall & septum', prob: '91.0%', risk: 'High Risk' },
          { vessel: 'LCX', name: 'Left circumflex', territory: 'Lateral & posterior wall', prob: '24.4%', risk: 'Low Risk' },
          { vessel: 'RCA', name: 'Right coronary artery', territory: 'Inferior wall & right ventricle', prob: '22.8%', risk: 'Low Risk' },
        ],
      },
      {
        id: 'factors',
        badge: 'EXPLAINABLE AI (XAI)',
        title: 'Explainable AI feature attribution',
        description: 'See which clinical measurements and biomarkers raised or lowered predicted probability. Using TreeSHAP Explainable AI, every prediction provides transparent attribution instead of black-box uncertainty.',
        caption: 'Sample data · Explainable AI local feature attribution table',
        factorsTable: [
          {
            feature: 'ST-Segment Elevation (V1–V4)',
            category: 'ECG',
            patientVal: '+2.4 mm (Pathological)',
            impact: '+0.28',
            barWidth: '85%',
            effect: 'Raises probability',
            isElevating: true,
          },
          {
            feature: 'Regional Wall Motion Abnormality',
            category: 'Echo',
            patientVal: 'Hypokinetic Anterior Wall',
            impact: '+0.19',
            barWidth: '65%',
            effect: 'Raises probability',
            isElevating: true,
          },
          {
            feature: 'Typical Exertional Angina',
            category: 'Symptom',
            patientVal: 'Canadian Class III',
            impact: '+0.14',
            barWidth: '50%',
            effect: 'Raises probability',
            isElevating: true,
          },
          {
            feature: 'Left Ventricular EF (Preserved)',
            category: 'Echo',
            patientVal: '58% (Normal Ejection)',
            impact: '-0.08',
            barWidth: '32%',
            effect: 'Lowers probability',
            isElevating: false,
          },
          {
            feature: 'Fasting Blood Sugar',
            category: 'Biochem',
            patientVal: '94 mg/dL (Normal)',
            impact: '-0.05',
            barWidth: '20%',
            effect: 'Lowers probability',
            isElevating: false,
          },
        ],
      },
      {
        id: 'reports',
        badge: 'CLINICAL DOCUMENTATION',
        title: 'Clinician audit & patient reports',
        description: 'A data-dense clinician audit with full Explainable AI feature attribution and calibrated probability bands, alongside an accessible plain-language summary for patient communication.',
        caption: 'Sample data · Multi-target risk calibration audit',
        clinicianRows: [
          { target: 'CAD (Overall)', prob: '94.4%', band: 'High', status: 'Elevated Risk', topXai: 'Combined Multivessel Burden' },
          { target: 'LAD Artery', prob: '91.0%', band: 'High', status: 'Elevated Risk', topXai: 'ST-Segment Elevation (+0.28)' },
          { target: 'LCX Artery', prob: '24.4%', band: 'Low', status: 'Baseline Range', topXai: 'Normal Lateral Wall Motion' },
          { target: 'RCA Artery', prob: '22.8%', band: 'Low', status: 'Baseline Range', topXai: 'Unremarkable Inferior Leads' },
        ],
      },
    ],
  },
  about: {
    heading: 'About the results & Explainable AI',
    paragraphs: [
      'The results are probabilities estimated by a supervised gradient boosting model from the clinical values you enter. The model does not look at the heart directly.',
      'A probability describes what the model estimated, not a confirmed condition. The tool is designed strictly for decision support and education.',
      `Risk words follow fixed bands: Low is under ${lowThreshold}%, Moderate is ${lowThreshold} to ${highThreshold}%, High is over ${highThreshold}%.`,
      'Explainable AI methods calculate exact local feature attributions (TreeSHAP) so clinicians can audit every single contributing factor.',
      "Entered values are kept in your browser session and are sent to this app's server only to calculate results without saving any patient identifiers.",
    ],
    technicalTextPre: 'Technical details, dataset benchmarks, and model evaluation curves are on the ',
    technicalLinkText: 'Model information',
    technicalTextPost: ' page.',
    disclaimer: {
      heading: 'Decision support only',
      body: 'Predictions and Explainable AI attributions are for decision-support and educational purposes only and are not a substitute for formal diagnostic imaging or professional medical evaluation.',
    },
    systemSpecs: [
      { component: 'Explainable AI Engine', spec: 'TreeSHAP Additive Attribution', role: 'Decomposes individual feature risk contributions' },
      { component: 'Inference Model', spec: 'Gradient Boosted Decision Trees', role: 'Calibrated tri-arterial classification' },
      { component: 'Input Surface', spec: `${featureCount} Multimodal Biomarkers`, role: 'Demographics, symptoms, ECG, echo, biochemistry' },
      { component: 'Risk Stratification', spec: `Tri-Tier Bands (<${lowThreshold}%, ${lowThreshold}–${highThreshold}%, >${highThreshold}%)`, role: 'Standardized clinical probability thresholds' },
      { component: 'Data Protection', spec: 'Ephemeral In-Memory Compute', role: 'Zero server-side persistence of patient parameters' },
    ],
  },
  cta: {
    heading: 'Start an assessment',
    text: 'Enter clinical measurements or load a sample patient to inspect Explainable AI results.',
    button: 'Start assessment',
  },
} as const;
