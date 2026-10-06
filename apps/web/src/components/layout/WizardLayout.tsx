import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FooterDisclaimer } from '../ui/FooterDisclaimer';
import { AppNav } from './AppNav';
import { StepSummary } from './StepSummary';

export const WizardLayout: React.FC = () => {
  const location = useLocation();
  const [playClass, setPlayClass] = useState('play');

  // Replay rule: add play class when page first mounts after navigation
  useEffect(() => {
    setPlayClass('play');
  }, [location.pathname]);

  return (
    <div className={`ecg-grid min-h-screen w-full flex flex-col ${playClass}`}>
      {/* Redesigned AppNav (Task 2.1 - 2.4, 2.6) rendered once */}
      <AppNav />

      {/* StepSummary bar for tablet and mobile <900px (Task 2.5) */}
      <StepSummary />

      {/* Main content container */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full flex flex-col focus:outline-none"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '18px 16px 16px',
          position: 'relative',
          zIndex: 1,
          isolation: 'isolate',
        }}
      >
        <Outlet />
      </main>

      {/* Footer */}
      <FooterDisclaimer />
    </div>
  );
};

export default WizardLayout;
