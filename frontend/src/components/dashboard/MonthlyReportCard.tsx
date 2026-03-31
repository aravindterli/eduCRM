'use client';

import React, { useState } from 'react';
import { FileText, Download, Loader2, Calendar } from 'lucide-react';
import api from '@/utils/api';

export const MonthlyReportCard = () => {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/monthly/pdf', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `EduCRM_Report_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to generate PDF report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl border-white/5 overflow-hidden group">
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <FileText size={24} />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Performance</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-200">Monthly Report</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Download a professional PDF summary of this month's leads, admissions, and financial performance.
          </p>
        </div>

        <button
          onClick={generatePDF}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/20"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Download size={18} />
              Generate PDF Report
            </>
          )}
        </button>

        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
          <Calendar size={12} />
          Current Period: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
};
