import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import { useReportGeneration } from '../hooks/useReportGeneration';
import { TechnicalReportView } from '../components/reports/TechnicalReportView';
import { PatientReportView } from '../components/reports/PatientReportView';
import { GeneratingView } from '../components/reports/GeneratingView';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Panel } from '../components/ui/Panel';

type ReportTab = 'technical' | 'patient';

interface DiagnosticStatus {
  last_status?: string;
  model?: string;
  key_present?: boolean;
  key_is_placeholder?: boolean;
  cooldown_s?: number | null;
  groq_calls_last_hour?: number;
}

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    inputs,
    prediction,
    technicalReport,
    patientReport,
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
  const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus | null>(null);

  // Single-call report generation hook (Tasks 4.1 & 4.2)
  const {
    status: genStatus,
    currentStage,
    retryInSeconds,
    elapsedSeconds,
    cooldownRemaining,
    meta,
    error: genError,
    generate,
  } = useReportGeneration(inputs);

  // Guard: if no prediction exists yet, redirect to results
  useEffect(() => {
    if (!isStepUnlocked(4) || !prediction) {
      navigate('/results', { replace: true });
    }
  }, [isStepUnlocked, prediction, navigate]);

  // Fetch zero-Groq configuration diagnostics on mount (Task 3.12)
  useEffect(() => {
    fetch('/api/v1/reports/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDiagnosticStatus(data);
        }
      })
      .catch(() => {
        setDiagnosticStatus({ last_status: 'network_error' });
      });
  }, []);

  // Auto-generate on initial mount if neither report is present in store
  useEffect(() => {
    if (prediction && (!technicalReport || !patientReport) && genStatus === 'idle') {
      generate();
    }
  }, [prediction, technicalReport, patientReport, genStatus, generate]);

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

  // Status line in metadata bar (Task 4.3)
  const getStatusLine = () => {
    const source = meta?.source || (technicalReport?.source === 'groq' ? 'groq' : 'template');
    const model = meta?.model || diagnosticStatus?.model || 'llama-3.3-70b-versatile';
    const elapsedSec = meta?.elapsed_ms ? (meta.elapsed_ms / 1000).toFixed(1) : null;
    const effectiveCooldown = cooldownRemaining ?? meta?.cooldown_s ?? diagnosticStatus?.cooldown_s;

    let baseText = '';
    if (source === 'groq') {
      baseText = `Synthesized by Groq (${model})${elapsedSec ? ` in ${elapsedSec}s` : ''}`;
    } else if (source === 'mixed') {
      const templateSections = Object.entries(meta?.section_sources || {})
        .filter(([_, s]) => s === 'template')
        .map(([sec]) => sec.split('.').pop());
      baseText = `Synthesized by Groq with rule-based fallback for ${
        templateSections.length > 0 ? templateSections.join(', ') : 'safety validation'
      }`;
    } else {
      const errStatus = meta?.status || diagnosticStatus?.last_status || 'template';
      baseText = `Synthesized from clinical rules and TreeSHAP values (Groq offline or rate limited: ${errStatus})`;
    }

    if (effectiveCooldown && effectiveCooldown > 0) {
      baseText += ` • Next AI generation available in ${effectiveCooldown}s`;
    }

    return baseText;
  };

  const tabs = [
    { id: 'technical', label: 'Clinician report' },
    { id: 'patient', label: 'Patient report' },
  ];

  const isGenerating = genStatus === 'generating';
  const hasReports = Boolean(technicalReport && patientReport);
  const isRegenerateDisabled = isGenerating || Boolean(cooldownRemaining && cooldownRemaining > 0);

  return (
    <div className="w-full flex-1 flex flex-col pb-16">
      <style>{`
        .report-fade-in {
          animation: reportFadeIn 250ms cubic-bezier(0.2, 0.9, 0.4, 1) forwards;
        }
        @keyframes reportFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

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
              variant="secondary"
              onClick={() => generate({ force: true })}
              disabled={isRegenerateDisabled}
              title={
                cooldownRemaining && cooldownRemaining > 0
                  ? `Next AI generation available in ${cooldownRemaining}s`
                  : 'Regenerate reports'
              }
              style={{ height: '32px' }}
            >
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrintOrDownloadPdf}
              disabled={isGenerating || !hasReports}
              style={{ height: '32px' }}
            >
              Download PDF
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrintOrDownloadPdf}
              disabled={isGenerating || !hasReports}
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

      {/* Plain error line in --ink with small --high dot and "Try again" text link */}
      {genError && (
        <div
          className="app-chrome no-print w-full flex items-center justify-center gap-2 py-2 mb-2"
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
          <span>{genError}</span>
          <button
            type="button"
            onClick={() => generate({ force: true })}
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
        {isGenerating ? (
          /* True System State Generating View (Task 4.2) */
          <GeneratingView
            currentStage={currentStage}
            elapsedSeconds={elapsedSeconds}
            retryInSeconds={retryInSeconds}
            modelName={meta?.model || diagnosticStatus?.model || 'llama-3.3-70b-versatile'}
          />
        ) : (
          /* Completed Reports View with 250ms Smooth Fade Transition (Task 4.3) */
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
