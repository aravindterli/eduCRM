'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLeadStore } from '@/store/useLeadStore';
import { leadService } from '@/services/lead.service';
import { LeadDetails } from '@/components/leads/LeadDetails';
import { LeadForm } from '@/components/leads/LeadForm';
import {
  Snowflake,
  Flame,
  Thermometer,
  UserMinus,
  MoreVertical,
  Phone,
  Mail,
  ExternalLink,
  Filter,
  RotateCcw,
  LayoutGrid,
  Calendar as CalendarIcon,
  ChevronRight,
  Trash2,
  Plus,
  Sparkles,
  MessageCircle,
  UserCheck,
  FileText,
  Handshake,
  Award,
  Pause,
  XCircle
} from 'lucide-react';
import { useFollowUpStore } from '@/store/useFollowUpStore';
import { FollowUpCalendar } from '@/components/leads/FollowUpCalendar';
import { FollowUpAlert } from '@/components/leads/FollowUpAlert';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';

interface NurturingColumn {
  id: string;
  label: string;
  stage: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  isDefault?: boolean;
  tag?: string;
}

const defaultColumns: NurturingColumn[] = [
  { id: 'new', label: 'New', stage: 'NEW', icon: 'Sparkles', color: 'text-blue-600', bg: 'bg-blue-100/70', border: 'border-blue-200', isDefault: true },
  { id: 'contacted', label: 'Contacted', stage: 'CONTACTED', icon: 'Phone', color: 'text-indigo-600', bg: 'bg-indigo-100/70', border: 'border-indigo-200', isDefault: true },
  { id: 'responded', label: 'Responded', stage: 'RESPONDED', icon: 'MessageCircle', color: 'text-cyan-600', bg: 'bg-cyan-100/70', border: 'border-cyan-200', isDefault: true },
  { id: 'qualified', label: 'Qualified', stage: 'QUALIFIED', icon: 'UserCheck', color: 'text-teal-600', bg: 'bg-teal-100/70', border: 'border-teal-200', isDefault: true },
  { id: 'meetingScheduled', label: 'Meeting Scheduled', stage: 'MEETING SCHEDULED', icon: 'CalendarIcon', color: 'text-amber-600', bg: 'bg-amber-100/70', border: 'border-amber-200', isDefault: true },
  { id: 'proposalSent', label: 'Proposal Sent', stage: 'PROPOSAL SENT', icon: 'FileText', color: 'text-purple-600', bg: 'bg-purple-100/70', border: 'border-purple-200', isDefault: true },
  { id: 'negotiation', label: 'Negotiation', stage: 'NEGOTIATION', icon: 'Handshake', color: 'text-emerald-600', bg: 'bg-emerald-100/70', border: 'border-emerald-200', isDefault: true },
  { id: 'converted', label: 'Converted', stage: 'CONVERTED', icon: 'Award', color: 'text-yellow-600', bg: 'bg-yellow-100/70', border: 'border-yellow-200', isDefault: true },
  { id: 'onHold', label: 'On Hold', stage: 'ON HOLD', icon: 'Pause', color: 'text-slate-600', bg: 'bg-slate-100/70', border: 'border-slate-200', isDefault: true },
  { id: 'lost', label: 'Lost', stage: 'LOST', icon: 'XCircle', color: 'text-rose-600', bg: 'bg-rose-100/70', border: 'border-rose-200', isDefault: true },
  { id: 'reEngagement', label: 'Re-Engagement', stage: 'RE-ENGAGEMENT', icon: 'Flame', color: 'text-orange-600', bg: 'bg-orange-100/70', border: 'border-orange-200', isDefault: true },
];

const getIconComponent = (icon: string) => {
  switch (icon) {
    case 'Sparkles':
      return <Sparkles size={18} />;
    case 'Phone':
      return <Phone size={18} />;
    case 'MessageCircle':
      return <MessageCircle size={18} />;
    case 'UserCheck':
      return <UserCheck size={18} />;
    case 'CalendarIcon':
      return <CalendarIcon size={18} />;
    case 'FileText':
      return <FileText size={18} />;
    case 'Handshake':
      return <Handshake size={18} />;
    case 'Award':
      return <Award size={18} />;
    case 'Pause':
      return <Pause size={18} />;
    case 'XCircle':
      return <XCircle size={18} />;
    case 'Flame':
      return <Flame size={18} />;
    default:
      return <LayoutGrid size={18} />;
  }
};

