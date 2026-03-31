'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface StageData {
  stage: string;
  count: number;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#10b981'];

export const StageDistribution = ({ data = [] }: { data: any[] }) => {
  const chartData = data.map(d => ({
    name: d.stage.replace(/_/g, ' '),
    value: d._count.id
  }));

  return (
    <div className="glass rounded-3xl border-white/5 p-6 h-full flex flex-col">
       <h3 className="font-bold text-slate-200 text-sm mb-4">Lead Distribution</h3>
       <div className="flex-1 w-full min-h-[250px]">
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie
               data={chartData}
               cx="50%"
               cy="50%"
               innerRadius={60}
               outerRadius={80}
               paddingAngle={5}
               dataKey="value"
             >
               {chartData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
               ))}
             </Pie>
             <Tooltip 
               contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
               itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
             />
             <Legend 
               verticalAlign="bottom" 
               height={36}
               formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{value}</span>}
             />
           </PieChart>
         </ResponsiveContainer>
       </div>
    </div>
  );
};
