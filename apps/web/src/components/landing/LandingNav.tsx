import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trace } from '../ui/Trace';
import { PrimaryButton } from '../ui/PrimaryButton';
import { QuietButton } from '../ui/QuietButton';
import { useTheme } from '../../hooks/useTheme';
import { useWizardStore } from '../../store/useWizardStore';
import { LANDING_COPY } from '../../content/landing';
import { ArrowRight, Sun, Moon, Menu, X } from 'lucide-react';

export const LandingNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>('');
  const [isNarrow, setIsNarrow] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsNarrow(window.innerWidth < 480);
      if (window.innerWidth >= 900) {
        setIsMobileMenuOpen(false);
      }
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
      setIsMobileMenuOpen(false);
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  const handleNavClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (!el) return;

    const navHeader = document.querySelector('.landing-nav-header');
    const headerHeight = navHeader ? navHeader.getBoundingClientRect().height : 56;
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 12;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });

    window.history.pushState(null, '', `#${sectionId}`);
    setActiveSection(sectionId);
  };

  const handleStartAssessment = () => {
    setIsMobileMenuOpen(false);
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

        {/* Right: Theme Toggle & Start Assessment & Mobile Menu Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="landing-theme-toggle-btn"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'Paper' : 'Monitor'} theme`}
            title={`Switch to ${resolvedTheme === 'dark' ? 'Paper' : 'Monitor'} theme`}
            style={{
              width: '32px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--bds)',
              borderRadius: 'var(--radius)',
              color: 'var(--ink)',
              cursor: 'pointer',
              transition: 'background-color 140ms ease, border-color 140ms ease, transform 140ms ease',
            }}
          >
            {resolvedTheme === 'dark' ? (
              <Sun size={15} />
            ) : (
              <Moon size={15} />
            )}
          </button>

          <PrimaryButton
            size="md"
            onClick={handleStartAssessment}
            aria-label={LANDING_COPY.nav.startAssessment}
            rightIcon={<ArrowRight size={15} />}
          >
            {isNarrow ? LANDING_COPY.nav.startAssessmentShort : LANDING_COPY.nav.startAssessment}
          </PrimaryButton>

          {/* Mobile Menu Toggle Button (<900px) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="landing-mobile-menu-btn"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            style={{
              width: '34px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--bds)',
              borderRadius: 'var(--radius)',
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown (<900px) */}
      {isMobileMenuOpen && (
        <div
          className="landing-mobile-drawer"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--panel)',
            borderBottom: '1px solid var(--bd)',
            padding: '12px 16px 16px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {LANDING_COPY.nav.links.map((link) => {
            const isCurrent = activeSection === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                style={{
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: isCurrent ? 'var(--hov)' : 'transparent',
                  border: '1px solid',
                  borderColor: isCurrent ? 'var(--bd)' : 'transparent',
                  color: isCurrent ? 'var(--ink)' : 'var(--mut)',
                  fontFamily: 'var(--fs)',
                  fontSize: '14px',
                  fontWeight: isCurrent ? 600 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default LandingNav;
