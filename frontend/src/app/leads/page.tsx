'use client';

import { Search, Filter, Plus, ExternalLink, Upload, Pencil, Trash2, MessageSquare, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LeadForm } from '@/components/leads/LeadForm';
import { LeadDetails } from '@/components/leads/LeadDetails';
import { LeadImportModal } from '@/components/leads/LeadImportModal';
import { BulkWhatsAppDrawer } from '@/components/leads/BulkWhatsAppDrawer';
import { useLeadStore } from '@/store/useLeadStore';
import ConnectorWarning from '@/components/shared/ConnectorWarning';
import React from 'react';

const stageColors: Record<string, string> = {
  'NEW': 'bg-blue-100/70 text-blue-700 border border-blue-200',
  'CONTACTED': 'bg-indigo-100/70 text-indigo-700 border border-indigo-200',
  'RESPONDED': 'bg-cyan-100/70 text-cyan-700 border border-cyan-200',
  'QUALIFIED': 'bg-teal-100/70 text-teal-700 border border-teal-200',
  'MEETING SCHEDULED': 'bg-amber-100/70 text-amber-700 border border-amber-200',
  'PROPOSAL SENT': 'bg-purple-100/70 text-purple-700 border border-purple-200',
  'NEGOTIATION': 'bg-emerald-100/70 text-emerald-700 border border-emerald-200',
  'CONVERTED': 'bg-yellow-100/70 text-yellow-700 border border-yellow-200',
  'ON HOLD': 'bg-slate-100/70 text-slate-700 border border-slate-200',
  'LOST': 'bg-rose-100/70 text-rose-700 border border-rose-200',
  'RE-ENGAGEMENT': 'bg-orange-100/70 text-orange-700 border border-orange-200',
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

  // Connector warning state — shown when WhatsApp/SMS/Twilio is not configured
  const [connectorWarning, setConnectorWarning] = React.useState<{ connector: string; message: string } | null>(null);

  // Sorting and Filtering State
  const [sortBy, setSortBy] = React.useState<string>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  React.useEffect(() => {
    const fetchStaff = async () => {
      const token = localStorage.getItem('centracrm_token');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStaff(data);
        }
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      }
    };
    fetchStaff();
  }, []);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLeads(1, limit, {
        assignedId: selectedOwner || undefined,
        sortBy,
        sortOrder,
        name: searchQuery || undefined
      });
    }, 500); // Debounce search

    return () => clearTimeout(delayDebounceFn);
  }, [fetchLeads, selectedOwner, sortBy, sortOrder, searchQuery, limit]);

  const filteredLeads = React.useMemo(() => {
    if (!campaignFilter) return leads;
    return leads.filter(l => l.campaignId === campaignFilter);
  }, [leads, campaignFilter]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

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
        staff={staff}
        onConnectorError={(connector, message) => setConnectorWarning({ connector, message })}
      />
      <BulkWhatsAppDrawer
        isOpen={isBulkWhatsAppOpen}
        onClose={() => setIsBulkWhatsAppOpen(false)}
        selectedLeadIds={selectedLeadIds}
        onConnectorError={(connector, message) => setConnectorWarning({ connector, message })}
        onSuccess={() => {
          setSelectedLeadIds([]);
          fetchLeads(page, limit);
        }}
      />

      {/* Connector Not Configured Warning Modal */}
      {connectorWarning && (
        <ConnectorWarning
          connector={connectorWarning.connector}
          message={connectorWarning.message}
          modal
          onDismiss={() => setConnectorWarning(null)}
        />
      )}

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
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-[8px] transition-all border border-black/10 shadow-sm text-xs font-bold"
          >
            <Upload size={14} />
            <span>Import</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-black hover:bg-black/90 text-white px-4 py-2 rounded-[8px] transition-all shadow-sm text-xs font-bold"
          >
            <Plus size={14} />
            <span>Add New</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-[16px] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-black/10 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-[8px] pl-10 pr-4 py-2 text-xs outline-none focus:border-black transition-all text-[#1A1A1A] font-semibold placeholder-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedOwner}
              onChange={(e) => {
                setSelectedOwner(e.target.value);
                fetchLeads(1, limit, { assignedId: e.target.value || undefined, sortBy, sortOrder });
              }}
              className="bg-white border border-black/10 rounded-[8px] px-3 py-2 text-xs outline-none text-[#1A1A1A] font-bold cursor-pointer transition-all"
            >
              <option value="">All Staff</option>
              {staff.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toLowerCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] text-[#F5F1EB] border-b border-black/10 text-[9px] font-bold uppercase tracking-[0.15em]">
                <th className="px-6 py-4 font-bold w-10">
                  <div
                    className={`w-5 h-5 rounded-[6px] border ${selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? 'bg-[#F5F1EB] border-[#F5F1EB] text-[#1A1A1A]' : 'border-[#F5F1EB]/30 hover:border-[#F5F1EB]/50'} flex items-center justify-center cursor-pointer transition-all`}
                    onClick={toggleSelectAll}
                  >
                    {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 && <div className="w-2.5 h-1 bg-[#1A1A1A] rounded-[2px]" />}
                    {selectedLeadIds.length > 0 && selectedLeadIds.length < filteredLeads.length && <div className="w-2.5 h-0.5 bg-[#1A1A1A] rounded-[2px]" />}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-bold text-[#F5F1EB]/80 text-left cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Lead Info
                    {sortBy === 'name' ? (
                      sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-bold text-[#F5F1EB]/80 text-left hidden sm:table-cell cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('stage')}
                >
                  <div className="flex items-center gap-1">
                    Stage
                    {sortBy === 'stage' ? (
                      sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-bold text-[#F5F1EB]/80 text-left hidden md:table-cell cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('leadSource')}
                >
                  <div className="flex items-center gap-1">
                    Source
                    {sortBy === 'leadSource' ? (
                      sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-bold text-[#F5F1EB]/80 text-left hidden md:table-cell">Owner</th>
                <th
                  className="px-6 py-4 font-bold text-[#F5F1EB]/80 text-left hidden sm:table-cell cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Created At
                    {sortBy === 'createdAt' ? (
                      sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-bold text-[#F5F1EB]/80 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-xs font-semibold text-[#1A1A1A]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400 italic">
                    Loading leads from server...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400 italic">
                    No leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-black/5 hover:bg-slate-50 transition-colors cursor-pointer group ${selectedLeadIds.includes(lead.id) ? 'bg-slate-50' : ''}`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="py-4 px-6">
                      <div
                        className={`w-5 h-5 rounded-[6px] border ${selectedLeadIds.includes(lead.id) ? 'bg-black border-black text-[#F5F1EB]' : 'border-black/10 group-hover:border-black/20'} flex items-center justify-center transition-all`}
                        onClick={(e) => toggleSelectLead(e, lead.id)}
                      >
                        {selectedLeadIds.includes(lead.id) && <div className="w-2 h-2 bg-white rounded-[2px]" />}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {lead.name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-[#1A1A1A] group-hover:text-blue-600 transition-colors truncate">{lead.name}</p>
                            {lead.tag && (
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-[6px] uppercase tracking-wider border ${lead.tag === 'HOT' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                lead.tag === 'WARM' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                {lead.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold truncate">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`px-2.5 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-wider border ${stageColors[lead.stage] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                        {lead.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs hidden md:table-cell">
                      <span className="text-slate-500">{lead.leadSource}</span>
                    </td>
                    <td className="px-6 py-4 text-xs hidden md:table-cell">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-[6px] bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-[10px] font-bold shadow-sm">
                            {lead.assignedTo.name[0]}
                          </div>
                          <span className="text-slate-600 font-semibold">{lead.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 hidden sm:table-cell">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeadToEdit(lead);
                          }}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-[6px] transition-colors border border-transparent hover:border-blue-100"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeadToDelete(lead);
                          }}
                          className="p-2 hover:bg-rose-50 text-rose-600 rounded-[6px] transition-colors border border-transparent hover:border-rose-100"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="p-2 hover:bg-slate-100 text-slate-600 rounded-[6px] transition-colors border border-transparent hover:border-slate-200"
                        >
                          <ExternalLink size={14} />
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
        <div className="px-6 py-4 border-t border-black/10 flex items-center justify-between bg-gray-50 text-slate-500">
          <div className="flex items-center gap-4">
            <p className="text-xs">
              Showing <span className="text-[#1A1A1A] font-bold">{(page - 1) * limit + 1}</span> to{' '}
              <span className="text-[#1A1A1A] font-bold">
                {Math.min(page * limit, total)}
              </span> of{' '}
              <span className="text-[#1A1A1A] font-bold">{total}</span> leads
            </p>
            <select
              value={limit}
              onChange={(e) => fetchLeads(1, Number(e.target.value))}
              className="bg-white border border-black/10 rounded-[6px] text-[10px] text-slate-600 outline-none px-2 py-1 font-bold cursor-pointer"
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
              className="px-4 py-1.5 rounded-[8px] bg-white text-xs font-bold border border-black/10 hover:bg-slate-50 text-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLeads(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-1.5 rounded-[8px] bg-black text-xs font-bold text-white hover:bg-black/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLeadToDelete(null)} />
          <div className="relative w-full max-w-sm bg-white border border-black/10 rounded-[16px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-[#1A1A1A]">
            <div className="w-12 h-12 rounded-[8px] bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mb-4 shadow-sm">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Delete Lead?</h3>
            <p className="text-sm text-slate-500 font-semibold mb-6">
              Are you sure you want to delete <span className="font-bold text-black">{leadToDelete.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLeadToDelete(null)}
                className="flex-1 px-4 py-2 rounded-[8px] text-sm font-bold bg-white hover:bg-slate-50 border border-black/10 transition-all shadow-sm text-slate-700"
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
                className="flex-1 px-4 py-2 rounded-[8px] text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-6 px-6 py-4 bg-white/95 border border-black/10 rounded-[12px] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 text-[#1A1A1A]">
          <div className="flex items-center gap-3 pr-6 border-r border-black/10">
            <span className="flex items-center justify-center w-6 h-6 rounded-[6px] bg-black text-[10px] font-bold text-white shadow-sm font-mono">
              {selectedLeadIds.length}
            </span>
            <span className="text-sm font-bold uppercase tracking-wider">Leads selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBulkWhatsAppOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-all shadow-sm"
            >
              <MessageSquare size={16} />
              Send WhatsApp
            </button>
            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
