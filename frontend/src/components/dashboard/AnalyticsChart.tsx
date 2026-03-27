'use client';

import React from 'react';

interface ChartData {
  label: string;
  value: number;
}

export const AnalyticsChart = ({ 
  title, 
  data = [], 
  height = 300 
}: { 
  title: string; 
  data?: ChartData[]; 
  height?: number 
}) => {
  const maxVal = Math.max(...data.map(d => d.value), 10);

  return (
    <div className="glass rounded-3xl border-white/5 p-6 space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground/80">{title}</h3>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Live Data</span>
      </div>
      
      <div 
        style={{ height }} 
        className="relative flex-1 w-full bg-white/[0.01] rounded-2xl border border-border overflow-hidden flex items-end px-4 pb-2 gap-2"
      >
        {data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground italic">
            No data available for this period
          </div>
        ) : (
          data.map((d, i) => {
            const percentage = (d.value / maxVal) * 100;
            return (
              <div key={i} className="flex-1 group relative flex flex-col items-center h-full justify-end">
                <div 
                  style={{ height: `${percentage}%` }}
                  className="w-full bg-gradient-to-t from-primary/20 to-primary/80 rounded-t-lg transition-all duration-700 group-hover:from-primary group-hover:to-primary/60 group-hover:scale-x-110"
                />
                {/* Tooltip */}
                <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none -translate-y-8">
                   <span className="text-[10px] font-black bg-background border border-border px-2 py-1 rounded-lg shadow-xl text-primary whitespace-nowrap">
                    {d.value} {title.includes('Revenue') ? '$' : ''}
                   </span>
                </div>
              </div>
            );
          })
        )}

        {/* Grid Lines */}
        <div className="absolute inset-x-0 top-1/4 border-t border-foreground/[0.02] pointer-events-none" />
        <div className="absolute inset-x-0 top-2/4 border-t border-foreground/[0.02] pointer-events-none" />
        <div className="absolute inset-x-0 top-3/4 border-t border-foreground/[0.02] pointer-events-none" />
      </div>

      <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-2 uppercase tracking-tighter">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center truncate px-0.5">{d.label}</span>
        ))}
      </div>
    </div>
  );
};
