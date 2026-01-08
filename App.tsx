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

    <div className="flex h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 overflow-hidden relative">

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
        <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Car className="text-white" size={20} />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block">AutoToll AI</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block -mt-1">Admin Console</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Lane #1: Active
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 font-medium">Camera: Online</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-slate-900">Administrator</div>
                <div className="text-xs text-slate-500">Super User</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-white shadow-sm flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
            </div>

            <button
              onClick={() => setUserRole(null)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-2"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
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
