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
        borderTop: '1px solid var(--bd)',
        borderBottom: '1px solid var(--bd)',
        position: 'relative',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 920 48"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <path
          pathLength="1"
          fill="none"
          stroke="var(--acc)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="1"
          d="M0 30 L90 30 L108 30 L116 22 L124 36 L132 30 L190 30 L208 30 L220 8 L234 44 L248 30 L330 30 L356 26 L376 30 L450 30 L468 30 L480 22 L488 36 L496 30 L540 30 L558 30 L570 8 L584 44 L598 30 L680 30 L702 26 L722 30 L780 30 L798 30 L810 8 L824 44 L838 30 L920 30"
          style={{
            animation: hasDrawn ? 'draw 1200ms var(--ease-draw) forwards' : 'none',
          }}
        />
      </svg>
    </div>
  );
};

export default GridStrip;
