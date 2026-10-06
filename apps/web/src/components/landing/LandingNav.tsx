import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trace } from '../ui/Trace';
import { PrimaryButton } from '../ui/PrimaryButton';
import { QuietButton } from '../ui/QuietButton';
import { useTheme } from '../../hooks/useTheme';
import { useWizardStore } from '../../store/useWizardStore';
import { LANDING_COPY } from '../../content/landing';
import { ArrowRight } from 'lucide-react';

export const LandingNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>('');
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsNarrow(window.innerWidth < 480);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    const sectionIds = ['how-it-works', 'what-you-get', 'about'];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: '-80px 0px -50% 0px',
        threshold: 0.1,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/' && !location.hash) {
      e.preventDefault();
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  const handleNavClick = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    window.history.pushState(null, '', `#${sectionId}`);

    const heading = el.querySelector('h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    setActiveSection(sectionId);
  };

  const handleStartAssessment = () => {
    useWizardStore.getState().reset();
    navigate('/welcome');
  };

  return (
    <header className="landing-nav-header app-chrome no-print">
      <div
        className="w-full h-full flex items-center justify-between"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
          gap: '12px',
        }}
      >
        {/* Left: Brand */}
        <a
          href="/"
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'inherit',
          }}
          aria-label="Perfusion3D Home"
        >
          <Trace width={36} height={16} className="trace-initial" />
          <span
            style={{
              fontFamily: 'var(--fs)',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            {LANDING_COPY.nav.wordmark}
          </span>
        </a>

        {/* Centre: Anchor navigation (visible from 900px) */}
        <nav aria-label="Landing page sections" className="landing-nav-center">
          {LANDING_COPY.nav.links.map((link) => {
            const isCurrent = activeSection === link.id;
            return (
              <QuietButton
                key={link.id}
                size="sm"
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => handleNavClick(link.id)}
                style={{
                  height: '32px',
                  backgroundColor: isCurrent ? 'var(--hov)' : 'transparent',
                  fontWeight: isCurrent ? 600 : 500,
                  color: isCurrent ? 'var(--ink)' : 'var(--mut)',
                  padding: '0 10px',
                }}
              >
                {link.label}
              </QuietButton>
            );
          })}
        </nav>

        {/* Right: Theme Select & Start Assessment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="landing-theme-select" className="landing-nav-theme-label">
              {LANDING_COPY.nav.themeLabel}
            </label>
            <select
              id="landing-theme-select"
              aria-label={LANDING_COPY.nav.themeLabel}
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              style={{
                height: '32px',
                width: '112px',
                fontFamily: 'var(--fs)',
                fontSize: '12px',
                backgroundColor: 'var(--panel)',
                color: 'var(--ink)',
                border: '1px solid var(--bds)',
                borderRadius: 'var(--radius)',
                padding: '0 8px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="system">System</option>
              <option value="light">Paper</option>
              <option value="dark">Monitor</option>
            </select>
          </div>

          <PrimaryButton
            size="md"
            onClick={handleStartAssessment}
            aria-label={LANDING_COPY.nav.startAssessment}
            rightIcon={<ArrowRight size={16} />}
          >
            {isNarrow ? LANDING_COPY.nav.startAssessmentShort : LANDING_COPY.nav.startAssessment}
          </PrimaryButton>
        </div>
      </div>
    </header>
  );
};

export default LandingNav;
