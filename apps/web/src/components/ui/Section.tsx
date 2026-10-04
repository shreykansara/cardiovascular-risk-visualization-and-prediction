import React, { useState } from 'react';

export interface SectionProps {
  title: string;
  count?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  count,
  collapsible = false,
  defaultOpen = true,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`w-full ${className}`}>
      <div
        className={`flex items-center justify-between pb-2 border-b border-border mb-4 ${
          collapsible ? 'cursor-pointer select-none' : ''
        }`}
        onClick={() => collapsible && setIsOpen(!isOpen)}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={(e) => {
          if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] leading-[24px] font-semibold text-text">
            {title}
          </h2>
          {count && (
            <span className="text-[13px] leading-[20px] text-text-muted">
              {count}
            </span>
          )}
        </div>

        {collapsible && (
          <svg
            className={`w-4 h-4 text-text-muted transition-transform duration-120 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {(!collapsible || isOpen) && <div>{children}</div>}
    </section>
  );
};
