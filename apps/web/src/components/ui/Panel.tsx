import React from 'react';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(({
  children,
  className = '',
  style,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`pn ${className}`}
      style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--bd)',
        borderRadius: '3px',
        padding: '12px 14px',
        boxShadow: 'none',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

Panel.displayName = 'Panel';
