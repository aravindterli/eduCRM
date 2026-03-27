
'use client';

import { useReportStore } from '@/store/useReportStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { SummaryChart } from '@/components/reports/SummaryChart';
import React from 'react';
import { BarChart3, TrendingUp, Users, Target, PieChart, Info } from 'lucide-react';

export default function ReportsPage() {
  const { 
    funnelData, 
    programData, 
    financeData, 
    leadStats, 
    counselorData,
    fetchFunnel, 
    fetchPrograms, 
    fetchFinance, 
    fetchLeadStats,
    fetchCounselors,
    loading 
  } = useReportStore();

  React.useEffect(() => {
    fetchFunnel();
    fetchPrograms();
    fetchFinance();
    fetchLeadStats();
    fetchCounselors();
  }, [fetchFunnel, fetchPrograms, fetchFinance, fetchLeadStats, fetchCounselors]);

  const funnelColors = ['#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Business Intelligence</h1>
          <p className="text-slate-400 text-sm">Actionable insights across your institution</p>
        </div>
        <div className="flex gap-2">
            <div className="px-4 py-2 glass rounded-xl text-xs font-bold text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Data
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Conversion Funnel */}
        <div className="glass p-8 rounded-3xl border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Enrollment Funnel</h3>
                <p className="text-xs text-slate-500">Lead to Admission Conversion</p>
              </div>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500">
                <Info size={16} />
            </button>
          </div>

          <div className="space-y-6">
            {funnelData.map((item, idx) => (
              <div key={item.stage} className="relative">
                <div className="flex justify-between items-end mb-2 px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.stage}</span>
                  <span className="text-lg font-black text-white">{item.count}</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${(item.count / (funnelData[0]?.count || 1)) * 100}%`,
                      backgroundColor: funnelColors[idx]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Program Distribution */}
        <div className="glass p-8 rounded-3xl border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <PieChart size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Program Popularity</h3>
              <p className="text-xs text-slate-500">Applications per program</p>
            </div>
          </div>
          <SummaryChart 
            data={programData.map(p => ({ name: p.name, value: p._count.applications }))} 
            dataKey="value"
            color="#3b82f6"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trends */}
        <div className="glass p-8 rounded-3xl border-white/5">
           <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Revenue Analytics</h3>
              <p className="text-xs text-slate-500">Monthly recovery and growth</p>
            </div>
          </div>
          <SummaryChart 
            type="area"
            data={financeData?.revenueByMonth?.map((m: any) => ({
                name: new Date(m.month).toLocaleDateString('default', { month: 'short' }),
                revenue: m.revenue
            })) || []} 
            dataKey="revenue"
            color="#10b981"
          />
        </div>

        {/* Counselor Productivity */}
        <div className="glass p-8 rounded-3xl border-white/5">
           <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Counselor Productivity</h3>
              <p className="text-xs text-slate-500">Leads vs Sessions Hosted</p>
            </div>
          </div>
          <div className="space-y-6">
             {counselorData?.length > 0 ? counselorData.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                         {c.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                         <p className="font-bold text-slate-200">{c.name}</p>
                         <div className="flex gap-4 mt-1 text-[10px] uppercase font-black tracking-wider">
                            <span className="text-blue-400">{c._count.leads} Leads Handled</span>
                            <span className="text-emerald-400">{c._count.counselingSessions} Sessions Hosted</span>
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-2xl font-black text-white">
                         {c._count.leads > 0 ? Math.round((c._count.counselingSessions / c._count.leads) * 100) : 0}%
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Conversion</p>
                   </div>
                </div>
             )) : (
                <div className="py-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No counselor activity recorded.</div>
             )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
