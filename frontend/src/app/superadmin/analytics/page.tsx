'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { superadminService } from '@/services/superadmin.service';
import { BarChart3, TrendingUp, Users, Building2, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function PlatformAnalyticsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const analytics = await superadminService.getAnalytics();
        setData(analytics);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Platform Analytics</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Global ecosystem performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Platform Revenue', value: `$${data?.revenueByMonth?.reduce((acc: any, curr: any) => acc + (curr._sum.amount || 0), 0) || 0}`, icon: TrendingUp, color: 'text-emerald-500', trend: '+24%' },
          { label: 'Ecosystem Leads', value: data?.leadsByMonth?.reduce((acc: any, curr: any) => acc + (curr._count.id || 0), 0) || 0, icon: Users, color: 'text-blue-500', trend: '+12%' },
          { label: 'Conversion Rate', value: '3.2%', icon: BarChart3, color: 'text-purple-500', trend: '+0.5%' },
          { label: 'Tenant Growth', value: data?.tenantsBySector?.reduce((acc: any, curr: any) => acc + curr._count.id, 0) || 0, icon: Building2, color: 'text-amber-500', trend: '+2' },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-[2rem] border-white/5 group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[9px] font-black flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {stat.trend}
              </span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sector Distribution */}
        <div className="glass p-8 rounded-[2.5rem] border-white/5">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <PieChart size={18} className="text-blue-500" /> Sector Distribution
            </h3>
          </div>
          <div className="space-y-6">
            {data?.tenantsBySector?.map((sector: any, i: number) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">{sector.sector}</span>
                  <span className="text-white">{sector._count.id} Tenants</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${(sector._count.id / data.tenantsBySector.reduce((a:any, b:any) => a + b._count.id, 0)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Tenants */}
        <div className="glass p-8 rounded-[2.5rem] border-white/5">
           <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-8">
              <TrendingUp size={18} className="text-emerald-500" /> Top Performing Tenants
            </h3>
            <div className="space-y-4">
              {data?.topTenants?.map((tenant: any, i: number) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-xs border border-blue-500/20">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{tenant.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{tenant.sector}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{tenant._count.leads}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Total Leads</p>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </MainLayout>
  );
}
