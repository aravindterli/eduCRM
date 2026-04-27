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
    blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    primary: 'bg-primary/10 text-primary ring-primary/20',
  };

  return (
    <div className="p-6 rounded-3xl glass border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
          <h3 className="text-3xl font-black text-foreground">{value}</h3>
        </div>
        <div className={`p-3 rounded-2xl ${colorClasses[color]} ring-1 group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2 relative z-10">
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
            {trend}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">vs last month</span>
        </div>
      )}

      {/* Decorative background element */}
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none ${
        color === 'blue' ? 'bg-blue-500' :
        color === 'indigo' ? 'bg-indigo-500' :
        color === 'emerald' ? 'bg-emerald-500' :
        color === 'purple' ? 'bg-purple-500' : 
        color === 'primary' ? 'bg-primary' : 'bg-amber-500'
      }`} />
    </div>
  );
};
