import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import { TechnicalReportView } from '../components/reports/TechnicalReportView';
import { PatientReportView } from '../components/reports/PatientReportView';
import type { PatientReportData, TechnicalReportData } from '../types/wizard';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
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

    // Only fetch if forced or if we don't have the report for the current tab
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

      // Re-fetch diagnostic status to capture result of generation
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

  // Generate when tab changes if not already fetched
  useEffect(() => {
    fetchActiveReport();
  }, [activeTab]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  // Task 1.11 & 2.4: Single status line under the report tabs driven by status codes
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
    // Default / no_key / placeholder
    return 'Groq API key not found. Using standard template.';
  };

  const tabs = [
    { id: 'technical', label: 'Clinician report' },
    { id: 'patient', label: 'Patient report' },
  ];

  return (
    <div className="w-full bg-panel py-6 px-4 md:px-8 flex flex-col items-center min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-[800px] flex flex-col gap-6">
        {/* Top Control Bar: Tabs left, Actions right (hidden during print) */}
        <div className="no-print w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-2">
          <div>
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as ReportTab)}
              className="border-b-0"
            />
            {/* Task 1.11 single status line: plain 12px muted text */}
            <p className="text-[12px] leading-[16px] text-text-muted mt-2">
              {getStatusLine()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => fetchActiveReport(true)}
              disabled={isLoading}
            >
              Regenerate
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrint}
            >
              Print
            </Button>
          </div>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="no-print w-full text-[13px] text-risk-high flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button variant="link" onClick={() => fetchActiveReport(true)}>
              Try again
            </Button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="w-full max-w-[800px] bg-page border border-border rounded p-12 flex flex-col gap-6 mx-auto">
            <div className="flex items-center gap-3">
              <span className="spinner" />
              <span className="text-[14px] text-text-muted">Generating structured report...</span>
            </div>
            <Skeleton height={32} width="60%" />
            <Skeleton height={20} width="40%" />
            <div className="flex flex-col gap-2 pt-4">
              <Skeleton height={24} width="100%" />
              <Skeleton height={24} width="100%" />
              <Skeleton height={24} width="100%" />
            </div>
          </div>
        ) : (
          /* Rendered Report Document Sheet */
          <div>
            {activeTab === 'technical' && technicalReport && (
              <TechnicalReportView report={technicalReport} />
            )}
            {activeTab === 'patient' && patientReport && (
              <PatientReportView report={patientReport} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
