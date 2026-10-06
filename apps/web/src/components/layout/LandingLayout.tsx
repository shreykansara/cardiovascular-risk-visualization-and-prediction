import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LandingNav } from '../landing/LandingNav';
import { FooterDisclaimer } from '../ui/FooterDisclaimer';

export const LandingLayout: React.FC = () => {
  const location = useLocation();
  const [playClass, setPlayClass] = useState('play');

  useEffect(() => {
    setPlayClass('play');
  }, [location.pathname]);

  return (
    <div className={`ecg-grid min-h-screen w-full flex flex-col ${playClass}`}>
      {/* Skip to content link */}
      <a href="#content" className="skip-link app-chrome no-print">
        Skip to content
      </a>

      {/* Landing Navigation Header */}
      <LandingNav />

      {/* Main Content Area */}
      <main
        id="content"
        tabIndex={-1}
        className="flex-1 w-full flex flex-col focus:outline-none"
      >
        <Outlet />
      </main>

      {/* Footer */}
      <FooterDisclaimer />
    </div>
  );
};

export default LandingLayout;
