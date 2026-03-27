'use client';

import React from 'react';
import { X, MessageSquare, User, History, ChevronRight } from 'lucide-react';

import { useCounselingStore } from '@/store/useCounselingStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useProgramStore } from '@/store/useProgramStore';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: any;
}

export const InteractionModal = ({ isOpen, onClose, student }: InteractionModalProps) => {
  const { students, logInteraction } = useCounselingStore();
  const { createApplication } = useApplicationStore();
  const { programs, fetchPrograms } = useProgramStore();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    leadId: '',
    programId: '',
    notes: '',
    recommendation: 'Initial Inquiry'
  });

  React.useEffect(() => {
    fetchPrograms();
    if (student) {
      setFormData(prev => ({ 
        ...prev, 
        leadId: student.id,
        programId: student.interestedProgramId || ''
      }));
    }
  }, [student, fetchPrograms]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, startApp: boolean = false) => {
    e?.preventDefault();
    if (!formData.leadId) return;

    setLoading(true);
    const success = await logInteraction(formData);
    
    if (success && startApp) {
      if (!formData.programId) {
        alert('Please select a program first');
        setLoading(false);
        return;
      }
      await createApplication({ leadId: formData.leadId, programId: formData.programId });
    }

    setLoading(false);
    if (success) {
      onClose();
      setFormData({
        leadId: '',
        programId: '',
        notes: '',
        recommendation: 'Initial Inquiry'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <form onSubmit={handleSubmit} className="relative w-full max-w-xl glass rounded-3xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
               <MessageSquare size={20} />
             </div>
             <h2 className="text-xl font-bold">New Counseling Session</h2>
           </div>
           <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="p-8 space-y-6">
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Selected Student</label>
             {student ? (
               <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                 <User size={18} className="text-slate-400" />
                 <span className="text-slate-200 font-medium">{student.name}</span>
               </div>
             ) : (
               <select 
                 name="leadId"
                 value={formData.leadId}
                 onChange={(e) => setFormData(prev => ({ ...prev, leadId: e.target.value }))}
                 required
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-slate-300"
               >
                 <option value="">Select a student...</option>
                 {students.map(s => (
                   <option key={s.id} value={s.id}>{s.name}</option>
                 ))}
               </select>
             )}
           </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Session Type</label>
                <select 
                  value={formData.recommendation}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendation: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-slate-300"
                 >
                   <option>Initial Inquiry</option>
                   <option>Career Guidance</option>
                   <option>Document Review</option>
                   <option>Visa Counseling</option>
                   <option>Financial Discussion</option>
                 </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Enrolling Program</label>
                <select 
                  value={formData.programId}
                  onChange={(e) => setFormData(prev => ({ ...prev, programId: e.target.value }))}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-slate-300"
                 >
                   <option value="">Select program...</option>
                   {programs.map(p => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                 </select>
              </div>
            </div>

           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Consultation Notes</label>
             <textarea 
               rows={4} 
               value={formData.notes}
               onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
               required
               placeholder="Summarize the discussion and key takeaways..." 
               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all resize-none shadow-inner" 
             />
           </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-between gap-3">
           <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all text-slate-400">
             Cancel
           </button>
           <div className="flex gap-2">
             <button 
               type="button"
               disabled={loading || !formData.leadId}
               onClick={(e) => handleSubmit(e as any, true)}
               className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 border border-indigo-400/30"
             >
               {loading ? 'Processing...' : 'Enroll & Start Application'}
             </button>
             <button 
               type="submit"
               disabled={loading || !formData.leadId}
               className="bg-blue-600 hover:bg-blue-500 px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
             >
               {loading ? 'Logging...' : (
                 <>
                   Log Interaction
                   <ChevronRight size={16} />
                 </>
               )}
             </button>
           </div>
        </div>
      </form>
    </div>
  );
};
