export type ReportType = 'ecg' | 'echo' | 'lab' | 'ehr';

export interface ExtractedField {
  value: number | string | boolean;
  confidence: 'high' | 'check';
  unit_in_report: string | null;
  converted: boolean;
  derived: boolean;
  evidence: string;
  page: number;
}

export type RejectionReason =
  | 'out_of_range'
  | 'unknown_unit'
  | 'censored_value'
  | 'not_percent'
  | 'unparseable';

export interface RejectedField {
  key: string;
  reason: RejectionReason;
  found: string;
}

export interface ExtractionResult {
  report_type: ReportType;
  status: 'ok' | 'partial' | 'empty';
  pages: number;
  fields: Record<string, ExtractedField>;
  not_found: string[];
  rejected: RejectedField[];
  warnings: string[];
  elapsed_ms: number;
}

export type ExtractionErrorCode =
  | 'not_pdf'
  | 'too_large'
  | 'too_many_pages'
  | 'encrypted'
  | 'no_text_layer'
  | 'unreadable'
  | 'wrong_report_type'
  | 'busy'
  | 'network'
  | 'unknown';

export interface ErrorBody {
  code: ExtractionErrorCode;
  message: string;
  suggested_type?: ReportType;
}

export class ExtractionError extends Error {
  code: ExtractionErrorCode;
  suggested_type?: ReportType;

  constructor(code: ExtractionErrorCode, message: string, suggested_type?: ReportType) {
    super(message);
    this.name = 'ExtractionError';
    this.code = code;
    this.suggested_type = suggested_type;
  }
}

export interface ReportSlotState {
  status: 'idle' | 'uploading' | 'reading' | 'done' | 'error';
  progress: number;
  filled: number;
  total: number;
  notFound: string[];
  skipped: string[];
  rejected: { key: string; reason: string; found: string }[];
  warnings: string[];
  error?: {
    code: ExtractionErrorCode;
    message: string;
    suggested_type?: ReportType;
  };
  uploadedAt?: string;
}

export const REPORT_TOTALS: Record<ReportType, number> = {
  ecg: 7,
  echo: 3,
  lab: 14,
  ehr: 31,
};

export const REPORT_DISPLAY_NAMES: Record<ReportType, string> = {
  ecg: 'ECG report',
  echo: 'Echo report',
  lab: 'Blood lab report',
  ehr: 'Outpatient note',
};
