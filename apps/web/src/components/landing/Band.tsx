import React from 'react';

export interface BandProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'alt';
  children: React.ReactNode;
}

export const Band: React.FC<BandProps> = ({
  variant = 'default',
  children,
  className = '',
  style,
  ...rest
}) => {
  return (
    <section
      className={`landing-band ${variant === 'alt' ? 'alt' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </section>
  );
};

export default Band;
