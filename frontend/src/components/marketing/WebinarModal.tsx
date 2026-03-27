'use client';

import React from 'react';
import { X, Calendar, Type, FileText, ChevronRight } from 'lucide-react';
import { useMarketingStore } from '@/store/useMarketingStore';

interface WebinarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebinarModal = ({ isOpen, onClose }: WebinarModalProps) => {
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    date: '',
  });
  const { createWebinar, isLoading } = useMarketingStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWebinar(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <form onSubmit={handleSubmit} className="relative w-full max-w-lg glass rounded-3xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
               <Calendar size={20} />
             </div>
             <h2 className="text-xl font-bold">Schedule New Webinar</h2>
           </div>
           <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="p-8 space-y-6">
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Webinar Title</label>
             <div className="relative">
               <input 
                 type="text" 
                 required
                 value={formData.title}
                 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                 placeholder="e.g. Mastering STEM Admissions" 
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all" 
               />
               <Type size={18} className="absolute left-4 top-3.5 text-slate-500" />
             </div>
           </div>
           
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Scheduled Date & Time</label>
             <div className="relative">
               <input 
                 type="datetime-local" 
                 required
                 value={formData.date}
                 onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 outline-none focus:border-blue-500/50 transition-all text-slate-300" 
               />
               <Calendar size={18} className="absolute left-4 top-3.5 text-slate-500" />
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Description</label>
             <div className="relative">
               <textarea 
                 rows={4}
                 required
                 value={formData.description}
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 placeholder="Outline the key topics and speakers..." 
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all resize-none" 
               />
               <FileText size={18} className="absolute left-4 top-4 text-slate-500" />
             </div>
           </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
           <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all text-slate-400">
             Cancel
           </button>
           <button 
             type="submit"
             disabled={isLoading}
             className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
           >
             {isLoading ? 'Scheduling...' : 'Schedule Webinar'}
             <ChevronRight size={16} />
           </button>
        </div>
      </form>
    </div>
  );
};
