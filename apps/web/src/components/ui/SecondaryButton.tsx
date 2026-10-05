import React, { forwardRef, useState } from 'react';

export interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  (
    {
      children,
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      style,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const heightToken = size === 'sm' ? 'var(--btn-sm)' : size === 'lg' ? 'var(--btn-lg)' : 'var(--btn-md)';
    const paddingX = size === 'sm' ? '12px' : size === 'lg' ? '20px' : '16px';
    const fontSize = size === 'sm' ? '12px' : size === 'lg' ? '14px' : '13px';

    const bg = isPressed
      ? 'var(--hov)'
      : isHovered
      ? 'var(--hov)'
      : 'var(--panel)';

    return (
      <button
        ref={ref}
        type="button"
        className={`inline-flex items-center justify-center gap-2 select-none transition-colors duration-100 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[var(--focus-offset)] ${className}`}
        disabled={disabled || isLoading}
        style={{
          fontFamily: 'var(--fs)',
          fontSize,
          fontWeight: 600,
          lineHeight: '1',
          textTransform: 'none',
          letterSpacing: 'normal',
          height: heightToken,
          padding: `0 ${paddingX}`,
          borderRadius: 'var(--radius)',
          backgroundColor: bg,
          border: '1px solid var(--bds)',
          color: 'var(--ink)',
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          opacity: disabled || isLoading ? 0.5 : (isPressed ? 0.88 : 1),
          boxShadow: 'none',
          outline: 'none',
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isLoading) setIsHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        }}
        onMouseDown={(e) => {
          if (!disabled && !isLoading) setIsPressed(true);
          onMouseDown?.(e);
        }}
        onMouseUp={(e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        }}
        {...props}
      >
        {leftIcon}
        <span>{children}</span>
        {rightIcon}
      </button>
    );
  }
);

SecondaryButton.displayName = 'SecondaryButton';
