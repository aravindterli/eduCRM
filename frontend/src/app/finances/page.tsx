
'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { IndianRupee, CreditCard, TrendingUp, Download, Search, FileText } from 'lucide-react';
import { PaymentModal } from '@/components/finances/PaymentModal';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function FinancesPage() {
  const { fees, stats, fetchFees, fetchStats, loading } = useFinanceStore();
  const [selectedFee, setSelectedFee] = React.useState<any>(null);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    fetchFees();
    fetchStats();
  }, [fetchFees, fetchStats]);

  const filteredFees = fees.filter(fee => {
    const searchLower = search.toLowerCase();
    const studentName = fee.admission?.application?.lead?.name?.toLowerCase() || '';
    const feeId = fee.id.toLowerCase();
    const enrollmentId = fee.admission?.enrollmentId?.toLowerCase() || '';
    
    return studentName.includes(searchLower) || 
           feeId.includes(searchLower) || 
           enrollmentId.includes(searchLower);
  });

  const calculatePaid = (payments: any[]) => payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <MainLayout>
      <PaymentModal 
        isOpen={!!selectedFee} 
        onClose={() => setSelectedFee(null)} 
        fee={selectedFee} 
      />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Financial Management</h1>
          <p className="text-slate-400 text-sm">Monitor fee collections and revenue</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
          <Download size={18} />
          <span>Export Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          label="Total Revenue" 
          value={`₹${stats?.total?.toLocaleString() || '0'}`} 
          trend="+8% this week" 
          icon={IndianRupee} 
          color="emerald"
        />
        <MetricCard 
          label="Total Collections" 
          value={fees.length.toString()} 
          icon={CreditCard} 
          color="amber"
          trend="Unique Fees"
        />
        <MetricCard 
          label="Active Admissions" 
          value={new Set(fees.map(f => f.admissionId)).size.toString()} 
          trend="Unique Enrolments" 
          icon={TrendingUp} 
          color="blue"
        />
      </div>

      <div className="glass rounded-2xl border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold">Student Fee Status</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              placeholder="Search student or Fee ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border-none rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 ring-white/10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 font-medium border-b border-white/5">
                <th className="px-6 py-4">Fee ID</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Program</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Paid</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">Loading financial records...</td>
                </tr>
              ) : filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500 italic">No financial records found.</td>
                </tr>
              ) : (
                filteredFees.map((fee) => {
                  const paid = calculatePaid(fee.payments);
                  return (
                    <tr key={fee.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-500 italic">{fee.id.split('-')[0]}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{fee.admission?.application?.lead?.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{fee.admission?.enrollmentId}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{fee.admission?.application?.program?.name}</td>
                      <td className="px-6 py-4 font-bold text-slate-200">₹{fee.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">₹{paid.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase ${
                          fee.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 
                          fee.status === 'PARTIAL' ? 'bg-blue-500/10 text-blue-400' : 
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {fee.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => setSelectedFee(fee)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ml-auto"
                          >
                            <IndianRupee size={14} />
                            Pay Now
                          </button>
                        )}
                        {fee.status === 'COMPLETED' && (
                          <button 
                            onClick={() => {
                              const token = localStorage.getItem('centracrm_token');
                              window.open(`${process.env.NEXT_PUBLIC_API_URL}/reports/payments/${fee.id}/receipt?token=${token}`, '_blank');
                            }}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-blue-400 transition-all ml-auto" 
                            title="Download Receipt"
                          >
                             <FileText size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
