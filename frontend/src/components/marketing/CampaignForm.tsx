'use client';

import React from 'react';
import { X, Megaphone, Calendar } from 'lucide-react';
import { useMarketingStore } from '@/store/useMarketingStore';

interface CampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export const CampaignForm = ({ isOpen, onClose, initialData }: CampaignFormProps) => {
  const [formData, setFormData] = React.useState({
    name: '',
    source: 'Google Ads',
    startDate: '',
  });
  const { createCampaign, updateCampaign, isLoading } = useMarketingStore();

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        source: initialData.source || 'Google Ads',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        name: '',
        source: 'Google Ads',
        startDate: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData?.id) {
      await updateCampaign(initialData.id, formData);
    } else {
      await createCampaign(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl glass rounded-3xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
               <Megaphone size={20} />
             </div>
             <h2 className="text-xl font-bold">{initialData ? 'Edit Campaign' : 'New Marketing Campaign'}</h2>
           </div>
           <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="p-8 grid grid-cols-2 gap-6">
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Campaign Name</label>
             <input 
               type="text" 
               required
               value={formData.name}
               onChange={(e) => setFormData({...formData, name: e.target.value})}
               placeholder="e.g. Summer Intake 2026" 
               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all" 
             />
           </div>
           
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Source Interface</label>
             <select 
               value={formData.source}
               onChange={(e) => setFormData({...formData, source: e.target.value})}
               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-slate-300"
             >
               <option>Google Ads</option>
               <option>Facebook Ads</option>
               <option>Instagram</option>
               <option>Email Blast</option>
             </select>
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Schedule Start</label>
             <div className="relative">
               <input 
                 type="date" 
                 value={formData.startDate}
                 onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-slate-300" 
               />
               <Calendar size={18} className="absolute right-4 top-3.5 text-slate-500 pointer-events-none" />
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
             className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20"
           >
             {isLoading ? 'Saving...' : (initialData ? 'Update Campaign' : 'Launch Campaign')}
           </button>
        </div>
      </form>
    </div>
  );
};
