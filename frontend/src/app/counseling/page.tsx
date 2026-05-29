'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar as CalendarIcon, Clock, User, MessageSquare, CheckCircle, Plus } from 'lucide-react';
import { InteractionModal } from '@/components/counseling/InteractionModal';
import { useCounselingStore } from '@/store/useCounselingStore';
import { useAuthStore } from '@/store/auth.store';

const stageColors: Record<string, string> = {
  'NEW': 'bg-blue-50 text-blue-700 border-blue-100',
  'CONTACTED': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'RESPONDED': 'bg-purple-50 text-purple-700 border-purple-100',
  'QUALIFIED': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'MEETING SCHEDULED': 'bg-amber-50 text-amber-700 border-amber-100',
  'MEETING_SCHEDULED': 'bg-amber-50 text-amber-700 border-amber-100',
  'PROPOSAL SENT': 'bg-orange-50 text-orange-700 border-orange-100',
  'PROPOSAL_SENT': 'bg-orange-50 text-orange-700 border-orange-100',
  'NEGOTIATION': 'bg-pink-50 text-pink-700 border-pink-100',
  'CONVERTED': 'bg-rose-50 text-rose-700 border-rose-100',
  'ON HOLD': 'bg-slate-50 text-slate-700 border-slate-100',
  'LOST': 'bg-red-50 text-red-700 border-red-100',
  'RE-ENGAGEMENT': 'bg-cyan-50 text-cyan-700 border-cyan-100'
};

export default function CounselingPage() {
  const { students, schedule, fetchStudents, fetchSchedule, loading } = useCounselingStore();
  const { user } = useAuthStore();

  const labels = {
    GENERIC: {
      title: 'Counseling Scheduler',
      subtitle: 'Manage your daily student interactions',
      queue: 'Active Counseling Queue',
      empty: 'No students currently awaiting counseling.',
      loading: 'Loading students...',
    },
    REAL_ESTATE: {
      title: 'Site Visit Scheduler',
      subtitle: 'Manage your property visits',
      queue: 'Active Site Visit Queue',
      empty: 'No leads currently awaiting site visits.',
      loading: 'Loading leads...',
    },
    HEALTHCARE: {
      title: 'Consultation Scheduler',
      subtitle: 'Manage your patient consultations',
      queue: 'Active Consultation Queue',
      empty: 'No patients currently awaiting consultation.',
      loading: 'Loading patients...',
    },
  };

  const sector = user?.sector || 'GENERIC';
  const currentLabels = (labels as any)[sector] || labels.GENERIC;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null);

  React.useEffect(() => {
    fetchStudents();
    fetchSchedule();
  }, [fetchStudents, fetchSchedule]);

  const openModal = (student?: any) => {
    setSelectedStudent(student || null);
    setIsModalOpen(true);
  };

  const ELIGIBLE_STAGES = [
    'QUALIFIED',
    'MEETING_SCHEDULED',
    'MEETING SCHEDULED',
    'PROPOSAL_SENT',
    'PROPOSAL SENT',
    'NEGOTIATION',
  ];
  const filteredStudents = students.filter((s: any) => ELIGIBLE_STAGES.includes(s.stage));

  return (
    <MainLayout>
      <InteractionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        student={selectedStudent} 
      />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{currentLabels.title}</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase mt-0.5 tracking-wider">{currentLabels.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-black/90 text-[#F5F1EB] px-4 py-2.5 rounded-[8px] transition-all font-bold shadow-sm cursor-pointer"
          >
            <Plus size={18} />
            <span>New Interaction</span>
          </button>
          <button className="bg-white hover:bg-gray-50 px-4 py-2.5 rounded-[8px] text-xs font-semibold transition-all border border-black/10 text-[#1A1A1A] shadow-xs cursor-pointer">
            View Full Calendar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-4 flex items-center gap-2">
            <User size={18} className="text-[#1A1A1A]/70" />
            {currentLabels.queue}
          </h3>
          {loading ? (
            <div className="p-10 text-center text-slate-400 italic font-semibold">{currentLabels.loading}</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-10 text-center text-slate-400 italic font-semibold">{currentLabels.empty}</div>
          ) : (
            filteredStudents.map((item: any) => (
              <div 
                key={item.id} 
                onClick={() => openModal(item)}
                className="p-5 rounded-[12px] bg-white border border-black/10 flex items-center justify-between group hover:bg-[#F5F1EB]/30 transition-all cursor-pointer shadow-xs text-[#1A1A1A]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[8px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    {item.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1A1A1A] group-hover:text-blue-600 transition-colors">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.qualification || 'Interest Pending'} • {item.location || 'Location Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[6px] border ${stageColors[item.stage] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    {item.stage.replace('_', ' ')}
                  </span>
                  <button 
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      openModal(item);
                    }}
                    className="bg-[#1A1A1A] hover:bg-black/90 p-2 rounded-[8px] text-[#F5F1EB] transition-all scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white border border-black/10 rounded-[16px] shadow-sm text-[#1A1A1A] flex flex-col space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
              <Clock size={16} className="text-[#1A1A1A]/70" />
              Follow-up Schedule
            </h3>
            {schedule.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No follow-ups scheduled for today.</p>
            ) : (
              <div className="space-y-4">
                {schedule.map((f: any) => (
                  <div key={f.id} className="p-4 rounded-[12px] bg-[#F5F1EB]/30 border border-black/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-indigo-600">{new Date(f.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-[6px] border bg-indigo-50 text-indigo-700 border-indigo-100">Scheduled</span>
                    </div>
                    <p className="text-sm font-bold text-[#1A1A1A]">{f.lead?.name}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 italic font-medium">"{f.notes}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 bg-white border border-black/10 rounded-[16px] shadow-sm text-[#1A1A1A] flex flex-col space-y-4">
             <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
               <CheckCircle size={16} className="text-[#1A1A1A]/70" />
               Reminders & Tasks
             </h3>
             <div className="space-y-3">
               {schedule.slice(0, 3).map((f: any, i: number) => (
                 <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
                   Call {f.lead?.name} for documentation
                 </div>
               ))}
               {schedule.length === 0 && (
                 <p className="text-[10px] text-slate-400 italic">All caught up!</p>
               )}
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
