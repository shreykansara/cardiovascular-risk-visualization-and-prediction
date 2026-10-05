import { useState, useEffect, useRef, useCallback } from 'react';
import type { PatientData } from '../types/clinical';
import type { PatientReportData, TechnicalReportData } from '../types/wizard';
import { useWizardStore } from '../store/useWizardStore';

export type ReportStage = 'preparing' | 'requesting' | 'waiting_retry' | 'checking' | 'building' | null;

export interface ReportMeta {
  status: string;
  source: 'groq' | 'template' | 'mixed' | string;
  model: string;
  elapsed_ms: number;
  cooldown_s: number | null;
  section_sources: Record<string, string>;
  generated_at: string;
}

export interface UseReportGenerationReturn {
  status: 'idle' | 'generating' | 'success' | 'error';
  currentStage: ReportStage;
  retryInSeconds: number | null;
  elapsedSeconds: number;
  cooldownRemaining: number | null;
  reports: {
    clinician: TechnicalReportData;
    patient: PatientReportData;
  } | null;
  meta: ReportMeta | null;
  error: string | null;
  generate: (options?: { force?: boolean }) => Promise<void>;
}

export function useReportGeneration(patientData: PatientData | null): UseReportGenerationReturn {
  const { technicalReport, patientReport, setTechnicalReport, setPatientReport } = useWizardStore();

  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>(
    technicalReport && patientReport ? 'success' : 'idle'
  );
  const [currentStage, setCurrentStage] = useState<ReportStage>(null);
  const [retryInSeconds, setRetryInSeconds] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [meta, setMeta] = useState<ReportMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);

  // Elapsed seconds timer during generation
  useEffect(() => {
    if (status === 'generating') {
      setElapsedSeconds(0);
      elapsedTimerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }
    return () => {
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current);
      }
    };
  }, [status]);

  // Retry countdown timer
  useEffect(() => {
    if (retryInSeconds !== null && retryInSeconds > 0) {
      retryTimerRef.current = window.setInterval(() => {
        setRetryInSeconds((prev) => {
          if (prev === null || prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (retryTimerRef.current) {
        window.clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    }
    return () => {
      if (retryTimerRef.current) {
        window.clearInterval(retryTimerRef.current);
      }
    };
  }, [retryInSeconds]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining !== null && cooldownRemaining > 0) {
      cooldownTimerRef.current = window.setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev === null || prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (cooldownTimerRef.current) {
        window.clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    }
    return () => {
      if (cooldownTimerRef.current) {
        window.clearInterval(cooldownTimerRef.current);
      }
    };
  }, [cooldownRemaining]);

  const generate = useCallback(
    async (options?: { force?: boolean }) => {
      if (!patientData) return;

      // Abort any prior request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setStatus('generating');
      setCurrentStage('preparing');
      setRetryInSeconds(null);
      setError(null);

      try {
        const response = await fetch('/api/v1/reports/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/x-ndjson',
          },
          body: JSON.stringify({
            patient: patientData,
            force: options?.force ?? false,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Report endpoint returned HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Streaming response body is empty.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep partial line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const eventData = JSON.parse(trimmed);

              if (eventData.event === 'stage') {
                const stage = eventData.stage as ReportStage;
                setCurrentStage(stage);
                if (stage === 'waiting_retry' && typeof eventData.retry_in_s === 'number') {
                  setRetryInSeconds(Math.ceil(eventData.retry_in_s));
                } else if (stage !== 'waiting_retry') {
                  setRetryInSeconds(null);
                }
              } else if (eventData.event === 'result') {
                const reportsData = eventData.reports;
                if (reportsData?.clinician && reportsData?.patient) {
                  setTechnicalReport(reportsData.clinician as TechnicalReportData);
                  setPatientReport(reportsData.patient as PatientReportData);
                }

                const metaData: ReportMeta = {
                  status: eventData.status,
                  source: eventData.source,
                  model: eventData.model,
                  elapsed_ms: eventData.elapsed_ms,
                  cooldown_s: eventData.cooldown_s ?? null,
                  section_sources: eventData.section_sources || {},
                  generated_at: eventData.generated_at,
                };
                setMeta(metaData);

                if (metaData.cooldown_s && metaData.cooldown_s > 0) {
                  setCooldownRemaining(metaData.cooldown_s);
                }

                setStatus('success');
                setCurrentStage(null);
                setRetryInSeconds(null);
              }
            } catch (parseErr) {
              console.warn('[NDJSON Parse Error]', parseErr, trimmed);
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('[Report Generation Failed]', err);
        setError(err.message || 'Report generation failed');
        setStatus('error');
        setCurrentStage(null);
      }
    },
    [patientData, setTechnicalReport, setPatientReport]
  );

  return {
    status,
    currentStage,
    retryInSeconds,
    elapsedSeconds,
    cooldownRemaining,
    reports:
      technicalReport && patientReport
        ? { clinician: technicalReport, patient: patientReport }
        : null,
    meta,
    error,
    generate,
  };
}
