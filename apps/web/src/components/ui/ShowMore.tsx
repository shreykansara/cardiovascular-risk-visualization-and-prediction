import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ShowMoreProps {
  label: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  id?: string;
}

export const ShowMore: React.FC<ShowMoreProps> = ({
  label,
  children,
  defaultExpanded = false,
  className = '',
  id,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`show-more-container ${className}`} id={id}>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer select-none"
        style={{
          background: 'none',
          border: 'none',
          padding: '4px 0',
          color: 'var(--mut)',
          fontFamily: 'var(--fm)',
          fontSize: '12px',
        }}
      >
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isExpanded && <div className="mt-2.5">{children}</div>}
    </div>
  );
};
