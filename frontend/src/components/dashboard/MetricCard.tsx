'use client';

import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  icon: any;
  color: 'blue' | 'indigo' | 'emerald' | 'purple' | 'amber' | 'primary';
}

export const MetricCard = ({ label, value, trend, icon: Icon, color }: MetricCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100/70',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100/70',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100/70',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-100/70',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100/70',
    primary: 'bg-slate-50 text-slate-800 border-slate-200 group-hover:bg-slate-100',
  };

  return (
    <div className="p-5 rounded-[16px] bg-white border border-black/10 shadow-sm relative overflow-hidden group hover:border-black/20 transition-all duration-300">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[9px] font-bold tracking-[0.15em] text-slate-500 uppercase mb-1">{label}</p>
          <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-[8px] border ${colorClasses[color]} transition-all duration-300 group-hover:scale-105`}>
          <Icon size={18} className="transition-transform duration-500" />
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 flex items-center gap-2 relative z-10">
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-[6px]">
            {trend}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
};
