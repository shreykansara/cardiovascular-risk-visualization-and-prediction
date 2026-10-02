/**
 * Clinical Parameter Input Drawer & Physiological Controls (AuraCor DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Sliders,
  User,
  X,
  Zap,
  FlaskConical,
  Stethoscope,
  Info,
} from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import type { PatientData } from '../../types/clinical';

interface PatientFormProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'vitals' | 'symptoms' | 'ecg' | 'echo_labs';

export const PatientForm: React.FC<PatientFormProps> = ({ isOpen, onClose }) => {
  const { patient, updateField, isLoading } = usePatientStore();
  const [activeTab, setActiveTab] = useState<TabKey>('vitals');

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] ultra-glass border-l border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.85)] flex flex-col animate-in slide-in-from-right duration-300 select-none">
      {/* Drawer Top Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
              Patient Physiological Parameters
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Instant live re-scoring & 3D WebGL twin sync
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-2 bg-surface-2/60 border-b border-slate-800 overflow-x-auto">
        {[
          { key: 'vitals', label: 'Vitals & Anamnesis', icon: User },
          { key: 'symptoms', label: 'Symptoms', icon: Stethoscope },
          { key: 'ecg', label: 'ECG Findings', icon: Zap },
          { key: 'echo_labs', label: 'Echo & Labs', icon: FlaskConical },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as TabKey)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === key
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Interactive Controls Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-sans">
        {/* Tab 1: Vitals & Demographics */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            {/* Age Slider */}
            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-slate-200">Patient Age</span>
                <span className="font-mono text-cyan-400 font-bold">{patient.Age} yrs</span>
              </div>
              <input
                type="range"
                min="30"
                max="86"
                step="1"
                value={patient.Age}
                onChange={(e) => updateField('Age', Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>30 yrs</span>
                <span>Cohort Median: 58</span>
                <span>86 yrs</span>
              </div>
            </div>

            {/* Sex Toggle */}
            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <span className="font-semibold text-slate-200">Biological Sex</span>
              <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/60">
                {(['Male', 'Female'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateField('Sex', s)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      patient.Sex === s ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Systolic Blood Pressure */}
            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-slate-200">Systolic Blood Pressure</span>
                <span className="font-mono text-cyan-400 font-bold">{patient.BP} mmHg</span>
              </div>
              <input
                type="range"
                min="90"
                max="190"
                step="5"
                value={patient.BP}
                onChange={(e) => updateField('BP', Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>90 mmHg</span>
                <span>Normal: &lt;120</span>
                <span>190 mmHg</span>
              </div>
            </div>

            {/* Resting Pulse Rate */}
            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-slate-200">Resting Pulse Rate</span>
                <span className="font-mono text-cyan-400 font-bold">{patient.PR} bpm</span>
              </div>
              <input
                type="range"
                min="50"
                max="110"
                step="2"
                value={patient.PR}
                onChange={(e) => updateField('PR', Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Weight and Height */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-3 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">Weight</span>
                  <span className="font-mono text-slate-100 font-bold">{patient.Weight} kg</span>
                </div>
                <input
                  type="range"
                  min="48"
                  max="120"
                  value={patient.Weight}
                  onChange={(e) => updateField('Weight', Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
                />
              </div>
              <div className="glass-card p-3 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">Height</span>
                  <span className="font-mono text-slate-100 font-bold">{patient.Length} cm</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="188"
                  value={patient.Length}
                  onChange={(e) => updateField('Length', Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2/40 text-slate-400 font-mono text-[11px]">
              <span>Calculated BMI:</span>
              <span className="text-cyan-300 font-bold">{patient.BMI} kg/m²</span>
            </div>
          </div>
        )}

        {/* Tab 2: Symptoms & Anamnesis */}
        {activeTab === 'symptoms' && (
          <div className="space-y-3">
            {[
              { key: 'Typical Chest Pain', label: 'Typical Exertional Angina', desc: 'Substernal chest pressure on exertion' },
              { key: 'DM', label: 'Diabetes Mellitus', desc: 'Diagnosed Type 1 or Type 2 Diabetes' },
              { key: 'HTN', label: 'Hypertension', desc: 'History of chronic elevated blood pressure' },
              { key: 'Current Smoker', label: 'Active Tobacco Smoker', desc: 'Current daily or frequent smoking' },
              { key: 'FH', label: 'Family History of CAD', desc: 'First-degree relative premature CAD' },
              { key: 'Dyspnea', label: 'Exertional Dyspnea', desc: 'Shortness of breath on mild exertion' },
              { key: 'DLP', label: 'Dyslipidemia', desc: 'Documented hypercholesterolemia' },
            ].map(({ key, label, desc }) => {
              const isChecked = (patient as any)[key] === '1' || (patient as any)[key] === 'Y';
              return (
                <div
                  key={key}
                  onClick={() => {
                    const currentVal = (patient as any)[key];
                    const nextVal = currentVal === '1' ? '0' : currentVal === '0' ? '1' : currentVal === 'Y' ? 'N' : 'Y';
                    updateField(key as any, nextVal);
                  }}
                  className={`p-3 rounded-xl glass-card flex items-center justify-between cursor-pointer border transition-all ${
                    isChecked
                      ? 'border-cyan-500/60 bg-cyan-950/20 text-white'
                      : 'border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block">{label}</span>
                    <span className="text-[10px] text-slate-400">{desc}</span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      isChecked ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        isChecked ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            {/* NYHA Functional Class */}
            <div className="glass-card p-3 rounded-xl">
              <span className="font-semibold text-slate-200 block mb-1.5">NYHA Functional Class</span>
              <div className="grid grid-cols-4 gap-1.5">
                {['0', '1', '2', '3'].map((fc) => (
                  <button
                    key={fc}
                    onClick={() => updateField('Function Class', fc)}
                    className={`py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
                      patient['Function Class'] === fc
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Class {fc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: ECG Findings */}
        {activeTab === 'ecg' && (
          <div className="space-y-3">
            {[
              { key: 'St Elevation', label: 'ECG ST-Segment Elevation', desc: 'Localized elevation (V1-V4 indicative of LAD territory)' },
              { key: 'St Depression', label: 'ECG ST-Segment Depression', desc: 'Subendocardial ischemia finding' },
              { key: 'Tinversion', label: 'T-Wave Inversion', desc: 'Repolarization abnormality' },
              { key: 'Q Wave', label: 'Pathologic Q-Wave', desc: 'Previous transmural myocardial infarction sign' },
              { key: 'LVH', label: 'Left Ventricular Hypertrophy', desc: 'Sokolow-Lyon voltage criteria met' },
              { key: 'Poor R Progression', label: 'Poor R-Wave Progression', desc: 'Loss of anterior electromotive forces' },
            ].map(({ key, label, desc }) => {
              const isChecked = (patient as any)[key] === '1' || (patient as any)[key] === 'Y';
              return (
                <div
                  key={key}
                  onClick={() => {
                    const currentVal = (patient as any)[key];
                    const nextVal = currentVal === '1' ? '0' : currentVal === '0' ? '1' : currentVal === 'Y' ? 'N' : 'Y';
                    updateField(key as any, nextVal);
                  }}
                  className={`p-3 rounded-xl glass-card flex items-center justify-between cursor-pointer border transition-all ${
                    isChecked
                      ? 'border-rose-500/60 bg-rose-950/20 text-white shadow-glow-critical'
                      : 'border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block">{label}</span>
                    <span className="text-[10px] text-slate-400">{desc}</span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      isChecked ? 'bg-rose-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        isChecked ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            {/* Bundle Branch Block */}
            <div className="glass-card p-3 rounded-xl">
              <span className="font-semibold text-slate-200 block mb-1.5">Bundle Branch Block (BBB)</span>
              <div className="grid grid-cols-3 gap-2">
                {(['N', 'LBBB', 'RBBB'] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => updateField('BBB', b)}
                    className={`py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
                      patient.BBB === b
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {b === 'N' ? 'None (N)' : b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Echo & Blood Biomarkers */}
        {activeTab === 'echo_labs' && (
          <div className="space-y-4">
            {/* Left Ventricular Ejection Fraction */}
            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-slate-200">Ejection Fraction (EF-TTE)</span>
                <span
                  className={`font-mono font-bold ${
                    patient['EF-TTE'] < 40 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {patient['EF-TTE']}%
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={patient['EF-TTE']}
                onChange={(e) => updateField('EF-TTE', Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Severe (&lt;35%)</span>
                <span>Borderline (40-49%)</span>
                <span>Normal (&ge;50%)</span>
              </div>
            </div>

            {/* Regional Wall Motion Abnormality (Region RWMA) */}
            <div className="glass-card p-3 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-200">Echocardiography RWMA Territory</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
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
                  const isSelected = patient['Region RWMA'] === code;
                  return (
                    <button
                      key={code}
                      onClick={() => updateField('Region RWMA', code)}
                      className={`p-2 rounded-lg text-left transition-all border ${
                        isSelected
                          ? 'bg-cyan-600/30 border-cyan-500/80 text-white shadow-glow-cyan'
                          : 'bg-slate-800/60 border-slate-700/40 text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="font-semibold text-xs">{label}</div>
                      <div className="text-[10px] font-mono text-cyan-400/90">{territory}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fasting Blood Sugar */}
            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-slate-200">Fasting Blood Sugar (FBS)</span>
                <span className="font-mono text-cyan-400 font-bold">{patient.FBS} mg/dL</span>
              </div>
              <input
                type="range"
                min="62"
                max="300"
                step="2"
                value={patient.FBS}
                onChange={(e) => updateField('FBS', Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Triglycerides */}
            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-slate-200">Triglycerides (TG)</span>
                <span className="font-mono text-cyan-400 font-bold">{patient.TG} mg/dL</span>
              </div>
              <input
                type="range"
                min="37"
                max="500"
                step="5"
                value={patient.TG}
                onChange={(e) => updateField('TG', Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Serum Creatinine */}
            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-slate-200">Serum Creatinine (CR)</span>
                <span className="font-mono text-cyan-400 font-bold">{patient.CR} mg/dL</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.2"
                step="0.1"
                value={patient.CR}
                onChange={(e) => updateField('CR', Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-slate-800 bg-surface-1/90 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>55 Clinical Parameters</span>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all shadow-sm"
        >
          Apply & Close
        </button>
      </div>
    </aside>
  );
};
