'use client';

import { Search, Filter, Plus, ExternalLink, Upload, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LeadForm } from '@/components/leads/LeadForm';
import { LeadDetails } from '@/components/leads/LeadDetails';
import { LeadImportModal } from '@/components/leads/LeadImportModal';
import { BulkWhatsAppDrawer } from '@/components/leads/BulkWhatsAppDrawer';
import { useLeadStore } from '@/store/useLeadStore';
import React from 'react';

const stageColors: Record<string, string> = {
  NEW_LEAD: 'bg-primary/10 text-primary',
  INTERESTED: 'bg-emerald-500/10 text-emerald-400',
  CONTACT_ATTEMPTED: 'bg-amber-500/10 text-amber-400',
};

export default function LeadsPage() {
  // Destructure reactive state from the store
  const { 
    leads, 
    fetchLeads, 
    loading, 
    total, 
    page, 
    limit, 
    totalPages,
    deleteLead 
  } = useLeadStore();

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const campaignFilter = searchParams?.get('campaignId');

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<any>(null);
  const [leadToEdit, setLeadToEdit] = React.useState<any>(null);
  const [leadToDelete, setLeadToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = React.useState<string[]>([]);
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = React.useState(false);
  const [staff, setStaff] = React.useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = React.useState<string>('');

  React.useEffect(() => {
    const fetchStaff = async () => {
      const token = localStorage.getItem('educrm_token');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStaff(data.filter((u: any) => u.role !== 'ADMIN'));
        }
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      }
    };
    fetchStaff();
  }, []);

  React.useEffect(() => {
    fetchLeads(1, limit, selectedOwner ? { assignedId: selectedOwner } : {});
  }, [fetchLeads, selectedOwner]);

  const filteredLeads = React.useMemo(() => {
    if (!campaignFilter) return leads;
    return leads.filter(l => l.campaignId === campaignFilter);
  }, [leads, campaignFilter]);

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <MainLayout>
      <LeadForm
        isOpen={isAddOpen || !!leadToEdit}
        onClose={() => {
          setIsAddOpen(false);
          setLeadToEdit(null);
        }}
        initialData={leadToEdit}
      />
      <LeadImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <LeadDetails
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
      <BulkWhatsAppDrawer
        isOpen={isBulkWhatsAppOpen}
        onClose={() => setIsBulkWhatsAppOpen(false)}
        selectedLeadIds={selectedLeadIds}
        onSuccess={() => {
          setSelectedLeadIds([]);
          fetchLeads(page, limit);
        }}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {campaignFilter ? 'Campaign Leads' : 'Lead Management'}
          </h1>
          <p className="text-slate-400 text-sm">
            {campaignFilter ? `Showing leads for the selected campaign` : 'Track and manage your admission leads'}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-muted-foreground px-4 py-2 rounded-xl transition-all border border-border"
          >
            <Upload size={18} />
            <span className="text-sm">Import</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            <span className="text-sm">Add New</span>
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              placeholder="Search leads..."
              className="w-full bg-white/5 border-none rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 ring-white/10"
            />
          </div>
           <div className="flex gap-2">
             <select
               value={selectedOwner}
               onChange={(e) => {
                 setSelectedOwner(e.target.value);
                 fetchLeads(1, limit, { assignedId: e.target.value || undefined });
               }}
               className="bg-white/5 border-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 ring-white/10 text-slate-300 cursor-pointer"
             >
               <option value="">All Staff</option>
               {staff.map(u => (
                 <option key={u.id} value={u.id} className="bg-slate-900 border-none">
                   {u.name} ({u.role.toLowerCase()})
                 </option>
               ))}
             </select>
             <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition-colors">
               <Filter size={16} />
               Filter
             </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium w-10">
                  <div
                    className={`w-5 h-5 rounded border ${selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? 'bg-primary border-primary text-white' : 'border-white/10 hover:border-white/20'} flex items-center justify-center cursor-pointer transition-all`}
                    onClick={toggleSelectAll}
                  >
                    {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 && <div className="w-2.5 h-1 bg-white rounded-full" />}
                    {selectedLeadIds.length > 0 && selectedLeadIds.length < filteredLeads.length && <div className="w-2.5 h-0.5 bg-white/50 rounded-full" />}
                  </div>
                </th>
                <th className="px-6 py-4 font-medium">Lead Info</th>
                <th className="px-6 py-4 font-medium hidden sm:table-cell">Stage</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Source</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Owner</th>
                <th className="px-6 py-4 font-medium hidden sm:table-cell">Created At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-500 italic">
                    Loading leads from server...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-500 italic">
                    No leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group ${selectedLeadIds.includes(lead.id) ? 'bg-white/[0.03]' : ''}`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="py-4 px-6">
                      <div
                        className={`w-5 h-5 rounded border ${selectedLeadIds.includes(lead.id) ? 'bg-primary border-primary text-white' : 'border-white/10 group-hover:border-white/20'} flex items-center justify-center transition-all`}
                        onClick={(e) => toggleSelectLead(e, lead.id)}
                      >
                        {selectedLeadIds.includes(lead.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs ring-1 ring-white/5 shrink-0">
                          {lead.name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm group-hover:text-blue-400 transition-colors truncate">{lead.name}</p>
                            {lead.tag && (
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                                lead.tag === 'HOT' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                lead.tag === 'WARM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                                'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                              }`}>
                                {lead.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${stageColors[lead.stage] || 'bg-slate-500/10 text-slate-400'}`}>
                        {lead.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm hidden md:table-cell">
                      <span className="text-slate-400">{lead.leadSource}</span>
                    </td>
                    <td className="px-6 py-4 text-sm hidden md:table-cell">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                            {lead.assignedTo.name[0]}
                          </div>
                          <span className="text-slate-300 font-medium">{lead.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 hidden sm:table-cell">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeadToEdit(lead);
                          }}
                          className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeadToDelete(lead);
                          }}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg text-slate-400"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500">
              Showing <span className="text-white font-medium">{(page - 1) * limit + 1}</span> to{' '}
              <span className="text-white font-medium">
                {Math.min(page * limit, total)}
              </span> of{' '}
              <span className="text-white font-medium">{total}</span> leads
            </p>
            <select
              value={limit}
              onChange={(e) => fetchLeads(1, Number(e.target.value))}
              className="bg-white/5 border-none rounded-lg text-[10px] text-slate-400 outline-none focus:ring-1 ring-white/10 px-2 py-1 cursor-pointer"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLeads(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-white/5 text-xs font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/5"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLeads(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setLeadToDelete(null)} />
          <div className="relative w-full max-w-sm glass rounded-3xl border-white/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">Delete Lead?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete <span className="font-semibold text-foreground">{leadToDelete.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLeadToDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  const success = await deleteLead(leadToDelete.id);
                  setIsDeleting(false);
                  if (success) setLeadToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-6 px-6 py-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 pr-6 border-r border-white/10">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {selectedLeadIds.length}
            </span>
            <span className="text-sm font-medium text-white">Leads selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBulkWhatsAppOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-bold transition-all border border-emerald-500/20"
            >
              <MessageSquare size={16} />
              Send WhatsApp
            </button>
            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
