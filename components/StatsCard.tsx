import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

export function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  };

  return (
    <div className="relative overflow-hidden bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex items-start justify-between shadow-lg hover:shadow-2xl hover:border-zinc-700 transition-all duration-300 group">
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10 -translate-y-1/2 translate-x-1/2 transition-opacity ${color === 'blue' ? 'bg-blue-500' :
          color === 'green' ? 'bg-emerald-500' :
            color === 'purple' ? 'bg-purple-500' : 'bg-amber-500'
        } group-hover:opacity-20`} />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{title}</h3>
        </div>
        <p className="text-3xl font-bold text-white tracking-tight mt-3">{value}</p>
        <div className="flex items-center gap-2 mt-3 p-1.5 rounded-lg bg-zinc-800/50 w-fit border border-white/5">
          {trend.includes('+') ? <ArrowUpRight size={14} className="text-emerald-500" /> :
            trend.includes('-') ? <ArrowDownRight size={14} className="text-red-500" /> : <Minus size={14} className="text-zinc-500" />}
          <span className={`text-xs font-bold ${trend.includes('+') ? "text-emerald-400" : trend.includes('-') ? "text-red-400" : "text-zinc-500"}`}>
            {trend}
          </span>
        </div>
      </div>

      <div className={`relative p-4 rounded-xl border z-10 ${colorMap[color]} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
    </div>
  );
};
