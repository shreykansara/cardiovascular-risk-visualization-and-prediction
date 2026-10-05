import React from 'react';
import type { ReportStage } from '../../hooks/useReportGeneration';
import { Skeleton } from '../ui/Skeleton';

interface GeneratingViewProps {
  currentStage: ReportStage;
  elapsedSeconds: number;
  retryInSeconds: number | null;
  modelName?: string;
}

const STAGES = [
  {
    id: 'preparing',
    title: 'Preparing clinical data and out-of-range parameters',
    stageKey: 'preparing',
  },
  {
    id: 'requesting',
    title: 'Generating clinician and patient reports',
    stageKey: 'requesting', // also matches waiting_retry
  },
  {
    id: 'checking',
    title: 'Verifying numbers and clinical copy against model predictions',
    stageKey: 'checking',
  },
  {
    id: 'building',
    title: 'Assembling clinical layout and plain-language summaries',
    stageKey: 'building',
  },
];

export const GeneratingView: React.FC<GeneratingViewProps> = ({
  currentStage,
  elapsedSeconds,
  retryInSeconds,
  modelName = 'llama-3.3-70b-versatile',
}) => {
  // Format elapsed time as mm:ss
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Determine stage progression
  const getStageIndex = (stage: ReportStage): number => {
    switch (stage) {
      case 'preparing':
        return 0;
      case 'requesting':
      case 'waiting_retry':
        return 1;
      case 'checking':
        return 2;
      case 'building':
        return 3;
      default:
        return 0;
    }
  };

  const activeStageIndex = getStageIndex(currentStage);

  // Screen reader stage text
  const currentStageTitle = STAGES[activeStageIndex]?.title || 'Processing';
  const ariaAnnouncement = `Stage ${activeStageIndex + 1} of 4: ${currentStageTitle}${
    currentStage === 'waiting_retry' && retryInSeconds ? `. Rate limit reached. Retrying in ${retryInSeconds} seconds.` : ''
  }`;

  return (
    <div
      className="w-full flex flex-col items-center"
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '16px 20px',
      }}
    >
      <style>{`
        @keyframes ecg-trace-loop {
          0% {
            stroke-dashoffset: 1200;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes pulse-dot {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(184, 58, 58, 0.5);
          }
          50% {
            transform: scale(1.15);
            opacity: 0.85;
            box-shadow: 0 0 0 6px rgba(184, 58, 58, 0);
          }
        }
        @keyframes shimmer-sweep {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .generating-shimmer {
          background: linear-gradient(
            90deg,
            var(--bd) 0%,
            var(--s-bg) 50%,
            var(--bd) 100%
          ) !important;
          background-size: 200% 100% !important;
          animation: shimmer-sweep 2.2s infinite linear !important;
        }
      `}</style>

      {/* Screen Reader Live Region (Task 4.5) */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
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
        {ariaAnnouncement}
      </div>

      {/* Generating Card Container */}
      <div
        className="sheet w-full flex flex-col gap-5 p-6 rounded"
        style={{
          backgroundColor: 'var(--s-bg)',
          border: '1px solid var(--s-bd)',
          boxShadow: 'var(--p-sh, 0 4px 16px rgba(0,0,0,0.06))',
        }}
      >
        {/* Header with Title and Live Timer (Task 4.2) */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--bd)' }}>
          <div className="flex items-center gap-2">
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--acc, #B83A3A)',
                animation: 'pulse-dot 1.8s infinite ease-in-out',
              }}
            />
            <h2
              style={{
                fontFamily: 'var(--fs, "Sora", sans-serif)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Synthesizing Clinical & Patient Reports
            </h2>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded"
            style={{
              backgroundColor: 'var(--p-bg)',
              border: '1px solid var(--bd)',
              fontFamily: 'var(--fm, "IBM Plex Mono", monospace)',
              fontSize: '12px',
              color: 'var(--ink)',
              letterSpacing: '0.04em',
            }}
          >
            <span style={{ color: 'var(--mut)', fontSize: '10px', textTransform: 'uppercase' }}>Elapsed</span>
            <span style={{ fontWeight: 600 }}>{timeFormatted}</span>
          </div>
        </div>

        {/* ECG Trace-Loop Waveform Animation (Task 4.2) */}
        <div
          className="w-full flex items-center justify-center py-2"
          style={{
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'var(--p-bg)',
            borderRadius: '4px',
            border: '1px solid var(--bd)',
            height: '64px',
          }}
        >
          <svg
            viewBox="0 0 600 60"
            className="w-full h-full"
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            {/* Subtle grid background lines */}
            <line x1="0" y1="30" x2="600" y2="30" stroke="var(--bd)" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="150" y1="0" x2="150" y2="60" stroke="var(--bd)" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="300" y1="0" x2="300" y2="60" stroke="var(--bd)" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="450" y1="0" x2="450" y2="60" stroke="var(--bd)" strokeWidth="0.5" strokeDasharray="3 3" />

            {/* Continuous Heartbeat Pulse Trace Loop */}
            <polyline
              points="
                0,30 20,30 25,28 30,30 40,30 45,34 50,8 55,52 60,26 65,30 75,30 85,22 95,30 150,30
                170,30 175,28 180,30 190,30 195,34 200,8 205,52 210,26 215,30 225,30 235,22 245,30 300,30
                320,30 325,28 330,30 340,30 345,34 350,8 355,52 360,26 365,30 375,30 385,22 395,30 450,30
                470,30 475,28 480,30 490,30 495,34 500,8 505,52 510,26 515,30 525,30 535,22 545,30 600,30
              "
              fill="none"
              stroke="var(--acc, #B83A3A)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1200"
              style={{
                animation: 'ecg-trace-loop 3.5s linear infinite',
                filter: 'drop-shadow(0 0 3px rgba(184, 58, 58, 0.4))',
              }}
            />
          </svg>
        </div>

        {/* 4-Stage Vertical Progress List (Task 4.2) */}
        <div className="flex flex-col gap-3 py-1">
          {STAGES.map((step, idx) => {
            const isCompleted = idx < activeStageIndex;
            const isActive = idx === activeStageIndex;
            const isPending = idx > activeStageIndex;

            return (
              <div key={step.id} className="flex flex-col">
                <div className="flex items-center gap-3">
                  {/* Step status indicator dot / checkmark */}
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: '20px',
                      height: '20px',
                      flexShrink: 0,
                      backgroundColor: isCompleted
                        ? 'var(--acc, #B83A3A)'
                        : isActive
                        ? 'var(--p-bg)'
                        : 'transparent',
                      border: isCompleted
                        ? '1px solid var(--acc, #B83A3A)'
                        : isActive
                        ? '2px solid var(--acc, #B83A3A)'
                        : '1.5px solid var(--bd)',
                      boxShadow: isActive ? '0 0 8px rgba(184, 58, 58, 0.35)' : 'none',
                      transition: 'all 0.25s ease-in-out',
                    }}
                  >
                    {isCompleted ? (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path
                          d="M1 4.5L4 7.5L10 1.5"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : isActive ? (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--acc, #B83A3A)',
                          animation: 'pulse-dot 1.4s infinite ease-in-out',
                        }}
                      />
                    ) : null}
                  </div>

                  {/* Step label */}
                  <div className="flex flex-col flex-1">
                    <span
                      style={{
                        fontFamily: 'var(--fs, "Sora", sans-serif)',
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : isCompleted ? 500 : 400,
                        color: isActive
                          ? 'var(--ink)'
                          : isCompleted
                          ? 'var(--mut)'
                          : 'var(--mut)',
                        opacity: isPending ? 0.6 : 1,
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {step.title}
                      {step.id === 'requesting' && (
                        <span style={{ fontSize: '11px', color: 'var(--mut)', marginLeft: '6px' }}>
                          ({modelName})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Task 4.2 Minute 429 countdown notice inside Step 2 */}
                {step.id === 'requesting' && currentStage === 'waiting_retry' && (
                  <div
                    className="ml-8 mt-1.5 px-3 py-1.5 rounded flex items-center gap-2"
                    style={{
                      backgroundColor: 'rgba(192, 125, 43, 0.12)',
                      border: '1px solid rgba(192, 125, 43, 0.3)',
                      fontFamily: 'var(--fm, "IBM Plex Mono", monospace)',
                      fontSize: '12px',
                      color: 'var(--ink)',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#C07D2B',
                        display: 'inline-block',
                      }}
                    />
                    <span>
                      Minute rate limit reached. Retrying in{' '}
                      <strong>{retryInSeconds !== null ? retryInSeconds : '...'}s</strong>...
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Placeholder Skeleton Cards Matching Report Layout (Task 4.2) */}
      <div className="w-full flex flex-col gap-4 mt-6">
        <div
          className="sheet w-full p-6 rounded flex flex-col gap-3"
          style={{
            backgroundColor: 'var(--s-bg)',
            border: '1px solid var(--s-bd)',
          }}
        >
          {/* Header Skeleton */}
          <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--bd)' }}>
            <Skeleton height={24} width="45%" className="generating-shimmer" />
            <Skeleton height={18} width="20%" className="generating-shimmer" />
          </div>

          {/* Summary Card Skeleton */}
          <div className="flex flex-col gap-2 pt-2">
            <Skeleton height={14} width="92%" className="generating-shimmer" />
            <Skeleton height={14} width="85%" className="generating-shimmer" />
            <Skeleton height={14} width="60%" className="generating-shimmer" />
          </div>

          {/* Table Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            <div
              className="p-3 rounded flex flex-col gap-2"
              style={{ backgroundColor: 'var(--p-bg)', border: '1px solid var(--bd)' }}
            >
              <Skeleton height={16} width="50%" className="generating-shimmer" />
              <Skeleton height={12} width="100%" className="generating-shimmer" />
              <Skeleton height={12} width="88%" className="generating-shimmer" />
              <Skeleton height={12} width="94%" className="generating-shimmer" />
            </div>
            <div
              className="p-3 rounded flex flex-col gap-2"
              style={{ backgroundColor: 'var(--p-bg)', border: '1px solid var(--bd)' }}
            >
              <Skeleton height={16} width="50%" className="generating-shimmer" />
              <Skeleton height={12} width="100%" className="generating-shimmer" />
              <Skeleton height={12} width="88%" className="generating-shimmer" />
              <Skeleton height={12} width="94%" className="generating-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
