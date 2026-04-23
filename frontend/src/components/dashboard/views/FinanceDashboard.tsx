'use client';

import React from 'react';
import { MetricCard } from '../MetricCard';
import { AnalyticsChart } from '../AnalyticsChart';
import { Landmark, CreditCard, AlertCircle, TrendingUp, PieChart, Clock } from 'lucide-react';

interface FinanceDashboardProps {
  metrics: any;
  revenueTrend: any;
  financeData: any;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  metrics,
  revenueTrend,
  financeData
}) => {
  const collectionData = (financeData?.feesByStatus || []).map((s: any) => ({
    status: s.status,
    count: s._count.id,
    amount: s._sum.amount || 0
  }));

  const totalPossible = collectionData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Revenue" 
          value={`₹${metrics.revenue.toLocaleString()}`} 
          icon={Landmark} 
          color="emerald" 
          trend="Lifetime"
        />
        <MetricCard 
          label="Monthly Revenue" 
          value={`₹${(revenueTrend[revenueTrend.length-1]?.value || 0).toLocaleString()}`} 
          icon={TrendingUp} 
          color="primary" 
        />
        <MetricCard 
          label="Outstanding Dues" 
          value={`₹${(totalPossible - metrics.revenue).toLocaleString()}`} 
          icon={AlertCircle} 
          color="amber" 
        />
        <MetricCard 
          label="Collection Rate" 
          value={`${metrics.collectionRate}%`} 
          icon={CreditCard} 
          color="purple" 
          trend="Target 90%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <AnalyticsChart title="Revenue Collection Trend (Monthly)" data={revenueTrend} height={350} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass rounded-3xl border-white/5 overflow-hidden flex flex-col h-[350px]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h2 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                      <PieChart size={18} className="text-blue-400" />
                      Payment Status Distribution
                    </h2>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {collectionData.map((s: any) => (
                      <div key={s.status} className="space-y-2">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                          <span className="text-slate-400">{s.status}</span>
                          <span className="text-slate-200">₹{s.amount.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${(s.amount / (totalPossible || 1)) * 100}%` }}
                            className={`h-full rounded-full ${
                               s.status === 'PAID' ? 'bg-emerald-500/50' : 
                               s.status === 'PARTIAL' ? 'bg-blue-500/50' : 'bg-amber-500/50'
                            }`}
                          />
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">{s.count} Students</p>
                      </div>
                    ))}
                </div>
             </div>

             <div className="glass rounded-3xl border-white/5 p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
                <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                   <Landmark size={40} />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Financial Summary</h3>
                <p className="text-xs text-slate-500 max-w-[200px] mb-6">Your collection rate is healthy. Focused follow-ups on pending dues could increase revenue by 12%.</p>
                <button className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
                   Generate Report
                </button>
             </div>
          </div>
        </div>
        
        <div className="space-y-8">
           <div className="glass rounded-3xl border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" />
                  Overdue Fee Alerts
                </h3>
              </div>
              <div className="p-5 space-y-4">
                 {collectionData.find(s => s.status === 'PENDING')?.amount > 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                       <p className="text-xs font-black text-amber-200 mb-1">Attention Required</p>
                       <p className="text-[10px] text-amber-500/80 font-bold leading-relaxed">
                          There are currently payments pending verification. Please review the finance module to confirm receipts.
                       </p>
                    </div>
                 ) : (
                    <div className="py-8 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">All clear!</div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
