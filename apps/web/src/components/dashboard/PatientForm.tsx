/**
 * Clinical Parameter Input Drawer & Physiological Controls (Perfusion3D Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState } from 'react';
import {
  Sliders,
  User,
  X,
  Zap,
  FlaskConical,
  Stethoscope,
  RotateCcw,
} from 'lucide-react';
import { usePatientStore, PATIENT_PROFILES } from '../../store/usePatientStore';

interface PatientFormProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'vitals' | 'symptoms' | 'ecg' | 'echo_labs';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  minLabel?: string;
  medianLabel?: string;
  maxLabel?: string;
  valueColor?: string;
  onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  minLabel,
  medianLabel,
  maxLabel,
  valueColor,
  onChange,
}) => {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="glass-card p-3 rounded-xl border border-white/[0.06] bg-slate-900/30 hover:border-white/[0.12] transition-colors">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span
          className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border border-white/[0.06] bg-slate-800/60 tabular-nums ${
            valueColor || 'text-slate-100'
          }`}
        >
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full perfusion3d-slider h-1.5 bg-slate-800/80 rounded-full cursor-pointer accent-cyan-400"
        style={{
          background: `linear-gradient(to right, #475569 0%, #06b6d4 ${pct}%, rgba(30, 41, 59, 0.8) ${pct}%, rgba(30, 41, 59, 0.8) 100%)`,
        }}
      />
      {(minLabel || medianLabel || maxLabel) && (
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>{minLabel || `${min} ${unit}`}</span>
          {medianLabel && <span>{medianLabel}</span>}
          <span>{maxLabel || `${max} ${unit}`}</span>
        </div>
      )}
    </div>
  );
};

export const PatientForm: React.FC<PatientFormProps> = ({ isOpen, onClose }) => {
  const {
    patient,
    patientData,
    updatePatientField,
    isCalculating,
    isLoading,
    activeProfile,
    lastSelectedPreset,
    resetToPreset,
  } = usePatientStore();
  const [activeTab, setActiveTab] = useState<TabKey>('vitals');

  // Single source of truth: fallback safe binding to patientData
  const p = patientData || patient;

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950/80 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 select-none">
      {/* Drawer Top Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
                Patient Physiological Parameters
              </h3>
              {/* Optimistic Live Telemetry Pulse Dot */}
              <span
                className="relative flex h-2 w-2 items-center justify-center"
                title={isCalculating || isLoading ? 'Live calculating telemetry...' : 'Telemetry connected'}
              >
                {isCalculating || isLoading ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400/80 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              {isCalculating || isLoading ? (
                <span className="text-cyan-400/90 font-mono text-[10px] font-medium animate-pulse">
                  ● Live recalculating risk &amp; 3D geometry...
                </span>
              ) : (
                'Instant live re-scoring & 3D WebGL twin sync'
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Mode / Preset Status Banner */}
      <div className="px-4 py-2 bg-slate-900/50 border-b border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {activeProfile === 'custom' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
              <span className="font-semibold text-cyan-300">Custom Mode Active</span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                (from {PATIENT_PROFILES[lastSelectedPreset]?.name || 'Preset'})
              </span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span className="text-slate-400 font-medium">Active Preset:</span>
              <span className="text-slate-200 font-semibold">{PATIENT_PROFILES[activeProfile]?.name}</span>
            </>
          )}
        </div>
        {activeProfile === 'custom' && (
          <button
            type="button"
            onClick={resetToPreset}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all shadow-[0_0_8px_rgba(6,182,212,0.15)]"
            title="Revert all parameters back to baseline preset"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Category Navigation Tabs (Sleek Glass Pills) */}
      <div className="flex items-center gap-1.5 p-2 bg-slate-950/50 border-b border-white/[0.06] overflow-x-auto">
        {[
          { key: 'vitals', label: '[ Vitals ]', icon: User },
          { key: 'symptoms', label: '[ Symptoms ]', icon: Stethoscope },
          { key: 'ecg', label: '[ ECG Leads ]', icon: Zap },
          { key: 'echo_labs', label: '[ Echo & Labs ]', icon: FlaskConical },
        ].map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as TabKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-white/[0.05]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Controls Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans custom-scrollbar">
        {/* Tab 1: Vitals */}
        {activeTab === 'vitals' && (
          <div className="space-y-3.5">
            {/* Age Slider */}
            <SliderControl
              label="Patient Age"
              value={p.Age}
              min={30}
              max={86}
              step={1}
              unit="yrs"
              minLabel="30 yrs"
              medianLabel="Cohort Median: 58"
              maxLabel="86 yrs"
              onChange={(val) => updatePatientField('Age', val)}
            />

            {/* Biological Sex */}
            <div className="glass-card p-3 rounded-xl border border-white/[0.06] bg-slate-900/30 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Biological Sex</span>
              <div className="flex gap-1.5 bg-slate-900/60 p-1 rounded-lg border border-white/[0.06]">
                {(['Male', 'Female'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updatePatientField('Sex', s)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      p.Sex === s
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Systolic Blood Pressure */}
            <SliderControl
              label="Systolic Blood Pressure"
              value={p.BP}
              min={90}
              max={190}
              step={5}
              unit="mmHg"
              minLabel="90 mmHg"
              medianLabel="Normal: <120"
              maxLabel="190 mmHg"
              onChange={(val) => updatePatientField('BP', val)}
            />

            {/* Resting Pulse Rate */}
            <SliderControl
              label="Resting Pulse Rate"
              value={p.PR}
              min={50}
              max={110}
              step={2}
              unit="bpm"
              minLabel="50 bpm"
              medianLabel="Target: 60-80"
              maxLabel="110 bpm"
              onChange={(val) => updatePatientField('PR', val)}
            />

            {/* Weight and Height: Balanced 2-Column Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-3 rounded-xl border border-white/[0.06] bg-slate-900/30">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-slate-400 font-medium">Weight</span>
                  <span className="text-xs font-mono font-semibold text-slate-100 bg-slate-800/60 px-2 py-0.5 rounded border border-white/[0.06] tabular-nums">
                    {p.Weight} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="48"
                  max="120"
                  step="1"
                  value={p.Weight}
                  onChange={(e) => updatePatientField('Weight', Number(e.target.value))}
                  className="w-full perfusion3d-slider h-1.5 bg-slate-800/80 rounded-full cursor-pointer accent-cyan-400"
                  style={{
                    background: `linear-gradient(to right, #475569 0%, #06b6d4 ${((p.Weight - 48) / (120 - 48)) * 100}%, rgba(30, 41, 59, 0.8) ${((p.Weight - 48) / (120 - 48)) * 100}%, rgba(30, 41, 59, 0.8) 100%)`,
                  }}
                />
              </div>

              <div className="glass-card p-3 rounded-xl border border-white/[0.06] bg-slate-900/30">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-slate-400 font-medium">Height</span>
                  <span className="text-xs font-mono font-semibold text-slate-100 bg-slate-800/60 px-2 py-0.5 rounded border border-white/[0.06] tabular-nums">
                    {p.Length} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="188"
                  step="1"
                  value={p.Length}
                  onChange={(e) => updatePatientField('Length', Number(e.target.value))}
                  className="w-full perfusion3d-slider h-1.5 bg-slate-800/80 rounded-full cursor-pointer accent-cyan-400"
                  style={{
                    background: `linear-gradient(to right, #475569 0%, #06b6d4 ${((p.Length - 140) / (188 - 140)) * 100}%, rgba(30, 41, 59, 0.8) ${((p.Length - 140) / (188 - 140)) * 100}%, rgba(30, 41, 59, 0.8) 100%)`,
                  }}
                />
              </div>
            </div>

            {/* Calculated BMI */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/40 border border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Calculated Body Mass Index (BMI)</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {p.BMI < 18.5 ? '(Underweight)' : p.BMI < 25 ? '(Normal)' : p.BMI < 30 ? '(Overweight)' : '(Obese)'}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-cyan-300 bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-500/20 tabular-nums">
                {p.BMI} kg/m²
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Symptoms */}
        {activeTab === 'symptoms' && (
          <div className="space-y-3">
            {[
              { key: 'Typical Chest Pain', label: 'Typical Exertional Angina', desc: 'Substernal chest pressure or constriction on exertion' },
              { key: 'DM', label: 'Diabetes Mellitus', desc: 'Diagnosed Type 1 or Type 2 Diabetes' },
              { key: 'HTN', label: 'Hypertension', desc: 'History of chronic elevated blood pressure' },
              { key: 'Current Smoker', label: 'Active Tobacco Smoker', desc: 'Current daily or frequent smoking' },
              { key: 'FH', label: 'Family History of CAD', desc: 'First-degree relative premature coronary disease' },
              { key: 'Dyspnea', label: 'Exertional Dyspnea', desc: 'Shortness of breath on mild to moderate exertion' },
              { key: 'DLP', label: 'Dyslipidemia', desc: 'Documented hypercholesterolemia or lipid abnormality' },
            ].map(({ key, label, desc }) => {
              const isChecked = (p as any)[key] === '1' || (p as any)[key] === 'Y';
              return (
                <div
                  key={key}
                  onClick={() => {
                    const currentVal = (p as any)[key];
                    const nextVal = currentVal === '1' ? '0' : currentVal === '0' ? '1' : currentVal === 'Y' ? 'N' : 'Y';
                    updatePatientField(key as any, nextVal);
                  }}
                  className={`p-3 rounded-xl glass-card flex items-center justify-between cursor-pointer border transition-all ${
                    isChecked
                      ? 'border-cyan-500/40 bg-cyan-950/20 text-white shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                      : 'border-white/[0.06] bg-slate-900/30 text-slate-300 hover:border-white/10 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block text-slate-200">{label}</span>
                    <span className="text-[10px] text-slate-400">{desc}</span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      isChecked ? 'bg-cyan-500' : 'bg-slate-800 border border-white/[0.08]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                        isChecked ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            {/* NYHA Functional Class */}
            <div className="glass-card p-3 rounded-xl border border-white/[0.06] bg-slate-900/30">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-400 font-medium">NYHA Functional Class</span>
                <span className="text-xs font-mono font-semibold text-slate-100 bg-slate-800/60 px-2 py-0.5 rounded border border-white/[0.06]">
                  Class {p['Function Class']}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {['0', '1', '2', '3'].map((fc) => (
                  <button
                    key={fc}
                    type="button"
                    onClick={() => updatePatientField('Function Class', fc)}
                    className={`py-1.5 rounded-lg font-mono text-xs font-semibold transition-all border ${
                      p['Function Class'] === fc
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/40 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    Class {fc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: ECG Leads */}
        {activeTab === 'ecg' && (
          <div className="space-y-3">
            {[
              { key: 'St Elevation', label: 'ECG ST-Segment Elevation', desc: 'Localized elevation (V1-V4 indicative of LAD territory ischemia)' },
              { key: 'St Depression', label: 'ECG ST-Segment Depression', desc: 'Subendocardial ischemia finding (leads II, III, aVF / V5-V6)' },
              { key: 'Tinversion', label: 'T-Wave Inversion', desc: 'Myocardial repolarization abnormality' },
              { key: 'Q Wave', label: 'Pathologic Q-Wave', desc: 'Prior transmural myocardial infarction sign' },
              { key: 'LVH', label: 'Left Ventricular Hypertrophy', desc: 'Sokolow-Lyon voltage criteria met' },
              { key: 'Poor R Progression', label: 'Poor R-Wave Progression', desc: 'Loss of anterior electromotive forces across precordial leads' },
            ].map(({ key, label, desc }) => {
              const isChecked = (p as any)[key] === '1' || (p as any)[key] === 'Y';
              return (
                <div
                  key={key}
                  onClick={() => {
                    const currentVal = (p as any)[key];
                    const nextVal = currentVal === '1' ? '0' : currentVal === '0' ? '1' : currentVal === 'Y' ? 'N' : 'Y';
                    updatePatientField(key as any, nextVal);
                  }}
                  className={`p-3 rounded-xl glass-card flex items-center justify-between cursor-pointer border transition-all ${
                    isChecked
                      ? 'border-rose-500/40 bg-rose-950/20 text-white shadow-[0_0_14px_rgba(244,63,94,0.15)]'
                      : 'border-white/[0.06] bg-slate-900/30 text-slate-300 hover:border-white/10 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block text-slate-200">{label}</span>
                    <span className="text-[10px] text-slate-400">{desc}</span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      isChecked ? 'bg-rose-500' : 'bg-slate-800 border border-white/[0.08]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                        isChecked ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            {/* Bundle Branch Block */}
            <div className="glass-card p-3 rounded-xl border border-white/[0.06] bg-slate-900/30">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-400 font-medium">Bundle Branch Block (BBB)</span>
                <span className="text-xs font-mono font-semibold text-slate-100 bg-slate-800/60 px-2 py-0.5 rounded border border-white/[0.06]">
                  {p.BBB === 'N' ? 'None' : p.BBB}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['N', 'LBBB', 'RBBB'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => updatePatientField('BBB', b)}
                    className={`py-1.5 rounded-lg font-mono text-xs font-semibold transition-all border ${
                      p.BBB === b
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/40 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {b === 'N' ? 'None (N)' : b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Echo & Labs */}
        {activeTab === 'echo_labs' && (
          <div className="space-y-4">
            {/* Ejection Fraction */}
            <SliderControl
              label="Ejection Fraction (EF-TTE)"
              value={p['EF-TTE']}
              min={15}
              max={60}
              step={5}
              unit="%"
              minLabel="Severe (<35%)"
              medianLabel="Borderline (40-49%)"
              maxLabel="Normal (≥50%)"
              valueColor={p['EF-TTE'] < 40 ? 'text-rose-400' : p['EF-TTE'] < 50 ? 'text-amber-400' : 'text-emerald-400'}
              onChange={(val) => updatePatientField('EF-TTE', val)}
            />

            {/* Regional Wall Motion Abnormality (Region RWMA) */}
            <div className="glass-card p-3 rounded-xl border border-white/[0.06] bg-slate-900/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Echocardiography RWMA Territory</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                  CRITICAL PREDICTOR
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { code: '0', label: 'Class 0: None / Normal Wall Motion', territory: 'Patent Myocardium' },
                  { code: '1', label: 'Class 1: Anterior Wall Hypokinesia', territory: 'LAD Vascular Bed' },
                  { code: '2', label: 'Class 2: Inferior Wall Hypokinesia', territory: 'RCA Vascular Bed' },
                  { code: '3', label: 'Class 3: Lateral Wall Hypokinesia', territory: 'LCX Vascular Bed' },
                  { code: '4', label: 'Class 4: Septal / Multi-Territory Dyskinesia', territory: 'Diffuse CAD' },
                ].map(({ code, label, territory }) => {
                  const isSelected = p['Region RWMA'] === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => updatePatientField('Region RWMA', code)}
                      className={`p-2.5 rounded-xl text-left transition-all border ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                          : 'bg-slate-900/40 border-white/[0.06] text-slate-300 hover:bg-slate-800/40 hover:border-white/10'
                      }`}
                    >
                      <div className="font-semibold text-xs text-slate-200">{label}</div>
                      <div className="text-[10px] font-mono text-cyan-400/90">{territory}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fasting Blood Sugar */}
            <SliderControl
              label="Fasting Blood Sugar (FBS)"
              value={p.FBS}
              min={62}
              max={300}
              step={2}
              unit="mg/dL"
              minLabel="62 mg/dL"
              medianLabel="Normal: <100"
              maxLabel="300 mg/dL"
              onChange={(val) => updatePatientField('FBS', val)}
            />

            {/* Triglycerides */}
            <SliderControl
              label="Triglycerides (TG)"
              value={p.TG}
              min={37}
              max={500}
              step={5}
              unit="mg/dL"
              minLabel="37 mg/dL"
              medianLabel="Normal: <150"
              maxLabel="500 mg/dL"
              onChange={(val) => updatePatientField('TG', val)}
            />

            {/* Serum Creatinine */}
            <SliderControl
              label="Serum Creatinine (CR)"
              value={p.CR}
              min={0.5}
              max={2.2}
              step={0.1}
              unit="mg/dL"
              minLabel="0.5 mg/dL"
              medianLabel="Normal: 0.7-1.2"
              maxLabel="2.2 mg/dL"
              onChange={(val) => updatePatientField('CR', val)}
            />
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-white/[0.08] bg-slate-950/80 backdrop-blur-xl flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>55 Clinical Parameters</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)]"
        >
          Apply & Close
        </button>
      </div>
    </aside>
  );
};
