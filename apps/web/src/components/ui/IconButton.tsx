import React, { forwardRef, useState } from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  size?: 'sm' | 'md' | 'lg' | 'xs';
  variant?: 'primary' | 'secondary' | 'quiet';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      size = 'sm',
      variant = 'secondary',
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

    let dim = 'var(--btn-sm)';
    if (size === 'xs') dim = '24px';
    else if (size === 'md') dim = 'var(--btn-md)';
    else if (size === 'lg') dim = 'var(--btn-lg)';

    let bg = 'var(--panel)';
    let border = '1px solid var(--bds)';
    let color = 'var(--ink)';

    if (variant === 'primary') {
      bg = isPressed ? 'var(--acc-press)' : isHovered ? 'var(--acc-hover)' : 'var(--acc)';
      border = '1px solid transparent';
      color = 'var(--onacc)';
    } else if (variant === 'secondary') {
      bg = isPressed ? 'var(--hov)' : isHovered ? 'var(--hov)' : 'var(--panel)';
      border = '1px solid var(--bds)';
      color = 'var(--ink)';
    } else if (variant === 'quiet') {
      bg = isPressed ? 'var(--hov)' : isHovered ? 'var(--hov)' : 'transparent';
      border = '1px solid transparent';
      color = 'var(--ink)';
    }

    return (
      <button
        ref={ref}
        type="button"
        className={`inline-flex items-center justify-center select-none transition-colors duration-100 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[var(--focus-offset)] ${className}`}
        disabled={disabled}
        style={{
          width: dim,
          height: dim,
          minWidth: dim,
          minHeight: dim,
          padding: 0,
          borderRadius: 'var(--radius)',
          backgroundColor: bg,
          border,
          color,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          boxShadow: 'none',
          outline: 'none',
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!disabled) setIsHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        }}
        onMouseDown={(e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        }}
        onMouseUp={(e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
