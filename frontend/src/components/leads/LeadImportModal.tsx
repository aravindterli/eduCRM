'use client';

import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeadImportModal = ({ isOpen, onClose }: LeadImportModalProps) => {
  const [fileContent, setFileContent] = useState<any[] | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const { importLeads, loading } = useLeadStore();

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const leads = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const lead: any = {};
        headers.forEach((header, i) => {
          lead[header] = values[i];
        });
        return lead;
      });

      setFileContent(leads);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!fileContent) return;
    const res = await importLeads(fileContent);
    setResults(res);
  };

  const closeAndReset = () => {
    setFileContent(null);
    setResults(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAndReset} />

      <div className="relative w-full max-w-lg bg-white border border-black/10 rounded-[16px] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden text-[#1A1A1A]">
        {/* Header */}
        <div className="p-6 border-b border-black/10 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Upload size={20} />
            </div>
            <h2 className="text-xl font-bold">Import Leads (CSV)</h2>
          </div>
          <button onClick={closeAndReset} className="p-2 hover:bg-gray-100 rounded-[8px] text-slate-400 hover:text-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 bg-white">
          {!results ? (
            <div className="space-y-6">
              <div className="p-4 rounded-[12px] bg-blue-50 border border-blue-100 text-xs text-blue-700 leading-relaxed font-medium">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <AlertCircle size={14} /> CSV Format Requirement
                </p>
                Columns: <span className="text-[#1A1A1A] font-bold">name, email, phone, location, leadSource</span> (Headers are required)
              </div>

              {!fileContent ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-black/10 rounded-[12px] hover:bg-gray-50/50 bg-gray-50/20 cursor-pointer transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-[#1A1A1A] mb-3 transition-colors" />
                    <p className="mb-2 text-sm text-slate-600"><span className="font-bold text-[#1A1A1A]">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">CSV File Only</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              ) : (
                <div className="p-6 rounded-[12px] bg-gray-50 border border-black/10 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[8px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A1A]">{fileContent.length} Leads found</p>
                      <p className="text-xs text-slate-500">Ready to import</p>
                    </div>
                  </div>
                  <button onClick={() => setFileContent(null)} className="text-xs font-bold text-rose-600 hover:underline">Change</button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold">Import Complete</h3>
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="p-4 rounded-[12px] bg-gray-50 border border-black/5">
                  <p className="text-2xl font-black text-emerald-600">{results.success}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Success</p>
                </div>
                <div className="p-4 rounded-[12px] bg-gray-50 border border-black/5">
                  <p className="text-2xl font-black text-rose-600">{results.failed}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Failed</p>
                </div>
              </div>
              {results.errors?.length > 0 && (
                <div className="text-left mt-6 p-4 rounded-[8px] bg-rose-50 border border-rose-100 text-rose-800 overflow-y-auto max-h-32">
                  <p className="text-xs font-bold text-rose-700 mb-2">Errors:</p>
                  {results.errors.map((err: any, i: number) => (
                    <p key={i} className="text-[10px] text-slate-500">• {err.name}: {err.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!results && (
          <div className="p-6 border-t border-black/10 bg-gray-50 flex justify-end gap-3">
            <button onClick={closeAndReset} className="px-6 py-2.5 rounded-[8px] text-sm font-semibold hover:bg-gray-100 transition-all text-slate-600">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!fileContent || loading}
              className="bg-[#1A1A1A] hover:bg-black/90 text-[#F5F1EB] disabled:opacity-50 px-8 py-2.5 rounded-[8px] text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Start Import'}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        {results && (
          <div className="p-6 border-t border-black/10 bg-gray-50 flex justify-center">
            <button onClick={closeAndReset} className="bg-[#1A1A1A] hover:bg-black/90 text-[#F5F1EB] px-12 py-3 rounded-[8px] text-sm font-bold transition-all shadow-sm">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
