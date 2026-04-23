'use client';

import React from 'react';
import { Clock, CheckCircle2, Pencil, Plus, X, CalendarCheck, Video, Mail } from 'lucide-react';
import { useFollowUpStore } from '@/store/useFollowUpStore';

interface FollowUpPanelProps {
  leadId: string;
  initialFollowUps?: any[];
}

const toISTString = (dateInput: string | Date) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  // Offset for IST (+5.5 hours)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().slice(0, 16);
};

export const FollowUpPanel = ({ leadId, initialFollowUps = [] }: FollowUpPanelProps) => {
  const { leadFollowUps, loading, fetchByLead, create, complete, edit } = useFollowUpStore();

  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<any | null>(null);
  const [form, setForm] = React.useState({ notes: '', scheduledAt: '', type: 'TASK' });
  const [editForm, setEditForm] = React.useState({ notes: '', scheduledAt: '', type: 'TASK' });
  const [msg, setMsg] = React.useState('');
  const [completingId, setCompletingId] = React.useState<string | null>(null);

  // use store data if loaded, else fall back to parent-supplied list
  const followUps = leadFollowUps.length > 0 ? leadFollowUps : initialFollowUps;

  React.useEffect(() => {
    fetchByLead(leadId);
  }, [leadId, fetchByLead]);

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await create(leadId, form);
    if (result) {
      flash('follow-up scheduled!');
      setForm({ notes: '', scheduledAt: '' });
      setIsScheduleOpen(false);
    }
  };

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    const ok = await complete(id);
    setCompletingId(null);
    if (ok) flash('follow-up marked complete!');
  };

  const openEdit = (f: any) => {
    setEditTarget(f);
    setEditForm({
      notes: f.notes || '',
      scheduledAt: toISTString(f.scheduledAt),
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const ok = await edit(editTarget.id, editForm);
    if (ok) {
      flash('follow-up updated!');
      setEditTarget(null);
    }
  };

  const pending = followUps.filter((f: any) => !f.completedAt);
  const completed = followUps.filter((f: any) => f.completedAt);

  return (
    <section className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock size={18} className="text-blue-400" />
          follow-ups
          {pending.length > 0 && (
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full uppercase">
              {pending.length} pending
            </span>
          )}
        </h3>
        <button
          onClick={() => setIsScheduleOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg transition-colors"
        >
          <Plus size={13} />
          schedule
        </button>
      </div>

      {/* success flash */}
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 size={15} />
          {msg}
        </div>
      )}

      {/* pending follow-ups */}
      {pending.length === 0 && completed.length === 0 && (
        <p className="text-xs text-muted-foreground italic px-1">no follow-ups scheduled yet.</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((f: any) => {
            const dt = new Date(f.scheduledAt);
            const isOverdue = dt < new Date() && !f.completedAt;
            return (
              <div
                key={f.id}
                className={`p-4 rounded-2xl border flex flex-col gap-3 ${isOverdue
                  ? 'bg-red-500/5 border-red-500/15'
                  : 'bg-blue-500/5 border-blue-500/10'
                  }`}
              >
                {/* top row: time + actions */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider ${isOverdue ? 'text-red-400' : 'text-blue-400'}`}>
                      {isOverdue ? '⚠ overdue · ' : ''}{dt.toLocaleString()}
                    </p>
                    {f.notes && (
                      <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{f.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(f)}
                      title="edit"
                      className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-blue-400 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleComplete(f.id)}
                      disabled={loading || completingId === f.id}
                      title="mark complete"
                      className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-muted-foreground hover:text-emerald-400 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} className={completingId === f.id ? 'animate-pulse text-emerald-400' : ''} />
                    </button>
                  </div>
                </div>

                {/* bottom row: join meeting + invite badge */}
                {f.meetingUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={f.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <Video size={12} />
                      join meeting
                    </a>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      <Mail size={10} />
                      invite sent
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* completed follow-ups (collapsible summary) */}
      {completed.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 py-1 select-none hover:text-foreground/60 transition-colors list-none">
            <CalendarCheck size={13} className="text-emerald-500" />
            {completed.length} completed
            <span className="ml-auto text-[10px] group-open:hidden">▼ show</span>
            <span className="ml-auto text-[10px] hidden group-open:inline">▲ hide</span>
          </summary>
          <div className="mt-2 space-y-2">
            {completed.map((f: any) => (
              <div key={f.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 opacity-70">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">
                  completed · {new Date(f.completedAt).toLocaleString()}
                </p>
                {f.notes && (
                  <p className="text-xs text-foreground/60 mt-0.5 italic">{f.notes}</p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── schedule modal ────────────────────────────────── */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsScheduleOpen(false)} />
          <div className="relative w-full max-w-md glass border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <form onSubmit={handleCreate}>
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">schedule follow-up</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Mail size={10} className="text-emerald-400" />
                    a jitsi meeting link + email invite will be sent to the lead
                  </p>
                </div>
                <button type="button" onClick={() => setIsScheduleOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">follow-up type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, type: 'TASK' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${form.type === 'TASK' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      <Clock size={14} />
                      Simple Task
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, type: 'MEETING' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${form.type === 'MEETING' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      <Video size={14} />
                      Video Meeting
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1 mt-1 italic">
                    {form.type === 'MEETING' ? 'A Jitsi link and email invite will be sent.' : 'This remains an internal reminder to call.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">date & time</label>
                  <input
                    type="datetime-local"
                    required
                    value={toISTString(form.scheduledAt)}
                    onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/30 transition-all text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">notes / objective</label>
                  <textarea
                    required
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="discuss application documents, verify course interest..."
                    rows={3}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/30 transition-all text-foreground resize-none"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-border bg-white/[0.02] flex gap-3">
                <button type="button" onClick={() => setIsScheduleOpen(false)} className="flex-1 py-2.5 text-sm font-semibold hover:bg-white/5 rounded-xl transition-colors">
                  cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'scheduling...' : 'confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── edit modal ────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setEditTarget(null)} />
          <div className="relative w-full max-w-md glass border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <form onSubmit={handleEdit}>
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold">edit follow-up</h3>
                <button type="button" onClick={() => setEditTarget(null)} className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">reschedule to</label>
                  <input
                    type="datetime-local"
                    value={toISTString(editForm.scheduledAt)}
                    onChange={(e) => setEditForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/30 transition-all text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/30 transition-all text-foreground resize-none"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-border bg-white/[0.02] flex gap-3">
                <button type="button" onClick={() => setEditTarget(null)} className="flex-1 py-2.5 text-sm font-semibold hover:bg-white/5 rounded-xl transition-colors">
                  cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'saving...' : 'save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
