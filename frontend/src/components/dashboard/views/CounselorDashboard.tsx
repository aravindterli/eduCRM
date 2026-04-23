'use client';

import React from 'react';
import { MetricCard } from '../MetricCard';
import { AnalyticsChart } from '../AnalyticsChart';
import { DashboardFollowUps } from '../DashboardFollowUps';
import { Users, GraduationCap, Target, Award, Activity, MousePointer2 } from 'lucide-react';

interface assignedToDashboardProps {
  metrics: any;
  leadStats: any;
  programData: any;
  funnelData: any;
}

export const assignedToDashboard: React.FC<assignedToDashboardProps> = ({
  metrics,
  leadStats,
  programData,
  funnelData
}) => {
  // Application pipeline focus
  const appFunnel = funnelData.filter((f: any) => ['Counseling', 'Applications', 'Admissions'].includes(f.stage));

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Assigned Students" value={metrics.totalLeads.toString()} icon={Users} color="primary" />
        <MetricCard 
          label="Sessions Today" 
          value={(leadStats?.counselingToday || 0).toString()} 
          icon={GraduationCap} 
          color="indigo" 
          trend="In Progress"
        />
        <MetricCard label="Apps Started" value={metrics.applications.toString()} icon={Target} color="primary" />
        <MetricCard label="Final Enrollments" value={metrics.admissions.toString()} icon={Award} color="emerald" trend="Milestone" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass rounded-3xl border-white/5 overflow-hidden flex flex-col h-[350px]">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h2 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                  <Activity size={18} className="text-purple-400" />
                  Application Pipeline
                </h2>
             </div>
             <div className="p-10 flex-1 flex flex-col justify-center">
                <div className="relative h-2 w-full bg-white/5 rounded-full mb-12">
                   {appFunnel.map((f: any, i: number) => {
                     const total = appFunnel[0].count || 1;
                     const width = (f.count / total) * 100;
                     return (
                       <div 
                         key={f.stage}
                         style={{ width: `${width}%`, zIndex: appFunnel.length - i }}
                         className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                            i === 0 ? 'bg-blue-600/20' : i === 1 ? 'bg-indigo-600/40' : 'bg-emerald-600'
                         }`}
                       />
                     );
                   })}
                   <div className="absolute inset-0 flex justify-between items-center px-4">
                      {appFunnel.map((f: any) => (
                        <div key={f.stage} className="flex flex-col items-center">
                           <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center mb-2 z-20">
                              <span className="text-xs font-black text-white">{f.count}</span>
                           </div>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{f.stage}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="glass rounded-3xl border-white/5 overflow-hidden">
             <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <MousePointer2 size={16} className="text-indigo-400" />
                  Preferred Programs
                </h3>
             </div>
             <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {programData?.length > 0 ? programData.slice(0, 4).map((p: any, i: number) => (
                  <div key={i} className="glass p-4 rounded-2xl border-white/5 flex justify-between items-center">
                     <div>
                        <p className="text-xs font-bold text-slate-200 mb-1">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Ptr</p>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-black text-blue-400">{p._count.applications}</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Apps</p>
                     </div>
                  </div>
                )) : (
                  <div className="col-span-2 py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No program data</div>
                )}
             </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <DashboardFollowUps title="Student Appointments" />
          <div className="glass rounded-3xl border-white/5 p-6 bg-emerald-500/5">
             <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
               <TrendingUp size={16} />
               Conversion Stats
             </h3>
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Counseling -> App</span>
                   <span className="text-sm font-black text-slate-200">68%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full w-[68%] bg-emerald-500/50 rounded-full"></div>
                </div>
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">App -> Admission</span>
                   <span className="text-sm font-black text-slate-200">42%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full w-[42%] bg-blue-500/50 rounded-full"></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendingUp = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);
