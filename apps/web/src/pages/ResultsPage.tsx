import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/useWizardStore';
import { HeartCanvas } from '../components/3d/HeartCanvas';
import { ColorScaleLegend } from '../components/results/ColorScaleLegend';
import { VesselCard } from '../components/results/VesselCard';
import { FactorsList } from '../components/results/FactorsList';
import { PhysiologicalBreakdownTable } from '../components/results/PhysiologicalBreakdownTable';
import { RiskLabel } from '../components/ui/RiskLabel';
import { Button } from '../components/ui/Button';
import { Section } from '../components/ui/Section';
import { riskLabel } from '../config/riskBands';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    prediction,
    shapResult,
    inputs,
    activeVesselFocus,
    setVesselFocus,
    markStepCompleted,
  } = useWizardStore();

  // If no prediction exists, provide a simple redirect
  if (!prediction) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-[480px] mx-auto">
        <h2 className="text-[20px] font-semibold text-text mb-2">No results yet</h2>
        <p className="text-[14px] text-text-muted mb-6">
          Please enter patient clinical measurements to generate the risk assessment.
        </p>
        <Button variant="primary" onClick={() => navigate('/enter-data')}>
          Enter clinical data
        </Button>
      </div>
    );
  }

  const cadProb = prediction.overall_cad?.probability ?? 0;
  const cadProbPct = Math.round(cadProb * 100);
  const cadBand = riskLabel(cadProb);

  // Synchronize 3D selection
  const handleSelectVessel = (vesselId: 'vessel_LAD' | 'vessel_LCX' | 'vessel_RCA') => {
    if (activeVesselFocus === vesselId) {
      setVesselFocus('default');
    } else {
      setVesselFocus(vesselId);
    }
  };

  // Determine which features to show in Factors list
  const currentFeatures = useMemo(() => {
    if (!shapResult) return [];
    if (activeVesselFocus === 'vessel_LAD') return shapResult.lad?.top_features || [];
    if (activeVesselFocus === 'vessel_LCX') return shapResult.lcx?.top_features || [];
    if (activeVesselFocus === 'vessel_RCA') return shapResult.rca?.top_features || [];
    return shapResult.cad?.top_features || [];
  }, [shapResult, activeVesselFocus]);

  const handleCreateReports = () => {
    markStepCompleted(3);
    navigate('/reports');
  };

  return (
    <div className="flex-1 w-full pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-8 items-start">
        {/* Left Column (58%): 3D Heart Canvas + Legend */}
        <div className="flex flex-col w-full">
          <div className="w-full h-[520px] bg-panel border border-border rounded overflow-hidden relative">
            <HeartCanvas />
          </div>
          <ColorScaleLegend />
        </div>

        {/* Right Column (42%): Clinical telemetry strictly per Task 2.5 */}
        <div className="flex flex-col gap-6 w-full">
          {/* Top: Coronary artery disease probability & RiskLabel */}
          <div>
            <div className="pb-2 border-b border-border">
              <h2 className="text-[16px] leading-[24px] font-semibold text-text">
                Coronary artery disease
              </h2>
            </div>
            <div className="flex items-center gap-4 pt-3">
              <span className="text-result-number">
                {cadProbPct}%
              </span>
              <RiskLabel band={cadBand} />
            </div>
          </div>

          {/* Three vessel rows (LAD, LCX, RCA) */}
          <div className="flex flex-col gap-2">
            <VesselCard
              vesselKey="lad"
              fullName="Left anterior descending artery"
              prediction={prediction.vessels?.lad}
              isSelected={activeVesselFocus === 'vessel_LAD'}
              onSelect={() => handleSelectVessel('vessel_LAD')}
            />
            <VesselCard
              vesselKey="lcx"
              fullName="Left circumflex artery"
              prediction={prediction.vessels?.lcx}
              isSelected={activeVesselFocus === 'vessel_LCX'}
              onSelect={() => handleSelectVessel('vessel_LCX')}
            />
            <VesselCard
              vesselKey="rca"
              fullName="Right coronary artery"
              prediction={prediction.vessels?.rca}
              isSelected={activeVesselFocus === 'vessel_RCA'}
              onSelect={() => handleSelectVessel('vessel_RCA')}
            />
          </div>

          {/* Factors influencing this result */}
          <FactorsList features={currentFeatures} inputs={inputs} />

          {/* Collapsed section: All measurements */}
          <Section title="All measurements" collapsible defaultOpen={false}>
            <div className="pt-2">
              <PhysiologicalBreakdownTable patientInputs={inputs} />
            </div>
          </Section>

          {/* Button: Create reports */}
          <div className="pt-2">
            <Button
              id="create-reports-button"
              variant="primary"
              onClick={handleCreateReports}
              className="w-full sm:w-auto"
            >
              Create reports
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
