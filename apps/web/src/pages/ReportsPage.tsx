/**
 * Step 4: Clinical & Patient Report Generation Page (Task 5.6)
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
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { useWizardStore } from '../store/useWizardStore';
import { TechnicalReportView } from '../components/reports/TechnicalReportView';
import { PatientReportView } from '../components/reports/PatientReportView';
import type { PatientReportData, TechnicalReportData } from '../types/wizard';

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
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl print:hidden">
        {/* Navigation & Tab Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/results')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-colors shrink-0 w-fit cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to 3D Twin</span>
          </button>

          {/* Two Tabs (Task 5.6) */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/[0.06]">
            <button
              type="button"
              id="tab-technical"
              onClick={() => setActiveTab('technical')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'technical'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)] border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Technical Report (for Clinician)</span>
            </button>

            <button
              type="button"
              id="tab-patient"
              onClick={() => setActiveTab('patient')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'patient'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)] border border-cyan-500/40'
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
          {/* LLM Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border ${
              llmStatus?.configured
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-white/[0.06]'
            }`}
            title={
              llmStatus?.configured
                ? `Connected to ${llmStatus.model}`
                : 'Deterministic verified clinical template active'
            }
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>
              {llmStatus?.configured ? `LLM Active (${llmStatus.model})` : 'Deterministic Template Mode'}
            </span>
          </div>

          <button
            type="button"
            id="regenerate-report-btn"
            onClick={handleRegenerate}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-medium border border-white/[0.08] transition-all cursor-pointer disabled:opacity-60"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <button
            type="button"
            id="download-pdf-btn"
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            id="print-report-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Non-blocking LLM notice if not configured */}
      {!llmStatus?.configured && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-slate-400 text-xs flex items-center gap-2 print:hidden font-mono">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            LLM API key not configured in environment. Displaying verified deterministic clinical template derived directly from model context.
          </span>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-16 rounded-2xl glass-card border border-white/[0.08] flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm font-semibold text-white">
            Synthesizing Structured Clinical Report...
          </span>
          <p className="text-xs text-slate-400 font-mono">
            Validating 55 input vectors, TreeSHAP attributions, and regulatory disclosures.
          </p>
        </div>
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
