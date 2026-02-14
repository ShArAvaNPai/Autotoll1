import React, { useState, useEffect } from 'react';
import { IndianRupee, Users, TrendingUp } from 'lucide-react';
import { getBackendUrl } from '../services/apiConfig';

export function ReportsView() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [location, setLocation] = useState('ALL');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [month, year, location]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                month: month.toString(),
                year: year.toString(),
                location: location
            });
            const res = await fetch(`${getBackendUrl()}/api/reports/monthly?${query}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    if (!data) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-8 flex flex-col pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-emerald-500" /> Monthly Reports
                    </h2>
                    <p className="text-zinc-500 mt-1">Revenue and traffic analysis for {months[month - 1]} {year}</p>
                </div>

                <div className="flex flex-wrap gap-3 bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
                    <select
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="bg-zinc-800 text-white text-sm font-bold px-4 py-2 rounded-xl focus:outline-none hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                        <option value="ALL">All Locations</option>
                        <option value="UDUPI">Udupi</option>
                        <option value="MANIPAL">Manipal</option>
                    </select>

                    <select
                        value={month}
                        onChange={e => setMonth(Number(e.target.value))}
                        className="bg-zinc-800 text-white text-sm font-bold px-4 py-2 rounded-xl focus:outline-none hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                        {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>

                    <select
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="bg-zinc-800 text-white text-sm font-bold px-4 py-2 rounded-xl focus:outline-none hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
                </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-8 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <IndianRupee size={100} />
                    </div>
                    <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs mb-2">Total Revenue Generated</p>
                    <h3 className="text-5xl font-black text-white tracking-tighter">₹{data.total_revenue.toLocaleString()}</h3>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-8 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={100} />
                    </div>
                    <p className="text-blue-500 font-bold uppercase tracking-widest text-xs mb-2">Total Visitors Processed</p>
                    <h3 className="text-5xl font-black text-white tracking-tighter">{data.total_visitors.toLocaleString()}</h3>
                </div>
            </div>

            {/* Daily Breakdown Chart (Custom CSS) */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-8">Daily Revenue Trend</h3>

                <div className="h-64 flex items-end gap-2 w-full overflow-x-auto pb-4 custom-scrollbar">
                    {data.daily_breakdown.map((day: any) => {
                        const maxRev = Math.max(...data.daily_breakdown.map((d: any) => d.revenue), 100);
                        const heightPercent = (day.revenue / maxRev) * 100;
                        const dateLabel = new Date(day.date).getDate();

                        return (
                            <div key={day.date} className="flex flex-col items-center gap-2 flex-1 min-w-[30px] group">
                                <div className="w-full relative flex items-end justify-center h-full">
                                    <div
                                        style={{ height: `${heightPercent}%` }}
                                        className="w-full bg-emerald-500/50 rounded-t-lg group-hover:bg-emerald-500 transition-all relative pt-2 min-h-[4px]"
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none transition-opacity border border-white/10 shadow-xl">
                                            ₹{day.revenue}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-bold">{dateLabel}</span>
                            </div>
                        );
                    })}
                    {data.daily_breakdown.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 italic">No data available for this period</div>
                    )}
                </div>
            </div>
        </div>
    );
}
