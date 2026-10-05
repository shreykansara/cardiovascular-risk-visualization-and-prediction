/**
 * useReports hook
 * Deterministic report fetching with client-side hashing, StrictMode protection,
 * and zero LLM dependencies.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PatientData } from '../types/clinical';
import type { PatientReportData, TechnicalReportData } from '../types/wizard';
import { useWizardStore } from '../store/useWizardStore';

export type ReportStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseReportsReturn {
  status: ReportStatus;
  technicalReport: TechnicalReportData | null;
  patientReport: PatientReportData | null;
  preparedAt: string | null;
  fetchReports: () => Promise<void>;
}

export function computeInputsHash(inputs: PatientData): string {
  const sortedKeys = Object.keys(inputs).sort();
  const pairs = sortedKeys.map((k) => `${k}:${(inputs as any)[k]}`);
  return pairs.join('|');
}

export function formatCurrentTime(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function useReports(patientData: PatientData): UseReportsReturn {
  const {
    technicalReport,
    patientReport,
    reportsHash,
    reportsPreparedAt,
    setReports,
  } = useWizardStore();

  const currentHash = computeInputsHash(patientData);
  const isMatch = Boolean(
    technicalReport && patientReport && reportsHash === currentHash
  );

  const [status, setStatus] = useState<ReportStatus>(() =>
    isMatch ? 'ready' : 'idle'
  );

  const inFlightRef = useRef(false);
  const lastFetchedHashRef = useRef<string | null>(isMatch ? currentHash : null);

  const fetchReports = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatus('loading');

    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patient: patientData }),
      });

      if (!res.ok) {
        throw new Error(`Report preparation failed with status ${res.status}`);
      }

      const data = await res.json();
      const preparedAt = formatCurrentTime();
      setReports(data.clinician, data.patient, currentHash, preparedAt);
      lastFetchedHashRef.current = currentHash;
      setStatus('ready');
    } catch (err) {
      console.error('Failed to prepare reports:', err);
      setStatus('error');
    } finally {
      inFlightRef.current = false;
    }
  }, [patientData, currentHash, setReports]);

  // One request per change of inputs, safe under React StrictMode
  useEffect(() => {
    if (isMatch) {
      if (status !== 'ready') {
        setStatus('ready');
      }
      return;
    }

    if (lastFetchedHashRef.current === currentHash && status === 'ready') {
      return;
    }

    fetchReports();
  }, [isMatch, currentHash, status, fetchReports]);

  return {
    status,
    technicalReport,
    patientReport,
    preparedAt: reportsPreparedAt,
    fetchReports,
  };
}
