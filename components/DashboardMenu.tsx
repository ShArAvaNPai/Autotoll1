
import React, { useState } from 'react';
import { Activity, User, Clock, Settings, FileCheck, ScanLine, Car, ChevronRight, Menu, Wallet, TrendingUp } from 'lucide-react';

interface DashboardMenuProps {
    onNavigate: (view: any) => void;
    stats: {
        totalVehicles: number;
        pendingReview: number;
    };
}

export const DashboardMenu: React.FC<DashboardMenuProps> = ({ onNavigate, stats }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const menuItems = [

        { id: 'monitor', title: 'Live Monitor', icon: ScanLine, color: 'text-blue-400', glow: 'shadow-blue-500/50' },
        { id: 'analytics', title: 'Analytics', icon: Activity, color: 'text-purple-400', glow: 'shadow-purple-500/50' },
        { id: 'registry', title: 'Registry', icon: User, color: 'text-emerald-400', glow: 'shadow-emerald-500/50' },
        { id: 'funds', title: 'Funds', icon: Wallet, color: 'text-green-400', glow: 'shadow-green-500/50' },
        { id: 'history', title: 'History', icon: Clock, color: 'text-indigo-400', glow: 'shadow-indigo-500/50' },
        { id: 'review', title: 'Review', icon: FileCheck, color: 'text-amber-400', glow: 'shadow-amber-500/50' },
        { id: 'realtime', title: 'Realtime', icon: Car, color: 'text-cyan-400', glow: 'shadow-cyan-500/50' },
        { id: 'settings', title: 'Config', icon: Settings, color: 'text-slate-400', glow: 'shadow-slate-500/50' }
    ];

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 pointer-events-none">

            {/* Glass Dock */}
            <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/5 transition-all duration-300 hover:bg-zinc-900/60 hover:scale-[1.02]">
                {menuItems.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/10"
                    >
                        {/* Icon */}
                        <div className={`relative z-10 transition-transform duration-300 ${hoveredIndex === index ? 'scale-125' : 'scale-100'}`}>
                            <item.icon size={22} className={`${item.color} drop-shadow-lg`} />
                        </div>

                        {/* Hover Glow */}
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                        {/* Active Indicator Glow/Reflection */}
                        {hoveredIndex === index && (
                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full ${item.color.replace('text', 'bg')} blur-md opacity-60`}></div>
                        )}

                        {/* Tooltip */}
                        <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-lg text-[10px] font-bold text-zinc-300 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap shadow-xl z-50`}>
                            {item.title}
                            {/* Arrow */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-r border-b border-white/10 rotate-45"></div>
                        </div>

                        {/* Notification Dot */}
                        {item.id === 'review' && stats.pendingReview > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] box-content border-2 border-zinc-900"></span>
                        )}
                    </button>
                ))}
            </div>

            <p className="text-[10px] font-medium text-zinc-500/50 uppercase tracking-[0.3em]">Command Center</p>
        </div>
    );
};