export default function NurturingPage() {
  const [columns, setColumns] = useState<NurturingColumn[]>(defaultColumns);
  const [columnData, setColumnData] = useState<Record<string, any[]>>(() => {
    return defaultColumns.reduce((acc, col) => {
      acc[col.id] = [];
      return acc;
    }, {} as Record<string, any[]>);
  });
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadToEdit, setLeadToEdit] = useState<any>(null);
  const [view, setView] = useState<'pipeline' | 'calendar'>('pipeline');
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const notifiedIds = React.useRef<Set<string>>(new Set());

  const { upcoming, fetchUpcoming, loading: followUpLoading, complete: completeFollowUp } = useFollowUpStore();

  const fetchAllColumns = async (currentColumns = columns) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        currentColumns.map(col =>
          leadService.getAll(1, 100, { stage: col.stage || col.id.toUpperCase() })
        )
      );

      const newData: Record<string, any[]> = {};
      currentColumns.forEach((col, index) => {
        newData[col.id] = results[index].leads;
      });
      setColumnData(newData);
    } catch (error) {
      console.error('Failed to fetch nurturing leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantConfig = async () => {
    // Strictly restrict to the 11 approved stages, ignoring server custom stages
    setColumns(defaultColumns);
    fetchAllColumns(defaultColumns);
  };

  // 1. Initial Data Fetch (on mount)
  useEffect(() => {
    fetchTenantConfig();
    fetchUpcoming();
  }, []); // Run only once

  // 2. Alert Checker Interval
  useEffect(() => {
    if (upcoming.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const dueTask = upcoming.find(task => {
        if (notifiedIds.current.has(task.id)) return false;
        const taskTime = new Date(task.scheduledAt);
        const diffMinutes = (taskTime.getTime() - now.getTime()) / (1000 * 60);
        return diffMinutes <= 5 && diffMinutes >= -15;
      });

      if (dueTask) {
        setActiveAlert(dueTask);
        // Mark as immediately seen so the NEXT 30s interval doesn't re-trigger it
        notifiedIds.current.add(dueTask.id);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [upcoming]);

  const handleDragStart = (e: React.DragEvent, lead: any) => {
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const targetColumn = columns.find(c => c.id === targetColumnId);

    if (!targetColumn) return;

    // Find the lead in our current columns
    let sourceColumnId = '';
    let leadToMove: any = null;

    // We look through all columns to find where it's coming from
    for (const [colId, leads] of Object.entries(columnData)) {
      const found = leads.find(l => l.id === leadId);
      if (found) {
        sourceColumnId = colId;
        leadToMove = { ...found }; // Clone it
        break;
      }
    }

    if (!leadToMove || sourceColumnId === targetColumnId) return;

    // Determine new properties
    const newTag = targetColumn.tag || leadToMove.tag;
    const newStage = targetColumn.stage || (leadToMove.stage === 'LOST_LEAD' ? 'NEW_LEAD' : leadToMove.stage);

    // Update the lead object with its NEW properties for the UI
    leadToMove.tag = newTag;
    leadToMove.stage = newStage;

    // Optimistic UI Update: Move card immediately
    const updatedData = { ...columnData };
    updatedData[sourceColumnId] = updatedData[sourceColumnId].filter(l => l.id !== leadId);
    updatedData[targetColumnId] = [leadToMove, ...updatedData[targetColumnId]];
    setColumnData(updatedData);

    try {
      // Persist to backend and global store
      const updatePayload: any = { tag: newTag, stage: newStage };

      const success = await useLeadStore.getState().updateLead(leadId, updatePayload);

      if (!success) {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Failed to move lead:', error);
      fetchAllColumns(); // Rollback to server state on error
    }
  };

  const handleAddStage = async (stageName: string) => {
    const id = stageName.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
    const newColumn = {
      id,
      label: stageName,
      stage: stageName.toUpperCase().replace(/\s+/g, '_'),
      icon: 'LayoutGrid',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    };

    const updatedColumns = [...columns, newColumn];
    setColumns(updatedColumns);
    setColumnData(prev => ({ ...prev, [id]: [] }));

    // Save to backend
    const token = useAuthStore.getState().token;
    if (token) {
      const customStagesOnly = updatedColumns.filter(c => !defaultColumns.find(dc => dc.id === c.id));
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/tenant/config`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ config: { customStages: customStagesOnly } })
        });
      } catch (error) {
        console.error('Failed to save tenant config:', error);
      }
    }

    // Fetch leads for the new column
    const res = await leadService.getAll(1, 100, { stage: newColumn.stage });
    setColumnData(prev => ({ ...prev, [id]: res.leads }));
  };

  const handleColumnDragStart = (e: React.DragEvent, columnId: string) => {
    e.dataTransfer.setData('columnId', columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const sourceColumnId = e.dataTransfer.getData('columnId');
    if (!sourceColumnId || sourceColumnId === targetColumnId) return;

    const sourceIndex = columns.findIndex(c => c.id === sourceColumnId);
    const targetIndex = columns.findIndex(c => c.id === targetColumnId);

    const updatedColumns = [...columns];
    const [movedColumn] = updatedColumns.splice(sourceIndex, 1);
    updatedColumns.splice(targetIndex, 0, movedColumn);

    setColumns(updatedColumns);

    // Save order to backend
    const token = useAuthStore.getState().token;
    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/tenant/config`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ config: { customStages: updatedColumns } })
        });
      } catch (error) {
        console.error('Failed to save tenant config:', error);
      }
    }
  };

  const handleDeleteStage = async (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (column?.isDefault) {
      alert('Cannot delete the default landing stage!');
      return;
    }

    if ((columnData[columnId]?.length || 0) > 0) {
      alert('Cannot delete a stage with active leads! Please move the leads first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this stage?')) return;

    const updatedColumns = columns.filter(c => c.id !== columnId);
    setColumns(updatedColumns);

    setColumnData(prev => {
      const newData = { ...prev };
      delete newData[columnId];
      return newData;
    });

    const token = useAuthStore.getState().token;
    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/tenant/config`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ config: { customStages: updatedColumns } })
        });
      } catch (error) {
        console.error('Failed to save tenant config:', error);
      }
    }
  };

  const { leads, fetchLeads } = useLeadStore();

  return (
    <MainLayout>
      <LeadDetails
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => {
          setSelectedLead(null);
          fetchAllColumns(); // Refresh columns when details close
        }}
      />
      <LeadForm
        isOpen={!!leadToEdit}
        onClose={() => {
          setLeadToEdit(null);
          fetchAllColumns(); // Refresh on close
        }}
        initialData={leadToEdit}
      />

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Nurturing Pipeline</h1>
          <p className="text-slate-400 text-sm">Manage and convert leads through different temperature stages.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchAllColumns()}
            className="p-2 hover:bg-slate-100 rounded-[8px] text-slate-600 transition-all border border-black/10 bg-white shadow-sm"
            title="Refresh Pipeline"
          >
            <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="flex bg-white p-1 rounded-[12px] border border-black/10 shadow-sm">
            <button
              onClick={() => setView('pipeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-bold transition-all ${view === 'pipeline' ? 'bg-[#1A1A1A] text-[#F5F1EB] shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-[#F5F1EB]/50'}`}
            >
              <LayoutGrid size={14} /> Pipeline
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-bold transition-all ${view === 'calendar' ? 'bg-[#1A1A1A] text-[#F5F1EB] shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-[#F5F1EB]/50'}`}
            >
              <CalendarIcon size={14} /> Calendar
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeAlert && (
          <FollowUpAlert
            task={activeAlert}
            onClose={() => {
              setActiveAlert(null);
            }}
            onCall={(phone) => {
              window.location.href = `tel:${phone}`;
              setActiveAlert(null);
            }}
            onWhatsApp={(phone) => {
              window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
              setActiveAlert(null);
            }}
          />
        )}
      </AnimatePresence>

      {view === 'calendar' ? (
        <div className="h-[calc(100vh-240px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FollowUpCalendar
            tasks={upcoming.filter(t => !t.meetingUrl)}
            onSelectTask={(lead) => setSelectedLead(lead)}
            onCompleteTask={(id) => completeFollowUp(id)}
          />
        </div>
      ) : (
        <div className="flex overflow-x-auto custom-scrollbar gap-6 h-[calc(100vh-240px)] pb-4 -mx-4 px-4 animate-in fade-in duration-500">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex flex-col h-full min-w-[280px] w-[280px] bg-gray-50 border border-black/10 rounded-[16px] overflow-hidden shadow-sm flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div
                className={`p-4 border-b border-black/10 ${column.bg} flex items-center justify-between cursor-move`}
                draggable
                onDragStart={(e) => handleColumnDragStart(e, column.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleColumnDrop(e, column.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-[8px] bg-white shadow-sm border ${column.border} ${column.color}`}>
                    {getIconComponent(column.icon)}
                  </div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">{column.label}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded-[6px] bg-white border ${column.border} ${column.color} font-mono font-bold shadow-sm`}>
                    {columnData[column.id]?.length || 0}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 transition-colors bg-slate-50/50">
                {loading && (columnData[column.id]?.length || 0) === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-[12px] bg-white border border-black/5 animate-pulse shadow-sm" />
                  ))
                ) : (columnData[column.id]?.length || 0) === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-400 italic text-xs border border-dashed border-black/10 rounded-[12px] bg-white/60">
                    <p>No leads here</p>
                  </div>
                ) : (
                  (columnData[column.id] || []).map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onClick={() => setSelectedLead(lead)}
                      className="group p-4 bg-white border border-black/10 hover:border-black/20 rounded-[12px] shadow-sm transition-all duration-300 cursor-grab active:cursor-grabbing flex items-center gap-3 relative text-[#1A1A1A]"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity rounded-l-[12px]" />
                      <div className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {lead.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm group-hover:text-blue-600 transition-colors truncate">
                            {lead.name}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-bold shrink-0">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-1 font-semibold">
                          <span className="truncate">{lead.phone}</span>
                          {lead.email && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="truncate text-slate-400">{lead.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
