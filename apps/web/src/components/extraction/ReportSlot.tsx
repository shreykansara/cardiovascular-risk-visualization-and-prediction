import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  HeartPulse,
  FlaskConical,
  ClipboardList,
  Check,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { FEATURE_SCHEMA } from '../../config/featureSchema';
import { SecondaryButton } from '../ui/SecondaryButton';
import { QuietButton } from '../ui/QuietButton';
import {
  ExtractionError,
  REPORT_DISPLAY_NAMES,
  REPORT_TOTALS,
  type ReportType,
  type ExtractionErrorCode,
} from '../../types/extraction';
import { extractReport } from '../../api/extract';
import { useWizardStore } from '../../store/useWizardStore';

const SLOT_ICONS: Record<ReportType, React.ReactNode> = {
  ecg: <Activity size={20} color="var(--acc)" />,
  echo: <HeartPulse size={20} color="var(--acc)" />,
  lab: <FlaskConical size={20} color="var(--acc)" />,
  ehr: <ClipboardList size={20} color="var(--acc)" />,
};

const SLOT_SUBTITLES: Record<ReportType, string> = {
  ecg: 'Fills 7 ECG fields',
  echo: 'Fills 3 echo fields',
  lab: 'Fills 14 laboratory fields',
  ehr: 'Fills 31 demographic and examination fields',
};

const ERROR_MESSAGES: Record<string, string> = {
  not_pdf: 'This file is not a PDF.',
  too_large: 'This file is larger than 5 MB.',
  too_many_pages: 'This report has more than 10 pages.',
  encrypted: 'This PDF is password protected.',
  no_text_layer: 'This PDF has no readable text. Scanned reports are not supported yet.',
  unreadable: 'This PDF could not be read.',
  busy: 'The server is busy. Try again in a moment.',
  network: 'Could not connect to the API server. Please ensure the backend is running.',
};

const REJECTED_REASONS: Record<string, string> = {
  out_of_range: 'outside the allowed range',
  unknown_unit: 'unit not recognised',
  censored_value: 'value given as a limit',
  not_percent: 'not a percentage',
  unparseable: 'could not be read',
};

function getFieldLabel(key: string): string {
  const feat = FEATURE_SCHEMA.find((f) => f.key === key);
  return feat ? feat.label : key;
}

function formatErrorMessage(code: ExtractionErrorCode, suggestedType?: ReportType, customMessage?: string): string {
  if (code === 'wrong_report_type') {
    const suggestedName = suggestedType ? REPORT_DISPLAY_NAMES[suggestedType] : 'another';
    const article = /^[aeiou]/i.test(suggestedName) ? 'an' : 'a';
    return `This looks like ${article} ${suggestedName} report. Upload it in the ${suggestedName} slot.`;
  }
  if (code === 'network' && customMessage) {
    return customMessage;
  }
  if (code === 'unknown' && customMessage && customMessage !== 'Extraction failed.') {
    return customMessage;
  }
  return ERROR_MESSAGES[code] || customMessage || 'Something went wrong while reading the report.';
}

export interface ReportSlotProps {
  type: ReportType;
  onAnnounce: (msg: string) => void;
  firstSlotButtonRef?: React.RefObject<HTMLButtonElement>;
}

