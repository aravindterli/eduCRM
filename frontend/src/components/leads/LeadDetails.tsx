'use client';

import React from 'react';
import { X, Phone, Mail, Calendar, MessageSquare, History, Tag, ArrowRight, Megaphone, CheckCircle2, UploadCloud, FileText, FileType, Check, Download, RotateCcw, MessageCircle, PhoneCall, Smartphone, Activity } from 'lucide-react';
import { useMarketingStore } from '@/store/useMarketingStore';
import { useLeadStore } from '@/store/useLeadStore';
import { useTemplateStore } from '@/store/useTemplateStore';
import { FollowUpPanel } from './FollowUpPanel';

interface LeadDetailsProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadDetails = ({ lead, isOpen, onClose }: LeadDetailsProps) => {
  const { webinars, fetchWebinars, registerLeadForWebinar } = useMarketingStore();
  const { updateStage, fetchLeads, loading } = useLeadStore();
  const { templates, fetchTemplates } = useTemplateStore();

  const [successMsg, setSuccessMsg] = React.useState('');
  const [newNote, setNewNote] = React.useState('');
  const [noteType, setNoteType] = React.useState('REMARK');
  const [addingNote, setAddingNote] = React.useState(false);
  const [loggingInteraction, setLoggingInteraction] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState('');
  const [sendingTemplate, setSendingTemplate] = React.useState(false);
  const [showLogModal, setShowLogModal] = React.useState(false);
  const [logType, setLogType] = React.useState('');
  const [logForm, setLogForm] = React.useState({ message: '', duration: '', result: '' });
  const [filterType, setFilterType] = React.useState('ALL');

  const openLogModal = (type: string) => {
    setLogType(type);
    setLogForm({ message: `Manual ${type.toLowerCase()} follow-up logged`, duration: '', result: '' });
    setShowLogModal(true);
  };

