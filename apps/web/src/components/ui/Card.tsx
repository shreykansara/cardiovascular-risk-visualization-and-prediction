import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'raised';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'base',
  header,
  footer,
  padding = 'md',
  className = '',
  ...props
}) => {
  const variantClass = variant === 'raised' ? 'clinical-card-raised' : 'clinical-card';

  const paddingClass = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8',
  }[padding];

  return (
    <div className={`${variantClass} flex flex-col overflow-hidden ${className}`} {...props}>
      {header && (
        <div className="px-4 py-3 border-b border-[#283548] flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={`flex-1 ${paddingClass}`}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-[#283548] bg-[#0f1520]/50 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
