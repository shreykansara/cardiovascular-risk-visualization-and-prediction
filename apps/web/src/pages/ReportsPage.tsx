import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import { useReports } from '../hooks/useReports';
import { TechnicalReportView } from '../components/reports/TechnicalReportView';
import { PatientReportView } from '../components/reports/PatientReportView';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Panel } from '../components/ui/Panel';

type ReportTab = 'technical' | 'patient';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    inputs,
    prediction,
    isStepUnlocked,
  } = useWizardStore();

  const isPaperFeed = Boolean((location.state as any)?.paperFeed);
  const [showPrintHead, setShowPrintHead] = useState<boolean>(isPaperFeed);

  useEffect(() => {
    if (isPaperFeed) {
      const timer = window.setTimeout(() => {
        setShowPrintHead(false);
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [isPaperFeed]);

  const [activeTab, setActiveTab] = useState<ReportTab>('technical');

  // Guard: if no prediction exists yet or step 4 not unlocked, redirect to welcome (not results)
  useEffect(() => {
    if (!isStepUnlocked(4) || !prediction) {
      navigate('/welcome', { replace: true });
    }
  }, [isStepUnlocked, prediction, navigate]);

  // Hook for deterministic report fetching with client-side hashing
  const {
    status,
    technicalReport,
    patientReport,
    preparedAt,
    fetchReports,
  } = useReports(inputs);

  const handlePrintOrDownloadPdf = () => {
    const origTitle = document.title;
    const todayStr = new Date().toISOString().slice(0, 10);
    const printTitle = activeTab === 'technical'
      ? `Perfusion3D clinician report ${todayStr}`
      : `Perfusion3D patient report ${todayStr}`;

    document.title = printTitle;

    const handleAfterPrint = () => {
      document.title = origTitle;
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);

    window.print();
  };

  const tabs = [
    { id: 'technical', label: 'Clinician report' },
    { id: 'patient', label: 'Patient report' },
  ];

  const isLoading = status === 'loading' || status === 'idle';
  const isReady = status === 'ready' && technicalReport && patientReport;
  const isError = status === 'error';

  return (
    <div className="w-full flex-1 flex flex-col pb-16">
      {/* Visually hidden screen reader status region */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {isLoading ? 'Preparing the reports' : isReady ? 'Reports ready' : 'The reports could not be prepared.'}
      </div>

      {/* Top band: tabs, buttons, status line */}
      <Panel
        className="app-chrome no-print wipe w-full mb-4 flex flex-col gap-2"
        style={{ padding: '8px 16px', '--i': 0 } as React.CSSProperties}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as ReportTab)}
            className="border-b-0"
          />

          <div className="flex items-center gap-2">
            <Button
              id="download-pdf-button"
              variant="secondary"
              onClick={handlePrintOrDownloadPdf}
              disabled={!isReady}
              style={{ height: '32px' }}
            >
              Download PDF
            </Button>
            <Button
              id="print-report-button"
              variant="secondary"
              onClick={handlePrintOrDownloadPdf}
              disabled={!isReady}
              style={{ height: '32px' }}
            >
              Print
            </Button>
          </div>
        </div>

        {/* Status line (12px, --ink): exactly one of loading, ready, error */}
        <div
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '12px',
            color: 'var(--ink)',
            margin: '2px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isLoading && <span>Preparing the reports</span>}
          {isReady && <span>Prepared at {preparedAt} from the entered values.</span>}
          {isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>The reports could not be prepared.</span>
              <button
                id="try-again-button"
                type="button"
                onClick={fetchReports}
                style={{
                  height: '32px',
                  padding: '0 10px',
                  background: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: '3px',
                  color: 'var(--ink)',
                  fontFamily: 'var(--fs)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </Panel>

      {/* Main printable report root */}
      <main id="print-root" className="w-full">
        {isLoading ? (
          /* Static Skeleton inside the sheet using ONLY sheet tokens (--s-skel on --s-bg) */
          <div
            className={`sheet-wrapper ${isPaperFeed ? 'feed-sheet' : 'wipe'}`}
            style={{ position: 'relative', width: '100%', '--i': 1 } as React.CSSProperties}
          >
            {isPaperFeed && showPrintHead && (
              <div
                className="print-head-line no-print"
                aria-hidden="true"
                onAnimationEnd={() => setShowPrintHead(false)}
              />
            )}
            <article
              id="printable-report-sheet"
              className="sheet w-full"
              aria-busy="true"
              style={{
                backgroundColor: 'var(--s-bg)',
                color: 'var(--s-ink)',
                border: '1px solid var(--s-bd)',
                borderRadius: '3px',
                maxWidth: '720px',
                margin: '16px auto',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div style={{ width: '60%', height: '24px', backgroundColor: 'var(--s-skel)', borderRadius: '3px' }} />
              <div style={{ width: '35%', height: '14px', backgroundColor: 'var(--s-skel)', borderRadius: '3px' }} />
              <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--s-bd)' }} />
              <div style={{ width: '100%', height: '80px', backgroundColor: 'var(--s-skel)', borderRadius: '3px' }} />
              <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--s-skel)', borderRadius: '3px' }} />
              <div style={{ width: '100%', height: '60px', backgroundColor: 'var(--s-skel)', borderRadius: '3px' }} />
            </article>
          </div>
        ) : isError ? (
          /* Error state inside the sheet: one line in --s-ink with a 7px --s-high dot */
          <div
            className="sheet-wrapper wipe"
            style={{ position: 'relative', width: '100%', '--i': 1 } as React.CSSProperties}
          >
            <article
              id="printable-report-sheet"
              className="sheet w-full"
              style={{
                backgroundColor: 'var(--s-bg)',
                color: 'var(--s-ink)',
                border: '1px solid var(--s-bd)',
                borderRadius: '3px',
                maxWidth: '720px',
                margin: '16px auto',
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--fs)',
                fontSize: '13px',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--s-high)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--s-ink)' }}>The reports could not be prepared.</span>
            </article>
          </div>
        ) : (
          /* Completed Reports View */
          <div
            className={`sheet-wrapper report-fade-in ${isPaperFeed ? 'feed-sheet' : 'wipe'}`}
            style={{ position: 'relative', width: '100%', '--i': 1 } as React.CSSProperties}
          >
            {isPaperFeed && showPrintHead && (
              <div
                className="print-head-line no-print"
                aria-hidden="true"
                onAnimationEnd={() => setShowPrintHead(false)}
              />
            )}

            <div className="w-full">
              {activeTab === 'technical' && technicalReport && (
                <TechnicalReportView report={technicalReport} />
              )}
              {activeTab === 'patient' && patientReport && (
                <PatientReportView report={patientReport} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReportsPage;
