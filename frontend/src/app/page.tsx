'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { useReportStore } from '@/store/useReportStore';
import { useLeadStore } from '@/store/useLeadStore';
import { useAuthStore } from '@/store/auth.store';
import React from 'react';

// Modular Views
import { AdminDashboard } from '@/components/dashboard/views/AdminDashboard';
import { TelecallerDashboard } from '@/components/dashboard/views/TelecallerDashboard';
import { assignedToDashboard } from '@/components/dashboard/views/assignedToDashboard';
import { FinanceDashboard } from '@/components/dashboard/views/FinanceDashboard';

export default function Dashboard() {
  const { fetchStats } = useLeadStore();
  const { 
    funnelData, 
    financeData, 
    leadStats, 
    programData,
    assignedToData,
    fetchFunnel, 
    fetchFinance, 
    fetchLeadStats,
    fetchPrograms,
    fetchassignedTos,
    fetchActivities,
    loading 
  } = useReportStore();

  const { user } = useAuthStore();

  React.useEffect(() => {
    if (!user) return;

    // Data fetching strategy based on role
    const role = user.role;

    if (['ADMIN', 'MARKETING_TEAM'].includes(role)) {
      fetchFunnel();
      fetchLeadStats();
      fetchActivities();
      fetchPrograms();
      fetchassignedTos();
      fetchFinance();
    } else if (role === 'TELECALLER') {
      fetchFunnel();
      fetchLeadStats();
    } else if (role === 'assignedTo') {
      fetchFunnel();
      fetchLeadStats();
      fetchPrograms();
    } else if (role === 'FINANCE') {
      fetchFinance();
    }

    // Basic lead stats for everyone except maybe finance
    if (role !== 'FINANCE') {
      fetchStats();
    }

  }, [user, fetchStats, fetchFunnel, fetchFinance, fetchLeadStats, fetchPrograms, fetchassignedTos, fetchActivities]);

  if (!user || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Initialising Dashboards...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Common derived metrics
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
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          Welcome back, {user.name.split(' ')[0]}!
        </h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {user.role.replace('_', ' ')} Command Center • {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}
        </p>
      </div>

      {user.role === 'ADMIN' || user.role === 'MARKETING_TEAM' ? (
        <AdminDashboard 
          metrics={metrics}
          leadStats={leadStats}
          funnelData={funnelData}
          revenueTrend={revenueTrend}
          acquisitionData={acquisitionData}
          programData={programData}
          assignedToData={assignedToData}
        />
      ) : user.role === 'TELECALLER' ? (
        <TelecallerDashboard 
          metrics={metrics}
          leadStats={leadStats}
          acquisitionData={acquisitionData}
          funnelData={funnelData}
        />
      ) : user.role === 'assignedTo' ? (
        <assignedToDashboard 
          metrics={metrics}
          leadStats={leadStats}
          programData={programData}
          funnelData={funnelData}
        />
      ) : user.role === 'FINANCE' ? (
        <FinanceDashboard 
          metrics={metrics}
          revenueTrend={revenueTrend}
          financeData={financeData}
        />
      ) : (
        <div className="p-20 text-center glass rounded-3xl border-white/5">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No dashboard assigned to this role</p>
        </div>
      )}
    </MainLayout>
  );
}
