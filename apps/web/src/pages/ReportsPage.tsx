import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import { TechnicalReportView } from '../components/reports/TechnicalReportView';
import { PatientReportView } from '../components/reports/PatientReportView';
import type { PatientReportData, TechnicalReportData } from '../types/wizard';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Panel } from '../components/ui/Panel';
import { Skeleton } from '../components/ui/Skeleton';

type ReportTab = 'technical' | 'patient';

interface DiagnosticStatus {
  last_error_code?: string | null;
  model?: string;
  key_present?: boolean;
  key_is_placeholder?: boolean;
}

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    inputs,
    prediction,
    shapResult,
    technicalReport,
    patientReport,
    setTechnicalReport,
    setPatientReport,
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus | null>(null);
  const [llmOutputUsed, setLlmOutputUsed] = useState<boolean>(false);

  // Guard: if no prediction exists yet, redirect to results
  useEffect(() => {
    if (!isStepUnlocked(4) || !prediction) {
      navigate('/results', { replace: true });
    }
  }, [isStepUnlocked, prediction, navigate]);

  // Fetch Groq diagnostics on mount
  useEffect(() => {
    fetch('/api/v1/reports/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDiagnosticStatus(data);
        }
      })
      .catch(() => {
        setDiagnosticStatus({ last_error_code: 'network_error' });
      });
  }, []);

  const fetchActiveReport = async (force: boolean = false) => {
    if (!prediction) return;

    if (!force) {
      if (activeTab === 'technical' && technicalReport) return;
      if (activeTab === 'patient' && patientReport) return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const payload = {
      patient: inputs,
      predictions: prediction,
      explanations: shapResult,
    };

    try {
      const endpoint = activeTab === 'technical' ? '/api/v1/reports/technical' : '/api/v1/reports/patient';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Report endpoint returned an error.');
      }

      const data = await res.json();

      if (activeTab === 'technical') {
        setTechnicalReport(data as TechnicalReportData);
      } else {
        setPatientReport(data as PatientReportData);
      }

      const statusRes = await fetch('/api/v1/reports/status');
      if (statusRes.ok) {
        const diag = await statusRes.json();
        setDiagnosticStatus(diag);
        if (diag.last_error_code === 'ok' || data.source === 'groq') {
          setLlmOutputUsed(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed generating report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveReport();
  }, [activeTab]);

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

  const getStatusLine = () => {
    const code = diagnosticStatus?.last_error_code;
    const model = diagnosticStatus?.model || 'llama-3.3-70b-versatile';

    if (code === 'ok' && llmOutputUsed) {
      return `Generated with Groq (${model})`;
    }
    if (code === 'request_blocked') {
      return 'Groq blocked the request. Using standard template.';
    }
    if (code === 'access_denied') {
      return 'Groq denied access for this key. Using standard template.';
    }
    if (code === 'key_rejected') {
      return 'Groq rejected the API key. Using standard template.';
    }
    if (code === 'model_unavailable') {
      return 'Groq model not available. Using standard template.';
    }
    if (code === 'rate_limited') {
      return 'Groq rate limit reached. Using standard template.';
    }
    if (code === 'validation_failed') {
      return 'Generated text failed safety checks. Using standard template.';
    }
    if (code === 'network_error') {
      return 'Could not reach Groq. Using standard template.';
    }
    return 'Groq API key not found. Using standard template.';
  };

  const tabs = [
    { id: 'technical', label: 'Clinician report' },
    { id: 'patient', label: 'Patient report' },
  ];

  return (
    <div className="w-full flex-1 flex flex-col pb-16">
      {/* Task 5.4 / 6.1 Top band: tabs, buttons, status line */}
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
              variant="secondary"
              onClick={() => fetchActiveReport(true)}
              disabled={isLoading}
              style={{ height: '32px' }}
            >
              Regenerate
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrintOrDownloadPdf}
              style={{ height: '32px' }}
            >
              Download PDF
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrintOrDownloadPdf}
              style={{ height: '32px' }}
            >
              Print
            </Button>
          </div>
        </div>

        {/* Status line (12px --mut, Sora) */}
        <p
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '12px',
            color: 'var(--mut)',
            margin: '2px 0 0',
          }}
        >
          {getStatusLine()}
        </p>
      </Panel>

      {/* Task 5.7 Plain error line in --ink with small --high dot and "Try again" text link */}
      {errorMessage && (
        <div
          className="app-chrome no-print w-full flex items-center justify-center gap-2 py-2"
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '13px',
            color: 'var(--ink)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--high)',
              display: 'inline-block',
            }}
          />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => fetchActiveReport(true)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontFamily: 'var(--fs)',
              fontSize: '13px',
              color: 'var(--acc)',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginLeft: '4px',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Main printable report root */}
      <main id="print-root" className="w-full">
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

          {/* Loading state: Static Skeletons (no spinners!) */}
          {isLoading ? (
            <article
              className="sheet w-full"
              style={{
                backgroundColor: 'var(--s-bg)',
                border: '1px solid var(--s-bd)',
                borderRadius: '3px',
                maxWidth: '720px',
                margin: '16px auto',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <Skeleton height={28} width="50%" />
              <Skeleton height={14} width="35%" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px' }}>
                <Skeleton height={20} width="100%" />
                <Skeleton height={20} width="90%" />
                <Skeleton height={20} width="95%" />
                <Skeleton height={20} width="80%" />
              </div>
            </article>
          ) : (
            /* Rendered Document Sheet */
            <div className="w-full">
              {activeTab === 'technical' && technicalReport && (
                <TechnicalReportView report={technicalReport} />
              )}
              {activeTab === 'patient' && patientReport && (
                <PatientReportView report={patientReport} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
