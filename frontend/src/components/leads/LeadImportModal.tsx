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
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeAndReset} />
      
      <div className="relative w-full max-w-lg glass rounded-3xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
               <Upload size={20} />
             </div>
             <h2 className="text-xl font-bold">Import Leads (CSV)</h2>
           </div>
           <button onClick={closeAndReset} className="p-2 hover:bg-white/5 rounded-xl text-slate-400">
             <X size={20} />
           </button>
        </div>

        <div className="p-8">
          {!results ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-400 leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <AlertCircle size={14} /> CSV Format Requirement
                </p>
                Columns: <span className="text-slate-300">name, email, phone, location, leadSource</span> (Headers are required)
              </div>

              {!fileContent ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-3xl hover:bg-white/5 cursor-pointer transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 text-slate-500 group-hover:text-blue-400 mb-3 transition-colors" />
                    <p className="mb-2 text-sm text-slate-400"><span className="font-bold text-white">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-500 uppercase font-black">CSV File Only</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              ) : (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-200">{fileContent.length} Leads found</p>
                      <p className="text-xs text-slate-500">Ready to import</p>
                    </div>
                  </div>
                  <button onClick={() => setFileContent(null)} className="text-xs font-bold text-red-400 hover:underline">Change</button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold">Import Complete</h3>
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-2xl font-black text-green-400">{results.success}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Success</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-2xl font-black text-red-400">{results.failed}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Failed</p>
                </div>
              </div>
              {results.errors?.length > 0 && (
                <div className="text-left mt-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10 overflow-y-auto max-h-32">
                  <p className="text-xs font-bold text-red-400 mb-2">Errors:</p>
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
          <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
             <button onClick={closeAndReset} className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all text-slate-400">
               Cancel
             </button>
             <button 
               onClick={handleImport}
               disabled={!fileContent || loading}
               className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
             >
               {loading ? <Loader2 className="animate-spin" size={18} /> : 'Start Import'}
               <ChevronRight size={16} />
             </button>
          </div>
        )}
        {results && (
           <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-center">
             <button onClick={closeAndReset} className="bg-white/10 hover:bg-white/20 px-12 py-3 rounded-2xl text-sm font-bold transition-all">
               Close
             </button>
           </div>
        )}
      </div>
    </div>
  );
};
