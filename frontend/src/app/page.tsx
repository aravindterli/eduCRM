'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { DashboardFollowUps } from '@/components/dashboard/DashboardFollowUps';
import { StageDistribution } from '@/components/dashboard/StageDistribution';
import { MonthlyReportCard } from '@/components/dashboard/MonthlyReportCard';
import { Users, UserPlus, CreditCard, TrendingUp, BarChart3, ChevronRight, Activity, Target, PieChart, Landmark } from 'lucide-react';
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

  const totalFees = financeData?.feesByStatus?.reduce((acc: number, curr: any) => acc + (curr._sum.amount || 0), 0) || 0;
  const metrics = {
    totalLeads: funnelData.find(f => f.stage === 'Leads')?.count || 0,
    applications: funnelData.find(f => f.stage === 'Applications')?.count || 0,
    admissions: funnelData.find(f => f.stage === 'Admissions')?.count || 0,
    revenue: revenueTrend.reduce((acc: number, curr: any) => acc + curr.value, 0),
    collectionRate: totalFees > 0 ? Math.round((revenueTrend.reduce((acc: number, curr: any) => acc + curr.value, 0) / totalFees) * 100) : 0
  };


  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <MetricCard label="Total Leads" value={metrics.totalLeads.toString()} icon={Users} color="primary" />
        <MetricCard 
          label="Leads Today" 
          value={(leadStats?.leadsToday || 0).toString()} 
          icon={UserPlus} 
          color="emerald" 
          trend="Real-time"
        />
        <MetricCard label="Applications" value={metrics.applications.toString()} icon={Target} color="primary" />
        <MetricCard label="Admissions" value={metrics.admissions.toString()} icon={TrendingUp} color="emerald" />
        <MetricCard 
          label="Total Revenue" 
          value={`₹${metrics.revenue.toLocaleString()}`} 
          trend={`${metrics.collectionRate}% collection rate VS LAST MONTH`}
          icon={Landmark} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnalyticsChart title="Acquisition Trend" data={acquisitionData} height={250} />
            <AnalyticsChart title="Revenue Trend (₹)" data={revenueTrend} height={250} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass rounded-3xl border-white/5 overflow-hidden flex flex-col h-[350px]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h2 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                      <Activity size={18} className="text-blue-400" />
                      Conversion Funnel
                    </h2>
                </div>
                <div className="p-8 flex-1 flex items-end">
                    <div className="flex items-end justify-between gap-4 w-full h-48">
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
             <div className="glass rounded-3xl border-white/5 overflow-hidden flex flex-col h-[350px]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h2 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                      <PieChart size={18} className="text-indigo-400" />
                      Source Distribution
                    </h2>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass rounded-3xl border-white/5 overflow-hidden min-h-[220px]">
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
          <DashboardFollowUps />
          <MonthlyReportCard />

          <div className="glass rounded-3xl border-white/5 overflow-hidden">
             <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
               <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                 <Activity size={16} className="text-emerald-400" />
                 Upcoming Webinars
               </h3>
             </div>
             <div className="p-5 space-y-4">
                {funnelData.find(f => f.stage === 'Upcoming Webinars')?.details?.length > 0 ? (
                  funnelData.find(f => f.stage === 'Upcoming Webinars').details.map((w: any) => (
                    <div key={w.id} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 -mx-2 p-2 rounded-xl transition-all">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex flex-col items-center justify-center">
                             <span className="text-[8px] font-black leading-none">{new Date(w.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                             <span className="text-xs font-bold">{new Date(w.date).getDate()}</span>
                          </div>
                          <div>
                             <p className="text-xs font-semibold text-slate-300 truncate max-w-[120px]">{w.title}</p>
                             <p className="text-[10px] text-slate-500 font-bold">{new Date(w.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black text-emerald-400">{w._count.registrations}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Regs</p>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">No upcoming webinars</div>
                )}
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
