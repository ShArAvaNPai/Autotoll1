import React from 'react';
import { StatsCard } from './StatsCard';
import { ScannerView } from './ScannerView';
import { HistoryTable } from './HistoryTable';
import { Car, IndianRupee, Activity } from 'lucide-react';
import { AnalysisResult, TollRecord } from '../types';

interface LiveMonitorProps {
    totalVehicles: number;
    totalRevenue: number;
    avgConfidence: number;
    pendingReviewCount: number;
    isAnalyzing: boolean;
    currentResult: AnalysisResult | null;
    currentScanImage: string | null;
    history: TollRecord[];
    onAnalyze: (file: File, location?: string) => Promise<void>;
    onClear: () => void;
    selectedLocation: string;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({
    totalVehicles,
    totalRevenue,
    avgConfidence,
    pendingReviewCount,
    isAnalyzing,
    currentResult,
    currentScanImage,
    history,
    onAnalyze,
    onClear,
    selectedLocation
}) => {
    return (
        <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col relative">
            {/* Background Flair */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/10 to-transparent -z-10 pointer-events-none rounded-t-[3rem]"></div>

            {/* Station Header */}
            <div className="flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 animate-pulse"></div>
                        <div className="relative bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30">
                            <Activity className="text-blue-400" size={20} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] leading-none">Scanning Station</h4>
                            <div className="h-px w-8 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                        </div>
                        <p className="text-xl font-bold text-white mt-1 tracking-tight">{selectedLocation}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">System Status</div>
                        <div className="text-emerald-400 text-xs font-bold">OPTIMAL</div>
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-2"></div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[ping_2s_linear_infinite]" />
                        <span className="relative">Live Transmission</span>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
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
                    value={pendingReviewCount}
                    icon={Activity}
                    trend="Requires attention"
                    color="amber"
                />
            </div>

            {/* Split View: Scanner & History */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 pb-6">
                {/* Left: Scanner (Takes up 1 column on large screens) */}
                <div className="lg:col-span-1 h-full flex flex-col">
                    <div className="flex-1 bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl p-1">
                        <ScannerView
                            onAnalyze={(file) => onAnalyze(file, selectedLocation)}
                            isAnalyzing={isAnalyzing}
                            lastResult={currentResult}
                            lastScannedImage={currentScanImage}
                            onClear={onClear}
                        />
                    </div>
                </div>

                {/* Right: History Table (Takes up 2 columns) */}
                <div className="lg:col-span-2 h-full min-h-[400px] flex flex-col">
                    <div className="flex-1 bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
                        <HistoryTable records={history} />
                    </div>
                </div>
            </div>
        </div>
    );
};
