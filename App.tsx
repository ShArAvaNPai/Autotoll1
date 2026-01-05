import React, { useState, useEffect } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { RealtimeDetectionView } from './components/RealtimeDetectionView';
import { LayoutDashboard, Car, IndianRupee, Activity, Settings, Bell, User, Clock, FileCheck, ScanLine, LogOut, Home } from 'lucide-react';
import { StatsCard } from './components/StatsCard'; // Still needed for some imports if used elsewhere or removing unused
import { LoginView } from './components/LoginView';
import { VehicleOwnerView } from './components/VehicleOwnerView';
import { Registry } from './components/Registry';
import { History } from './components/History';
import { ReviewQueue } from './components/ReviewQueue';
import { analyzeVehicleImageLocal as analyzeVehicleImage } from './services/api';
import { AnalysisResult, TollRecord, VehicleType, TollRate } from './types';
import { TOLL_RATES as DEFAULT_RATES } from './constants';
import { DashboardMenu } from './components/DashboardMenu';
import { LiveMonitor } from './components/LiveMonitor';

export default function App() {
  const [history, setHistory] = useState<TollRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [currentScanImage, setCurrentScanImage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'owner' | null>(null);
  // Default view is now 'monitor' since dashboard menu is an overlay
  const [currentView, setCurrentView] = useState<'monitor' | 'analytics' | 'settings' | 'registry' | 'history' | 'review' | 'realtime'>('monitor');
  const [tollRates, setTollRates] = useState<TollRate>(DEFAULT_RATES);
  const [registryInitialPlate, setRegistryInitialPlate] = useState<string>('');
  const [summary, setSummary] = useState({
    total_vehicles: 0,
    total_revenue: 0,
    avg_confidence: 0,
    pending_review: 0
  });

  const fetchSummary = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/summary');
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch summary", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/history');
      if (res.ok) {
        const data = await res.json();
        const mappedRecords: TollRecord[] = data.map((d: any) => {
          let timestamp = Date.now();
          try {
            const dateStr = d.timestamp.endsWith('Z') ? d.timestamp : d.timestamp + 'Z';
            timestamp = new Date(dateStr).getTime();
            if (isNaN(timestamp)) {
              // Fallback for tricky formats
              timestamp = new Date(d.timestamp).getTime() || Date.now();
            }
          } catch (e) {
            console.error("Date parse error", e);
          }

          return {
            id: d.id.toString(),
            timestamp,
            vehicleType: (d.vehicle_type as VehicleType) || VehicleType.Unknown,
            licensePlate: d.license_plate || 'UNKNOWN',
            confidence: parseFloat(d.confidence) || 0,
            tollAmount: d.toll_amount || 0,
            imageUrl: d.image_path ? `http://localhost:8000${d.image_path}` : '',
            status: d.status === 'verified' ? 'processed' : 'manual_review',
            color: 'Detected',
            makeModel: d.make_model || `Detected ${d.vehicle_type || 'Vehicle'}`,
            description: d.description || `A ${d.vehicle_type?.toLowerCase() || 'vehicle'} detected.`
          };
        });
        setHistory(mappedRecords);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchSummary();
    const interval = setInterval(() => {
      fetchHistory();
      fetchSummary();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRegisterFromHistory = (plate: string) => {
    setRegistryInitialPlate(plate);
    setCurrentView('registry');
  };

  const totalVehicles = summary.total_vehicles;
  const totalRevenue = summary.total_revenue;
  const avgConfidence = summary.avg_confidence;
  const pendingReviewCount = summary.pending_review;

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    setCurrentResult(null);
    setCurrentScanImage(null); // Clear previous

    // Ensure we are on the monitor view
    setCurrentView('monitor');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
      });

      const base64Image = await base64Promise;
      setCurrentScanImage(base64Image); // Store image for persistence

      const result = await analyzeVehicleImage(file);
      setCurrentResult(result);

      // Refresh history and summary from backend immediately
      await Promise.all([fetchHistory(), fetchSummary()]);

    } catch (error) {
      console.error("Failed to process", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setCurrentResult(null);
    setCurrentScanImage(null);
    fetchHistory();
    fetchSummary();
  };

  if (!userRole) {
    return <LoginView onLogin={setUserRole} />;
  }

  if (userRole === 'owner') {
    return <VehicleOwnerView onBack={() => setUserRole(null)} />;
  }

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden relative">

      {/* Persistent Navigation Overlay */}
      <DashboardMenu
        onNavigate={(view) => setCurrentView(view)}
        stats={{
          totalVehicles: summary.total_vehicles,
          pendingReview: summary.pending_review
        }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-zinc-900 bg-black/80 backdrop-blur-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Car className="text-white" size={16} />
            </div>
            <span className="font-bold text-sm text-white">AutoToll AI</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-500 text-sm">
            <span className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-400">Lane #1: Active</span>
            <span className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-400">Camera: Online</span>
          </div>

          <button className="p-2 text-zinc-500 hover:text-white relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-black"></span>
          </button>

          <button
            onClick={() => setUserRole(null)}
            className="p-2 text-zinc-500 hover:text-red-400 transition-colors ml-2"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-6 transition-all duration-300">
          {currentView === 'monitor' ? (
            <LiveMonitor
              totalVehicles={totalVehicles}
              totalRevenue={totalRevenue}
              avgConfidence={avgConfidence}
              pendingReviewCount={pendingReviewCount}
              isAnalyzing={isAnalyzing}
              currentResult={currentResult}
              currentScanImage={currentScanImage}
              history={history}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
            />
          ) : currentView === 'analytics' ? (
            <AnalyticsView />
          ) : currentView === 'registry' ? (
            <Registry initialPlate={registryInitialPlate} />
          ) : currentView === 'history' ? (
            <History onRegister={handleRegisterFromHistory} />
          ) : currentView === 'realtime' ? (
            <RealtimeDetectionView />
          ) : currentView === 'review' ? (
            <ReviewQueue onProcessed={() => {
              fetchHistory();
              fetchSummary();
            }} />
          ) : (
            <SettingsView
              currentRates={tollRates}
              onUpdateRates={setTollRates}
            />
          )}
        </div>
      </main>
    </div >
  );
}
