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
    lead: 'Enter clinical measurements to see the predicted probability of narrowing in the three main coronary arteries, along with the factors that influenced each result.',
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
    subline: 'Three steps from measurements to reports.',
    steps: [
      {
        number: '1',
        title: 'Enter measurements',
        description: `Type in ${featureCount} clinical values across five groups: demographics, examination, ECG, blood tests and heart ultrasound. Or load a sample patient.`,
      },
      {
        number: '2',
        title: 'View the result',
        description: 'See the predicted probability for coronary artery disease and for each of the three main arteries, colour-coded on the 3D heart.',
      },
      {
        number: '3',
        title: 'Create reports',
        description: 'Get a clinician report and a plain-language patient report, ready to print or save as a PDF.',
      },
    ],
  },
  whatYouGet: {
    heading: 'What you get',
    rows: [
      {
        id: 'arteries',
        title: 'A 3D view of each artery',
        description: 'Rotate the heart and select an artery to see its predicted probability and risk level.',
        caption: 'Sample data',
      },
      {
        id: 'factors',
        title: 'The factors behind each result',
        description: 'See which measurements raised or lowered the predicted probability, in plain terms.',
        caption: 'Sample data',
        exampleFactors: [
          { name: 'ST-segment elevation', direction: 'Raises probability', barWidth: '78%' },
          { name: 'Regional wall motion', direction: 'Raises probability', barWidth: '64%' },
          { name: 'Typical angina', direction: 'Raises probability', barWidth: '52%' },
        ],
      },
      {
        id: 'reports',
        title: 'Two reports',
        description: 'A clinician report with the full measurements and a patient report written in plain language. Neither gives advice or recommendations.',
        caption: 'Sample data',
        reportTitle: 'Clinician report',
      },
    ],
  },
  about: {
    heading: 'About the results',
    paragraphs: [
      'The results are probabilities estimated by a computer model from the values you enter. The model does not look at the heart directly.',
      'A probability describes what the model estimated, not a confirmed condition. The tool is meant for decision support and education.',
      `Risk words follow fixed bands: Low is under ${lowThreshold}%, Moderate is ${lowThreshold} to ${highThreshold}%, High is over ${highThreshold}%.`,
      "Entered values are kept in your browser session and are sent to this app's server only to calculate results.",
    ],
    technicalTextPre: 'Technical details and evaluation figures are on the ',
    technicalLinkText: 'Model information',
    technicalTextPost: ' page.',
    disclaimer: {
      heading: 'Decision support only',
      body: 'Predictions are for decision-support and educational purposes only and are not a substitute for formal diagnostic imaging or professional medical evaluation.',
    },
  },
  cta: {
    heading: 'Start an assessment',
    text: 'Enter the measurements or load a sample patient.',
    button: 'Start assessment',
  },
} as const;