export const ReportSlot: React.FC<ReportSlotProps> = ({
  type,
  onAnnounce,
  firstSlotButtonRef,
}) => {
  const slotState = useWizardStore((s) => s.reports[type]);
  const setReportSlotState = useWizardStore((s) => s.setReportSlotState);
  const applyExtraction = useWizardStore((s) => s.applyExtraction);
  const removeReport = useWizardStore((s) => s.removeReport);

  const [fileName, setFileName] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const displayName = REPORT_DISPLAY_NAMES[type];
  const totalCount = REPORT_TOTALS[type];

  // Abort pending requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleProcessFile = async (file: File) => {
    // Check if PDF (client pre-check)
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      const errCode: ExtractionErrorCode = 'not_pdf';
      const msg = formatErrorMessage(errCode);
      setReportSlotState(type, {
        status: 'error',
        error: { code: errCode, message: msg },
      });
      onAnnounce(msg);
      return;
    }

    // Abort previous in-flight request if present
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Store filename in memory only
    setFileName(file.name);
    setReportSlotState(type, {
      status: 'uploading',
      progress: 0,
      error: undefined,
    });
    onAnnounce(`${displayName} uploading`);

    try {
      const result = await extractReport(type, file, {
        signal: abortController.signal,
        onProgress: (pct) => {
          if (pct >= 100) {
            setReportSlotState(type, { status: 'reading', progress: 100 });
          } else {
            setReportSlotState(type, { status: 'uploading', progress: pct });
          }
        },
      });

      // Apply extraction to form
      applyExtraction(type, result);
      const filledCount = Object.keys(result.fields).length;
      onAnnounce(`${displayName} read: ${filledCount} of ${totalCount} fields filled`);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'Aborted') {
        // User cancelled, slot already reset to idle
        return;
      }

      let code: ExtractionErrorCode = 'unknown';
      let suggestedType: ReportType | undefined;
      let msg = 'Something went wrong while reading the report.';

      if (err instanceof ExtractionError) {
        code = err.code;
        suggestedType = err.suggested_type;
        msg = formatErrorMessage(code, suggestedType, err.message);
      } else if (err.message) {
        msg = err.message;
      }

      setReportSlotState(type, {
        status: 'error',
        error: { code, message: msg, suggested_type: suggestedType },
      });
      onAnnounce(msg);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setReportSlotState(type, { status: 'idle', progress: 0 });
    setFileName(null);
  };

  const handleRemove = () => {
    removeReport(type);
    setFileName(null);
    setShowDetails(false);
    onAnnounce(`${displayName} removed`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
    // Clear input so same file can be re-selected if desired
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (slotState.status === 'uploading' || slotState.status === 'reading') return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (slotState.status === 'uploading' || slotState.status === 'reading') return;

    const files = e.dataTransfer.files;
    if (!files || files.length !== 1) {
      const errCode: ExtractionErrorCode = 'not_pdf';
      const msg = formatErrorMessage(errCode);
      setReportSlotState(type, {
        status: 'error',
        error: { code: errCode, message: msg },
      });
      onAnnounce(msg);
      return;
    }

    handleProcessFile(files[0]);
  };

  const isBusy = slotState.status === 'uploading' || slotState.status === 'reading';

  return (
    <div
      className={`report-slot ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-busy={slotState.status === 'reading' ? 'true' : undefined}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        aria-label={`${displayName} file`}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Top Row: Icon + Title | Status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {SLOT_ICONS[type]}
          <span
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            {displayName}
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '12px',
            color: 'var(--mut)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {slotState.status === 'done' ? (
            <>
              <Check size={16} color="var(--ink)" />
              <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Uploaded</span>
            </>
          ) : (
            <span>Not uploaded</span>
          )}
        </div>
      </div>

      {/* Line 2: Fills {n} {what} */}
      <div
        style={{
          fontFamily: 'var(--fs)',
          fontSize: '12px',
          color: 'var(--mut)',
          marginTop: '6px',
        }}
      >
        {SLOT_SUBTITLES[type]}
      </div>

      {/* Body by State */}
      <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
        {/* IDLE */}
        {slotState.status === 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <SecondaryButton
              ref={firstSlotButtonRef}
              size="sm"
              leftIcon={<Upload size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload PDF
            </SecondaryButton>
            <span
              className="report-slot-drop-hint"
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '12px',
                color: 'var(--mut)',
              }}
            >
              or drop a PDF here
            </span>
          </div>
        )}

        {/* UPLOADING */}
        {slotState.status === 'uploading' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: 'var(--fs)', fontSize: '13px', color: 'var(--ink)' }}>
                Uploading… {slotState.progress}%
              </span>
              <QuietButton
                size="sm"
                leftIcon={<X size={14} />}
                onClick={handleCancelUpload}
              >
                Cancel
              </QuietButton>
            </div>
            <div className="report-progress-track">
              <div
                className="report-progress-fill"
                style={{ width: `${slotState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* READING */}
        {slotState.status === 'reading' && (
          <div>
            <span style={{ fontFamily: 'var(--fs)', fontSize: '13px', color: 'var(--ink)' }}>
              Reading the report…
            </span>
            <div className="report-progress-track">
              <div
                className="report-progress-fill"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* DONE */}
        {slotState.status === 'done' && (
          <div>
            <div
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {slotState.filled > 0
                ? `${slotState.filled} of ${totalCount} fields filled`
                : 'No matching values were found in this report.'}
            </div>
            <div
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '12px',
                color: 'var(--mut)',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fileName || 'Uploaded earlier in this session'}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '8px',
                flexWrap: 'wrap',
              }}
            >
              <QuietButton
                size="sm"
                leftIcon={<Upload size={14} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </QuietButton>
              <QuietButton
                size="sm"
                leftIcon={<X size={14} />}
                aria-label={`Remove ${displayName}`}
                onClick={handleRemove}
              >
                Remove
              </QuietButton>
              <QuietButton
                size="sm"
                rightIcon={showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                onClick={() => setShowDetails((prev) => !prev)}
              >
                Details
              </QuietButton>
            </div>

            {/* Details list */}
            {showDetails && (
              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--bd)',
                  fontSize: '12px',
                  fontFamily: 'var(--fs)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {/* Not found */}
                {slotState.notFound && slotState.notFound.length > 0 && (
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      Not found ({slotState.notFound.length}):{' '}
                    </span>
                    <span style={{ color: 'var(--mut)' }}>
                      {slotState.notFound.map(getFieldLabel).join(', ')}
                    </span>
                  </div>
                )}

                {/* Kept as entered (skipped) */}
                {slotState.skipped && slotState.skipped.length > 0 && (
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      Kept as entered ({slotState.skipped.length}):{' '}
                    </span>
                    <span style={{ color: 'var(--mut)' }}>
                      {slotState.skipped.map(getFieldLabel).join(', ')}
                    </span>
                  </div>
                )}

                {/* Not accepted */}
                {slotState.rejected && slotState.rejected.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>
                      Not accepted ({slotState.rejected.length}):
                    </div>
                    {slotState.rejected.map((rej, idx) => (
                      <div key={idx} style={{ color: 'var(--mut)', paddingLeft: '8px' }}>
                        {getFieldLabel(rej.key)}: {REJECTED_REASONS[rej.reason] || rej.reason}
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes (warnings) */}
                {slotState.warnings && slotState.warnings.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>
                      Notes:
                    </div>
                    {slotState.warnings.map((w, idx) => (
                      <div key={idx} style={{ color: 'var(--mut)', paddingLeft: '8px' }}>
                        {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ERROR */}
        {slotState.status === 'error' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                color: 'var(--ink)',
                lineHeight: 1.4,
              }}
            >
              <span className="report-error-dot" />
              <span>
                {slotState.error
                  ? formatErrorMessage(slotState.error.code, slotState.error.suggested_type)
                  : 'Something went wrong while reading the report.'}
              </span>
            </div>
            <div style={{ marginTop: '8px' }}>
              <QuietButton
                size="sm"
                leftIcon={<RotateCcw size={14} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Try again
              </QuietButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportSlot;
