'use client';
import React, { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, Clock, Mail, MessageSquare, Phone, Smartphone, CheckCircle2, XCircle, Loader2, Edit2, X } from 'lucide-react';
import { useNotificationRuleStore, NotificationRule } from '@/store/useNotificationRuleStore';

const TRIGGERS = [
  { value: 'LEAD_CREATED', label: 'Lead Created', group: 'Leads' },
  { value: 'LEAD_ASSIGNED', label: 'Lead Assigned', group: 'Leads' },
  { value: 'LEAD_STAGE_CHANGED', label: 'Lead Stage Changed', group: 'Leads' },
  { value: 'LEAD_LOST', label: 'Lead Marked as Lost', group: 'Leads' },
  { value: 'FOLLOW_UP_CREATED', label: 'Follow-up / Call Scheduled', group: 'Follow-ups' },
  { value: 'FOLLOW_UP_OVERDUE', label: 'Follow-up Overdue', group: 'Follow-ups' },
  { value: 'COUNSELING_SCHEDULED', label: 'Counseling Session Scheduled', group: 'Counseling' },
  { value: 'WEBINAR_REGISTERED', label: 'Webinar Registration', group: 'Webinars' },
  { value: 'APPLICATION_STARTED', label: 'Application Started', group: 'Applications' },
  { value: 'APPLICATION_SUBMITTED', label: 'Application Submitted', group: 'Applications' },
  { value: 'APPLICATION_REJECTED', label: 'Application Rejected', group: 'Applications' },
  { value: 'ADMISSION_CONFIRMED', label: 'Admission Confirmed', group: 'Admissions' },
  { value: 'ADMISSION_CONFIRMED_FINANCE', label: 'Admission Confirmed (Finance)', group: 'Admissions' },
  { value: 'FEE_DUE_REMINDER', label: 'Fee Due Reminder', group: 'Finance' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received', group: 'Finance' },
  { value: 'DAILY_SUMMARY', label: 'Daily Summary', group: 'Automation' },
  { value: 'WEEKLY_FINANCE_REPORT', label: 'Weekly Finance Report', group: 'Automation' },
  { value: 'RE_ENGAGEMENT_DRIP', label: 'Re-engagement Drip', group: 'Automation' },
];

const CHANNELS = [
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'text-blue-400 border-blue-500 bg-blue-600/20' },
  { value: 'SMS', label: 'SMS', icon: Smartphone, color: 'text-emerald-400 border-emerald-500 bg-emerald-600/20' },
  { value: 'RCS', label: 'RCS', icon: Phone, color: 'text-teal-400 border-teal-500 bg-teal-600/20' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-400 border-green-500 bg-green-600/20' },
  { value: 'INTERNAL', label: 'In-App', icon: Bell, color: 'text-purple-400 border-purple-500 bg-purple-600/20' },
];

const TIMINGS = [
  { label: 'Immediately', value: 0 },
  { label: '10 min before', value: -10 },
  { label: '15 min before', value: -15 },
  { label: '30 min before', value: -30 },
  { label: '1 hour before', value: -60 },
  { label: '2 hours before', value: -120 },
  { label: '6 hours before', value: -360 },
  { label: '12 hours before', value: -720 },
  { label: '1 day before', value: -1440 },
  { label: '2 days before', value: -2880 },
  { label: '3 days before', value: -4320 },
  { label: '1 hour after', value: 60 },
  { label: '1 day after', value: 1440 },
  { label: '7 days after', value: 10080 },
];

const STATUS_MAP: Record<string, { color: string; icon: React.ElementType }> = {
  PENDING: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock },
  PROCESSING: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Loader2 },
  SENT: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  FAILED: { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle },
  CANCELLED: { color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: X },
};

function timingLabel(v: number) {
  return TIMINGS.find(t => t.value === v)?.label ?? `${v}m`;
}

