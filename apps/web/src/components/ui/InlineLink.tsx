import React, { forwardRef } from 'react';

export interface InlineLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  underline?: 'always' | 'hover';
}

export const InlineLink = forwardRef<HTMLButtonElement, InlineLinkProps>(
  (
    {
      children,
      underline = 'hover',
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`inline-flex items-center gap-1 select-none transition-colors duration-100 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[var(--focus-offset)] ${className}`}
        disabled={disabled}
        style={{
          fontFamily: 'var(--fs)',
          fontSize: 'inherit',
          fontWeight: 500,
          lineHeight: 'inherit',
          backgroundColor: 'transparent',
          border: 'none',
          padding: 0,
          color: 'var(--acc)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          textDecoration: underline === 'always' ? 'underline' : 'none',
          outline: 'none',
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!disabled && underline === 'hover') {
            e.currentTarget.style.textDecoration = 'underline';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && underline === 'hover') {
            e.currentTarget.style.textDecoration = 'none';
          }
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

InlineLink.displayName = 'InlineLink';
