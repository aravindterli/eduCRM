'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { Users, UserPlus, CreditCard, TrendingUp, BarChart3, ChevronRight, Activity, Target, ShieldCheck, PieChart } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useReportStore } from '@/store/useReportStore';
import { useAuthStore } from '@/store/auth.store';
import React from 'react';

export default function Dashboard() {
  const { fetchStats } = useLeadStore();
  const { 
    funnelData, 
    financeData, 
    leadStats, 
    programData,
    counselorData,
    activityLogs,
    fetchFunnel, 
    fetchFinance, 
    fetchLeadStats,
    fetchPrograms,
    fetchCounselors,
    fetchActivities,
    loading 
  } = useReportStore();

  const { user } = useAuthStore();

  React.useEffect(() => {
    if (!user) return;

    // Reports module (ADMIN, MARKETING_TEAM, FINANCE)
    if (['ADMIN', 'MARKETING_TEAM', 'FINANCE'].includes(user.role)) {
      fetchFunnel();
      fetchLeadStats();
      fetchActivities();
      fetchPrograms();
      fetchCounselors();
    }

    // Leads module (Everyone except FINANCE)
    if (['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR'].includes(user.role)) {
      fetchStats();
    }

    // Finance module (ADMIN, FINANCE)
    if (['ADMIN', 'FINANCE'].includes(user.role)) {
      fetchFinance();
    }

  }, [user, fetchStats, fetchFunnel, fetchFinance, fetchLeadStats, fetchPrograms, fetchCounselors, fetchActivities]);

  const acquisitionData = (leadStats?.dailyLeads || []).map((d: any) => ({
    label: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
    value: d.count
  })).reverse().slice(-7);

  const revenueTrend = (financeData?.revenueByMonth || []).map((d: any) => ({
    label: new Date(d.month).toLocaleDateString(undefined, { month: 'short' }),
    value: d.revenue
  }));

  const metrics = {
    totalLeads: funnelData.find(f => f.stage === 'Leads')?.count || 0,
    applications: funnelData.find(f => f.stage === 'Applications')?.count || 0,
    admissions: funnelData.find(f => f.stage === 'Admissions')?.count || 0,
    revenue: revenueTrend.reduce((acc: number, curr: any) => acc + curr.value, 0),
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours/24)}d ago`;
  };

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard label="Total Leads" value={metrics.totalLeads.toString()} icon={Users} color="primary" />
        <MetricCard label="Applications" value={metrics.applications.toString()} icon={Target} color="primary" />
        <MetricCard label="Admissions" value={metrics.admissions.toString()} icon={TrendingUp} color="emerald" />
        <MetricCard label="Total Revenue" value={`$${metrics.revenue.toLocaleString()}`} icon={CreditCard} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnalyticsChart title="Acquisition Trend" data={acquisitionData} />
            <AnalyticsChart title="Revenue Trend ($)" data={revenueTrend} />
          </div>
          
          <div className="glass rounded-3xl border-white/5 overflow-hidden">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h2 className="font-bold text-slate-200 flex items-center gap-2">
                  <Activity size={18} className="text-blue-400" />
                  Conversion Funnel
                </h2>
             </div>
             <div className="p-8">
                <div className="flex items-end justify-between gap-4 h-48">
                  {funnelData.map((f, i) => {
                    const maxVal = Math.max(...funnelData.map(fd => fd.count), 1);
                    const height = (f.count / maxVal) * 100;
                    return (
                      <div key={f.stage} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                        <div className="relative w-full flex flex-col items-center h-full justify-end">
                          <div 
                            style={{ height: `${height}%` }}
                            className={`w-full max-w-[80px] rounded-2xl transition-all duration-700 group-hover:scale-110 shadow-2xl ${
                              i === 0 ? 'bg-blue-600/40' :
                              i === 1 ? 'bg-indigo-600/60' :
                              i === 2 ? 'bg-purple-600/80' : 'bg-emerald-600'
                            }`}
                          />
                          <div className="absolute inset-x-0 bottom-4 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-2xl font-black text-white drop-shadow-xl">{f.count}</span>
                            <span className="text-[10px] font-bold text-white/50">{Math.round((f.count/maxVal)*100)}%</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{f.stage}</p>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass rounded-3xl border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-200">Program Performance</h3>
                </div>
                <div className="p-5 space-y-4">
                   {programData?.length > 0 ? programData.slice(0, 5).map((p: any, i: number) => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-500">{i+1}</div>
                           <p className="text-xs font-semibold text-slate-300 truncate max-w-[120px]">{p.name}</p>
                        </div>
                        <div className="flex gap-4 text-[10px] font-black shrink-0">
                           <span className="text-blue-400">{p._count.applications} Apps</span>
                           <span className="text-emerald-400">{p._count.admissions} Adm</span>
                        </div>
                     </div>
                   )) : (
                     <div className="py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No program data</div>
                   )}
                </div>
             </div>

             <div className="glass rounded-3xl border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-200">Counselor Leaderboard</h3>
                </div>
                <div className="p-5 space-y-4">
                   {counselorData?.length > 0 ? counselorData.slice(0, 5).map((c: any, i: number) => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold">{c.name[0]}</div>
                           <div className="truncate max-w-[100px]">
                              <p className="text-xs font-semibold text-slate-300 truncate">{c.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold">{c._count.leads} Leads</p>
                           </div>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black shrink-0">
                           {c._count.counselingSessions} SESS
                        </div>
                     </div>
                   )) : (
                     <div className="py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No counselor data</div>
                   )}
                </div>
             </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="glass rounded-3xl border-white/5 p-6 space-y-4">
             <h3 className="font-semibold text-slate-300 flex items-center gap-2">
               <PieChart size={16} className="text-indigo-400" />
               Source Distribution
             </h3>
             <div className="space-y-4">
                {leadStats?.leadsBySource?.length > 0 ? leadStats.leadsBySource.map((s: any) => (
                  <div key={s.leadSource} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-400">{s.leadSource}</span>
                      <span className="text-slate-200">{Math.round((s._count.id / (metrics.totalLeads || 1)) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${(s._count.id / (metrics.totalLeads || 1)) * 100}%` }}
                        className="h-full bg-blue-500/50 rounded-full"
                      />
                    </div>
                  </div>
                )) : (
                  <div className="py-4 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">No lead sources</div>
                )}
             </div>
          </div>

          <div className="glass rounded-3xl border-white/5 overflow-hidden">
             <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h2 className="font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  Recent Activity
                </h2>
             </div>
             <div className="p-6 space-y-6">
                {(activityLogs || []).length > 0 ? activityLogs.map((act: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 group">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors shrink-0" />
                     <div>
                        <p className="text-xs text-slate-400 leading-snug">{act.action}</p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">{act.userId ? 'User' : 'System'} • {formatTime(act.createdAt)}</p>
                     </div>
                  </div>
                )) : (
                  <div className="py-8 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">No activity found</div>
                )}
             </div>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/20 relative overflow-hidden group border border-white/10">
             <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-black text-white leading-tight">Monthly Performance <br/> Detailed Report</h3>
                <p className="text-blue-100 text-sm font-medium">Export a full analytical breakdown for the board.</p>
                <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-black text-sm hover:px-8 transition-all flex items-center gap-2">
                   Download PDF
                   <ChevronRight size={16} />
                </button>
             </div>
             <div className="absolute -bottom-4 -right-4 text-white/5 group-hover:scale-110 transition-transform duration-700">
                <BarChart3 size={160} />
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
