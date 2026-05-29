'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { useReportStore } from '@/store/useReportStore';
import { useLeadStore } from '@/store/useLeadStore';
import { useAuthStore } from '@/store/auth.store';
import React from 'react';

// Three role-type dashboards only — aligned with RoleType enum (SUPERADMIN | ADMIN | STANDARDUSER)
import { AdminDashboard } from '@/components/dashboard/views/AdminDashboard';
import { SuperadminDashboard } from '@/components/dashboard/views/SuperadminDashboard';
import { StandardUserDashboard } from '@/components/dashboard/views/StandardUserDashboard';

export default function Dashboard() {
  const { fetchStats } = useLeadStore();
  const {
    funnelData,
    financeData,
    leadStats,
    programData,
    counselorData,
    fetchFunnel,
    fetchFinance,
    fetchLeadStats,
    fetchPrograms,
    fetchCounselors,
    fetchActivities,
    loading,
  } = useReportStore();

  const { user } = useAuthStore();
  const [adminTab, setAdminTab] = React.useState<'overview' | 'agents' | 'deals'>('overview');

  React.useEffect(() => {
    if (!user) return;

    if (user.role === 'SUPERADMIN') return; // superadmin loads its own data

    if (user.role === 'ADMIN') {
      fetchFunnel();
      fetchLeadStats();
      fetchActivities();
      fetchPrograms();
      fetchCounselors();
      fetchFinance();
      fetchStats();
    } else {
      // STANDARDUSER — load lead stats and funnel only
      fetchFunnel();
      fetchLeadStats();
      fetchStats();
    }
  }, [user, fetchStats, fetchFunnel, fetchFinance, fetchLeadStats, fetchPrograms, fetchCounselors, fetchActivities]);

  if (!user || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-black/20 border-t-black animate-spin" />
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">
              Initialising Dashboard...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Derived metrics shared between dashboards
  const acquisitionData = (leadStats?.dailyLeads || [])
    .map((d: any) => ({
      label: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
      value: d.count,
    }))
    .reverse()
    .slice(-7);

  const revenueTrend = (financeData?.revenueByMonth || []).map((d: any) => ({
    label: new Date(d.month).toLocaleDateString(undefined, { month: 'short' }),
    value: d.revenue,
  }));

  const totalFees =
    financeData?.feesByStatus?.reduce(
      (acc: number, curr: any) => acc + (curr._sum.amount || 0),
      0
    ) || 0;

  const metrics = {
    totalLeads: funnelData.find((f: any) => f.stage === 'Leads')?.count || 0,
    applications: funnelData.find((f: any) => f.stage === 'Applications')?.count || 0,
    admissions: funnelData.find((f: any) => f.stage === 'Admissions')?.count || 0,
    revenue: revenueTrend.reduce((acc: number, curr: any) => acc + curr.value, 0),
    collectionRate:
      totalFees > 0
        ? Math.round(
          (revenueTrend.reduce((acc: number, curr: any) => acc + curr.value, 0) / totalFees) * 100
        )
        : 0,
  };

  return (
    <MainLayout>
      {/* page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight mb-1">
            Welcome back, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {user.role.replace(/_/g, ' ')} Command Center &bull;{' '}
            {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}
          </p>
        </div>

        {/* admin tab switcher — only shown to ADMIN */}
        {user.role === 'ADMIN' && (
          <div className="flex items-center gap-1 bg-white border border-black/10 shadow-sm p-1 rounded-[12px]">
            {(['overview', 'agents', 'deals'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setAdminTab(tab)}
                className={`px-5 py-1.5 text-xs font-bold capitalize transition-all rounded-[8px] ${adminTab === tab
                  ? 'bg-[#1A1A1A] text-[#F5F1EB] shadow-sm'
                  : 'text-slate-600 hover:text-[#1A1A1A] hover:bg-[#F5F1EB]/50'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* role-type branching — exactly three branches */}
      {user.role === 'SUPERADMIN' && <SuperadminDashboard />}

      {user.role === 'ADMIN' && (
        <AdminDashboard
          metrics={metrics}
          leadStats={leadStats}
          funnelData={funnelData}
          revenueTrend={revenueTrend}
          acquisitionData={acquisitionData}
          programData={programData}
          counselorData={counselorData}
          activeTab={adminTab}
        />
      )}

      {user.role === 'STANDARDUSER' && (
        <StandardUserDashboard
          metrics={metrics}
          leadStats={leadStats}
          acquisitionData={acquisitionData}
          funnelData={funnelData}
        />
      )}
    </MainLayout>
  );
}
