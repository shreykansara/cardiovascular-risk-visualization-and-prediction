/**
 * Step 1: Welcome & Clinical Safety Disclaimer Page (Task C7a)
 * Clean clinical entry point with structured preset cards and mandatory safety disclaimer.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Heart, Cpu, FileText, ArrowRight } from 'lucide-react';
import { useWizardStore } from '../store/useWizardStore';
import { usePatientStore } from '../store/usePatientStore';
import type { PatientProfileKey } from '../types/clinical';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Button, Card, Badge } from '../components/ui';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { disclaimerAccepted, setDisclaimerAccepted } = useWizardStore();
  const { loadProfile } = usePatientStore();

  const handleStart = () => {
    if (!disclaimerAccepted) return;
    navigate('/enter-data');
  };

  const handleSelectPresetAndStart = (presetKey: PatientProfileKey) => {
    loadProfile(presetKey);
    if (disclaimerAccepted) {
      navigate('/enter-data');
    }
  };

  const presetList: { key: PatientProfileKey; title: string; desc: string; badge: string; badgeVariant: 'risk-low' | 'risk-moderate' | 'risk-high' }[] = [
    {
      key: 'normal',
      title: 'Low-Risk Baseline',
      desc: 'Age 45, Normal BP, Preserved EF 62%, Normal Troponin & ECG.',
      badge: 'Low Risk',
      badgeVariant: 'risk-low',
    },
    {
      key: 'high_risk_lad',
      title: 'Anterior Ischemia (LAD)',
      desc: 'Age 58, Typical Angina, V2-V4 ST Elevation, EF 50%.',
      badge: 'High Risk (LAD)',
      badgeVariant: 'risk-high',
    },
    {
      key: 'rca_ischemia',
      title: 'Inferior Ischemia (RCA)',
      desc: 'Age 64, Atypical Angina, Inferior Wall RWMA, Dyslipidemia.',
      badge: 'Moderate Risk (RCA)',
      badgeVariant: 'risk-moderate',
    },
    {
      key: 'triple_vessel',
      title: 'Multivessel CAD',
      desc: 'Age 72, Severe Angina, Diffuse ECG Changes, Reduced EF 35%.',
      badge: 'High Risk (Multi)',
      badgeVariant: 'risk-high',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full">
      <Card variant="base" padding="lg" className="w-full">
        <div className="flex flex-col gap-6">
          {/* Header Title */}
          <div className="flex flex-col gap-1.5 border-b border-[#283548] pb-5">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Perfusion3D
              </h1>
              <Badge variant="blue">Clinical Decision Support</Badge>
            </div>
            <p className="text-sm text-slate-300">
              Spatial Hemodynamic Ischemia & Multi-Vessel Coronary Digital Twin
            </p>
          </div>

          {/* Clinical Overview Paragraph */}
          <div className="p-4 rounded-md bg-[#0b0f17] border border-[#283548] text-slate-300 text-xs sm:text-sm leading-relaxed">
            <p>
              Perfusion3D evaluates multi-vessel coronary artery disease (CAD) risk across 55 physiological parameters. By coupling calibrated multi-head gradient-boosted ensembles with interactive 3D hemodynamic vascular conduits, the system estimates localized stenosis probabilities for the Left Anterior Descending (LAD), Left Circumflex (LCX), and Right Coronary (RCA) arteries alongside TreeSHAP feature attributions and structured clinical reports.
            </p>
          </div>

          {/* 3 Key Workflow Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-md bg-[#1c2637] border border-[#283548] flex items-start gap-3">
              <div className="p-2 rounded bg-blue-950/60 border border-blue-800/60 text-blue-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">55-Feature Schema</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Demographics, vitals, ECG, laboratory biomarkers, and echocardiography.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-[#1c2637] border border-[#283548] flex items-start gap-3">
              <div className="p-2 rounded bg-blue-950/60 border border-blue-800/60 text-blue-400 shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">3D Vascular Twin</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Anatomical myocardium with calibrated hemodynamic vessel segments.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-[#1c2637] border border-[#283548] flex items-start gap-3">
              <div className="p-2 rounded bg-blue-950/60 border border-blue-800/60 text-blue-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Clinical Reports</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automated clinician-facing technical report and plain-language patient summary.
                </p>
              </div>
            </div>
          </div>

          {/* Patient Profile Presets */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider text-[11px]">
              Validated Clinical Patient Profiles
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {presetList.map((preset) => (
                <div
                  key={preset.key}
                  onClick={() => handleSelectPresetAndStart(preset.key)}
                  className="p-3 rounded-md bg-[#1c2637] border border-[#283548] hover:border-[#384961] cursor-pointer transition-colors flex flex-col justify-between gap-2"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{preset.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{preset.desc}</p>
                  </div>
                  <Badge variant={preset.badgeVariant} size="sm">
                    {preset.badge}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Safety Disclaimer Section */}
          <div className="flex flex-col gap-3 pt-2">
            <DisclaimerBanner />

            {/* Mandatory User Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-md bg-[#1c2637] border border-[#283548] hover:border-[#384961] cursor-pointer transition-colors select-none">
              <div className="pt-0.5 shrink-0">
                <input
                  type="checkbox"
                  id="disclaimer-checkbox"
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-[#283548] text-blue-600 focus:ring-blue-600 bg-[#131a26] cursor-pointer"
                />
              </div>
              <div className="text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-white">
                  I understand and acknowledge the clinical safety terms.
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  I confirm this system will be utilized strictly for research, decision support, and educational exploration, and not as an autonomous diagnostic authority.
                </p>
              </div>
            </label>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#283548]">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Leakage Guard Active (Zero Target Contamination)</span>
            </div>

            <Button
              id="start-wizard-btn"
              variant="primary"
              size="md"
              onClick={handleStart}
              disabled={!disclaimerAccepted}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Begin Clinical Assessment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WelcomePage;
