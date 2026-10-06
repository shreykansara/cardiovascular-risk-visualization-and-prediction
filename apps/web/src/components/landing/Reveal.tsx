import React, { useRef, useState, useEffect } from 'react';

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerIndex?: number;
  variant?: 'fade-up' | 'wipe' | 'scale';
  children: React.ReactNode;
}

export const Reveal: React.FC<RevealProps> = ({
  staggerIndex = 0,
  variant = 'fade-up',
  children,
  className = '',
  style,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animClass = isRevealed
    ? variant === 'wipe'
      ? 'wipe'
      : variant === 'scale'
      ? 'scale-in'
      : 'fade-up'
    : '';

  return (
    <div
      ref={ref}
      className={`${animClass} ${className}`}
      style={{
        ...style,
        '--i': staggerIndex,
      } as React.CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Reveal;