  const submitLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingInteraction(true);
    const token = localStorage.getItem('educrm_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}/log-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          type: logType, 
          message: logForm.message, 
          duration: logForm.duration,
          result: logForm.result,
          direction: 'OUTBOUND'
        })
      });
      if (res.ok) {
        setSuccessMsg(`${logType} Logged`);
        fetchLeads();
        setShowLogModal(false);
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingInteraction(false);
    }
  };
  const [updatingStage, setUpdatingStage] = React.useState(false);
  const [updatingTag, setUpdatingTag] = React.useState(false);
  const [verifyingDocId, setVerifyingDocId] = React.useState<string | null>(null);
  const [downloadingLetter, setDownloadingLetter] = React.useState(false);
  const [reactivating, setReactivating] = React.useState(false);
  const { reactivateLead } = useLeadStore();

  React.useEffect(() => {
    if (isOpen) {
      fetchWebinars();
      fetchTemplates();
    }
  }, [isOpen, fetchWebinars, fetchTemplates]);

  // follow-up scheduling is now handled by FollowUpPanel

  const handleStageChange = async (newStage: string) => {
    setUpdatingStage(true);
    try {
      const success = await updateStage(lead.id, newStage);
      if (success) {
        setSuccessMsg(`Stage updated to ${newStage.replace('_', ' ')}`);
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } finally {
      setUpdatingStage(false);
    }
  };

  const { updateLead } = useLeadStore();
  const handleTagChange = async (newTag: string) => {
    setUpdatingTag(true);
    try {
      const success = await updateLead(lead.id, { tag: newTag });
      if (success) {
        setSuccessMsg(`Lead temperature updated to ${newTag}`);
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } finally {
      setUpdatingTag(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const token = localStorage.getItem('educrm_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newNote, type: noteType })
      });
      if (res.ok) {
        setSuccessMsg('Note added successfully');
        setNewNote('');
        fetchLeads(); // Refresh leads to show new note in timeline
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } finally {
      setAddingNote(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate) return;
    setSendingTemplate(true);
    try {
      const token = localStorage.getItem('educrm_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}/send-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ templateId: selectedTemplate })
      });
      if (res.ok) {
        setSuccessMsg('Template message queued!');
        setSelectedTemplate('');
        fetchLeads(); // Refresh leads to show new comm log in timeline
        setTimeout(() => setSuccessMsg(''), 2000);
      } else {
        const errorData = await res.json();
        console.error('Failed to send template:', errorData.message);
      }
    } catch (error) {
      console.error('Failed to dispatch template:', error);
    } finally {
      setSendingTemplate(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', lead.application.id);

    try {
      const token = localStorage.getItem('educrm_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        setSuccessMsg('Document uploaded successfully!');
        fetchLeads(); // Refresh leads to show doc in list
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } catch (error) {
      console.error('Upload failed', error);
    }
  };

  const handleVerifyDocument = async (docId: string, status: string) => {
    setVerifyingDocId(docId);
    try {
      const token = localStorage.getItem('educrm_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSuccessMsg(`Document ${status.toLowerCase()}!`);
        fetchLeads(); // Refresh leads to show updated status
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } catch (error) {
      console.error('Verify failed', error);
    } finally {
      setVerifyingDocId(null);
    }
  };

  const handleDownloadLetter = async () => {
    if (!lead?.application?.id) {
      setSuccessMsg('No application record found for this lead.');
      setTimeout(() => setSuccessMsg(''), 3000);
      return;
    }
    setDownloadingLetter(true);
    try {
      const token = localStorage.getItem('educrm_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${lead.application.id}/letter`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const { url } = await res.json();
        const link = document.createElement('a');
        link.href = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${url}`;
        link.target = '_blank';
        link.download = `Admission_Letter_${lead.name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccessMsg('Admission letter downloaded!');
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } catch (error) {
      console.error('Download failed', error);
    } finally {
      setDownloadingLetter(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const success = await reactivateLead(lead.id);
      if (success) {
        setSuccessMsg('Lead re-activated successfully!');
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } finally {
      setReactivating(false);
    }
  };

  const timelineItems = React.useMemo(() => {
    if (!lead) return [];

    const notes = (lead.notes || []).map((note: any) => ({
      id: `note_${note.id}`,
      type: 'note',
      category: note.type?.replace('STUDENT_', '').replace('DISCUSSION_', '') || 'REMARK',
      date: new Date(note.createdAt),
      content: note
    }));

    const cLogs = (lead.communicationLogs || []).map((log: any) => ({
      id: `clog_${log.id}`,
      type: 'communication',
      category: log.type,
      date: new Date(log.timestamp),
      content: log
    }));

    const followUps = (lead.followUps || []).filter((f: any) => f.completedAt).map((f: any) => ({
      id: `followup_${f.id}`,
      type: 'followup',
      date: new Date(f.completedAt),
      content: f
    }));

    const counselingLogs = (lead.counselingLogs || []).map((clog: any) => ({
      id: `counseling_${clog.id}`,
      type: 'counseling',
      date: new Date(clog.createdAt),
      content: clog
    }));

    const webinars = (lead.webinarRegistrations || []).map((reg: any) => ({
      id: `webinar_${reg.id}`,
      type: 'webinar',
      date: new Date(reg.createdAt),
      content: reg
    }));

    return [...cLogs, ...notes, ...followUps, ...counselingLogs, ...webinars].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [lead]);

  const filteredTimelineItems = React.useMemo(() => {
    if (filterType === 'ALL') return timelineItems;
    return timelineItems.filter(item => {
      if (filterType === 'note') return item.type === 'note';
      if (filterType === 'communication') return item.type === 'communication';
      // Specific communication types
      if (item.type === 'communication') return item.content.type === filterType;
      return false;
    });
  }, [timelineItems, filterType]);

  const NOTE_TYPES = [
    { value: 'REMARK', label: 'Owner Remark', color: 'blue' },
    { value: 'STUDENT_FEEDBACK', label: 'Student Feedback', color: 'emerald' },
    { value: 'DISCUSSION_SUMMARY', label: 'Discussion Summary', color: 'purple' },
    { value: 'GENERAL', label: 'General Note', color: 'slate' }
  ];

  if (!isOpen || !lead) return null;

  const STAGES = [
    'NEW_LEAD', 'CONTACT_ATTEMPTED', 'RESPONDED', 'INTERESTED',
    'COUNSELING_SCHEDULED', 'WEBINAR_REGISTERED', 'WEBINAR_ATTENDED',
    'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'ADMISSION_CONFIRMED',
    'LOST_LEAD', 'RE_ENGAGEMENT'
  ];

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-xl glass border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                {lead.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold">{lead.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={lead.stage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    disabled={updatingStage}
                    className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-1 rounded border-none outline-none cursor-pointer hover:bg-primary/20 transition-all disabled:opacity-50"
                  >
                    <option value={lead.stage} className="bg-background text-foreground">
                      {updatingStage ? 'Updating...' : lead.stage.replace('_', ' ')}
                    </option>
                    {STAGES.filter(s => s !== lead.stage).map(s => (
                      <option key={s} value={s} className="bg-background text-foreground">{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <select
                    value={lead.tag || 'COLD'}
                    onChange={(e) => handleTagChange(e.target.value)}
                    disabled={updatingTag}
                    className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border-none outline-none cursor-pointer hover:opacity-80 transition-all disabled:opacity-50 ${
                      lead.tag === 'HOT' ? 'bg-red-500/10 text-red-400' :
                      lead.tag === 'WARM' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    <option value="COLD" className="bg-background text-foreground">Cold</option>
                    <option value="WARM" className="bg-background text-foreground">Warm</option>
                    <option value="HOT" className="bg-background text-foreground">Hot</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={18} />
                <p className="text-sm font-medium">{successMsg}</p>
              </div>
            )}

            <section className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone</p>
                <div className="flex items-center gap-3 text-foreground/80">
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{lead.phone}</span>
                  <div className="flex gap-1.5 ml-auto">
                    <a href={`tel:${lead.phone}`} className="p-1.5 bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-all" title="Call directly">
                      <PhoneCall size={12} />
                    </a>
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all" title="Message on WhatsApp">
                      <MessageCircle size={12} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p>
                <div className="flex items-center gap-2 text-foreground/80">
                  <Mail size={14} className="text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-sm truncate hover:text-primary transition-colors">{lead.email}</a>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Source</p>
                <div className="flex items-center gap-2 text-foreground/80">
                  <Tag size={14} className="text-muted-foreground" />
                  <span className="text-sm">{lead.leadSource}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Campaign</p>
                <div className="flex items-center gap-2 text-foreground/80">
                  <Megaphone size={14} className="text-muted-foreground" />
                  <span className="text-sm">{lead.campaign?.name || 'Organic / None'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Created</p>
                <div className="flex items-center gap-2 text-foreground/80">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span className="text-sm">{new Date(lead.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Drip Status</p>
                <div className="flex items-center gap-2 text-foreground/80">
                  <MessageSquare size={14} className="text-primary" />
                  <span className="text-sm">
                    {lead.stage === 'NEW_LEAD' ? 'Active (Pending)' : 'Completed / N/A'}
                  </span>
                </div>
              </div>
            </section>

            <FollowUpPanel leadId={lead.id} initialFollowUps={lead.followUps || []} />

            <section className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Activity size={14} /> Quick Follow-up Logging
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => openLogModal('CALL')}
                  disabled={loggingInteraction}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all"
                >
                  <Phone size={18} />
                  <span className="text-[10px] font-bold uppercase">Log Call</span>
                </button>
                <button 
                  onClick={() => openLogModal('WHATSAPP')}
                  disabled={loggingInteraction}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  <MessageCircle size={18} />
                  <span className="text-[10px] font-bold uppercase">WhatsApp</span>
                </button>
                <button 
                  onClick={() => openLogModal('SMS')}
                  disabled={loggingInteraction}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all"
                >
                  <Smartphone size={18} />
                  <span className="text-[10px] font-bold uppercase">Log SMS</span>
                </button>
              </div>
            </section>

            {lead.application && (
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText size={18} className="text-emerald-400" />
                    Application Documents
                  </h3>
                  <div className="p-1 px-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded">
                    {lead.application.status}
                  </div>
                </div>

                <div className="space-y-3">
                  {lead.application.documents?.map((doc: any) => (
                    <div key={doc.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <FileType size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">{doc.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{doc.type} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${doc.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : doc.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {doc.status}
                        </span>
                        <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${doc.url}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded text-slate-400 transition-colors">
                          <Download size={14} />
                        </a>
                        {doc.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'APPROVED')}
                              disabled={verifyingDocId === doc.id}
                              className="p-1.5 hover:bg-emerald-500/20 rounded text-emerald-400 transition-colors disabled:opacity-30"
                            >
                              <Check size={14} className={verifyingDocId === doc.id ? 'animate-pulse' : ''} />
                            </button>
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                              disabled={verifyingDocId === doc.id}
                              className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors disabled:opacity-30"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-4 border border-dashed border-white/20 rounded-2xl text-center hover:bg-white/5 transition-colors">
                    <input type="file" onChange={handleFileUpload} className="hidden" id="doc-upload" />
                    <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <UploadCloud size={24} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-300">Click to upload identity or academic record</span>
                    </label>
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <History size={18} className="text-purple-400" />
                Conversation & Activity Timeline
              </h3>
              
              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { id: 'ALL', label: 'All', icon: Activity },
                  { id: 'CALL', label: 'Calls', icon: PhoneCall },
                  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
                  { id: 'SMS', label: 'SMS', icon: Smartphone },
                  { id: 'EMAIL', label: 'Emails', icon: Mail },
                  { id: 'note', label: 'Notes', icon: FileText }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap border ${
                      filterType === tab.id 
                        ? 'bg-primary/20 border-primary/30 text-primary' 
                        : 'bg-white/5 border-transparent text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-6 border-l-2 border-white/5 ml-2 pl-6 pt-2">

                {filteredTimelineItems.length > 0 ? filteredTimelineItems.map((item: any) => {
                  if (item.type === 'communication') {
                    const log = item.content;
                    const isCall = log.type === 'CALL';
                    const isWhatsapp = log.type === 'WHATSAPP';
                    const Icon = isCall ? PhoneCall : isWhatsapp ? MessageCircle : Mail;
                    const colorClass = isCall ? 'text-orange-400' : isWhatsapp ? 'text-emerald-400' : 'text-blue-400';
                    
                    return (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-4 border-background" />
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase flex gap-2 items-center">
                            <Icon size={10} className={colorClass} />
                            {log.type} Interaction • {item.date.toLocaleString()}
                            <span className={log.status === 'SENT' ? 'text-primary' : 'text-red-400'}>{log.status}</span>
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setNewNote(log.message);
                                const editor = document.getElementById('note-editor');
                                editor?.focus();
                                setSuccessMsg('Message copied to editor');
                                setTimeout(() => setSuccessMsg(''), 2000);
                              }}
                              className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-primary transition-all flex items-center gap-1"
                              title="Reuse this message"
                            >
                              <RotateCcw size={10} />
                              <span className="text-[8px] font-bold uppercase">Reuse</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{log.message}</p>
                        {(log.duration || log.result) && (
                          <div className="flex gap-3 mt-2">
                             {log.duration && (
                               <span className="text-[9px] font-bold text-slate-400 uppercase bg-white/5 px-1.5 py-0.5 rounded">
                                 Duration: {log.duration}m
                               </span>
                             )}
                             {log.result && (
                               <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">
                                 {log.result}
                               </span>
                             )}
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (item.type === 'note') {
                    const note = item.content;
                    const cat = item.category || 'REMARK';
                    const catColor = cat === 'REMARK' ? 'bg-blue-500/10 text-blue-400' :
                                   cat === 'FEEDBACK' ? 'bg-emerald-500/10 text-emerald-400' :
                                   cat === 'SUMMARY' ? 'bg-purple-500/10 text-purple-400' :
                                   'bg-slate-500/10 text-slate-400';
                    return (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-4 border-background" />
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${catColor}`}>
                              {cat}
                            </span>
                            {note.assignedTo?.name || 'Owner'} • {item.date.toLocaleString()}
                          </p>
                          <button
                            onClick={() => {
                              setNewNote(note.content);
                              const editor = document.getElementById('note-editor');
                              editor?.focus();
                              setSuccessMsg('Note copied to editor');
                              setTimeout(() => setSuccessMsg(''), 2000);
                            }}
                            className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
                            title="Reuse this note"
                          >
                            <RotateCcw size={10} />
                            <span className="text-[8px] font-bold uppercase">Reuse</span>
                          </button>
                        </div>
                        <p className="text-sm text-foreground/80 mt-1 italic">"{note.content}"</p>
                      </div>
                    );
                  }
                  if (item.type === 'counseling') {
                    const clog = item.content;
                    return (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-4 border-slate-900" />
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] uppercase tracking-wider">Counseling</span>
                            {clog.assignedTo?.name || 'assignedTo'} • {item.date.toLocaleString()}
                          </p>
                          <button
                            onClick={() => {
                              const content = `${clog.notes || ''}${clog.recommendation ? `\nRecommendation: ${clog.recommendation}` : ''}`;
                              setNewNote(content);
                              const editor = document.getElementById('note-editor');
                              editor?.focus();
                              setSuccessMsg('Counseling remarks copied');
                              setTimeout(() => setSuccessMsg(''), 2000);
                            }}
                            className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-emerald-400 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
                            title="Reuse these remarks"
                          >
                            <RotateCcw size={10} />
                            <span className="text-[8px] font-bold uppercase">Reuse</span>
                          </button>
                        </div>
                        {clog.notes && <p className="text-sm text-slate-300 mt-1 italic">"{clog.notes}"</p>}
                        {clog.recommendation && (
                          <p className="text-[10px] font-bold text-emerald-400 mt-2 flex items-center gap-1">
                            <ArrowRight size={10} /> Rec: {clog.recommendation}
                          </p>
                        )}
                      </div>
                    );
                  }
                  if (item.type === 'webinar') {
                    const reg = item.content;
                    return (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-pink-500 border-4 border-slate-900" />
                        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 text-[8px] uppercase tracking-wider">Webinar</span>
                          {reg.attended ? 'Attended' : 'Registered'} • {item.date.toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-300 mt-1">"{reg.webinar?.title || 'Webinar'}" event.</p>
                      </div>
                    );
                  }
                  if (item.type === 'followup') {
                    const f = item.content;
                    return (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-4 border-background" />
                        <p className="text-[10px] font-bold text-muted-foreground">Follow-up Call Completed • {item.date.toLocaleString()}</p>
                        <p className="text-sm text-foreground/80 mt-1">{f.notes}</p>
                      </div>
                    );
                  }
                  return null;
                }) : (
                  <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                Add Detailed History Entry
              </h3>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                 {NOTE_TYPES.map(t => (
                   <button 
                    key={t.value}
                    onClick={() => setNoteType(t.value)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      noteType === t.value ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'
                    }`}
                   >
                     {t.label}
                   </button>
                 ))}
              </div>

              <div className="flex gap-2">
                <textarea
                  id="note-editor"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={`Type ${noteType.toLowerCase().replace('_', ' ')} details here...`}
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/30 transition-all text-foreground resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="bg-primary hover:bg-primary/90 px-4 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 text-white"
                >
                  {addingNote ? 'Saving...' : 'Save'}
                </button>
              </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare size={18} className="text-pink-400" />
                Dispatch Custom Template
              </h3>
              <div className="flex gap-2">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-500/30 transition-all text-slate-400"
                >
                  <option value="">Select a template to send...</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id} className="bg-slate-900">
                      {t.name} ({t.channel})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSendTemplate}
                  disabled={sendingTemplate || !selectedTemplate}
                  className="bg-pink-600 hover:bg-pink-500 px-4 rounded-xl text-sm font-bold shadow-lg shadow-pink-500/20 transition-all disabled:opacity-50"
                >
                  {sendingTemplate ? 'Sending...' : 'Send'}
                </button>
              </div>
            </section>

            {/* Webinar History Section (Keep existing) */}
            <section className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar size={18} className="text-blue-400" />
                  Webinar History
                </h3>
                {/* ... register dropdown */}
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        registerLeadForWebinar(e.target.value, lead.id);
                        e.target.value = '';
                      }
                    }}
                    className="bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500/30 transition-all text-slate-400"
                  >
                    <option value="">+ Register for...</option>
                    {webinars
                      .filter(w => !lead.webinarRegistrations?.some((r: any) => r.webinarId === w.id))
                      .map(w => (
                        <option key={w.id} value={w.id} className="bg-background text-foreground">{w.title}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {!lead.webinarRegistrations?.length ? (
                  <p className="text-xs text-slate-500 italic px-2">No webinars registered yet.</p>
                ) : lead.webinarRegistrations.map((reg: any) => (
                  <div key={reg.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${reg.attended ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-300">{reg.webinar?.title}</p>
                        <p className="text-[10px] text-slate-500">{new Date(reg.webinar?.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${reg.attended ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {reg.attended ? 'Attended' : 'Registered'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-white/5 flex gap-3 bg-white/[0.02]">
            {lead.stage === 'ADMISSION_CONFIRMED' ? (
              <button
                onClick={handleDownloadLetter}
                disabled={downloadingLetter}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50"
              >
                <Download size={16} className={downloadingLetter ? 'animate-bounce' : ''} />
                {downloadingLetter ? 'Downloading...' : 'Download Letter'}
              </button>
            ) : (lead.stage === 'RE_ENGAGEMENT' || lead.stage === 'LOST_LEAD') ? (
              <button
                onClick={handleReactivate}
                disabled={loading || reactivating}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50"
              >
                <RotateCcw size={16} className={reactivating ? 'animate-spin' : ''} />
                {reactivating ? 'Re-activating...' : 'Re-activate Lead'}
              </button>
            ) : (
              <button
                onClick={() => handleStageChange(STAGES[STAGES.indexOf(lead.stage) + 1] || lead.stage)}
                disabled={loading || updatingStage}
                className="flex-1 bg-primary hover:bg-primary/90 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-white"
              >
                {loading || updatingStage ? 'Updating...' : (
                  <>
                    Next Stage
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── interaction log modal ────────────────────────── */}
      {showLogModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowLogModal(false)} />
          <div className="relative w-full max-w-md glass border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <form onSubmit={submitLogInteraction}>
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h3 className="font-bold flex items-center gap-2 uppercase tracking-tight">
                    <Activity size={18} className="text-primary" />
                    Log {logType} Interaction
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Recording manual assignedTo follow-up</p>
                </div>
                <button type="button" onClick={() => setShowLogModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Interaction Notes</label>
                  <textarea
                    required
                    value={logForm.message}
                    onChange={(e) => setLogForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="What did you discuss? e.g. Student needs more time, interested in scholarship..."
                    rows={4}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/30 transition-all text-foreground resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Outcome / Result</label>
                    <select
                      value={logForm.result}
                      onChange={(e) => setLogForm(p => ({ ...p, result: e.target.value }))}
                      className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/30 transition-all text-foreground"
                    >
                      <option value="" className="bg-slate-900">Select outcome...</option>
                      <option value="INTERESTED" className="bg-slate-900">Interested</option>
                      <option value="FOLLOW_UP_NEEDED" className="bg-slate-900">Follow-up Needed</option>
                      <option value="NOT_REACHABLE" className="bg-slate-900">Not Reachable</option>
                      <option value="NOT_INTERESTED" className="bg-slate-900">Not Interested</option>
                      <option value="WRONG_NUMBER" className="bg-slate-900">Wrong Number</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Duration (mins)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={logForm.duration}
                      onChange={(e) => setLogForm(p => ({ ...p, duration: e.target.value }))}
                      className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/30 transition-all text-foreground"
                    />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-border bg-white/[0.02] flex gap-3">
                <button type="button" onClick={() => setShowLogModal(false)} className="flex-1 py-2.5 text-sm font-semibold hover:bg-white/5 rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingInteraction}
                  className="flex-1 bg-primary hover:bg-primary/90 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 text-white"
                >
                  {loggingInteraction ? 'Saving...' : 'Save Interaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
