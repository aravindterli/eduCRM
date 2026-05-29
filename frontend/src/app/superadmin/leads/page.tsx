'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { superadminService } from '@/services/superadmin.service';
import { Users, Building2, Search, Filter, ArrowUpRight } from 'lucide-react';

export default function GlobalLeadsPage() {
  const [leads, setLeads] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [sector, setSector] = React.useState<string | undefined>();
  const [showSectorMenu, setShowSectorMenu] = React.useState(false);

  const fetchLeads = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await superadminService.getGlobalLeads({
        search: search || undefined,
        sector: sector === 'ALL' ? undefined : sector
      });
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch global leads:', error);
    } finally {
      setLoading(false);
    }
  }, [search, sector]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-foreground tracking-tight">Global Lead Monitor</h1>
        </div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Cross-tenant lead generation tracking</p>
      </div>

      <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                placeholder="Search all leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-6 text-sm outline-none focus:border-blue-500/30 transition-all w-80 text-foreground"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSectorMenu(!showSectorMenu)}
                className="glass border-white/5 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/5 transition-all text-foreground"
              >
                <Filter size={16} /> Sector: {sector || 'All'}
              </button>

              {showSectorMenu && (
                <div className="absolute top-full mt-2 left-0 w-48 glass border-white/10 rounded-2xl overflow-hidden z-10 shadow-2xl">
                  {['ALL', 'EDUCATION', 'REAL_ESTATE', 'HEALTHCARE'].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSector(s);
                        setShowSectorMenu(false);
                      }}
                      className="w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Live Monitoring: {leads.length} Active Leads
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Details</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Organization</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sector</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Created At</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && leads.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-20 bg-white/[0.01]" />
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <p className="text-sm text-slate-500 font-medium">No global leads found matching your criteria.</p>
                  </td>
                </tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-sm font-bold text-foreground">{lead.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{lead.email || lead.phone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-500" />
                      <span className="text-xs font-bold text-slate-300">{lead.tenant?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 uppercase">
                      {lead.tenant?.sector || 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-slate-400 font-medium">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md inline-block ${lead.tag === 'HOT' ? 'bg-red-500/10 text-red-500' :
                      lead.tag === 'WARM' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                      {lead.tag || 'NEW'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
