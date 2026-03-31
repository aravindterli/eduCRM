'use client';

import React from 'react';
import { Phone, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useFollowUpStore } from '@/store/useFollowUpStore';
import { FollowUp } from '@/services/followUp.service';
import Link from 'next/link';

export const DashboardFollowUps = () => {
  const { upcoming, fetchUpcoming, complete, loading } = useFollowUpStore();
  const [completingId, setCompletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  // 'upcoming' already filtered by backend to be PENDING and soon
  const todaysFollowUps = upcoming.slice(0, 5);

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    await complete(id);
    setCompletingId(null);
  };

  return (
    <div className="glass rounded-3xl border-white/5 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <h2 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
          <Phone size={18} className="text-emerald-400" />
          Priority Follow-ups
        </h2>
        <Link href="/follow-ups" className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">
          View All
        </Link>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {todaysFollowUps.length > 0 ? todaysFollowUps.map((f: FollowUp) => (
          <div key={f.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all group">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{f.lead?.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <Clock size={10} />
                  {new Date(f.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button 
                onClick={() => handleComplete(f.id)}
                disabled={loading || completingId === f.id}
                className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={16} className={completingId === f.id ? 'animate-pulse' : ''} />
              </button>
            </div>
          </div>
        )) : (
          <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No pending calls</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-white/[0.01]">
         <Link 
            href="/leads"
            className="w-full py-2.5 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5 transition-all"
         >
           View Lead Pipeline
           <ChevronRight size={14} />
         </Link>
      </div>
    </div>
  );
};
