'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar as CalendarIcon, Clock, User, MessageSquare, CheckCircle, Plus } from 'lucide-react';
import { InteractionModal } from '@/components/counseling/InteractionModal';
import { useCounselingStore } from '@/store/useCounselingStore';

export default function CounselingPage() {
  const { students, schedule, fetchStudents, fetchSchedule, loading } = useCounselingStore();
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

  return (
    <MainLayout>
      <InteractionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        student={selectedStudent} 
      />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Counseling Scheduler</h1>
          <p className="text-slate-400 text-sm">Manage your daily student interactions</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-bold"
          >
            <Plus size={18} />
            <span>New Interaction</span>
          </button>
          <button className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm transition-all border border-white/5 font-medium">
            View Full Calendar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <User size={18} className="text-blue-400" />
            Active Counseling Queue
          </h3>
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center text-slate-500 italic font-medium">No students currently awaiting counseling.</div>
          ) : (
            students.map((item) => (
              <div 
                key={item.id} 
                onClick={() => openModal(item)}
                className="p-6 rounded-2xl glass border-white/5 flex items-center justify-between group hover:border-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                    {item.name[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">{item.name}</h4>
                    <p className="text-xs text-slate-500">{item.qualification || 'Interest Pending'} • {item.location || 'Location Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-blue-500/10 text-blue-400">
                    {item.stage.replace('_', ' ')}
                  </span>
                  <button 
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      openModal(item);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg text-white transition-all scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 shadow-lg shadow-blue-500/20"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass border-white/5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-indigo-400" />
              Follow-up Schedule
            </h3>
            {schedule.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No follow-ups scheduled for today.</p>
            ) : (
              <div className="space-y-4">
                {schedule.map((f: any) => (
                  <div key={f.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-indigo-400">{new Date(f.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">Scheduled</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{f.lead?.name}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{f.notes}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl glass border-white/5">
             <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-slate-500">
               Reminders & Tasks
             </h3>
             <div className="space-y-3">
               {schedule.slice(0, 3).map((f: any, i: number) => (
                 <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                   Call {f.lead?.name} for documentation
                 </div>
               ))}
               {schedule.length === 0 && (
                 <p className="text-[10px] text-slate-600 italic">All caught up!</p>
               )}
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
