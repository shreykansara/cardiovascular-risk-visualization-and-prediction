/**
 * Reusable Persistent Clinical Safety Disclaimer Banner
 * Required across all screens to ensure regulatory transparency.
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  compact = false,
  className = '',
}) => {
  return (
    <aside
      aria-label="Clinical Decision-Support Disclaimer"
      className={`w-full bg-amber-950/40 border border-amber-800/60 rounded-md px-3.5 py-2.5 flex items-center justify-between gap-3 text-amber-200/90 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs leading-relaxed font-sans">
          <strong className="font-semibold text-amber-300 mr-1.5 uppercase tracking-wider text-[10px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/60">
            Decision-Support Only
          </strong>
          <span>
            Predictions are for decision-support and educational purposes only and are not a substitute for formal diagnostic imaging or professional medical evaluation.
          </span>
        </p>
      </div>
    </aside>
  );
};

export default DisclaimerBanner;
