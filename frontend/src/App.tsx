import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import {
  DatasetMeta,
  DatasetProfile,
  RecommendationsResponse,
  AnalysisResponse,
  AnalysisRequest
} from './types';
import * as api from './services/api';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DatasetsPage } from './pages/DatasetsPage';
import { ExplorationPage } from './pages/ExplorationPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ReportsPage } from './pages/ReportsPage';

export function AppContent() {
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResponse | null>(null);

  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Check health and load datasets on initial load
  useEffect(() => {
    async function init() {
      try {
        await api.checkHealth();
        setIsBackendHealthy(true);
      } catch (e) {
        setIsBackendHealthy(false);
      }

      await refreshDatasets(true);
    }
    init();
  }, []);

  const refreshDatasets = async (autoSelectExample = false) => {
    try {
      setIsLoadingDatasets(true);
      const list = await api.getDatasets();
      setDatasets(list);

      if (list.length > 0) {
        if (!activeDatasetId || autoSelectExample) {
          // If Cleveland benchmark exists, prefer it, or pick first
          const cleveland = list.find((d) => d.dataset_id === 'cleveland-heart');
          const chosen = cleveland ? cleveland.dataset_id : list[0].dataset_id;
          await selectDataset(chosen);
        }
      } else if (autoSelectExample) {
        // Pre-load Cleveland example if empty
        await handleLoadExample();
      }
    } catch (e) {
      console.error('Failed to load datasets:', e);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const selectDataset = async (datasetId: string) => {
    setActiveDatasetId(datasetId);
    try {
      setIsLoadingProfile(true);
      const [prof, recs] = await Promise.all([
        api.getDatasetProfile(datasetId),
        api.getRecommendations(datasetId),
      ]);
      setProfile(prof);
      setRecommendations(recs);
      const list = await api.getDatasets();
      setDatasets(list);
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    const meta = await api.uploadDataset(file);
    await refreshDatasets();
    await selectDataset(meta.dataset_id);
    navigate('/datasets');
  };

  const handleLoadExample = async () => {
    try {
      setIsLoadingProfile(true);
      const meta = await api.loadHeartDiseaseExample();
      await refreshDatasets();
      await selectDataset(meta.dataset_id);
      navigate('/datasets');
    } catch (e) {
      console.error('Failed to load benchmark:', e);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleRunAnalysis = async (req: AnalysisRequest) => {
    if (!activeDatasetId) return;
    try {
      setIsAnalyzing(true);
      const result = await api.runAnalysis(activeDatasetId, req);
      setCurrentAnalysis(result);
    } catch (e: any) {
      alert(`Model execution error: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeDataset = datasets.find((d) => d.dataset_id === activeDatasetId);

  return (
    <div className="flex h-screen bg-warmbg overflow-hidden font-sans text-maintext">
      {/* Left Sidebar */}
      <Sidebar
        activeDatasetId={activeDatasetId}
        activeDatasetName={activeDataset?.filename}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          datasets={datasets}
          activeDatasetId={activeDatasetId}
          onSelectDataset={selectDataset}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/datasets" replace />} />
            <Route
              path="/datasets"
              element={
                <DatasetsPage
                  datasets={datasets}
                  activeDatasetId={activeDatasetId}
                  profile={profile}
                  isLoadingProfile={isLoadingProfile}
                  onUploadFile={handleUploadFile}
                  onLoadExample={handleLoadExample}
                  onSelectDataset={selectDataset}
                />
              }
            />
            <Route
              path="/exploration"
              element={
                <ExplorationPage
                  profile={profile}
                  isLoading={isLoadingProfile}
                  onLoadExample={handleLoadExample}
                />
              }
            />
            <Route
              path="/analysis"
              element={
                <AnalysisPage
                  profile={profile}
                  recommendations={recommendations}
                  currentAnalysis={currentAnalysis}
                  isAnalyzing={isAnalyzing}
                  onRunAnalysis={handleRunAnalysis}
                  onLoadExample={handleLoadExample}
                />
              }
            />
            <Route
              path="/reports"
              element={
                <ReportsPage
                  currentAnalysis={currentAnalysis}
                  profile={profile}
                  onLoadExample={handleLoadExample}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
