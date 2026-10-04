/**
 * Wizard Shell Layout
 * Shared navigation bar, interactive stepper, persistent clinical banner, and content viewports.
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Stepper } from '../common/Stepper';
import { DisclaimerBanner } from '../common/DisclaimerBanner';

export const WizardLayout: React.FC = () => {
  const location = useLocation();
  const isWelcome = location.pathname === '/welcome';

  return (
    <div className="min-h-screen w-screen bg-[#0b0f17] text-slate-100 flex flex-col overflow-x-hidden font-sans">
      {/* Top Floating Wizard Stepper Navigation */}
      <header className="sticky top-0 z-50 w-full shrink-0">
        <Stepper />
        {/* Persistent disclaimer banner on /enter-data, /results, and /reports */}
        {!isWelcome && (
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2">
            <DisclaimerBanner />
          </div>
        )}
      </header>

      {/* Main Wizard Page Content Container */}
      <main className="flex-1 flex flex-col w-full relative">
        <Outlet />
      </main>
    </div>
  );
};

export default WizardLayout;
