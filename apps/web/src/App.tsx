/**
 * Perfusion3D Wizard Application Root
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WizardLayout } from './components/layout/WizardLayout';
import { WelcomePage } from './pages/WelcomePage';
import { DataEntryPage } from './pages/DataEntryPage';
import { ResultsPage } from './pages/ResultsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DesignSystemPage } from './pages/DesignSystemPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<WizardLayout />}>
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/enter-data" element={<DataEntryPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/design-system" element={<DesignSystemPage />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
