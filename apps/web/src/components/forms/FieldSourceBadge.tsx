import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import type { FieldMeta } from '../../types/wizard';
import { REPORT_DISPLAY_NAMES } from '../../types/extraction';
import { Chip } from '../ui/Chip';

export interface FieldSourceBadgeProps {
  meta?: FieldMeta;
}

export const FieldSourceBadge: React.FC<FieldSourceBadgeProps> = ({ meta }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!meta || !meta.source || meta.source === 'manual') {
    return null;
  }

  const reportName = meta.fromReport
    ? REPORT_DISPLAY_NAMES[meta.fromReport]
    : 'Report';
  const pageNum = meta.page ?? 1;

  // Evidence copy formatting
  let evidenceText = meta.evidence || 'Extracted from uploaded report';
  if (meta.derived) {
    evidenceText = 'Calculated from height and weight';
  } else if (meta.converted && meta.evidence) {
    if (!meta.evidence.includes('Converted from')) {
      evidenceText = `${meta.evidence} (Converted from ${meta.evidence})`;
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      <Chip label={meta.source === 'extracted' ? 'From report' : 'Check'} />
      <button
        type="button"
        aria-label="Where this value came from"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="evidence-info-button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          padding: 0,
          border: 'none',
          background: 'transparent',
          color: 'var(--mut)',
          cursor: 'pointer',
        }}
      >
        <Info size={16} />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Evidence details"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 150,
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--bds)',
            borderRadius: '3px',
            padding: '10px 12px',
            boxShadow: 'none',
            maxWidth: '280px',
            width: 'max-content',
            minWidth: '180px',
          }}
          className="evidence-popover"
        >
          <div
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--ink)',
              marginBottom: '4px',
              lineHeight: 1.3,
            }}
          >
            From: {reportName}, page {pageNum}
          </div>
          <div
            style={{
              fontFamily: 'var(--fm)',
              fontSize: '12px',
              color: 'var(--mut)',
              wordBreak: 'break-word',
              lineHeight: 1.4,
            }}
          >
            {evidenceText}
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldSourceBadge;
