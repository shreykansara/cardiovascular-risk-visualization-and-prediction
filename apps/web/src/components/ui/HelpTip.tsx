import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTipProps {
  text: string;
  ariaLabel?: string;
  label?: string;
  className?: string;
}

export const HelpTip: React.FC<HelpTipProps> = ({
  text,
  ariaLabel = 'More information',
  label,
  className = '',
}) => {
  const effectiveLabel = label || ariaLabel;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  return (
    <span
      ref={containerRef}
      className={`inline-flex items-center relative align-middle ${className}`}
      style={{ verticalAlign: 'middle', lineHeight: 1 }}
    >
      <button
        type="button"
        aria-label={effectiveLabel}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="inline-flex items-center justify-center p-0.5 rounded cursor-pointer transition-colors text-text-muted hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--mut)',
        }}
      >
        <HelpCircle size={15} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-1.5 p-2.5 rounded text-xs leading-normal pointer-events-auto"
          style={{
            maxWidth: '260px',
            width: 'max-content',
            background: 'var(--card)',
            color: 'var(--ink)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            fontFamily: 'var(--fs)',
            fontSize: '12px',
            lineHeight: 1.45,
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
};
