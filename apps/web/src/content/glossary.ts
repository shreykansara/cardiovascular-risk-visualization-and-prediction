/**
 * Plain language glossary and vocabulary mappings.
 * All helper texts follow progressive disclosure and are 1 sentence <= 14 words.
 */

export interface ArteryGlossaryEntry {
  plain: string;
  full: string;
  help: string;
}

export const ARTERY_GLOSSARY: Record<'LAD' | 'LCx' | 'RCA', ArteryGlossaryEntry> = {
  LAD: {
    plain: 'Front artery',
    full: 'Left anterior descending artery',
    help: 'Supplies blood to the front and left side of the heart.',
  },
  LCx: {
    plain: 'Side artery',
    full: 'Left circumflex artery',
    help: 'Supplies blood to the side and back of the heart.',
  },
  RCA: {
    plain: 'Right artery',
    full: 'Right coronary artery',
    help: 'Supplies blood to the right side and bottom of the heart.',
  },
};

export const SECTION_NAMES: Record<string, string> = {
  demographics: 'Patient background',
  'clinical-examination': 'Physical examination',
  ecg: 'ECG tests',
  laboratory: 'Blood tests',
  echocardiography: 'Heart scan',
};

export const REPORT_NAMES: Record<string, string> = {
  ecg: 'ECG report',
  echo: 'Ultrasound report',
  lab: 'Lab results',
  ehr: 'Clinic notes',
};

export const FIELD_HELP: Record<string, string> = {
  DM: 'Affects how the body handles blood sugar.',
  HTN: 'High blood pressure causing extra force against vessel walls.',
  CRF: 'Chronic kidney damage that reduces how well kidneys filter.',
  CVA: 'A stroke caused by blocked blood flow to the brain.',
  CHF: 'Heart failure where the heart cannot pump blood normally.',
  DLP: 'High cholesterol or fat levels in the blood.',
  'LowTH Ang': 'Chest pain triggered by small amounts of physical activity.',
  'Q Wave': 'An ECG dip that can signal past heart muscle damage.',
  'St Elevation': 'A raised ECG wave that can signal urgent heart strain.',
  'St Depression': 'A lowered ECG wave often showing reduced heart blood flow.',
  Tinversion: 'An inverted ECG wave that signals heart muscle strain.',
  LVH: 'Thickening of the heart main pumping chamber wall.',
  'Poor R Progression': 'Delayed electrical signals across chest leads on the ECG.',
  BBB: 'A delay in electrical signals across the heart muscle.',
  FBS: 'Blood sugar level measured after fasting without food.',
  CR: 'A blood marker used to measure kidney health.',
  TG: 'A type of fat found in circulating blood.',
  LDL: 'Cholesterol that can slowly build up along artery walls.',
  HDL: 'Cholesterol that helps remove fats from blood vessels.',
  BUN: 'A blood test measuring waste filtered by the kidneys.',
  ESR: 'A blood marker that shows general inflammation levels.',
  HB: 'The red blood cell protein carrying oxygen throughout the body.',
  WBC: 'Immune cells that help the body fight off infection.',
  Lymph: 'A type of white blood cell in the immune system.',
  Neut: 'The most common white blood cell fighting infections.',
  PLT: 'Tiny blood cell fragments that help blood clot properly.',
  'EF-TTE': 'The percentage of blood pumped out with each heartbeat.',
  'Region RWMA': 'Areas of the heart wall that do not squeeze normally.',
  VHD: 'Damage or improper functioning of one or more heart valves.',
  BP: 'Blood pressure measured in millimeters of mercury.',
  PR: 'The number of heart beats per minute at rest.',
  BMI: 'A measure of body size comparing weight to height.',
  Weight: 'Body weight recorded in kilograms.',
  Length: 'Body height recorded in centimeters.',
  Age: 'Patient age in completed years.',
};
