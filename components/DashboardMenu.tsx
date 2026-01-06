import React, { useState } from 'react';
import { Activity, User, Clock, Settings, FileCheck, ScanLine, Car, ChevronRight, Menu } from 'lucide-react';

interface DashboardMenuProps {
    onNavigate: (view: any) => void;
    stats: {
        totalVehicles: number;
        pendingReview: number;
    };
}

export const DashboardMenu: React.FC<DashboardMenuProps> = ({ onNavigate, stats }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const menuItems = [
        { id: 'monitor', title: 'Live Monitor', icon: ScanLine, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'analytics', title: 'Analytics', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'registry', title: 'Registry', icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'history', title: 'History', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'review', title: 'Review', icon: FileCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'realtime', title: 'Realtime', icon: Car, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { id: 'settings', title: 'Config', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50' }
    ];

    return (
        <div
            className="fixed bottom-6 left-6 z-50 flex items-end gap-4 pointer-events-none"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Main Toggle Button */}
            <div className={`
                relative z-20 w-16 h-16 rounded-2xl bg-white shadow-2xl shadow-blue-900/10 border border-slate-100 flex items-center justify-center cursor-pointer pointer-events-auto transition-all duration-500
                ${isExpanded ? 'rotate-90 scale-110 bg-blue-50 border-blue-200' : 'rotate-0 scale-100'}
            `}>
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                {isExpanded ? (
                    <Menu className="text-blue-600 w-8 h-8" />
                ) : (
                    <Car className="text-slate-700 w-8 h-8" />
                )}
            </div>

            {/* Expanded Dock */}
            <div className={`
                absolute bottom-0 left-20 h-16 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-200/50 rounded-2xl flex items-center px-2 gap-2 origin-left transition-all duration-500 ease-out pointer-events-auto
                ${isExpanded ? 'w-[400px] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10 overflow-hidden'}
            `}>
                {menuItems.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`
                            group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 hover:scale-110
                            ${item.bg}
                        `}
                        title={item.title}
                        style={{ transitionDelay: `${index * 50}ms` }}
                    >
                        <item.icon size={20} className={`${item.color} transition-transform duration-300 group-hover:-translate-y-0.5`} />
                        <span className={`absolute -bottom-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50`}>
                            {item.title}
                        </span>

                        {/* Notification Dot for Review */}
                        {item.id === 'review' && stats.pendingReview > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm animate-pulse">
                                {stats.pendingReview}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
