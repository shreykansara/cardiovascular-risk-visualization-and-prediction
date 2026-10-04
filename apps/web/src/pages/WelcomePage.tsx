import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import { Panel } from '../components/ui/Panel';
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
    <div
      style={{
        maxWidth: '640px',
        marginTop: '64px',
        width: '100%',
      }}
    >
      {/* All inside one Panel with padding 24px */}
      <Panel
        className="wipe"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          textAlign: 'left',
          '--i': 0,
        } as React.CSSProperties}
      >
        {/* Product name (20px/600) */}
        <h1
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          Perfusion3D
        </h1>

        {/* One sentence */}
        <p
          style={{
            fontFamily: 'var(--fs)',
            fontSize: '13px',
            lineHeight: 1.45,
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          Estimates the likelihood of coronary artery narrowing from clinical measurements and shows the result on a 3D heart.
        </p>

        {/* Disclaimer sentence inside an inner block with 1px --bd border and 12px padding */}
        <div
          style={{
            border: '1px solid var(--bd)',
            borderRadius: '3px',
            padding: '12px',
            fontFamily: 'var(--fs)',
            fontSize: '11px',
            lineHeight: 1.4,
            color: 'var(--mut)',
            backgroundColor: 'var(--panel)',
          }}
        >
          {MANDATORY_DISCLAIMER}
        </div>

        {/* Acknowledgement Checkbox row */}
        <div style={{ paddingTop: '4px' }}>
          <Checkbox
            id="welcome-acknowledgement"
            checked={disclaimerAccepted}
            onChange={(e) => setDisclaimerAccepted(e.target.checked)}
            label="I understand this system is an investigational decision-support prototype and does not provide medical diagnoses."
          />
        </div>

        {/* Primary Button "Start" (enabled only when checked) */}
        <div style={{ paddingTop: '4px' }}>
          <Button
            id="start-wizard-button"
            variant="primary"
            disabled={!disclaimerAccepted}
            onClick={handleStart}
          >
            Start
          </Button>
        </div>
      </Panel>
    </div>
  );
};

export default WelcomePage;
