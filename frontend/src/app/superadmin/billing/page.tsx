'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { superadminService } from '@/services/superadmin.service';
import { CreditCard, TrendingUp, Calendar, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';

export default function BillingPage() {
  const [tenants, setTenants] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBilling = async () => {
      try {
        const data = await superadminService.getBilling();
        setTenants(data);
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, []);

  const totalMonthlyRev = tenants.reduce((acc, t) => acc + (t.subscriptionPlan === 'ENTERPRISE' ? 499 : t.subscriptionPlan === 'PRO' ? 199 : 0), 0);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Billing & Revenue</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Platform subscription management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Estimated Monthly Revenue', value: `$${totalMonthlyRev}`, icon: DollarSign, color: 'text-emerald-500' },
          { label: 'Active Subscriptions', value: tenants.filter(t => t.subscriptionStatus === 'ACTIVE').length, icon: CheckCircle2, color: 'text-blue-500' },
          { label: 'Pending Payments', value: '3', icon: AlertCircle, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="glass p-8 rounded-[2rem] border-white/5">
            <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-6 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-lg font-black text-white tracking-tight">Tenant Subscription Status</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Organization</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Billing</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-white">{tenant.name}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase ${
                      tenant.subscriptionPlan === 'ENTERPRISE' ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' :
                      tenant.subscriptionPlan === 'PRO' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' :
                      'text-slate-400 border-white/5 bg-white/5'
                    }`}>
                      {tenant.subscriptionPlan}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${tenant.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                      <span className="text-xs font-bold text-slate-300 capitalize">{tenant.subscriptionStatus}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={14} />
                      <span className="text-xs font-medium">{tenant.nextBillingDate ? new Date(tenant.nextBillingDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
