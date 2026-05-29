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
    <div className="bg-white border border-black/10 rounded-[16px] overflow-hidden flex flex-col shadow-sm hover:border-black/20 transition-all duration-300">
      <div className="p-5 border-b border-black/10 flex justify-between items-center bg-gray-50">
        <h2 className="font-bold text-[#1A1A1A] flex items-center gap-2 text-sm">
          <Phone size={16} className="text-emerald-600" />
          PriorityFollowUps
        </h2>
        <Link href="/follow-ups" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-500 hover:underline">
          ViewAll
        </Link>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3 max-h-[300px]">
        {todaysFollowUps.length > 0 ? todaysFollowUps.map((f: FollowUp) => (
          <div key={f.id} className="p-4 rounded-[8px] bg-slate-50/50 border border-black/5 hover:bg-slate-50 transition-all group">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-bold text-[#1A1A1A] truncate">{f.lead?.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(f.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {f.createdBy && (
                    <span className="px-2 py-0.5 rounded-[6px] bg-blue-50 text-blue-600 border border-blue-100 leading-none">
                      by {f.createdBy.name.split(' ')[0]}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleComplete(f.id)}
                disabled={loading || completingId === f.id}
                className="w-8 h-8 rounded-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 shadow-sm"
              >
                <CheckCircle2 size={16} className={completingId === f.id ? 'animate-pulse' : ''} />
              </button>
            </div>
          </div>
        )) : (
          <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">NoPendingCalls</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-black/10 bg-gray-50">
        <Link
          href="/leads"
          className="w-full py-2.5 rounded-[8px] border border-black/10 bg-white flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-[#1A1A1A] hover:border-black/20 shadow-sm transition-all"
        >
          ViewLeadPipeline
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};
