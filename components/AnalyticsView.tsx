import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, IndianRupee, Car, Clock, TrendingUp, Filter, RefreshCw } from 'lucide-react';

const API_BASE = "http://localhost:8000";

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#71717a'];

interface AnalyticsData {
    revenueTrend: { date: string; revenue: number; volume: number }[];
    hourlyTraffic: { hour: string; count: number }[];
    vehicleDistribution: { type: string; value: number }[];
    summary: {
        totalRevenue: number;
        totalVehicles: number;
        avgRevenue: number;
    };
}

export const AnalyticsView: React.FC = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/analytics`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error("Failed to fetch analytics", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const CustomTooltip = ({ active, payload, label, prefix = "" }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg shadow-xl">
                    <p className="text-zinc-400 text-xs mb-1">{label}</p>
                    <p className="text-zinc-100 font-bold">
                        {prefix}{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading && !data) {
        return (
            <div className="flex h-full items-center justify-center">
                <RefreshCw className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="p-6 space-y-6 overflow-auto h-full pb-12">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                    <Activity className="text-blue-500" />
                    System Analytics
                </h2>
                <button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm transition-colors"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-900 p-5 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-zinc-500 text-sm font-medium">Total Revenue</span>
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <IndianRupee size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">₹{data.summary.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                        <TrendingUp size={12} />
                        Live tracking active
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-900 p-5 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-zinc-500 text-sm font-medium">Total Vehicles</span>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Car size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">{data.summary.totalVehicles.toLocaleString()}</div>
                    <div className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                        <Activity size={12} />
                        Cumulative count
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-900 p-5 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-zinc-500 text-sm font-medium">Avg. Toll per Vehicle</span>
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">₹{data.summary.avgRevenue.toFixed(2)}</div>
                    <div className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                        <Filter size={12} />
                        Weighted average
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Area Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                            <IndianRupee size={18} className="text-emerald-400" />
                            Revenue Trend (Last 7 Days)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenueTrend}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#52525b"
                                    fontSize={12}
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        return date.toLocaleDateString(undefined, { weekday: 'short' });
                                    }}
                                />
                                <YAxis stroke="#52525b" fontSize={12} />
                                <Tooltip content={<CustomTooltip prefix="₹" />} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Hourly Traffic Bar Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                            <Clock size={18} className="text-blue-400" />
                            Hourly Traffic Flow (Today)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.hourlyTraffic}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                <XAxis
                                    dataKey="hour"
                                    stroke="#52525b"
                                    fontSize={10}
                                    interval={2}
                                />
                                <YAxis stroke="#52525b" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="count"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vehicle Distribution Pie Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-semibold text-zinc-100 mb-6 flex items-center gap-2">
                        <Car size={18} className="text-purple-400" />
                        Vehicle Type Distribution
                    </h3>
                    <div className="h-[300px] w-full flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.vehicleDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="type"
                                >
                                    {data.vehicleDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Data Insights Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                    <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-400" />
                        Quick Insights
                    </h3>
                    <div className="flex-1 space-y-4">
                        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                            <p className="text-zinc-400 text-sm mb-1">Peak Hour Traffic</p>
                            <p className="text-xl font-bold text-white">
                                {data.hourlyTraffic.reduce((prev, current) => (prev.count > current.count) ? prev : current).count > 0
                                    ? `${data.hourlyTraffic.reduce((prev, current) => (prev.count > current.count) ? prev : current).hour}`
                                    : "No data today"}
                            </p>
                        </div>
                        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                            <p className="text-zinc-400 text-sm mb-1">Top Vehicle Category</p>
                            <p className="text-xl font-bold text-white">
                                {data.vehicleDistribution.length > 0
                                    ? data.vehicleDistribution.reduce((prev, current) => (prev.value > current.value) ? prev : current).type
                                    : "No data"}
                            </p>
                        </div>
                        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                            <p className="text-emerald-500 text-sm font-medium">System Health</p>
                            <p className="text-zinc-300 text-sm mt-1">All toll collection points are operational. Real-time sync is enabled.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
