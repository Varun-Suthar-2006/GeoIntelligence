import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

import { Overview } from './pages/Overview';
import { SatelliteExplorer } from './pages/SatelliteExplorer';
import { ImageComparison } from './pages/ImageComparison';
import { ChangeDetection } from './pages/ChangeDetection';
import { GeospatialIntelligence } from './pages/GeospatialIntelligence';
import { AIModelCentre } from './pages/AIModelCentre';
import { DatasetManager } from './pages/DatasetManager';
import { AnalysisHistory } from './pages/AnalysisHistory';
import { ResearchReports } from './pages/ResearchReports';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
          <Navbar />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/explorer" element={<SatelliteExplorer />} />
                <Route path="/comparison" element={<ImageComparison />} />
                <Route path="/detection" element={<ChangeDetection />} />
                <Route path="/geospatial" element={<GeospatialIntelligence />} />
                <Route path="/models" element={<AIModelCentre />} />
                <Route path="/datasets" element={<DatasetManager />} />
                <Route path="/history" element={<AnalysisHistory />} />
                <Route path="/reports" element={<ResearchReports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
