import React, { useRef, useState, useEffect } from 'react';

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerIndex?: number;
  children: React.ReactNode;
}

export const Reveal: React.FC<RevealProps> = ({
  staggerIndex = 0,
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
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${isRevealed ? 'wipe' : ''} ${className}`}
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
