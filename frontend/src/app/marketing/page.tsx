
'use client';

import React from 'react';
import {
  Megaphone, Plus, Search, Calendar, MessageSquare,
  Check, X, BarChart3, Users, Send, Loader2, Globe, Mail, Phone
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const channelStyle: Record<string, string> = {
  WHATSAPP: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  EMAIL:    'bg-blue-50 text-blue-700 border border-blue-100',
  SMS:      'bg-amber-50 text-amber-700 border border-amber-100',
};

const sourceStyle: Record<string, string> = {
  META:    'bg-indigo-50 text-indigo-700 border border-indigo-100',
  GOOGLE:  'bg-sky-50 text-sky-700 border border-sky-100',
  ORGANIC: 'bg-teal-50 text-teal-700 border border-teal-100',
  OTHER:   'bg-[#F5F1EB] text-[#666] border border-black/6',
};

const statusStyle: Record<string, string> = {
  COMPLETED:   'bg-emerald-50 text-emerald-700 border border-emerald-100',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border border-blue-100',
  SCHEDULED:   'bg-violet-50 text-violet-700 border border-violet-100',
  DRAFT:       'bg-[#F5F1EB] text-[#666] border border-black/6',
};

const channelIcon: Record<string, React.ReactNode> = {
  WHATSAPP: <MessageSquare size={12} />,
  EMAIL:    <Mail size={12} />,
  SMS:      <Phone size={12} />,
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white border border-black/6 rounded-[16px] p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="text-[11px] font-semibold text-[#BBB] uppercase tracking-wide">All time</span>
      </div>
      <div>
        <p className="text-[22px] font-bold text-[#1A1A1A] tracking-tight leading-none">{value}</p>
        <p className="text-xs text-[#888] mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showStatsModal, setShowStatsModal] = React.useState(false);
  const [selectedCampaignStats, setSelectedCampaignStats] = React.useState<any>(null);
  const [fetchingStats, setFetchingStats] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('');
  const [filterChannel, setFilterChannel] = React.useState('');

  const [newCampaign, setNewCampaign] = React.useState({
    name: '',
    channel: 'WHATSAPP',
    source: '',
    templateId: '',
    audienceFilters: { city: '', tag: '', stage: '', leadSource: '' },
    scheduledAt: '',
  });

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  React.useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${backendUrl}/marketing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCampaigns(await res.json());
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${backendUrl}/marketing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCampaign),
      });
      if (res.ok) {
        setShowCreateModal(false);
        fetchCampaigns();
        setNewCampaign({ name: '', channel: 'WHATSAPP', source: '', templateId: '',
          audienceFilters: { city: '', tag: '', stage: '', leadSource: '' }, scheduledAt: '' });
      }
    } catch { /* silent */ }
  };

  const handleExecute = async (id: string) => {
    try {
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${backendUrl}/marketing/${id}/execute`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchCampaigns();
    } catch { /* silent */ }
  };

  const handleViewStats = async (id: string) => {
    setFetchingStats(true);
    try {
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${backendUrl}/marketing/${id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { setSelectedCampaignStats(await res.json()); setShowStatsModal(true); }
    } catch { /* silent */ } finally {
      setFetchingStats(false);
    }
  };

  const filtered = campaigns.filter((c) => {
    const matchSearch  = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus  = !filterStatus  || c.status  === filterStatus;
    const matchChannel = !filterChannel || c.channel === filterChannel;
    return matchSearch && matchStatus && matchChannel;
  });

  const inputCls = 'w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]';
  const labelCls = 'block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-1.5';

  return (
    <MainLayout>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Marketing Campaigns</h1>
          <p className="text-sm text-[#999] mt-0.5">Manage and track your outbound marketing efforts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[8px] transition-colors duration-200 self-start sm:self-auto"
        >
          <Plus size={15} /> Create Campaign
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Campaigns" value={campaigns.length} icon={Megaphone} color="#6366F1" />
        <StatCard label="Active" value={campaigns.filter(c => c.status === 'IN_PROGRESS' || c.status === 'SCHEDULED').length} icon={Calendar} color="#0D9488" />
        <StatCard label="Completed" value={campaigns.filter(c => c.status === 'COMPLETED').length} icon={Check} color="#059669" />
        <StatCard label="Leads Generated" value="—" icon={Users} color="#D97706" />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-black/6 rounded-[16px] p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BBB]" />
          <input
            type="text"
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F9F7F4] border border-black/8 rounded-[8px] text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 transition-all placeholder:text-[#BBB]"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#F9F7F4] border border-black/8 rounded-[8px] px-3 py-2 text-[13px] text-[#555] outline-none focus:border-black/20 transition-all">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}
          className="bg-[#F9F7F4] border border-black/8 rounded-[8px] px-3 py-2 text-[13px] text-[#555] outline-none focus:border-black/20 transition-all">
          <option value="">All Channels</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
        </select>
      </div>

      {/* ── Campaign Table ── */}
      <div className="bg-white border border-black/6 rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#F9F7F4] border-b border-black/6">
                {['Campaign Name', 'Channel', 'Source', 'Audience', 'Scheduled At', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-[#888] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-[#BBB] text-[13px]">
                  <Loader2 size={18} className="animate-spin mx-auto mb-2" /> Loading campaigns…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-[#BBB] text-[13px]">
                  <Megaphone size={32} className="mx-auto mb-3 opacity-20" />
                  No campaigns found. Create one to get started.
                </td></tr>
              ) : filtered.map((camp) => (
                <tr key={camp.id} className="hover:bg-[#F9F7F4] transition-colors">
                  <td className="px-5 py-4 font-semibold text-[#1A1A1A]">{camp.name}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${channelStyle[camp.channel] ?? channelStyle.WHATSAPP}`}>
                      {channelIcon[camp.channel]}
                      {camp.channel}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${sourceStyle[camp.source] ?? sourceStyle.OTHER}`}>
                      {camp.source || 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#666]">
                    {camp.audienceFilters
                      ? <div className="flex flex-wrap gap-1">
                          {Object.entries(camp.audienceFilters).map(([k, v]: [string, any]) => v && (
                            <span key={k} className="bg-[#F5F1EB] text-[#666] text-[10px] px-1.5 py-0.5 rounded-[4px] font-medium">{k}: {v}</span>
                          ))}
                        </div>
                      : <span className="text-[#BBB]">All Leads</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-[#666]">
                    {camp.scheduledAt ? new Date(camp.scheduledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Immediate'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusStyle[camp.status] ?? statusStyle.DRAFT}`}>
                      {camp.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {camp.status === 'DRAFT' && (
                      <button onClick={() => handleExecute(camp.id)}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                        <Send size={13} /> Execute
                      </button>
                    )}
                    {(camp.status === 'COMPLETED' || camp.status === 'IN_PROGRESS') && (
                      <button onClick={() => handleViewStats(camp.id)} disabled={fetchingStats}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-[#555] hover:text-[#1A1A1A] transition-colors disabled:opacity-50">
                        {fetchingStats ? <Loader2 size={13} className="animate-spin" /> : <BarChart3 size={13} />}
                        View Stats
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Campaign Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-black/10 rounded-[16px] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-black/6 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">Create New Campaign</h3>
                <p className="text-[11px] text-[#999] mt-0.5">Define your campaign and audience</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-[8px] hover:bg-[#F5F1EB] flex items-center justify-center text-[#888] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[60vh]">
              <div>
                <label className={labelCls}>Campaign Name</label>
                <input type="text" value={newCampaign.name} placeholder="e.g. Summer Intake 2026"
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Channel</label>
                  <select value={newCampaign.channel}
                    onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}
                    className={inputCls}>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Source</label>
                  <select value={newCampaign.source}
                    onChange={(e) => setNewCampaign({ ...newCampaign, source: e.target.value })}
                    className={inputCls}>
                    <option value="">Select source</option>
                    <option value="META">Meta (Facebook / Insta)</option>
                    <option value="GOOGLE">Google Ads</option>
                    <option value="ORGANIC">Organic</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Audience Filters</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'city', placeholder: 'City' },
                    { key: 'tag',  placeholder: 'Tag (e.g. HOT)' },
                  ].map(({ key, placeholder }) => (
                    <input key={key} type="text" placeholder={placeholder}
                      value={(newCampaign.audienceFilters as any)[key]}
                      onChange={(e) => setNewCampaign({ ...newCampaign, audienceFilters: { ...newCampaign.audienceFilters, [key]: e.target.value } })}
                      className={inputCls} />
                  ))}
                  <input type="text" placeholder="Lead Source (e.g. META)" className={`${inputCls} col-span-2`}
                    value={newCampaign.audienceFilters.leadSource}
                    onChange={(e) => setNewCampaign({ ...newCampaign, audienceFilters: { ...newCampaign.audienceFilters, leadSource: e.target.value } })} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Schedule Time (Optional)</label>
                <input type="datetime-local" value={newCampaign.scheduledAt}
                  onChange={(e) => setNewCampaign({ ...newCampaign, scheduledAt: e.target.value })}
                  className={inputCls} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-black/6 bg-[#F9F7F4] flex gap-3">
              <button onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 text-[13px] font-semibold text-[#555] hover:text-[#1A1A1A] hover:bg-black/5 rounded-[8px] transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={!newCampaign.name}
                className="flex-1 bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-50 text-white py-2.5 rounded-[8px] text-[13px] font-bold transition-colors">
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Modal ── */}
      {showStatsModal && selectedCampaignStats && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-black/10 rounded-[16px] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-black/6 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">Campaign Statistics</h3>
                <p className="text-[11px] text-[#999] mt-0.5">{selectedCampaignStats.campaignName}</p>
              </div>
              <button onClick={() => setShowStatsModal(false)} className="w-8 h-8 rounded-[8px] hover:bg-[#F5F1EB] flex items-center justify-center text-[#888] transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 max-h-[65vh]">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#666]">Status</span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusStyle[selectedCampaignStats.status] ?? statusStyle.DRAFT}`}>
                  {selectedCampaignStats.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Counter Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F9F7F4] border border-black/6 rounded-[12px] p-4">
                  <p className="text-[10px] font-bold text-[#999] uppercase tracking-wide">Total Targeted</p>
                  <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{selectedCampaignStats.totalTargeted}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-[12px] p-4">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Leads Generated</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{selectedCampaignStats.leadsGenerated}</p>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                {[
                  { label: 'Sent',      key: 'sent',      color: '#0D9488', base: 'totalTargeted' },
                  { label: 'Delivered', key: 'delivered', color: '#6366F1', base: 'totalTargeted' },
                  { label: 'Opened',    key: 'opened',    color: '#7C3AED', base: 'totalTargeted' },
                  { label: 'Clicked',   key: 'clicked',   color: '#0EA5E9', base: 'totalTargeted' },
                  { label: 'Replied',   key: 'replied',   color: '#EC4899', base: 'totalTargeted' },
                  { label: 'Failed',    key: 'failed',    color: '#EF4444', base: 'totalTargeted' },
                  { label: 'Converted', key: 'converted', color: '#059669', base: 'leadsGenerated' },
                ].map(({ label, key, color, base }) => {
                  const val  = selectedCampaignStats[key]    ?? 0;
                  const total = selectedCampaignStats[base]  ?? 0;
                  const pct  = total ? Math.round((val / total) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-[12px] mb-1.5">
                        <span className="font-semibold text-[#555]">{label}</span>
                        <span className="font-bold text-[#1A1A1A]">{val} <span className="text-[#BBB] font-normal">/ {total}</span></span>
                      </div>
                      <div className="h-2 bg-[#F5F1EB] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-black/6 bg-[#F9F7F4]">
              <button onClick={() => setShowStatsModal(false)}
                className="w-full py-2.5 text-[13px] font-semibold bg-[#1A1A1A] text-white rounded-[8px] hover:bg-[#333] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
