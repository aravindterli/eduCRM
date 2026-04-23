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
  ChevronRight
} from 'lucide-react';
import { useFollowUpStore } from '@/store/useFollowUpStore';
import { FollowUpCalendar } from '@/components/leads/FollowUpCalendar';
import { FollowUpAlert } from '@/components/leads/FollowUpAlert';
import { AnimatePresence } from 'framer-motion';

const columns = [
  { id: 'cold', label: 'Cold Leads', tag: 'COLD', icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'warm', label: 'Warm Leads', tag: 'WARM', icon: Thermometer, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'hot', label: 'Hot Leads', tag: 'HOT', icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { id: 'lost', label: 'Lead Lost', stage: 'LOST_LEAD', icon: UserMinus, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
];

export default function NurturingPage() {
  const [columnData, setColumnData] = useState<Record<string, any[]>>({
    cold: [],
    warm: [],
    hot: [],
    lost: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadToEdit, setLeadToEdit] = useState<any>(null);
  const [view, setView] = useState<'pipeline' | 'calendar'>('pipeline');
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const notifiedIds = React.useRef<Set<string>>(new Set());

  const { upcoming, fetchUpcoming, loading: followUpLoading, complete: completeFollowUp } = useFollowUpStore();

  const fetchAllColumns = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        columns.map(col =>
          leadService.getAll(1, 100, col.tag ? { tag: col.tag } : { stage: col.stage })
        )
      );

      const newData: Record<string, any[]> = {};
      columns.forEach((col, index) => {
        newData[col.id] = results[index].leads;
      });
      setColumnData(newData);
    } catch (error) {
      console.error('Failed to fetch nurturing leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial Data Fetch (on mount)
  useEffect(() => {
    fetchAllColumns();
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
            onClick={fetchAllColumns}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-all border border-white/5 bg-white/5"
            title="Refresh Pipeline"
          >
            <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setView('pipeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'pipeline' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutGrid size={14} /> Pipeline
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'calendar' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
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
              className="flex flex-col h-full min-w-[320px] w-[320px] flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`p-4 rounded-t-2xl border-x border-t border-white/5 ${column.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-black/20 ${column.color}`}>
                    <column.icon size={18} />
                  </div>
                  <h3 className="font-bold text-sm">{column.label}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 text-slate-400 font-mono">
                    {columnData[column.id].length}
                  </span>
                </div>
                <button className="p-1 hover:bg-black/20 rounded-lg text-slate-400">
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className={`flex-1 overflow-y-auto custom-scrollbar p-3 bg-white/[0.02] border-x border-b border-white/5 rounded-b-2xl space-y-3 transition-colors`}>
                {loading && columnData[column.id].length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
                  ))
                ) : columnData[column.id].length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-500 italic text-xs border border-dashed border-white/10 rounded-xl">
                    <p>No leads here</p>
                  </div>
                ) : (
                  columnData[column.id].map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onClick={() => setSelectedLead(lead)}
                      className="group glass p-4 rounded-xl border-white/5 hover:border-white/20 transition-all cursor-grab active:cursor-grabbing hover:shadow-xl hover:shadow-black/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-white/5">
                          {lead.name[0]}
                        </div>
                        <div className="flex gap-1 group-hover:opacity-100 opacity-0 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeadToEdit(lead);
                            }}
                            className="p-1 hover:bg-white/10 rounded-md text-slate-400 transition-all"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors flex items-center justify-between min-w-0">
                        <span className="truncate">{lead.name}</span>
                        {lead.tag && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0 ${lead.tag === 'HOT' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                            lead.tag === 'WARM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                            }`}>
                            {lead.tag}
                          </span>
                        )}
                      </h4>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 truncate">
                          <Phone size={10} />
                          {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 truncate">
                            <Mail size={10} />
                            {lead.email}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                          <span className="text-[10px] text-slate-500">{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                        {lead.assignedTo && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[7px] font-bold">
                              {lead.assignedTo.name[0]}
                            </div>
                            <span className="text-[9px] font-bold text-primary truncate max-w-[60px]">
                              {lead.assignedTo.name.split(' ')[0]}
                            </span>
                          </div>
                        )}
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
