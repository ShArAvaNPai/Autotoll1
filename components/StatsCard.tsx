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
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex items-start justify-between shadow-lg hover:border-zinc-700 transition-all group">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-zinc-500">{title}</h3>
        </div>
        <p className="text-2xl font-bold text-zinc-100 tracking-tight mt-2">{value}</p>
        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-zinc-600">
          {trend.includes('+') ? <ArrowUpRight size={12} className="text-emerald-500" /> :
            trend.includes('-') ? <ArrowDownRight size={12} className="text-red-500" /> : <Minus size={12} />}
          <span className={trend.includes('+') ? "text-emerald-400" : trend.includes('-') ? "text-red-400" : "text-zinc-600"}>
            {trend}
          </span>
        </div>
      </div>
      <div className={`p-3 rounded-lg border ${colorMap[color]} group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
    </div>
  );
};
