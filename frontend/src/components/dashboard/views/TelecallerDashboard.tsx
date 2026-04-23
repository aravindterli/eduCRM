'use client';

import React from 'react';
import { MetricCard } from '../MetricCard';
import { AnalyticsChart } from '../AnalyticsChart';
import { DashboardFollowUps } from '../DashboardFollowUps';
import { Users, PhoneCall, Calendar, CheckCircle2, Activity, PieChart } from 'lucide-react';

interface TelecallerDashboardProps {
  metrics: any;
  leadStats: any;
  acquisitionData: any;
  funnelData: any;
}

export const TelecallerDashboard: React.FC<TelecallerDashboardProps> = ({
  metrics,
  leadStats,
  acquisitionData,
  funnelData
}) => {
  // Filter funnel for Telecaller relevance (Leads, Interested)
  const myFunnel = funnelData.filter((f: any) => ['Leads', 'Counseling'].includes(f.stage));

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="My Total Leads" value={metrics.totalLeads.toString()} icon={Users} color="primary" />
        <MetricCard 
          label="Calls Today" 
          value={(leadStats?.interactionToday || 0).toString()} 
          icon={PhoneCall} 
          color="emerald" 
          trend="Targets"
        />
        <MetricCard label="Pending Follow-ups" value={(leadStats?.pendingFollowUps || 0).toString()} icon={Calendar} color="amber" />
        <MetricCard label="Interested Conversion" value={`${Math.round(metrics.applications)}`} icon={CheckCircle2} color="purple" trend="Success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnalyticsChart title="Engagement Trend" data={acquisitionData} height={300} />
            
            <div className="glass rounded-3xl border-white/5 overflow-hidden flex flex-col h-[300px]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h2 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                      <PieChart size={18} className="text-amber-400" />
                      My Lead Stages
                    </h2>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    {leadStats?.leadsByStage?.length > 0 ? leadStats.leadsByStage.map((s: any) => (
                      <div key={s.stage} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-slate-400">{s.stage.replace('_', ' ')}</span>
                          <span className="text-slate-200">{s._count.id}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${(s._count.id / (metrics.totalLeads || 1)) * 100}%` }}
                            className="h-full bg-amber-500/50 rounded-full"
                          />
                        </div>
                      </div>
                    )) : (
                      <div className="py-4 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">No lead data</div>
                    )}
                </div>
            </div>
          </div>

          <div className="glass rounded-3xl border-white/5 overflow-hidden">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h2 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                  <Activity size={18} className="text-blue-400" />
                  Action Funnel
                </h2>
             </div>
             <div className="p-10">
                <div className="flex items-center justify-center gap-12">
                   {myFunnel.map((f: any, i: number) => (
                     <div key={f.stage} className="text-center group">
                        <div className="w-24 h-24 rounded-full border-4 border-white/5 flex flex-col items-center justify-center bg-white/[0.02] group-hover:border-blue-500/50 transition-all duration-500">
                           <span className="text-3xl font-black text-white">{f.count}</span>
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Count</span>
                        </div>
                        <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">{f.stage}</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <DashboardFollowUps />
          <div className="glass rounded-3xl border-white/5 p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
             <h3 className="text-sm font-bold text-slate-200 mb-2">Today's Target</h3>
             <p className="text-xs text-slate-400 mb-4">Complete 40 calls to maintain your bonus streak.</p>
             <div className="h-2 w-full bg-white/5 rounded-full">
                <div className="h-full w-[65%] bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
             </div>
             <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>26 Done</span>
                <span>40 Target</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
