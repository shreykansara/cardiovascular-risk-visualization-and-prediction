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
      { id: 'what-you-get', label: 'How this helps you' },
      { id: 'about', label: 'About the results' },
    ],
    themeLabel: 'Theme',
    startAssessment: 'Start assessment',
    startAssessmentShort: 'Start',
  },
  hero: {
    title: 'Explore your heart health in 3D',
    lead: 'A clear, visual tool that turns health measurements and test reports into an interactive 3D model of your heart arteries. Understand key risk factors and get clear summaries to share with your doctor.',
    startAssessment: 'Start assessment',
    howItWorks: 'See how it works',
    facts: [
      { value: '3D Heart', label: 'Interactive visualization' },
      { value: 'Key Factors', label: 'Clear explanations' },
      { value: 'Doctor-Ready', label: 'Printable summaries' },
    ],
    sampleBlock: {
      heading: 'Try an interactive sample',
      helper: 'Choose a sample to see how the 3D heart and numbers respond.',
      openInApp: 'Open this sample in the app',
      caption: 'Sample demonstration data. Not for a real patient.',
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
        { id: 'lad', label: 'Front artery (LAD)' },
        { id: 'lcx', label: 'Side artery (LCX)' },
        { id: 'rca', label: 'Right artery (RCA)' },
      ],
      readout: {
        full: {
          key: 'CAD',
          name: 'Overall heart arteries',
          description: 'Combined risk estimate across the main heart arteries for this sample.',
        },
        lad: {
          key: 'LAD',
          name: 'Front artery (LAD)',
          description: 'Runs down the front of the heart and supplies blood to the main pumping wall.',
        },
        lcx: {
          key: 'LCX',
          name: 'Side artery (LCX)',
          description: 'Wraps around the side of the heart and supplies blood to the outer wall.',
        },
        rca: {
          key: 'RCA',
          name: 'Right artery (RCA)',
          description: 'Runs along the right side of the heart and supplies blood to the lower wall.',
        },
      },
    },
  },
  howItWorks: {
    heading: 'How it works',
    subline: 'Three simple steps to visualize your heart health.',
    steps: [
      {
        number: '1',
        stepTag: 'STEP 1',
        title: 'Enter health measurements',
      },
      {
        number: '2',
        stepTag: 'STEP 2',
        title: 'Explore your heart in 3D',
      },
      {
        number: '3',
        stepTag: 'STEP 3',
        title: 'Understand key influences',
      },
    ],
  },
  whatYouGet: {
    heading: 'How this platform helps you',
    rows: [
      {
        id: 'arteries',
        badge: '3D VISUALIZATION',
        title: 'Coronary artery visualization',
        description: 'Interactive 3D view of the three main coronary arteries. Risk tiers are color-coded by estimated likelihood of narrowing.',
        caption: 'Color-coded arterial risk tiers',
        vessels: [
          { vessel: 'Front (LAD)', territory: 'Main pumping wall (anterior)' },
          { vessel: 'Side (LCX)', territory: 'Outer left wall (lateral)' },
          { vessel: 'Right (RCA)', territory: 'Lower heart wall (inferior)' },
        ],
      },
      {
        id: 'factors',
        badge: 'EXPLAINABLE AI',
        title: 'Key risk drivers',
        description: 'Clinical measurements with the strongest influence, showing whether they elevate or reduce estimated risk.',
        caption: 'Top contributing clinical factors',
        factorsTable: [
          {
            feature: 'Chest discomfort during exertion',
            category: 'Symptoms',
            patientVal: 'Present',
            impact: '+0.28',
            barWidth: '70%',
            effect: 'Elevates risk',
            isElevating: true,
          },
          {
            feature: 'Ultrasound wall motion abnormality',
            category: 'Imaging',
            patientVal: 'Irregular motion',
            impact: '+0.19',
            barWidth: '50%',
            effect: 'Elevates risk',
            isElevating: true,
          },
          {
            feature: 'Resting blood pressure',
            category: 'Vitals',
            patientVal: '135 / 85 mmHg',
            impact: '+0.14',
            barWidth: '35%',
            effect: 'Elevates risk',
            isElevating: true,
          },
          {
            feature: 'Left ventricular ejection fraction',
            category: 'Imaging',
            patientVal: '58% (Normal)',
            impact: '-0.08',
            barWidth: '25%',
            effect: 'Reduces risk',
            isElevating: false,
          },
        ],
      },
      {
        id: 'reports',
        badge: 'CLINICAL SUMMARIES',
        title: 'Doctor-ready summaries',
        description: 'Structured summaries tailored for clinical discussion.',
        caption: 'Print and PDF export ready',
        clinicianRows: [
          { target: 'Overall heart estimate', prob: '94.4%', band: 'High', status: 'Higher risk', topXai: 'Combined clinical factors' },
          { target: 'Front artery (LAD)', prob: '91.0%', band: 'High', status: 'Higher risk', topXai: 'Chest symptoms & wall motion' },
          { target: 'Side artery (LCX)', prob: '24.4%', band: 'Low', status: 'Lower risk', topXai: 'Normal lateral motion' },
          { target: 'Right artery (RCA)', prob: '22.8%', band: 'Low', status: 'Lower risk', topXai: 'Normal ECG readings' },
        ],
      },
    ],
  },
  about: {
    heading: 'About the results',
    paragraphs: [
      'Estimates calculate the likelihood of coronary artery narrowing based on validated cardiovascular data.',
    ],
    technicalTextPre: 'Clinicians can view model validation and performance metrics on the ',
    technicalLinkText: 'Technical details',
    technicalTextPost: ' page.',
    disclaimer: {
      heading: 'Important notice',
      body: 'Predictions are for decision-support and educational purposes only. Not a substitute for formal diagnostic angiography or professional medical evaluation.',
    },
    systemSpecs: [
      { component: 'Clinical intent', spec: 'Decision support', role: 'Facilitates doctor consultation; not a formal diagnosis' },
      { component: 'Risk bands', spec: `Low (<${lowThreshold}%), Moderate (${lowThreshold}–${highThreshold}%), High (>${highThreshold}%)`, role: 'Calibrated probability ranges' },
      { component: 'Data privacy', spec: 'Session-only processing', role: 'Zero patient health records stored or shared' },
    ],
  },
  cta: {
    heading: 'Ready to explore your heart health?',
    text: 'Start your assessment now, or explore a sample patient in interactive 3D.',
    button: 'Start assessment',
  },
} as const;
