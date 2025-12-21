import React, { useState, useEffect } from 'react';
import { Clock, Car, AlertTriangle, User, RefreshCw } from 'lucide-react';

const API_BASE = "http://localhost:8000";

interface Detection {
    id: number;
    vehicle_type: string;
    license_plate: string;
    confidence: string;
    timestamp: string;
    is_authorized: number;
}

interface HistoryProps {
    onRegister?: (plate: string) => void;
}

export function History({ onRegister }: HistoryProps) {
    const [logs, setLogs] = useState<Detection[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
        // Poll every 5 seconds for new entries
        const interval = setInterval(fetchHistory, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/history`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (e) {
            console.error("Failed to fetch history", e);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Detection Logs
                </h2>
                <button
                    onClick={fetchHistory}
                    className="p-2 text-zinc-400 hover:text-white bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
                    title="Refresh Logs"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-900 text-zinc-500 text-sm border-b border-zinc-800">
                            <th className="p-4 font-medium">Time</th>
                            <th className="p-4 font-medium">Vehicle</th>
                            <th className="p-4 font-medium">License Plate</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Confidence</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-sm">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-zinc-500 italic">
                                    No detections recorded yet.
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => {
                                const isAuth = log.is_authorized === 1;
                                return (
                                    <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="p-4 text-zinc-400 flex items-center gap-2">
                                            <Clock size={14} />
                                            {formatDate(log.timestamp)}
                                        </td>
                                        <td className="p-4 text-zinc-200 capitalize">
                                            {log.vehicle_type}
                                        </td>
                                        <td className="p-4">
                                            {log.license_plate === 'UNKNOWN' ? (
                                                <span className="text-zinc-500 text-xs">—</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded text-yellow-500 font-mono font-bold tracking-wider text-xs">
                                                        {log.license_plate}
                                                    </span>
                                                    {onRegister && !isAuth && (
                                                        <button
                                                            onClick={() => onRegister(log.license_plate)}
                                                            className="text-xs bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-0.5 rounded transition-all flex items-center gap-1 border border-blue-600/20"
                                                        >
                                                            <User size={10} />
                                                            Register
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {isAuth ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                                                    <User size={12} />
                                                    Identified
                                                </span>
                                            ) : log.license_plate === 'UNKNOWN' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-xs font-medium">
                                                    No Plate
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
                                                    <AlertTriangle size={12} />
                                                    Visitor
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-zinc-400">
                                            {(parseFloat(log.confidence) * 100).toFixed(0)}%
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
