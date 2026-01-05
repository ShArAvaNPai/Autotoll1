import React, { useState } from 'react';
import { Activity, User, Clock, Settings, FileCheck, ScanLine, Car } from 'lucide-react';

interface DashboardMenuProps {
    onNavigate: (view: any) => void;
    stats: {
        totalVehicles: number;
        pendingReview: number;
    };
}

export const DashboardMenu: React.FC<DashboardMenuProps> = ({ onNavigate, stats }) => {
    const [isHovered, setIsHovered] = useState(false);

    const menuItems = [
        {
            id: 'monitor',
            title: 'Live',
            icon: ScanLine,
            color: 'blue',
            action: () => onNavigate('monitor'),
            angle: 360 // Right
        },
        {
            id: 'analytics',
            title: 'Analytics',
            icon: Activity,
            color: 'purple',
            action: () => onNavigate('analytics'),
            angle: 342
        },
        {
            id: 'registry',
            title: 'Registry',
            icon: User,
            color: 'emerald',
            action: () => onNavigate('registry'),
            angle: 324
        },
        {
            id: 'history',
            title: 'History',
            icon: Clock,
            color: 'indigo',
            action: () => onNavigate('history'),
            angle: 306
        },
        {
            id: 'review',
            title: 'Review',
            icon: FileCheck,
            color: 'amber',
            action: () => onNavigate('review'),
            angle: 288
        },
        {
            id: 'settings',
            title: 'Config',
            icon: Settings,
            color: 'zinc',
            action: () => onNavigate('settings'),
            angle: 270 // Up
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'hover:bg-blue-500 hover:text-white text-blue-400 border-blue-500/50',
            purple: 'hover:bg-purple-500 hover:text-white text-purple-400 border-purple-500/50',
            amber: 'hover:bg-amber-500 hover:text-white text-amber-400 border-amber-500/50',
            emerald: 'hover:bg-emerald-500 hover:text-white text-emerald-400 border-emerald-500/50',
            indigo: 'hover:bg-indigo-500 hover:text-white text-indigo-400 border-indigo-500/50',
            cyan: 'hover:bg-cyan-500 hover:text-white text-cyan-400 border-cyan-500/50',
            zinc: 'hover:bg-zinc-600 hover:text-white text-zinc-400 border-zinc-500/50',
        };
        return colors[color] || colors.zinc;
    };

    const radius = 180; // Slightly larger radius for the fan

    return (
        <div className="fixed -bottom-36 -left-36 z-50 pointer-events-none w-[400px] h-[400px] flex items-center justify-center">

            {/* Ambient Background Glow (Left Sided) - Reduced intensity for overlay */}
            <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-blue-900/5 rounded-full blur-3xl transition-all duration-1000 ${isHovered ? 'scale-110 opacity-20' : 'scale-100 opacity-0'}`}></div>

            {/* Main Container */}
            <div
                className="relative flex items-center justify-center w-[400px] h-[400px] pointer-events-auto"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >

                {/* Core Button (Center) */}
                <div className={`z-20 w-24 h-24 rounded-full bg-zinc-950/90 backdrop-blur-md border-2 border-zinc-800 flex items-center justify-center cursor-pointer transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${isHovered ? 'scale-90 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.2)]' : 'scale-100'}`}>
                    <div className={`relative w-16 h-16 rounded-full bg-black/50 flex items-center justify-center border border-zinc-700 transition-all duration-500 ${isHovered ? 'rotate-180 border-blue-400/30' : 'rotate-0'}`}>
                        <Car className={`transition-colors duration-300 ${isHovered ? 'text-blue-400' : 'text-zinc-500'}`} size={28} />
                        <div className={`absolute inset-0 rounded-full border border-dashed border-zinc-600 transition-all duration-1000 ${isHovered ? 'rotate-[-360deg] scale-110 border-blue-500/30' : 'rotate-0 scale-100'}`}></div>
                    </div>

                    <span className={`absolute -bottom-10 text-zinc-500 text-[10px] font-mono tracking-widest transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>SYS.IDLE</span>
                </div>

                {/* Orbiting Items */}
                {menuItems.map((item, index) => {
                    // Calculate position
                    const rad = (item.angle * Math.PI) / 180;
                    const x = Math.cos(rad) * radius;
                    const y = Math.sin(rad) * radius;

                    return (
                        <button
                            key={item.id}
                            onClick={item.action}
                            className={`absolute w-16 h-16 rounded-full bg-zinc-900/90 backdrop-blur-md border-2 flex flex-col items-center justify-center transition-all duration-500 shadow-lg z-10 
                                ${getColorClasses(item.color)}
                                ${isHovered ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none translate-x-0 translate-y-0'}
                            `}
                            style={{
                                transform: isHovered ? `translate(${x}px, ${y}px)` : 'translate(0px, 0px)',
                            }}
                        >
                            <item.icon size={20} className="mb-0.5" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">{item.title}</span>
                        </button>
                    );
                })}

                {/* Connecting Lines */}
                <svg className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} width="400" height="400">
                    <path d={`M 200 200 L ${200 + Math.cos(360 * Math.PI / 180) * radius} ${200 + Math.sin(360 * Math.PI / 180) * radius}`} stroke="rgba(255,255,255,0.1)" />
                </svg>

            </div>

        </div>
    );
};
