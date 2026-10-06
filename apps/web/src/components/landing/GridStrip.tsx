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
        height: '28px',
        minHeight: '28px',
        maxHeight: '28px',
        borderTop: '1px solid var(--bd)',
        borderBottom: '1px solid var(--bd)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1000 28"
        preserveAspectRatio="none"
        width="100%"
        height="28"
        style={{ display: 'block', height: '28px', width: '100%' }}
      >
        <path
          pathLength="1"
          fill="none"
          stroke="var(--acc)"
          strokeWidth="1.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="1"
          d="M0 14 L80 14 L95 14 L102 10 L109 18 L116 14 L170 14 L185 14 L195 3 L207 25 L219 14 L280 14 L300 11 L318 14 L400 14 L415 14 L422 10 L429 18 L436 14 L490 14 L505 14 L515 3 L527 25 L539 14 L600 14 L620 11 L638 14 L720 14 L735 14 L742 10 L749 18 L756 14 L810 14 L825 14 L835 3 L847 25 L859 14 L920 14 L940 11 L958 14 L1000 14"
          style={{
            animation: hasDrawn ? 'draw 1200ms var(--ease-draw) forwards' : 'none',
          }}
        />
      </svg>
    </div>
  );
};

export default GridStrip;
