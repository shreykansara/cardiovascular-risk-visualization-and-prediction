import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { MANDATORY_DISCLAIMER } from '../components/ui/FooterDisclaimer';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { disclaimerAccepted, setDisclaimerAccepted, markStepCompleted } = useWizardStore();

  const handleStart = () => {
    if (!disclaimerAccepted) return;
    markStepCompleted(1);
    navigate('/enter-data');
  };

  return (
    <div className="w-full max-w-[640px] mt-[64px] flex flex-col gap-6 text-left">
      <h1 className="text-page-title text-text">
        Perfusion3D
      </h1>

      <p className="text-body text-text">
        Estimates the likelihood of coronary artery narrowing from clinical measurements and shows the result on a 3D heart.
      </p>

      <div className="bg-panel border border-border p-4 rounded text-[13px] leading-[20px] text-text-muted">
        {MANDATORY_DISCLAIMER}
      </div>

      <div className="pt-2">
        <Checkbox
          id="welcome-acknowledgement"
          checked={disclaimerAccepted}
          onChange={(e) => setDisclaimerAccepted(e.target.checked)}
          label="I understand this system is an investigational decision-support prototype and does not provide medical diagnoses."
        />
      </div>

      <div>
        <Button
          id="start-wizard-button"
          variant="primary"
          disabled={!disclaimerAccepted}
          onClick={handleStart}
        >
          Start
        </Button>
      </div>
    </div>
  );
};

export default WelcomePage;
