import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <button
          type="button"
          tabIndex={0}
          className="text-slate-400 hover:text-slate-200 cursor-help focus:outline-none"
          aria-label="Clinical term information"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {isVisible && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-60 p-2.5 bg-[#1c2637] text-slate-200 text-xs rounded-md border border-[#283548] shadow-md pointer-events-none animate-in fade-in duration-100"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1c2637]" />
        </div>
      )}
    </div>
  );
};
