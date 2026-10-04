import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  action?: React.ReactNode;
}

export const Banner: React.FC<BannerProps> = ({
  children,
  variant = 'warning',
  title,
  action,
  className = '',
  ...props
}) => {
  const icon = {
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />,
  }[variant];

  const variantClasses = {
    info: 'bg-blue-950/40 border-blue-800/60 text-blue-200',
    warning: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
    danger: 'bg-red-950/40 border-red-800/60 text-red-200',
    success: 'bg-green-950/40 border-green-800/60 text-green-200',
  }[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-md border text-xs leading-relaxed ${variantClasses} ${className}`}
      {...props}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        {title && <div className="font-semibold text-slate-100 mb-0.5">{title}</div>}
        <div>{children}</div>
      </div>
      {action && <div className="shrink-0 ml-2">{action}</div>}
    </div>
  );
};
