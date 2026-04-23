'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FollowUpCalendar } from '@/components/leads/FollowUpCalendar';
import { LeadDetails } from '@/components/leads/LeadDetails';
import { useFollowUpStore } from '@/store/useFollowUpStore';
import { CalendarClock, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

export default function FollowUpsPage() {
  const { upcoming, fetchUpcoming } = useFollowUpStore();
  const [selectedLead, setSelectedLead] = React.useState<any>(null);

  React.useEffect(() => { fetchUpcoming(); }, [fetchUpcoming]);

  const now = new Date();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const overdue = upcoming.filter(f => new Date(f.scheduledAt) < todayStart);
  const dueToday = upcoming.filter(f => {
    const d = new Date(f.scheduledAt);
    return d >= todayStart && d <= todayEnd;
  });

  return (
    <MainLayout>
      {/* page header - COMPACT */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <CalendarClock size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">follow-ups</h1>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">meeting agenda</p>
          </div>
        </div>
      </div>

      {/* summary banner - SLIM */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass-premium rounded-2xl border border-white/5 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Clock size={16} className="text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">{upcoming.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">pending</p>
          </div>
        </div>
        <div className="glass-premium rounded-2xl border border-white/5 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">{dueToday.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">today</p>
          </div>
        </div>
        <div className="glass-premium rounded-2xl border border-white/5 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-red-400 leading-none">{overdue.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">overdue</p>
          </div>
        </div>
      </div>

      {/* calendar / agenda - FITTED */}
      <div className="h-[calc(100vh-210px)]">
        <FollowUpCalendar 
          tasks={upcoming.filter(f => f.meetingUrl)} 
          onSelectTask={(lead) => setSelectedLead(lead)} 
          onCompleteTask={async (id) => {
            const { useFollowUpStore } = await import('@/store/useFollowUpStore');
            useFollowUpStore.getState().complete(id);
          }}
        />
      </div>

      {/* lead context drawer */}
      <LeadDetails 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)} 
        lead={selectedLead} 
      />
    </MainLayout>
  );
}
