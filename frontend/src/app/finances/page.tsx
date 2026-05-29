
'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { IndianRupee, CreditCard, TrendingUp, Download, Search, FileText } from 'lucide-react';
import { PaymentModal } from '@/components/finances/PaymentModal';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useAuthStore } from '@/store/auth.store';

export default function FinancesPage() {
  const { fees, stats, fetchFees, fetchStats, loading } = useFinanceStore();
  const [selectedFee, setSelectedFee] = React.useState<any>(null);
  const [search, setSearch] = React.useState('');
  const { user } = useAuthStore();
  const sector = user?.sector || 'GENERIC';

  const labels = {
    GENERIC: {
      subtitle: 'Monitor fee collections and revenue',
      metricCollections: 'UniqueFees',
      metricAdmissions: 'ActiveAdmissions',
      metricEnrolments: 'UniqueEnrolments',
      tableTitle: 'StudentFeeStatus',
      searchPlaceholder: 'Search student or Fee ID...',
      thStudent: 'Student',
      thProgram: 'Program',
      thFeeId: 'FeeID',
    },
    REAL_ESTATE: {
      subtitle: 'Monitor payment collections and revenue',
      metricCollections: 'UniquePayments',
      metricAdmissions: 'ActiveBookings',
      metricEnrolments: 'UniqueBookings',
      tableTitle: 'ClientPaymentStatus',
      searchPlaceholder: 'Search client or Payment ID...',
      thStudent: 'Client',
      thProgram: 'Property',
      thFeeId: 'PaymentID',
    },
    HEALTHCARE: {
      subtitle: 'Monitor billing and revenue',
      metricCollections: 'UniqueBills',
      metricAdmissions: 'ActiveCases',
      metricEnrolments: 'UniquePatients',
      tableTitle: 'PatientBillingStatus',
      searchPlaceholder: 'Search patient or Bill ID...',
      thStudent: 'Patient',
      thProgram: 'Service',
      thFeeId: 'BillID',
    },
  };

  const currentLabels = (labels as any)[sector] || labels.GENERIC;

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
      
      <div className="flex justify-between items-center mb-8 text-[#1A1A1A]">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">FinancialManagement</h1>
          <p className="text-[#1A1A1A]/60 text-sm mt-1">{currentLabels.subtitle}</p>
        </div>
        <button className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white px-4 py-2 rounded-[8px] border border-black/10 transition-all font-semibold tracking-wider text-sm shadow-sm">
          <Download size={18} />
          <span>ExportReport</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          label="TotalRevenue" 
          value={`₹${stats?.total?.toLocaleString() || '0'}`} 
          trend="+8% this week" 
          icon={IndianRupee} 
          color="emerald"
        />
        <MetricCard 
          label="TotalCollections" 
          value={fees.length.toString()} 
          icon={CreditCard} 
          color="amber"
          trend={currentLabels.metricCollections}
        />
        <MetricCard 
          label={currentLabels.metricAdmissions} 
          value={new Set(fees.map(f => f.admissionId)).size.toString()} 
          trend={currentLabels.metricEnrolments} 
          icon={TrendingUp} 
          color="blue"
        />
      </div>

      <div className="bg-white border border-black/10 rounded-[16px] shadow-sm overflow-hidden text-[#1A1A1A]">
        <div className="p-6 border-b border-black/10 bg-[#F5F1EB]/30 flex items-center justify-between">
          <h3 className="font-bold text-[#1A1A1A]">{currentLabels.tableTitle}</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              placeholder={currentLabels.searchPlaceholder} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-black/10 text-[#1A1A1A] placeholder-slate-450 rounded-[8px] pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-black/10 bg-gray-50 text-slate-500 text-xs font-black uppercase tracking-wider">
                <th className="px-6 py-4">{currentLabels.thFeeId}</th>
                <th className="px-6 py-4">{currentLabels.thStudent}</th>
                <th className="px-6 py-4">{currentLabels.thProgram}</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">PaidAmount</th>
                <th className="px-6 py-4">PaymentStatus</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-semibold">Loading financial records...</td>
                </tr>
              ) : filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-semibold italic">No financial records found.</td>
                </tr>
              ) : (
                filteredFees.map((fee) => {
                  const paid = calculatePaid(fee.payments);
                  return (
                    <tr key={fee.id} className="hover:bg-[#F5F1EB]/30 transition-all">
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400 italic">{fee.id.split('-')[0]}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#1A1A1A]">{fee.admission?.application?.lead?.name}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{fee.admission?.enrollmentId}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs font-medium">{fee.admission?.application?.program?.name}</td>
                      <td className="px-6 py-4 font-bold text-[#1A1A1A]">₹{fee.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">₹{paid.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-[6px] text-[10px] font-black tracking-tighter uppercase border ${
                          fee.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          fee.status === 'PARTIAL' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {fee.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => setSelectedFee(fee)}
                            className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all flex items-center gap-1 ml-auto"
                          >
                            <IndianRupee size={14} />
                            PayNow
                          </button>
                        )}
                        {fee.status === 'COMPLETED' && (
                          <button 
                            onClick={() => {
                              const token = localStorage.getItem('centracrm_token');
                              window.open(`${process.env.NEXT_PUBLIC_API_URL}/reports/payments/${fee.id}/receipt?token=${token}`, '_blank');
                            }}
                            className="p-2 bg-gray-50 hover:bg-blue-50 border border-black/10 hover:border-blue-200 text-slate-500 hover:text-blue-600 transition-all rounded-[8px] ml-auto flex items-center justify-center" 
                            title="DownloadReceipt"
                          >
                             <FileText size={16} />
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
