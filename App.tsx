import React, { useState, useEffect } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { RealtimeDetectionView } from './components/RealtimeDetectionView';
import { LayoutDashboard, Car, IndianRupee, Activity, Settings, Bell, User, Clock, FileCheck, ScanLine } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { HistoryTable } from './components/HistoryTable';
import { ScannerView } from './components/ScannerView';
import { Registry } from './components/Registry';
import { History } from './components/History';
import { ReviewQueue } from './components/ReviewQueue';
import { analyzeVehicleImageLocal as analyzeVehicleImage } from './services/api';
import { AnalysisResult, TollRecord, VehicleType, TollRate } from './types';
import { TOLL_RATES as DEFAULT_RATES } from './constants';
import { v4 as uuidv4 } from 'uuid'; // Actually we will just use crypto.randomUUID for cleaner dep-less code in this env

export default function App() {
  const [history, setHistory] = useState<TollRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [currentScanImage, setCurrentScanImage] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'settings' | 'registry' | 'history' | 'review' | 'realtime'>('dashboard');
  const [tollRates, setTollRates] = useState<TollRate>(DEFAULT_RATES);
  const [registryInitialPlate, setRegistryInitialPlate] = useState<string>('');

  const handleRegisterFromHistory = (plate: string) => {
    setRegistryInitialPlate(plate);
    setCurrentView('registry');
  };

  const totalVehicles = history.length;
  const totalRevenue = history.reduce((acc, curr) => acc + curr.tollAmount, 0);
  const avgConfidence = totalVehicles > 0
    ? (history.reduce((acc, curr) => acc + curr.confidence, 0) / totalVehicles * 100).toFixed(1)
    : "0";

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    setCurrentResult(null);
    setCurrentScanImage(null); // Clear previous
    setCurrentView('dashboard');

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

      // Create new record
      // Use dynamic toll rates from state
      const tollAmount = tollRates[result.vehicleType] || tollRates[VehicleType.Unknown] || 10;

      const newRecord: TollRecord = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        tollAmount,
        imageUrl: base64Image, // In a real app, upload to storage and store URL
        status: result.confidence > 0.7 ? 'processed' : 'manual_review'
      };

      setHistory(prev => [newRecord, ...prev]);

    } catch (error) {
      console.error("Failed to process", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-900">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Car className="text-white" size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-white">AutoToll AI</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === 'analytics'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
          >
            <Activity size={18} />
            Analytics
          </button>
          <button
            onClick={() => setCurrentView('registry')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === 'registry'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
          >
            <User size={18} />
            Registry
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === 'history'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
          >
            <Clock size={18} />
            History
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === 'settings'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
          >
            <Settings size={18} />
            Settings
          </button>
          <button
            onClick={() => setCurrentView('review')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === 'review'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
          >
            <FileCheck size={18} />
            Review Queue
          </button>
          <button
            onClick={() => setCurrentView('realtime')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === 'realtime'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
          >
            <ScanLine size={18} />
            Real-time Scan
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-900">
            <p className="text-xs text-zinc-500 mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-400">Operational</span>
            </div>
            <p className="text-xs text-zinc-600 mt-2">Model: YOLOv8 Nano</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-zinc-900 bg-black/80 backdrop-blur-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4 md:hidden">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Car className="text-white" size={16} />
            </div>
            <span className="font-bold text-sm text-white">AutoToll AI</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-zinc-500 text-sm">
            <span className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-400">Lane #1: Active</span>
            <span className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-400">Camera: Online</span>
          </div>

          <button className="p-2 text-zinc-500 hover:text-white relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-black"></span>
          </button>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          {currentView === 'dashboard' ? (
            <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">

              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Vehicles"
                  value={totalVehicles}
                  icon={Car}
                  trend="+12% from last hour"
                  color="blue"
                />
                <StatsCard
                  title="Revenue"
                  value={`₹${totalRevenue.toFixed(2)}`}
                  icon={IndianRupee}
                  trend="+8.5% daily avg"
                  color="green"
                />
                <StatsCard
                  title="Avg Confidence"
                  value={`${avgConfidence}%`}
                  icon={Activity}
                  trend="Optimal Range"
                  color="purple"
                />
                <StatsCard
                  title="Pending Review"
                  value={history.filter(h => h.status === 'manual_review').length}
                  icon={Activity}
                  trend="Requires attention"
                  color="amber"
                />
              </div>

              {/* Split View: Scanner & History */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Left: Scanner (Takes up 1 column on large screens) */}
                <div className="lg:col-span-1 h-full">
                  <ScannerView
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                    lastResult={currentResult}
                    lastScannedImage={currentScanImage}
                  />
                </div>

                {/* Right: History Table (Takes up 2 columns) */}
                <div className="lg:col-span-2 h-full min-h-[400px]">
                  <HistoryTable records={history} />
                </div>
              </div>

            </div>
          ) : currentView === 'analytics' ? (
            <AnalyticsView history={history} />
          ) : currentView === 'registry' ? (
            <Registry initialPlate={registryInitialPlate} />
          ) : currentView === 'history' ? (
            <History onRegister={handleRegisterFromHistory} />
          ) : currentView === 'realtime' ? (
            <RealtimeDetectionView />
          ) : currentView === 'review' ? (
            <ReviewQueue />
          ) : (
            <SettingsView
              currentRates={tollRates}
              onUpdateRates={setTollRates}
            />
          )}
        </div>
      </main>
    </div>
  );
}
