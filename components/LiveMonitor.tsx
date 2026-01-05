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
    onAnalyze: (file: File) => Promise<void>;
    onClear: () => void;
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
    onClear
}) => {
    return (
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
                    value={pendingReviewCount}
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
                        onAnalyze={onAnalyze}
                        isAnalyzing={isAnalyzing}
                        lastResult={currentResult}
                        lastScannedImage={currentScanImage}
                        onClear={onClear}
                    />
                </div>

                {/* Right: History Table (Takes up 2 columns) */}
                <div className="lg:col-span-2 h-full min-h-[400px]">
                    <HistoryTable records={history} />
                </div>
            </div>
        </div>
    );
};
