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
      {/* page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <CalendarClock size={24} className="text-blue-400" />
          <h1 className="text-2xl font-bold">follow-ups</h1>
        </div>
        <p className="text-slate-400 text-sm ml-9">agenda view of all pending lead follow-ups</p>
      </div>

      {/* summary banner */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl border border-white/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Clock size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide">total pending</p>
          </div>
        </div>
        <div className="glass rounded-2xl border border-white/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{dueToday.length}</p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide">due today</p>
          </div>
        </div>
        <div className="glass rounded-2xl border border-white/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{overdue.length}</p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide">overdue</p>
          </div>
        </div>
      </div>

      {/* calendar / agenda */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        <FollowUpCalendar onViewLead={setSelectedLead} />
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
