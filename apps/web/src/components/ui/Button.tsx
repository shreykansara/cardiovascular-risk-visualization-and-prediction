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
  style,
  ...props
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isLink = variant === 'link';

  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--fs)',
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: '1',
    textTransform: 'none',
    letterSpacing: 'normal',
    transition: 'opacity 120ms',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.5 : 1,
    boxShadow: 'none',
    outline: 'none',
  };

  let variantStyle: React.CSSProperties = {};
  if (isPrimary) {
    variantStyle = {
      height: '36px',
      padding: '0 16px',
      borderRadius: '3px',
      backgroundColor: 'var(--acc)',
      border: '1px solid var(--acc)',
      color: 'var(--onacc)',
    };
  } else if (isSecondary) {
    variantStyle = {
      height: '36px',
      padding: '0 16px',
      borderRadius: '3px',
      backgroundColor: 'var(--panel)',
      border: '1px solid var(--bds)',
      color: 'var(--ink)',
    };
  } else if (isLink) {
    variantStyle = {
      height: 'auto',
      padding: '0',
      borderRadius: '0',
      backgroundColor: 'transparent',
      border: 'none',
      color: 'var(--acc)',
      textDecoration: 'underline',
    };
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 select-none focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[var(--focus-offset)] ${
        isPrimary ? 'btn-primary hover:opacity-88' : isSecondary ? 'btn-secondary' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      style={{
        ...baseStyle,
        ...variantStyle,
        ...style,
      }}
      {...props}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
};
