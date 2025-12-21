import React, { useMemo } from 'react';
import { TollRecord } from '../types';
import { PieChart, Activity, IndianRupee } from 'lucide-react';

interface AnalyticsViewProps {
    history: TollRecord[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ history }) => {
    const stats = useMemo<{ typeCount: Record<string, number>; revenueByType: Record<string, number>; totalRevenue: number }>(() => {
        const typeCount: Record<string, number> = {};
        const revenueByType: Record<string, number> = {};
        let totalRevenue = 0;

        history.forEach(record => {
            typeCount[record.vehicleType] = (typeCount[record.vehicleType] || 0) + 1;
            revenueByType[record.vehicleType] = (revenueByType[record.vehicleType] || 0) + record.tollAmount;
            totalRevenue += record.tollAmount;
        });

        return { typeCount, revenueByType, totalRevenue };
    }, [history]);

    return (
        <div className="p-6 space-y-6 overflow-auto h-full">
            <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                <Activity className="text-blue-500" />
                Analytics Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle Distrubution Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
                            <PieChart size={18} className="text-purple-400" />
                            Vehicle Distribution
                        </h3>
                        <span className="text-xs text-zinc-500">Total: {history.length}</span>
                    </div>

                    <div className="space-y-4">
                        {Object.entries(stats.typeCount).map(([type, count]) => (
                            <div key={type} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">{type}</span>
                                    <span className="text-zinc-200">{count} ({(((count as number) / history.length) * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${((count as number) / history.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && (
                            <div className="text-center text-zinc-600 py-8">No data available</div>
                        )}
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
                            <IndianRupee size={18} className="text-emerald-400" />
                            Revenue by Type
                        </h3>
                        <span className="text-xs text-emerald-400 font-mono">₹{stats.totalRevenue.toFixed(2)}</span>
                    </div>

                    <div className="space-y-4">
                        {Object.entries(stats.revenueByType).map(([type, amount]) => (
                            <div key={type} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-8 rounded-full ${type === 'Car' ? 'bg-blue-500' :
                                        type === 'Truck' ? 'bg-orange-500' : 'bg-zinc-500'
                                        }`} />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-200">{type}</p>
                                        <p className="text-xs text-zinc-500">{stats.typeCount[type]} vehicles</p>
                                    </div>
                                </div>
                                <span className="font-mono text-emerald-400 font-medium">
                                    ₹{(amount as number).toFixed(2)}
                                </span>
                            </div>
                        ))}
                        {history.length === 0 && (
                            <div className="text-center text-zinc-600 py-8">No revenue recorded</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
