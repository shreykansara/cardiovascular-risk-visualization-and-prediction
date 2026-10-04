import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'link';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  let variantClasses = '';
  if (variant === 'primary') {
    variantClasses = 'h-[36px] px-4 bg-accent hover:bg-accent-hover text-on-accent rounded text-[14px] font-medium border-0';
  } else if (variant === 'secondary') {
    variantClasses = 'h-[36px] px-4 bg-page hover:bg-panel border border-border-strong text-text rounded text-[14px] font-medium';
  } else if (variant === 'link') {
    variantClasses = 'h-auto p-0 bg-transparent text-accent hover:text-accent-hover underline text-[14px] font-medium border-0';
  }

  const baseClasses =
    'inline-flex items-center justify-center gap-2 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="spinner" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
