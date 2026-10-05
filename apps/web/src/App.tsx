/**
 * Perfusion3D Wizard Application Root
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WizardLayout } from './components/layout/WizardLayout';
import { WelcomePage } from './pages/WelcomePage';
import { DataEntryPage } from './pages/DataEntryPage';
import { ReportsPage } from './pages/ReportsPage';
import { ModelInfoPage } from './pages/ModelInfoPage';
import { DesignSystemPage } from './pages/DesignSystemPage';

// Lazy-load the 3D chunk with the Results route only (Task 2.8)
const ResultsPage = React.lazy(() => import('./pages/ResultsPage'));

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<WizardLayout />}>
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/enter-data" element={<DataEntryPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/model-info" element={<ModelInfoPage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