function ChannelTag({ ch }: { ch: string }) {
  const c = CHANNELS.find(x => x.value === ch);
  if (!c) return <span className="text-xs text-slate-500">{ch}</span>;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${c.color}`}>
      <Icon size={10} />{c.label}
    </span>
  );
}

const emptyForm = () => ({ name: '', description: '', trigger: '', channel: '', offsets: [0] as number[], isActive: true });

import { createPortal } from 'react-dom';

function RuleModal({ init, onSave, onClose, saving }: {
  init: ReturnType<typeof emptyForm>;
  onSave: (d: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [f, setF] = useState(init);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  if (!mounted) return null;

  const toggle = (v: number) => setF(p => ({ ...p, offsets: p.offsets.includes(v) ? p.offsets.filter(o => o !== v) : [...p.offsets, v] }));
  const groups = TRIGGERS.reduce((a, t) => { (a[t.group] = a[t.group] || []).push(t); return a; }, {} as Record<string, typeof TRIGGERS>);
  const valid = f.name && f.trigger && f.channel && f.offsets.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl flex flex-col max-h-[90vh] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50">
          <h3 className="font-bold text-base">{init.name ? 'edit rule' : 'new notification rule'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Name & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">rule name *</p>
              <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. follow-up reminder"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">description</p>
              <input value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))}
                placeholder="optional note"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>

          {/* Trigger */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">trigger event *</p>
            <div className="relative">
              <select value={f.trigger} onChange={e => setF(p => ({ ...p, trigger: e.target.value }))}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
                <option value="">— select trigger —</option>
                {Object.entries(groups).map(([g, items]) => (
                  <optgroup key={g} label={g} className="bg-slate-900 text-slate-400">
                    {items.map(t => <option key={t.value} value={t.value} className="text-white">{t.label}</option>)}
                  </optgroup>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <Plus size={14} className="rotate-45" />
              </div>
            </div>
          </div>

          {/* Channel */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">channel *</p>
            <div className="grid grid-cols-5 gap-2">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                const active = f.channel === ch.value;
                return (
                  <button key={ch.value} type="button" onClick={() => setF(p => ({ ...p, channel: ch.value }))}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[10px] font-bold tracking-tight transition-all ${active ? ch.color : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:border-white/20'}`}>
                    <Icon size={16} />{ch.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">when to send * <span className="normal-case font-medium opacity-50 ml-1">(multi-select)</span></p>
              <div className="px-2 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20">
                <span className="text-[10px] text-blue-400 font-bold">{f.offsets.length} selected</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TIMINGS.map(t => {
                const on = f.offsets.includes(t.value);
                return (
                  <button key={t.value} type="button" onClick={() => toggle(t.value)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${on ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${on ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20'}`}>
                      {on && <CheckCircle2 size={10} />}
                    </div>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between py-4 px-5 bg-white/5 rounded-2xl border border-white/5">
            <div className="space-y-0.5">
              <p className="text-sm font-bold">automation active</p>
              <p className="text-[11px] text-slate-500">notifications will be queued automatically</p>
            </div>
            <button type="button" onClick={() => setF(p => ({ ...p, isActive: !p.isActive }))} className="transition-all active:scale-90">
              {f.isActive ? <ToggleRight size={36} className="text-blue-500" /> : <ToggleLeft size={36} className="text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-white/5 bg-slate-900/50 flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all">
            cancel
          </button>
          <button onClick={() => onSave(f)} disabled={saving || !valid}
            className="relative group bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-10 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            <span>save configuration</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function NotificationRules() {

  const { rules, queue, loading, queueLoading, fetchRules, createRule, updateRule, deleteRule, toggleRule, fetchQueue, cancelQueued, retryQueued } = useNotificationRuleStore();
  const [tab, setTab] = useState<'rules' | 'queue'>('rules');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<NotificationRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [qFilter, setQFilter] = useState('');

  useEffect(() => { fetchRules(); }, []);
  useEffect(() => { if (tab === 'queue') fetchQueue({ status: qFilter || undefined, limit: 100 }); }, [tab, qFilter]);

  const save = async (d: any) => {
    setSaving(true);
    const ok = editing ? await updateRule(editing.id, d) : await createRule(d);
    setSaving(false);
    if (ok) { setModal(false); setEditing(null); }
  };

  const groups = TRIGGERS.reduce((a, t) => {
    const ruleCount = rules.filter(r => r.trigger === t.value).length;
    if (ruleCount > 0) (a[t.group] = a[t.group] || []).push({ ...t, ruleCount });
    return a;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold">notification automation</h3>
          <p className="text-xs text-slate-500 mt-0.5">rules that send messages to leads & team automatically</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-bold transition-all">
          <Plus size={15} /> new rule
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 border border-white/5 rounded-xl w-fit">
        {(['rules', 'queue'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            {t === 'rules' ? `rules (${rules.length})` : 'queue'}
          </button>
        ))}
      </div>

      {/* RULES */}
      {tab === 'rules' && (
        <div className="space-y-5">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={22} /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-14 text-slate-500">
              <Bell size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">no rules yet — create your first rule</p>
            </div>
          ) : (
            Object.entries(groups).map(([grp, items]) => (
              <div key={grp}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">{grp}</p>
                <div className="space-y-1.5">
                  {rules.filter(r => items.some((i: any) => i.value === r.trigger)).map(rule => (
                    <div key={rule.id} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${rule.isActive ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-white/2 border-white/5 opacity-50'}`}>
                      <button onClick={() => toggleRule(rule.id)} className="shrink-0">
                        {rule.isActive ? <ToggleRight size={22} className="text-blue-500" /> : <ToggleLeft size={22} className="text-slate-500" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{rule.name}</span>
                          <ChannelTag ch={rule.channel} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{TRIGGERS.find(t => t.value === rule.trigger)?.label}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                        {rule.offsets.map(o => (
                          <span key={o} className="text-[10px] font-semibold px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">{timingLabel(o)}</span>
                        ))}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditing(rule); setModal(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Edit2 size={13} /></button>
                        <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* QUEUE */}
      {tab === 'queue' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
              {['', 'PENDING', 'SENT', 'FAILED', 'CANCELLED'].map(s => (
                <button key={s} onClick={() => setQFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${qFilter === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                  {s || 'all'}
                </button>
              ))}
            </div>
            <button onClick={() => fetchQueue({ status: qFilter || undefined, limit: 100 })} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-all">
              <RefreshCw size={13} className={queueLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {queueLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={22} /></div>
          ) : queue.length === 0 ? (
            <div className="text-center py-14 text-slate-500">
              <Clock size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">queue is empty</p>
            </div>
          ) : (
            queue.map(item => {
              const s = STATUS_MAP[item.status] || STATUS_MAP.PENDING;
              const Icon = s.icon;
              return (
                <div key={item.id} className={`flex items-center gap-3 p-3.5 rounded-xl border ${s.color}`}>
                  <Icon size={15} className={`shrink-0 ${item.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate">{item.subject || item.trigger}</span>
                      <ChannelTag ch={item.channel} />
                      <span className={`text-[10px] font-bold uppercase`}>{item.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {item.contactInfo || item.recipientId || 'no recipient'} · {new Date(item.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                    {item.errorLog && <p className="text-xs text-red-400 mt-0.5 truncate">{item.errorLog}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {item.status === 'FAILED' && (
                      <button onClick={() => retryQueued(item.id)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all">
                        <RefreshCw size={10} /> retry
                      </button>
                    )}
                    {item.status === 'PENDING' && (
                      <button onClick={() => cancelQueued(item.id)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all">
                        <X size={10} /> cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {modal && (
        <RuleModal
          init={editing ? { name: editing.name, description: editing.description || '', trigger: editing.trigger, channel: editing.channel, offsets: editing.offsets, isActive: editing.isActive } : emptyForm()}
          onSave={save}
          onClose={() => { setModal(false); setEditing(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}
