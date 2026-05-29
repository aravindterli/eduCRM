'use client';
import React, { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, Clock, Mail, MessageSquare, Phone, Smartphone, CheckCircle2, XCircle, Loader2, Edit2, X } from 'lucide-react';
import { useNotificationRuleStore, NotificationRule } from '@/store/useNotificationRuleStore';

const triggers = [
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

const channels = [
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'text-blue-700 border-blue-100 bg-blue-50/50' },
  { value: 'SMS', label: 'SMS', icon: Smartphone, color: 'text-emerald-700 border-emerald-100 bg-emerald-50/50' },
  { value: 'RCS', label: 'RCS', icon: Phone, color: 'text-teal-700 border-teal-100 bg-teal-50/50' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-700 border-green-100 bg-green-50/50' },
  { value: 'INTERNAL', label: 'In-App', icon: Bell, color: 'text-purple-700 border-purple-100 bg-purple-50/50' },
];

const timings = [
  { label: 'Immediately', value: 0 },
  { label: '10 Min Before', value: -10 },
  { label: '15 Min Before', value: -15 },
  { label: '30 Min Before', value: -30 },
  { label: '1 Hour Before', value: -60 },
  { label: '2 Hours Before', value: -120 },
  { label: '6 Hours Before', value: -360 },
  { label: '12 Hours Before', value: -720 },
  { label: '1 Day Before', value: -1440 },
  { label: '2 Days Before', value: -2880 },
  { label: '3 Days Before', value: -4320 },
  { label: '1 Hour After', value: 60 },
  { label: '1 Day After', value: 1440 },
  { label: '7 Days After', value: 10080 },
];

const statusMap: Record<string, { color: string; icon: React.ElementType }> = {
  PENDING: { color: 'text-amber-700 bg-amber-50 border-amber-100', icon: Clock },
  PROCESSING: { color: 'text-blue-700 bg-blue-50 border-blue-100', icon: Loader2 },
  SENT: { color: 'text-emerald-700 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
  FAILED: { color: 'text-red-700 bg-red-50 border-red-100', icon: XCircle },
  CANCELLED: { color: 'text-slate-700 bg-slate-50 border-slate-100', icon: X },
};

function timingLabel(v: number) {
  return timings.find(t => t.value === v)?.label ?? `${v}m`;
}

function ChannelTag({ ch }: { ch: string }) {
  const c = channels.find(x => x.value === ch);
  if (!c) return <span className="text-xs text-[#777]">{ch}</span>;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-[4px] border ${c.color}`}>
      <Icon size={10} />{c.label}
    </span>
  );
}

const emptyForm = () => ({ name: '', description: '', trigger: '', channel: '', offsets: [0] as number[], isActive: true });

import { createPortal } from 'react-dom';
import { useThemeStore } from '@/store/useThemeStore';

function RuleModal({ init, onSave, onClose, saving }: {
  init: ReturnType<typeof emptyForm>;
  onSave: (d: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [f, setF] = useState(init);
  const [mounted, setMounted] = useState(false);
  const { theme, accent } = useThemeStore();

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  if (!mounted) return null;

  const toggle = (v: number) => setF(p => ({ ...p, offsets: p.offsets.includes(v) ? p.offsets.filter(o => o !== v) : [...p.offsets, v] }));
  const groups = triggers.reduce((a, t) => { (a[t.group] = a[t.group] || []).push(t); return a; }, {} as Record<string, typeof triggers>);
  const valid = f.name && f.trigger && f.channel && f.offsets.length > 0;

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm theme-${theme} accent-${accent} animate-in fade-in duration-200`}>
      <div className="bg-white border border-black/8 rounded-[16px] w-full max-w-xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden text-[#1A1A1A] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-[#F9F7F4]">
          <h3 className="font-bold text-sm text-[#1A1A1A]">{init.name ? 'Edit Rule' : 'New Notification Rule'}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 text-[#888] hover:text-[#1A1A1A] transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Name & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Rule Name *</p>
              <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Follow-up Reminder"
                className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Description</p>
              <input value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional Note"
                className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]" />
            </div>
          </div>

          {/* Trigger */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Trigger Event *</p>
            <div className="relative">
              <select value={f.trigger} onChange={e => setF(p => ({ ...p, trigger: e.target.value }))}
                className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-3 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer">
                <option value="">-- Select Trigger Event --</option>
                {Object.entries(groups).map(([g, items]) => (
                  <optgroup key={g} label={g} className="bg-white text-[#555] font-semibold">
                    {items.map(t => <option key={t.value} value={t.value} className="text-[#1A1A1A] bg-white">{t.label}</option>)}
                  </optgroup>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#888] text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Channel */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Channel *</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {channels.map(ch => {
                const Icon = ch.icon;
                const active = f.channel === ch.value;
                return (
                  <button key={ch.value} type="button" onClick={() => setF(p => ({ ...p, channel: ch.value }))}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-[8px] border text-[10px] font-bold tracking-tight transition-all ${
                      active ? ch.color + ' border-current scale-105 shadow-sm' : 'bg-[#F9F7F4] border-black/8 text-[#777] hover:bg-black/5 hover:border-black/20'
                    }`}>
                    <Icon size={16} />{ch.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timings */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">When to Send * <span className="normal-case font-medium opacity-60 ml-1">(Multi-select)</span></p>
              <div className="px-2.5 py-0.5 bg-[#1A1A1A] rounded-full">
                <span className="text-[9px] text-white font-bold">{f.offsets.length} Selected</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {timings.map(t => {
                const on = f.offsets.includes(t.value);
                return (
                  <button key={t.value} type="button" onClick={() => toggle(t.value)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-[8px] border transition-all text-left text-xs ${
                      on ? 'bg-[#1A1A1A]/5 border-[#1A1A1A] text-[#1A1A1A] font-bold' : 'bg-[#F9F7F4] border-black/8 text-[#777] hover:bg-black/5'
                    }`}>
                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${on ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'border-black/20'}`}>
                      {on && <CheckCircle2 size={10} />}
                    </div>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between py-4 px-5 bg-[#F9F7F4] rounded-[12px] border border-black/5">
            <div className="space-y-0.5">
              <p className="text-[13px] font-bold text-[#1A1A1A]">Automation Active</p>
              <p className="text-[11px] text-[#888]">Notifications will be queued automatically</p>
            </div>
            <button type="button" onClick={() => setF(p => ({ ...p, isActive: !p.isActive }))} className="transition-all active:scale-95">
              {f.isActive ? <ToggleRight size={32} className="text-[#1A1A1A]" /> : <ToggleLeft size={32} className="text-[#BBB]" />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 bg-[#F9F7F4]/30 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-[8px] text-[13px] font-semibold text-[#777] hover:bg-black/5 transition-all">
            Cancel
          </button>
          <button onClick={() => onSave(f)} disabled={saving || !valid}
            className="bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-40 px-6 py-2 rounded-[8px] text-[13px] font-bold transition-all flex items-center gap-2 shadow-sm">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            <span>Save Configuration</span>
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

  const groups = triggers.reduce((a, t) => {
    const ruleCount = rules.filter(r => r.trigger === t.value).length;
    if (ruleCount > 0) (a[t.group] = a[t.group] || []).push({ ...t, ruleCount });
    return a;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-black/6 rounded-[16px] p-6 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
            Notification Automation
          </h3>
          <p className="text-[12px] text-[#999] mt-0.5">Configure rules that send messages to leads and team automatically</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }}
          className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] px-5 py-2.5 rounded-[8px] text-xs font-bold transition-all text-white self-start sm:self-auto shadow-sm">
          <Plus size={14} /> New Rule
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1.5 p-1 bg-[#F9F7F4] border border-black/6 rounded-[8px] w-fit">
        {(['rules', 'queue'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-[6px] text-xs font-semibold transition-all ${
              tab === t ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-[#777] hover:bg-black/5 hover:text-[#1A1A1A]'
            }`}>
            {t === 'rules' ? `Rules (${rules.length})` : 'Queue'}
          </button>
        ))}
      </div>

      {/* RULES TAB */}
      {tab === 'rules' && (
        <div className="space-y-5">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#1A1A1A]" size={24} /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-16 text-[#999] bg-[#F9F7F4] border border-dashed border-black/10 rounded-[16px]">
              <Bell size={32} className="mx-auto mb-3 opacity-30 text-[#1A1A1A]" />
              <p className="text-[13px] font-bold text-[#1A1A1A]">No Rules Yet</p>
              <p className="text-xs text-[#999] mt-1">Create your first automated notification rule</p>
            </div>
          ) : (
            Object.entries(groups).map(([grp, items]) => (
              <div key={grp} className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#888] px-1">{grp}</p>
                <div className="space-y-2.5">
                  {rules.filter(r => items.some((i: any) => i.value === r.trigger)).map(rule => (
                    <div key={rule.id} className={`flex items-center gap-4 p-4 rounded-[12px] border transition-all shadow-sm ${
                      rule.isActive ? 'bg-white border-black/6 hover:border-black/12' : 'bg-[#F9F7F4]/50 border-black/4 opacity-65'
                    }`}>
                      <button onClick={() => toggleRule(rule.id)} className="shrink-0 transition-all active:scale-95">
                        {rule.isActive ? <ToggleRight size={26} className="text-[#1A1A1A]" /> : <ToggleLeft size={26} className="text-[#BBB]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold text-[#1A1A1A]">{rule.name}</span>
                          <ChannelTag ch={rule.channel} />
                        </div>
                        <p className="text-xs text-[#777] mt-0.5 truncate">{triggers.find(t => t.value === rule.trigger)?.label}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-w-[200px] justify-end">
                        {rule.offsets.map(o => (
                          <span key={o} className="text-[9px] font-bold px-2 py-0.5 bg-[#F9F7F4] text-[#1A1A1A] rounded-[4px] border border-black/6">{timingLabel(o)}</span>
                        ))}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditing(rule); setModal(true); }} className="p-1.5 rounded-[6px] hover:bg-black/5 text-[#777] hover:text-[#1A1A1A] transition-all"><Edit2 size={13} /></button>
                        <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-[6px] hover:bg-red-50 text-[#777] hover:text-red-600 transition-all"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* QUEUE TAB */}
      {tab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 p-1 bg-[#F9F7F4] border border-black/6 rounded-[8px]">
              {['', 'PENDING', 'SENT', 'FAILED', 'CANCELLED'].map(s => (
                <button key={s} onClick={() => setQFilter(s)}
                  className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-all ${
                    qFilter === s ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-[#777] hover:bg-black/5 hover:text-[#1A1A1A]'
                  }`}>
                  {s ? s.charAt(0) + s.slice(1).toLowerCase() : 'All'}
                </button>
              ))}
            </div>
            <button onClick={() => fetchQueue({ status: qFilter || undefined, limit: 100 })} className="p-2 rounded-[8px] hover:bg-black/5 text-[#777] hover:text-[#1A1A1A] transition-all">
              <RefreshCw size={14} className={queueLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {queueLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#1A1A1A]" size={24} /></div>
          ) : queue.length === 0 ? (
            <div className="text-center py-16 text-[#999] bg-[#F9F7F4] border border-dashed border-black/10 rounded-[16px]">
              <Clock size={32} className="mx-auto mb-3 opacity-30 text-[#1A1A1A]" />
              <p className="text-[13px] font-bold text-[#1A1A1A]">Queue is Empty</p>
              <p className="text-xs text-[#999] mt-1">No queued notifications found</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {queue.map(item => {
                const s = statusMap[item.status] || statusMap.PENDING;
                const Icon = s.icon;
                return (
                  <div key={item.id} className={`flex items-center gap-4 p-4 rounded-[12px] border bg-white border-black/6 shadow-sm`}>
                    <Icon size={16} className={`shrink-0 ${item.status === 'PROCESSING' ? 'animate-spin' : ''} ${s.color.split(' ')[0]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-bold text-[#1A1A1A] truncate">{item.subject || item.trigger}</span>
                        <ChannelTag ch={item.channel} />
                        <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-[4px] border ${s.color}`}>{item.status}</span>
                      </div>
                      <p className="text-xs text-[#777] mt-0.5 truncate">
                        {item.contactInfo || item.recipientId || 'No Recipient'} · {new Date(item.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </p>
                      {item.errorLog && <p className="text-xs text-red-600 mt-1 font-semibold truncate bg-red-50 p-2 rounded-[6px] border border-red-100">{item.errorLog}</p>}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {item.status === 'FAILED' && (
                        <button onClick={() => retryQueued(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100 transition-all shadow-sm">
                          <RefreshCw size={11} /> Retry
                        </button>
                      )}
                      {item.status === 'PENDING' && (
                        <button onClick={() => cancelQueued(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 transition-all shadow-sm">
                          <X size={11} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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

