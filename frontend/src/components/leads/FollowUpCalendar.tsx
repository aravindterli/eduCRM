'use client';

import React from 'react';
import { Phone, CheckCircle2, Pencil, X, Clock, AlertTriangle, CalendarClock, Video, MessageSquare } from 'lucide-react';
import { useFollowUpStore } from '@/store/useFollowUpStore';
import { FollowUp } from '@/services/followUp.service';

const STAGE_COLORS: Record<string, string> = {
  NEW_LEAD: 'bg-primary/10 text-primary',
  INTERESTED: 'bg-emerald-500/10 text-emerald-400',
  CONTACT_ATTEMPTED: 'bg-amber-500/10 text-amber-400',
  COUNSELING_SCHEDULED: 'bg-blue-500/10 text-blue-400',
  APPLICATION_STARTED: 'bg-purple-500/10 text-purple-400',
  ADMISSION_CONFIRMED: 'bg-emerald-600/10 text-emerald-300',
};

function groupByDate(items: FollowUp[]): Record<string, FollowUp[]> {
  return items.reduce<Record<string, FollowUp[]>>((acc, f) => {
    const key = new Date(f.scheduledAt).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});
}

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'today';
  if (d.toDateString() === tomorrow.toDateString()) return 'tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function isOverdue(scheduledAt: string) {
  return new Date(scheduledAt) < new Date();
}

interface EditState { id: string; notes: string; scheduledAt: string }

export const FollowUpCalendar = ({ onViewLead }: { onViewLead?: (lead: any) => void }) => {
  const { upcoming, loading, fetchUpcoming, complete, edit } = useFollowUpStore();
  const [editTarget, setEditTarget] = React.useState<EditState | null>(null);
  const [msg, setMsg] = React.useState('');

  React.useEffect(() => { fetchUpcoming(); }, [fetchUpcoming]);

  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 2500); };

  const handleComplete = async (id: string) => {
    const ok = await complete(id);
    if (ok) flash('follow-up marked complete!');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const ok = await edit(editTarget.id, { notes: editTarget.notes, scheduledAt: editTarget.scheduledAt });
    if (ok) { flash('follow-up updated!'); setEditTarget(null); }
  };

  const openEdit = (f: FollowUp) =>
    setEditTarget({
      id: f.id,
      notes: f.notes || '',
      scheduledAt: new Date(f.scheduledAt).toISOString().slice(0, 16),
    });

  // today+later
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const overdueItems = upcoming.filter(f => new Date(f.scheduledAt) < todayStart);
  const upcomingItems = upcoming.filter(f => new Date(f.scheduledAt) >= todayStart);
  const grouped = groupByDate(upcomingItems);

  if (loading && upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <CalendarClock size={32} className="text-muted-foreground animate-pulse" />
        <p className="text-sm text-muted-foreground">loading follow-ups...</p>
      </div>
    );
  }

  return (
    <>
      {msg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 size={15} />
          {msg}
        </div>
      )}

      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <CalendarClock size={48} className="text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm font-medium">no pending follow-ups</p>
          <p className="text-muted-foreground/50 text-xs">schedule a follow-up from any lead's detail panel</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* overdue block */}
          {overdueItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-400" />
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest">overdue ({overdueItems.length})</h3>
              </div>
              <div className="space-y-2">
                {overdueItems.map(f => <FollowUpCard key={f.id} f={f} onComplete={handleComplete} onEdit={openEdit} onViewLead={onViewLead} overdue />)}
              </div>
            </div>
          )}

          {/* grouped upcoming */}
          {Object.entries(grouped).map(([dateStr, items]) => (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-400" />
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">{dateLabel(dateStr)}</h3>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(f => <FollowUpCard key={f.id} f={f} onComplete={handleComplete} onEdit={openEdit} onViewLead={onViewLead} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setEditTarget(null)} />
          <div className="relative w-full max-w-md glass border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <form onSubmit={handleEdit}>
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-sm">edit follow-up</h3>
                <button type="button" onClick={() => setEditTarget(null)} className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">reschedule</label>
                  <input
                    type="datetime-local"
                    value={editTarget.scheduledAt}
                    onChange={e => setEditTarget(p => p ? { ...p, scheduledAt: e.target.value } : null)}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/30 transition-all text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">notes</label>
                  <textarea
                    value={editTarget.notes}
                    onChange={e => setEditTarget(p => p ? { ...p, notes: e.target.value } : null)}
                    rows={3}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/30 transition-all text-foreground resize-none"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-border bg-white/[0.02] flex gap-3">
                <button type="button" onClick={() => setEditTarget(null)} className="flex-1 py-2.5 text-sm font-semibold hover:bg-white/5 rounded-xl transition-colors">cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                  {loading ? 'saving...' : 'save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ── card sub-component ──────────────────────────────────────────────────────
interface CardProps {
  f: FollowUp;
  overdue?: boolean;
  onComplete: (id: string) => void;
  onEdit: (f: FollowUp) => void;
  onViewLead?: (lead: any) => void;
}

const FollowUpCard = ({ f, overdue, onComplete, onEdit, onViewLead }: CardProps) => {
  const stage = f.lead?.stage || '';
  const stageClass = STAGE_COLORS[stage] || 'bg-slate-500/10 text-slate-400';
  const time = new Date(f.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`group p-4 rounded-2xl border flex gap-4 items-start transition-colors ${overdue ? 'bg-red-500/5 border-red-500/15 hover:bg-red-500/10' : 'glass border-white/5 hover:bg-white/[0.04]'
      }`}>
      {/* time */}
      <div className="text-center shrink-0 w-12">
        <p className={`text-[11px] font-bold ${overdue ? 'text-red-400' : 'text-blue-400'}`}>{time}</p>
        {overdue && <p className="text-[9px] text-red-500 uppercase font-bold">late</p>}
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-foreground">{f.lead?.name || 'unknown lead'}</p>
          {stage && (
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${stageClass}`}>
              {stage.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        {f.notes && <p className="text-xs text-foreground/60 mt-0.5 line-clamp-2">{f.notes}</p>}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {f.lead?.phone && (
            <a
              href={`tel:${f.lead.phone}`}
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              <Phone size={10} />
              {f.lead.phone}
            </a>
          )}
          {f.meetingUrl && (
            <a
              href={f.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-md transition-colors shadow shadow-blue-500/20"
            >
              <Video size={10} />
              join
            </a>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(f)}
          title="edit"
          className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-blue-400 transition-colors"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onViewLead?.(f.lead)}
          title="view engagement history"
          className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageSquare size={13} />
        </button>
        <button
          onClick={() => onComplete(f.id)}
          title="mark complete"
          className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-muted-foreground hover:text-emerald-400 transition-colors"
        >
          <CheckCircle2 size={13} />
        </button>
      </div>
    </div>
  );
};
