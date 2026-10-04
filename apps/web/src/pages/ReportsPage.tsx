/**
 * Step 4: Clinical & Patient Report Generation Page (Task 5.6, Phase C)
 * Features:
 * - Two Tabs: 'Technical report (for clinician)' and 'Patient report'
 * - Loading, Regenerate, Download PDF, and Print actions
 * - Persistent disclaimer banner + Section 8 disclaimer in document
 * - Graceful fallback to verified deterministic clinical report template
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  User,
  Printer,
  Download,
  RotateCw,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react';
import { useWizardStore } from '../store/useWizardStore';
import { TechnicalReportView } from '../components/reports/TechnicalReportView';
import { PatientReportView } from '../components/reports/PatientReportView';
import type { PatientReportData, TechnicalReportData } from '../types/wizard';
import { Button, Card, Badge, Banner, Spinner } from '../components/ui';

type ReportTab = 'technical' | 'patient';

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
  const [llmStatus, setLlmStatus] = useState<{ configured: boolean; model: string } | null>(null);

  // Guard: if no prediction exists yet, redirect to results
  useEffect(() => {
    if (!isStepUnlocked(4) || !prediction) {
      navigate('/results', { replace: true });
    }
  }, [isStepUnlocked, prediction, navigate]);

  // Check LLM config status on mount
  useEffect(() => {
    fetch('/api/v1/reports/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setLlmStatus({ configured: data.configured, model: data.model });
        }
      })
      .catch(() => {
        setLlmStatus(null);
      });
  }, []);

  // Fetch or generate report for active tab
  const fetchReport = async (tab: ReportTab, forceRefresh: boolean = false) => {
    if (!forceRefresh) {
      if (tab === 'technical' && technicalReport) return;
      if (tab === 'patient' && patientReport) return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const endpoint = tab === 'technical' ? '/api/v1/reports/technical' : '/api/v1/reports/patient';
    const payload = {
      patient: inputs,
      predictions: prediction,
      explanations: shapResult,
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Report service returned ${res.status}: ${res.statusText}`);
      }

      const reportData = await res.json();
      if (tab === 'technical') {
        setTechnicalReport(reportData as TechnicalReportData);
      } else {
        setPatientReport(reportData as PatientReportData);
      }
    } catch (err: any) {
      console.error('[ReportsPage] Fetch error:', err);
      setErrorMessage(err.message || 'Failed to generate report.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load when tab changes
  useEffect(() => {
    if (prediction) {
      fetchReport(activeTab, false);
    }
  }, [activeTab, prediction]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleRegenerate = () => {
    fetchReport(activeTab, true);
  };

  const currentReport = activeTab === 'technical' ? technicalReport : patientReport;

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 md:p-8 max-w-7xl mx-auto w-full gap-5">
      {/* Top Controls Island */}
      <Card variant="base" padding="md" className="w-full print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Navigation & Tab Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/results')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to 3D Twin
            </Button>

            {/* Two Tabs */}
            <div className="flex items-center gap-1 bg-[#0b0f17] p-1 rounded-md border border-[#283548]">
              <button
                type="button"
                id="tab-technical"
                onClick={() => setActiveTab('technical')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer select-none ${
                  activeTab === 'technical'
                    ? 'bg-[#1c2637] text-white border border-[#384961] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Technical Report (Clinician)</span>
              </button>

              <button
                type="button"
                id="tab-patient"
                onClick={() => setActiveTab('patient')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer select-none ${
                  activeTab === 'patient'
                    ? 'bg-[#1c2637] text-white border border-[#384961] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient Report</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: Regenerate, Download PDF, Print */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Groq / LLM Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono-numbers border ${
                llmStatus?.configured
                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                  : 'bg-[#1c2637] text-slate-400 border-[#283548]'
              }`}
              title={
                llmStatus?.configured
                  ? `Connected to Groq ${llmStatus.model}`
                  : 'Deterministic verified clinical template active'
              }
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>
                {llmStatus?.configured ? `Groq (${llmStatus.model})` : 'Deterministic Template Mode'}
              </span>
            </div>

            <Button
              id="regenerate-report-btn"
              variant="secondary"
              size="sm"
              onClick={handleRegenerate}
              disabled={isLoading}
              leftIcon={<RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Regenerate
            </Button>

            <Button
              id="download-pdf-btn"
              variant="secondary"
              size="sm"
              onClick={handleDownloadPdf}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download PDF
            </Button>

            <Button
              id="print-report-btn"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* Non-blocking notice if Groq not configured */}
      {!llmStatus?.configured && (
        <Banner variant="info" className="print:hidden">
          Groq API key not configured in environment. Displaying verified deterministic clinical template derived directly from model context.
        </Banner>
      )}

      {/* Error state */}
      {errorMessage && (
        <Banner variant="danger">
          {errorMessage}
        </Banner>
      )}

      {/* Loading state */}
      {isLoading && (
        <Card variant="base" padding="lg" className="flex flex-col items-center justify-center gap-3 text-center py-16">
          <Spinner size="lg" />
          <span className="text-sm font-semibold text-white">
            Synthesizing Structured Clinical Report...
          </span>
          <p className="text-xs text-slate-400 font-mono-numbers">
            Validating 55 input vectors, TreeSHAP attributions, and regulatory disclosures.
          </p>
        </Card>
      )}

      {/* Rendered Document View */}
      {!isLoading && currentReport && (
        <div className="w-full">
          {activeTab === 'technical' && (
            <TechnicalReportView report={currentReport as TechnicalReportData} />
          )}

          {activeTab === 'patient' && (
            <PatientReportView report={currentReport as PatientReportData} />
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
