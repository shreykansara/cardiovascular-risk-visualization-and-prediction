/**
 * Reusable Persistent Clinical Safety Disclaimer Banner
 * Required across all screens to ensure regulatory transparency.
 */

import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

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
      className={`w-full bg-amber-500/10 border-y sm:border sm:rounded-xl border-amber-500/30 px-3.5 py-2.5 backdrop-blur-md flex items-center justify-between gap-3 text-amber-200/90 shadow-[0_0_15px_rgba(245,158,11,0.08)] ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs leading-relaxed font-sans">
          <strong className="font-semibold text-amber-300 mr-1.5 uppercase tracking-wider text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
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
