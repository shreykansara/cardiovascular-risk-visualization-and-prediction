import React, { useState, forwardRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Panel } from '../ui/Panel';
import { ReportSlot } from './ReportSlot';
import { useWizardStore } from '../../store/useWizardStore';
import type { ReportType } from '../../types/extraction';

export interface ReportUploadPanelProps {
  firstSlotButtonRef?: React.RefObject<HTMLButtonElement>;
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
}

export const ReportUploadPanel = forwardRef<HTMLDivElement, ReportUploadPanelProps>(
  ({ firstSlotButtonRef, isExpanded: controlledExpanded, onToggleExpanded }, ref) => {
    const [internalExpanded, setInternalExpanded] = useState(true);
    const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

    const [announcement, setAnnouncement] = useState('');

    const reports = useWizardStore((s) => s.reports);

    const uploadedReportsCount = (['ecg', 'echo', 'lab', 'ehr'] as ReportType[]).filter(
      (t) => reports[t].status === 'done'
    ).length;

    const filledFieldsCount = (['ecg', 'echo', 'lab', 'ehr'] as ReportType[]).reduce(
      (sum, t) => sum + (reports[t].status === 'done' ? reports[t].filled : 0),
      0
    );

    const handleToggle = () => {
      const next = !isExpanded;
      if (onToggleExpanded) {
        onToggleExpanded(next);
      } else {
        setInternalExpanded(next);
      }
    };

    const handleAnnounce = (msg: string) => {
      setAnnouncement(msg);
    };

    return (
      <Panel
        ref={ref}
        id="report-upload-panel"
        className="wipe"
        style={{ padding: 0, overflow: 'hidden', marginBottom: '14px' }}
      >
        {/* Visually hidden screen reader status region (Task 9.7) */}
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>

        {/* Header Button (Task 9.2) */}
        <button
          type="button"
          aria-expanded={isExpanded}
          className="report-panel-header-btn"
          onClick={handleToggle}
        >
          <span
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            Upload reports
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--fm)',
              fontSize: '12px',
              color: 'var(--mut)',
            }}
          >
            <span>
              {uploadedReportsCount} of 4 reports uploaded · {filledFieldsCount} of 55 fields filled
            </span>
            {isExpanded ? (
              <ChevronUp size={16} color="var(--mut)" />
            ) : (
              <ChevronDown size={16} color="var(--mut)" />
            )}
          </div>
        </button>

        {/* Collapsible Body */}
        {isExpanded && (
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid var(--bd)',
            }}
          >
            {/* Helper text */}
            <p
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '13px',
                color: 'var(--mut)',
                maxWidth: '64ch',
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              Upload the reports you have. Only the fields found in an uploaded report are filled;
              everything else stays empty.
            </p>

            {/* 4 Slots Grid (Task 9.2) */}
            <div className="report-slot-grid">
              <ReportSlot
                type="ecg"
                onAnnounce={handleAnnounce}
                firstSlotButtonRef={firstSlotButtonRef}
              />
              <ReportSlot type="echo" onAnnounce={handleAnnounce} />
              <ReportSlot type="lab" onAnnounce={handleAnnounce} />
              <ReportSlot type="ehr" onAnnounce={handleAnnounce} />
            </div>

            {/* Verified Caption (Task 9.2 & 9.9) */}
            <div
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '11px',
                color: 'var(--mut)',
                marginTop: '12px',
                lineHeight: 1.4,
              }}
            >
              PDF only, up to 5 MB each. Files are read in memory and are not stored.
            </div>
          </div>
        )}
      </Panel>
    );
  }
);

ReportUploadPanel.displayName = 'ReportUploadPanel';

export default ReportUploadPanel;
