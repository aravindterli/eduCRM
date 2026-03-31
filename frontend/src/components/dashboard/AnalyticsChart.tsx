'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartData {
  label: string;
  value: number;
}

export const AnalyticsChart = ({ 
  title, 
  data = [], 
  height = 250 
}: { 
  title: string; 
  data?: ChartData[]; 
  height?: number 
}) => {
  const isRevenue = title.includes('Revenue');
  
  return (
    <div className="glass rounded-3xl border-white/5 p-6 space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-200 text-sm">{title}</h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Live Data</span>
      </div>
      
      <div className="flex-1 w-full" style={{ minHeight: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(val) => isRevenue ? `₹${val>=1000 ? (val/1000)+'k' : val}` : val}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              itemStyle={{ color: '#f8fafc', fontSize: '10px', fontWeight: 'bold' }}
              labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
              formatter={(value: any) => [isRevenue ? `₹${value.toLocaleString()}` : value, title]}
            />
            <Bar 
              dataKey="value" 
              radius={[6, 6, 0, 0]} 
              barSize={32}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={isRevenue ? 'url(#revenueGradient)' : 'url(#acquisitionGradient)'} 
                />
              ))}
            </Bar>
            <defs>
              <linearGradient id="acquisitionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
