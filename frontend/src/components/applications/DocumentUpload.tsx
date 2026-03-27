'use client';

import React, { useState } from 'react';
import { X, Upload, File, ChevronRight } from 'lucide-react';
import { useApplicationStore } from '@/store/useApplicationStore';

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
}

export const DocumentUpload = ({ isOpen, onClose, applicationId }: DocumentUploadProps) => {
  const [formData, setFormData] = useState({
    applicationId: '',
    type: 'Marksheet',
    url: '',
  });
  const { applications, uploadDocument, loading } = useApplicationStore();

  React.useEffect(() => {
    if (applicationId) {
      setFormData(prev => ({ ...prev, applicationId }));
    } else {
      setFormData(prev => ({ ...prev, applicationId: '' }));
    }
  }, [applicationId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicationId) return alert('Please select an application');
    await uploadDocument(formData.applicationId, { type: formData.type, url: formData.url });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <form 
        onSubmit={handleSubmit} 
        className="relative w-full max-w-lg glass rounded-3xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
               <Upload size={20} />
             </div>
             <h2 className="text-xl font-bold">Upload Student Document</h2>
           </div>
           <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
             <X size={20} />
           </button>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Select Application</label>
             <select 
               required
               value={formData.applicationId}
               onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
               className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-slate-300 appearance-none"
             >
               <option value="" className="bg-slate-900">Choose an application...</option>
               {applications.map(app => (
                 <option key={app.id} value={app.id} className="bg-slate-900">
                   {app.lead?.name} - {app.program?.name}
                 </option>
               ))}
             </select>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Document Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-slate-300 appearance-none"
                >
                  <option className="bg-slate-900">Marksheet</option>
                  <option className="bg-slate-900">ID Proof</option>
                  <option className="bg-slate-900">Experience Letter</option>
                  <option className="bg-slate-900">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">File URL</label>
                <input 
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://link-to-doc.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
           <button 
             type="button" 
             onClick={onClose} 
             className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all text-slate-400"
           >
             Cancel
           </button>
           <button 
             type="submit"
             disabled={loading}
             className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
           >
             {loading ? 'Uploading...' : 'Upload Document'}
             <ChevronRight size={16} />
           </button>
        </div>
      </form>
    </div>
  );
};
