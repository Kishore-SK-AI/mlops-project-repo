import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/AppShell';

import { OverviewPage } from './pages/OverviewPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { PipelinesPage } from './pages/PipelinesPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { ModelsPage } from './pages/ModelsPage';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { InferencePage } from './pages/InferencePage';
import { MonitoringPage } from './pages/MonitoringPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/datasets" element={<DatasetsPage />} />
            <Route path="/pipelines" element={<PipelinesPage />} />
            <Route path="/experiments" element={<ExperimentsPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/deployments" element={<DeploymentsPage />} />
            <Route path="/inference" element={<InferencePage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<OverviewPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
