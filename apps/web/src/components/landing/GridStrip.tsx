import React, { useRef, useState, useEffect } from 'react';

export const GridStrip: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasDrawn(true);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasDrawn(true);
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
      ref={containerRef}
      className="ecg-grid w-full overflow-hidden"
      style={{
        height: '48px',
        minHeight: '48px',
        maxHeight: '48px',
        borderTop: '1px solid var(--bd)',
        borderBottom: '1px solid var(--bd)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1000 48"
        preserveAspectRatio="none"
        width="100%"
        height="48"
        style={{ display: 'block', height: '48px', width: '100%' }}
      >
        <path
          pathLength="1"
          fill="none"
          stroke="var(--acc)"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="1"
          d="M0 26 L75 26 L90 26 L98 18 L106 30 L114 26 L165 26 L175 29 L188 6 L202 42 L216 26 L280 26 L298 17 L318 26 L385 26 L400 26 L408 18 L416 30 L424 26 L475 26 L485 29 L498 6 L512 42 L526 26 L590 26 L608 17 L628 26 L695 26 L710 26 L718 18 L726 30 L734 26 L785 26 L795 29 L808 6 L822 42 L836 26 L900 26 L918 17 L938 26 L1000 26"
          style={{
            animation: hasDrawn ? 'draw 1200ms var(--ease-draw) forwards' : 'none',
          }}
        />
      </svg>
    </div>
  );
};

export default GridStrip;
