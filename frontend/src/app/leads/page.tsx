'use client';

import { Search, Filter, Plus, MoreVertical, ExternalLink, Upload, Phone, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LeadForm } from '@/components/leads/LeadForm';
import { LeadDetails } from '@/components/leads/LeadDetails';
import { LeadImportModal } from '@/components/leads/LeadImportModal';
import { useLeadStore } from '@/store/useLeadStore';
import React from 'react';

const stageColors: Record<string, string> = {
  NEW_LEAD: 'bg-primary/10 text-primary',
  INTERESTED: 'bg-emerald-500/10 text-emerald-400',
  CONTACT_ATTEMPTED: 'bg-amber-500/10 text-amber-400',
};

export default function LeadsPage() {
  const { leads, fetchLeads, loading } = useLeadStore();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const campaignFilter = searchParams?.get('campaignId');
  
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<any>(null);
  const [leadToEdit, setLeadToEdit] = React.useState<any>(null);
  const [leadToDelete, setLeadToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { deleteLead } = useLeadStore();

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = React.useMemo(() => {
    if (!campaignFilter) return leads;
    return leads.filter(l => l.campaignId === campaignFilter);
  }, [leads, campaignFilter]);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {campaignFilter ? 'Campaign Leads' : 'Lead Management'}
          </h1>
          <p className="text-slate-400 text-sm">
            {campaignFilter ? `Showing leads for the selected campaign` : 'Track and manage your admission leads'}
          </p>
          {campaignFilter && (
            <button 
              onClick={() => window.history.pushState({}, '', '/leads')}
              className="text-[10px] text-primary hover:underline mt-1"
            >
              Clear filter
            </button>
          )}
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
                <th className="px-6 py-4 font-medium">Lead Info</th>
                <th className="px-6 py-4 font-medium hidden sm:table-cell">Stage</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Source</th>
                <th className="px-6 py-4 font-medium hidden sm:table-cell">Created At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500 italic">
                    Loading leads from server...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500 italic">
                    {campaignFilter ? 'No leads found for this campaign.' : 'No leads found. Start by adding one!'}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs ring-1 ring-white/5 shrink-0">
                          {lead.name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm group-hover:text-blue-400 transition-colors truncate">{lead.name}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-[10px] text-slate-500 truncate">{lead.email}</p>
                             <div className="flex lg:hidden items-center gap-2 ml-auto">
                                <a 
                                  href={`tel:${lead.phone}`} 
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 px-2 bg-blue-500/10 text-blue-400 rounded-md"
                                >
                                  <Phone size={12} />
                                </a>
                                <a 
                                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 px-2 bg-emerald-500/10 text-emerald-400 rounded-md"
                                >
                                  <MessageSquare size={12} />
                                </a>
                             </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${stageColors[lead.stage] || 'bg-slate-500/10 text-slate-400'}`}>
                        {lead.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm hidden md:table-cell">
                      {lead.leadSource === 'External LMS' ? (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
                          EXTERNAL LMS
                        </span>
                      ) : (
                        <span className="text-slate-400">{lead.leadSource}</span>
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
                          className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-colors"
                          title="Edit Lead"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeadToDelete(lead);
                          }}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg text-slate-400"
                          title="View Details"
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
              Are you sure you want to delete <span className="font-semibold text-foreground">{leadToDelete.name}</span>? This action cannot be undone and will remove all associated data.
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
    </MainLayout>
  );
}
