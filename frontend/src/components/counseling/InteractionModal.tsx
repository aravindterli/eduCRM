'use client';

import React from 'react';
import { X, MessageSquare, User, History, ChevronRight } from 'lucide-react';

import { useCounselingStore } from '@/store/useCounselingStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useProgramStore } from '@/store/useProgramStore';
import { useAuthStore } from '@/store/auth.store';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: any;
}

export const InteractionModal = ({ isOpen, onClose, student }: InteractionModalProps) => {
  const { students, logInteraction } = useCounselingStore();
  const { createApplication } = useApplicationStore();
  const { programs, fetchPrograms } = useProgramStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const labels = {
    GENERIC: {
      title: 'New Counseling Session',
      leadLabel: 'Selected Student',
      leadPlaceholder: 'Select a student...',
      typeLabel: 'Session Type',
      programLabel: 'Enrolling Program',
      programPlaceholder: 'Select program...',
      notesLabel: 'Consultation Notes',
      actionBtn: 'Enroll & Start Application',
      types: ['Initial Inquiry', 'Career Guidance', 'Document Review', 'Visa Counseling', 'Financial Discussion']
    },
    REAL_ESTATE: {
      title: 'New Site Visit / Interaction',
      leadLabel: 'Selected Lead',
      leadPlaceholder: 'Select a lead...',
      typeLabel: 'Interaction Type',
      programLabel: 'Interested Property',
      programPlaceholder: 'Select property...',
      notesLabel: 'Visit Notes',
      actionBtn: 'Book Property / Unit',
      types: ['Initial Inquiry', 'Property Visit', 'Price Negotiation', 'Booking Discussion', 'Document Verification']
    },
    HEALTHCARE: {
      title: 'New Patient Consultation',
      leadLabel: 'Selected Patient',
      leadPlaceholder: 'Select a patient...',
      typeLabel: 'Consultation Type',
      programLabel: 'Treatment / Service',
      programPlaceholder: 'Select service...',
      notesLabel: 'Clinical Notes',
      actionBtn: 'Schedule Treatment',
      types: ['Initial Inquiry', 'General Checkup', 'Specialist Consultation', 'Follow-up Visit', 'Diagnostic Review']
    }
  };

  const sector = user?.sector || 'GENERIC';
  const currentLabels = (labels as any)[sector] || labels.GENERIC;
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <form onSubmit={handleSubmit} className="relative w-full max-w-xl bg-white border border-black/10 rounded-[16px] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden text-[#1A1A1A]">
        <div className="p-6 border-b border-black/10 flex justify-between items-center bg-gray-50">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-[8px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
               <MessageSquare size={20} />
             </div>
             <h2 className="text-lg font-bold text-[#1A1A1A]">{currentLabels.title}</h2>
           </div>
           <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[8px] text-slate-500 hover:text-slate-800 transition-colors shrink-0">
             <X size={20} />
           </button>
        </div>

        <div className="p-8 space-y-6">
           <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{currentLabels.leadLabel}</label>
             {student ? (
               <div className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 flex items-center gap-3 shadow-xs">
                 <User size={18} className="text-slate-400" />
                 <span className="text-[#1A1A1A] font-semibold text-sm">{student.name}</span>
               </div>
             ) : (
               <select 
                 name="leadId"
                 value={formData.leadId}
                 onChange={(e) => setFormData(prev => ({ ...prev, leadId: e.target.value }))}
                 required
                 className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 outline-none focus:ring-2 focus:ring-black/10 transition-all text-slate-600 font-semibold shadow-xs"
               >
                 <option value="" className="bg-white text-slate-500">{currentLabels.leadPlaceholder}</option>
                 {students.map(s => (
                   <option key={s.id} value={s.id} className="bg-white text-[#1A1A1A]">{s.name}</option>
                 ))}
               </select>
             )}
           </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{currentLabels.typeLabel}</label>
                 <select 
                   value={formData.recommendation}
                   onChange={(e) => setFormData(prev => ({ ...prev, recommendation: e.target.value }))}
                   className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 outline-none focus:ring-2 focus:ring-black/10 transition-all text-slate-600 font-semibold shadow-xs"
                  >
                    {currentLabels.types.map((type: string) => (
                      <option key={type} className="bg-white text-[#1A1A1A]">{type}</option>
                    ))}
                  </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{currentLabels.programLabel}</label>
                 <select 
                   value={formData.programId}
                   onChange={(e) => setFormData(prev => ({ ...prev, programId: e.target.value }))}
                   required
                   className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 outline-none focus:ring-2 focus:ring-black/10 transition-all text-slate-600 font-semibold shadow-xs"
                  >
                    <option value="" className="bg-white text-slate-500">{currentLabels.programPlaceholder}</option>
                   {programs.map(p => (
                     <option key={p.id} value={p.id} className="bg-white text-[#1A1A1A]">{p.name}</option>
                   ))}
                 </select>
              </div>
            </div>

           <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{currentLabels.notesLabel}</label>
             <textarea 
               rows={4} 
               value={formData.notes}
               onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
               required
               placeholder="Summarize the discussion and key takeaways..." 
               className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-black/10 transition-all resize-none font-semibold text-[#1A1A1A] shadow-xs" 
             />
           </div>
        </div>

        <div className="p-6 border-t border-black/10 bg-gray-50 flex justify-between gap-3">
           <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold hover:bg-gray-150 rounded-[8px] transition-colors text-slate-500 cursor-pointer">
             Cancel
           </button>
           <div className="flex gap-2">
             <button 
               type="button"
               disabled={loading || !formData.leadId}
               onClick={(e) => handleSubmit(e as any, true)}
               className="bg-[#1A1A1A]/80 hover:bg-black text-white px-6 py-2.5 rounded-[8px] text-sm font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 border-none cursor-pointer"
             >
               {loading ? 'Processing...' : currentLabels.actionBtn}
             </button>
             <button 
               type="submit"
               disabled={loading || !formData.leadId}
               className="bg-[#1A1A1A] hover:bg-black px-8 py-2.5 rounded-[8px] text-sm font-bold text-[#F5F1EB] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
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
