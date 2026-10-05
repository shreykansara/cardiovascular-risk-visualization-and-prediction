import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
      {/* Section header: flex, space-between, baseline; margin 14px 0 8px; padding-bottom 5px; border-bottom 1px solid --bd. */}
      <div
        className={`flex items-baseline justify-between ${
          collapsible ? 'cursor-pointer select-none' : ''
        }`}
        style={{
          margin: '14px 0 8px',
          paddingBottom: '5px',
          borderBottom: '1px solid var(--bd)',
        }}
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
        <div className="flex items-baseline gap-2">
          {/* Title 14px/600 */}
          <h2
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {count && (
            <span
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '12px',
                fontWeight: 400,
                color: 'var(--mut)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count}
            </span>
          )}

          {collapsible && (
            <ChevronDown
              size={16}
              style={{
                color: 'var(--mut)',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )}
        </div>
      </div>

      {(!collapsible || isOpen) && <div>{children}</div>}
    </section>
  );
};
