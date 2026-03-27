'use client';

import React from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, MessageSquare, History, Tag, ArrowRight, Megaphone, Clock, CheckCircle2, UploadCloud, FileText, FileType, Check, Download, RotateCcw } from 'lucide-react';
import { useMarketingStore } from '@/store/useMarketingStore';
import { useLeadStore } from '@/store/useLeadStore';
import { useTemplateStore } from '@/store/useTemplateStore';

interface LeadDetailsProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadDetails = ({ lead, isOpen, onClose }: LeadDetailsProps) => {
  const { webinars, fetchWebinars, registerLeadForWebinar } = useMarketingStore();
  const { scheduleCall, updateStage, fetchLeads, loading } = useLeadStore();
  const { templates, fetchTemplates } = useTemplateStore();
  
  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);
  const [scheduleData, setScheduleData] = React.useState({ notes: '', scheduledAt: '' });
  const [successMsg, setSuccessMsg] = React.useState('');
  const [newNote, setNewNote] = React.useState('');
  const [addingNote, setAddingNote] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState('');
  const [sendingTemplate, setSendingTemplate] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      fetchWebinars();
      fetchTemplates();
    }
  }, [isOpen, fetchWebinars, fetchTemplates]);

  const handleScheduleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await scheduleCall(lead.id, scheduleData);
    if (success) {
      setSuccessMsg('Call scheduled successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        setIsScheduleOpen(false);
      }, 2000);
    }
  };

  const handleStageChange = async (newStage: string) => {
    const success = await updateStage(lead.id, newStage);
    if (success) {
      setSuccessMsg(`Stage updated to ${newStage.replace('_', ' ')}`);
      setTimeout(() => setSuccessMsg(''), 2000);
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
        body: JSON.stringify({ content: newNote })
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
    }
  };

  const handleDownloadLetter = async () => {
    if (!lead?.application?.id) {
      setSuccessMsg('No application record found for this lead.');
      setTimeout(() => setSuccessMsg(''), 3000);
      return;
    }
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
    }
  };

  const timelineItems = React.useMemo(() => {
    if (!lead) return [];
    
    const logs = (lead.communicationLogs || []).map((log: any) => ({
      id: `comm_${log.id}`,
      type: 'communication',
      date: new Date(log.timestamp),
      content: log
    }));

    const notes = (lead.notes || []).map((note: any) => ({
      id: `note_${note.id}`,
      type: 'note',
      date: new Date(note.createdAt),
      content: note
    }));

    const followUps = (lead.followUps || []).filter((f: any) => f.completedAt).map((f: any) => ({
      id: `followup_${f.id}`,
      type: 'followup',
      date: new Date(f.completedAt),
      content: f
    }));
    
    const cLogs = (lead.counselingLogs || []).map((clog: any) => ({
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

    return [...logs, ...notes, ...followUps, ...cLogs, ...webinars].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [lead]);

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
                    className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-1 rounded border-none outline-none cursor-pointer hover:bg-primary/20 transition-all"
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s} className="bg-background text-foreground">{s.replace('_', ' ')}</option>
                    ))}
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
              {/* Phone, Email, Source, Campaign, Created fields (Keep existing) */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone</p>
                <div className="flex items-center gap-2 text-foreground/80">
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="text-sm">{lead.phone}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p>
                <div className="flex items-center gap-2 text-foreground/80">
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="text-sm truncate">{lead.email}</span>
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

            {/* Upcoming Follow-ups Section */}
            {lead.followUps?.length > 0 && (
              <section className="space-y-4">
                 <h3 className="font-semibold flex items-center gap-2">
                  <Clock size={18} className="text-blue-400" />
                  Scheduled Follow-ups
                </h3>
                <div className="space-y-3">
                  {lead.followUps.filter((f: any) => !f.completedAt).map((f: any) => (
                    <div key={f.id} className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">{new Date(f.scheduledAt).toLocaleString()}</p>
                        <p className="text-sm text-foreground/70 mt-1">{f.notes}</p>
                      </div>
                      <div className="p-1 px-2 bg-primary/10 text-primary text-[9px] font-bold uppercase rounded">Pending</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Application & Documents Verification */}
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
                                 <button onClick={() => handleVerifyDocument(doc.id, 'APPROVED')} className="p-1.5 hover:bg-emerald-500/20 rounded text-emerald-400 transition-colors"><Check size={14} /></button>
                                 <button onClick={() => handleVerifyDocument(doc.id, 'REJECTED')} className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors"><X size={14} /></button>
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
              <div className="space-y-6 border-l-2 border-white/5 ml-2 pl-6">
                
                {timelineItems.length > 0 ? timelineItems.map((item: any) => {
                  if (item.type === 'communication') {
                    const log = item.content;
                    return (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-4 border-background" />
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase flex gap-2 items-center">
                             {log.type} Message • {item.date.toLocaleString()}
                             <span className={log.status === 'SENT' ? 'text-primary' : 'text-red-400'}>{log.status}</span>
                          </p>
                          <button 
                            onClick={() => {
                              setNewNote(log.message);
                              const editor = document.getElementById('note-editor');
                              editor?.focus();
                              setSuccessMsg('Message copied to editor');
                              setTimeout(() => setSuccessMsg(''), 2000);
                            }}
                            className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
                            title="Reuse this message"
                          >
                            <RotateCcw size={10} />
                            <span className="text-[8px] font-bold uppercase">Reuse</span>
                          </button>
                        </div>
                        <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{log.message}</p>
                      </div>
                    );
                  }
                  if (item.type === 'note') {
                    const note = item.content;
                    return (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-4 border-background" />
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] uppercase tracking-wider">Remark</span>
                            {note.counselor?.name || 'Counselor'} • {item.date.toLocaleString()}
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
                            {clog.counselor?.name || 'Counselor'} • {item.date.toLocaleString()}
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
                Add Internal Note
              </h3>
              <div className="flex gap-2">
                <textarea 
                  id="note-editor"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type counselor remarks, student feedback, or discussion summary..."
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/30 transition-all text-foreground resize-none"
                  rows={3}
                />
                <button 
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="bg-primary hover:bg-primary/90 px-4 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 text-primary-foreground"
                 >
                   Save
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
                   Send
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
            <button 
              onClick={() => setIsScheduleOpen(true)}
              className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Clock size={16} />
              Schedule Call
            </button>
            {lead.stage === 'ADMISSION_CONFIRMED' ? (
              <button 
                onClick={handleDownloadLetter}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-white"
              >
                <Download size={16} />
                Download Letter
              </button>
            ) : (
              <button 
                onClick={() => handleStageChange(STAGES[STAGES.indexOf(lead.stage) + 1] || lead.stage)}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-primary-foreground"
              >
                {loading ? 'Updating...' : (
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

      {/* Schedule Call Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsScheduleOpen(false)} />
          <div className="relative w-full max-w-md glass border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <form onSubmit={handleScheduleCall}>
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-bold">Schedule Follow-up Call</h3>
                <button type="button" onClick={() => setIsScheduleOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Call Date & Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={scheduleData.scheduledAt}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/30 transition-all text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Notes / Call Objective</label>
                  <textarea 
                    required
                    value={scheduleData.notes}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Discuss application documents..."
                    rows={4}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/30 transition-all text-foreground resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-border bg-white/[0.02] flex gap-3">
                <button type="button" onClick={() => setIsScheduleOpen(false)} className="flex-1 py-2 text-sm font-semibold hover:bg-white/5 rounded-xl">Cancel</button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 text-primary-foreground"
                >
                  {loading ? 'Scheduling...' : 'Confirm Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
