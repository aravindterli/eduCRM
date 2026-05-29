'use client';

import React from 'react';
import { Device } from '@twilio/voice-sdk';
import { X, Phone, Mail, Calendar, MessageSquare, History, Tag, ArrowRight, Megaphone, CheckCircle2, UploadCloud, FileText, FileType, Check, Download, RotateCcw, MessageCircle, PhoneCall, Smartphone, Activity, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useMarketingStore } from '@/store/useMarketingStore';
import { useLeadStore } from '@/store/useLeadStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/auth.store';

const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};
import { useTemplateStore } from '@/store/useTemplateStore';
import { FollowUpPanel } from './FollowUpPanel';

interface LeadDetailsProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  staff?: any[];
}

export const LeadDetails = ({ lead, isOpen, onClose, staff }: LeadDetailsProps) => {
  const { webinars, fetchWebinars, registerLeadForWebinar } = useMarketingStore();
  const { updateStage, fetchLeads, loading } = useLeadStore();
  const { templates, fetchTemplates } = useTemplateStore();
  const { user } = useAuthStore();

  const sector = (user?.sector as 'EDUCATION' | 'REAL_ESTATE' | 'HEALTHCARE' | 'GENERIC') || 'EDUCATION';

  const sectorConfigs = {
    EDUCATION: {
      backgroundLabel: 'Educational Background',
      interestLabel: 'Interested Program',
      counselingLabel: 'Counseling Log',
      applicationLabel: 'Application Documents',
      downloadLabel: 'Download Letter',
      downloadSuccess: 'Admission letter downloaded!',
      uploadPlaceholder: 'Click to upload identity or academic record'
    },
    REAL_ESTATE: {
      backgroundLabel: 'Current Residence',
      interestLabel: 'Property Interest',
      counselingLabel: 'Site Visit Log',
      applicationLabel: 'Booking Documents',
      downloadLabel: 'Download Booking Receipt',
      downloadSuccess: 'Booking receipt downloaded!',
      uploadPlaceholder: 'Click to upload identity or booking agreement'
    },
    HEALTHCARE: {
      backgroundLabel: 'Insurance Status',
      interestLabel: 'Required Service',
      counselingLabel: 'Consultation Log',
      applicationLabel: 'Medical Documents',
      downloadLabel: 'Download Consultation Slip',
      downloadSuccess: 'Consultation slip downloaded!',
      uploadPlaceholder: 'Click to upload identity or medical records'
    },
    GENERIC: {
      backgroundLabel: 'Industry',
      interestLabel: 'Required Solution',
      counselingLabel: 'Interaction Log',
      applicationLabel: 'Inquiry Documents',
      downloadLabel: 'Download Invoice/Receipt',
      downloadSuccess: 'Invoice/Receipt downloaded!',
      uploadPlaceholder: 'Click to upload identity or supporting documents'
    }
  };

  const currentConfig = sectorConfigs[sector] || sectorConfigs.EDUCATION;

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
  const [activeCommTab, setActiveCommTab] = React.useState<null | 'chat' | 'call' | 'history'>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [calls, setCalls] = React.useState<any[]>([]);
  const [fetchingComms, setFetchingComms] = React.useState(false);
  const [newMessage, setNewMessage] = React.useState('');
  const [twilioDevice, setTwilioDevice] = React.useState<any>(null);
  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const [twilioCall, setTwilioCall] = React.useState<any>(null);
  const [callStatus, setCallStatus] = React.useState('Idle');
  const [callDuration, setCallDuration] = React.useState(0);
  const timerIntervalRef = React.useRef<any>(null);
  const callDurationRef = React.useRef(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = React.useState(false);

  const fetchMessages = async () => {
    setFetchingComms(true);
    const token = localStorage.getItem('centracrm_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setFetchingComms(false);
    }
  };

  const fetchCalls = async () => {
    setFetchingComms(true);
    const token = localStorage.getItem('centracrm_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}/calls`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCalls(data);
      }
    } catch (error) {
      console.error('Failed to fetch calls:', error);
    } finally {
      setFetchingComms(false);
    }
  };

  const saveCallLog = async (duration: number) => {
    const token = localStorage.getItem('centracrm_token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ duration, result: 'CONNECTED' })
      });
      fetchCalls(); // Refresh calls list
    } catch (error) {
      console.error('Failed to save call log:', error);
    }
  };

  const setupTwilioDevice = async () => {
    const token = localStorage.getItem('centracrm_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/twilio/token`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const { token: twilioToken } = await res.json();

        const device = new Device(twilioToken, {
          codecPreferences: ['opus' as any, 'pcmu' as any],
        });

        device.on('registered', () => {
          console.log('Twilio Device Registered');
          setCallStatus('Ready');
        });

        device.on('error', (error: any) => {
          console.error('Twilio Device Error:', error);
          setCallStatus('Error');
        });

        device.register();
        setTwilioDevice(device);
      }
    } catch (error) {
      console.error('Failed to setup Twilio device:', error);
    }
  };

  const disconnectCall = () => {
    if (twilioDevice) {
      twilioDevice.disconnectAll();
      setCallStatus('Idle');
    }
  };

  React.useEffect(() => {
    if (activeCommTab === 'chat') {
      fetchMessages();
    } else if (activeCommTab === 'history') {
      fetchCalls();
    } else if (activeCommTab === 'call' && !twilioDevice) {
      setupTwilioDevice();
    }
  }, [activeCommTab, twilioDevice]);

  const socket = useNotificationStore(state => state.socket);

  React.useEffect(() => {
    if (socket) {
      socket.on('twilio:callStatus', (data: any) => {
        console.log('[Socket] Twilio call status:', data);
        if (data.status === 'in-progress') {
          setCallStatus('Connected');

          // Reset duration
          setCallDuration(0);
          callDurationRef.current = 0;

          // Start Timer
          const interval = setInterval(() => {
            setCallDuration(prev => {
              const newVal = prev + 1;
              callDurationRef.current = newVal;
              return newVal;
            });
          }, 1000);
          timerIntervalRef.current = interval;
        }
      });

      return () => {
        socket.off('twilio:callStatus');
      };
    }
  }, [socket]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const token = localStorage.getItem('centracrm_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage, channel: 'WHATSAPP' }) // Default to WhatsApp for now
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const toggleMute = () => {
    if (twilioCall) {
      const newMuteStatus = !isMuted;
      twilioCall.mute(newMuteStatus);
      setIsMuted(newMuteStatus);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const initiateCall = async () => {
    if (twilioDevice) {
      setCallStatus('Calling');
      try {
        const token = localStorage.getItem('centracrm_token');
        const decoded = token ? decodeToken(token) : null;
        const userId = decoded?.id;

        const call = await twilioDevice.connect({
          params: {
            To: lead.phone,
            UserId: userId
          }
        });
        setTwilioCall(call);

        call.on('ringing', () => {
          console.log('Twilio Call Ringing');
          setCallStatus('Ringing');
        });

        call.on('accept', () => {
          console.log('Twilio Call Accepted by Twilio');
          // We don't start the timer here anymore, 
          // we wait for the socket event 'answered'
        });

        call.on('disconnect', () => {
          console.log('Twilio Call Disconnected');
          setCallStatus('Idle');
          setTwilioCall(null);

          // Stop Timer
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }

          // Save Call Log
          saveCallLog(callDurationRef.current);
        });
      } catch (error) {
        console.error('Failed to connect call:', error);
        setCallStatus('Error');
      }
    } else {
      console.error('Twilio device not ready');
      setCallStatus('Simulation');
      setTimeout(() => setCallStatus('Idle'), 2000);
    }
  };


  const openLogModal = (type: string) => {
    setLogType(type);
    setLogForm({ message: `Manual ${type.toLowerCase()} follow-up logged`, duration: '', result: '' });
    setShowLogModal(true);
  };

  const submitLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingInteraction(true);
    const token = localStorage.getItem('centracrm_token');
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
  const [updatingOwner, setUpdatingOwner] = React.useState(false);
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

  const handleOwnerChange = async (newOwnerId: string) => {
    setUpdatingOwner(true);
    try {
      const success = await updateLead(lead.id, { assignedId: newOwnerId });
      if (success) {
        setSuccessMsg(`Lead manually reassigned`);
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } finally {
      setUpdatingOwner(false);
    }
  };
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
      const token = localStorage.getItem('centracrm_token');
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
      const token = localStorage.getItem('centracrm_token');
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
      const token = localStorage.getItem('centracrm_token');
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
      const token = localStorage.getItem('centracrm_token');
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
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${lead.application.id}/letter`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const { url } = await res.json();
        const link = document.createElement('a');
        link.href = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${url}`;
        link.target = '_blank';
        const downloadName = sector === 'EDUCATION' ? 'Admission_Letter' :
                            sector === 'REAL_ESTATE' ? 'Booking_Receipt' :
                            sector === 'HEALTHCARE' ? 'Consultation_Slip' :
                            'Receipt';
        link.download = `${downloadName}_${lead.name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccessMsg(currentConfig.downloadSuccess);
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

    return [...cLogs, ...notes, ...followUps, ...counselingLogs, ...(sector === 'EDUCATION' ? webinars : [])].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [lead, sector]);

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

  const noteTypes = [
    { value: 'REMARK', label: 'Owner Remark', color: 'blue' },
    { value: 'STUDENT_FEEDBACK', label: sector === 'EDUCATION' ? 'Student Feedback' : sector === 'REAL_ESTATE' ? 'Client Feedback' : sector === 'HEALTHCARE' ? 'Patient Feedback' : 'Client Feedback', color: 'emerald' },
    { value: 'DISCUSSION_SUMMARY', label: 'Discussion Summary', color: 'purple' },
    { value: 'GENERAL', label: 'General Note', color: 'slate' }
  ];

  if (!isOpen || !lead) return null;

  const stages = [
    'NEW', 'CONTACTED', 'RESPONDED', 'QUALIFIED', 'MEETING SCHEDULED',
    'PROPOSAL SENT', 'NEGOTIATION', 'CONVERTED', 'ON HOLD', 'LOST', 'RE-ENGAGEMENT'
  ];

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-xl bg-white border-l border-black/10 shadow-2xl animate-in slide-in-from-right duration-300 text-[#1A1A1A]">
        <div className="flex flex-col h-full bg-white">
          <div className="p-6 border-b border-black/10 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[8px] bg-[#1A1A1A] text-[#F5F1EB] flex items-center justify-center font-bold text-xl shadow-sm">
                {lead.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A]">{lead.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <select
                    value={lead.stage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    disabled={updatingStage}
                    className="text-[10px] uppercase font-bold tracking-widest text-[#F5F1EB] bg-[#1A1A1A] hover:bg-black/90 px-3 py-1.5 rounded-[8px] border-none outline-none cursor-pointer transition-all disabled:opacity-50 shadow-sm"
                  >
                    <option value={lead.stage} className="bg-white text-[#1A1A1A]">
                      {updatingStage ? 'Updating...' : lead.stage.replace('_', ' ')}
                    </option>
                    {stages.filter(s => s !== lead.stage).map(s => (
                      <option key={s} value={s} className="bg-white text-[#1A1A1A]">{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <select
                    value={lead.tag || 'COLD'}
                    onChange={(e) => handleTagChange(e.target.value)}
                    disabled={updatingTag}
                    className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-[8px] border outline-none cursor-pointer hover:opacity-90 transition-all disabled:opacity-50 shadow-sm font-semibold ${lead.tag === 'HOT' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      lead.tag === 'WARM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                  >
                    <option value="COLD" className="bg-white text-[#1A1A1A]">Cold</option>
                    <option value="WARM" className="bg-white text-[#1A1A1A]">Warm</option>
                    <option value="HOT" className="bg-white text-[#1A1A1A]">Hot</option>
                  </select>
                  {staff && (
                    <div className="flex items-center gap-2 ml-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Assignee</span>
                      <select
                        value={lead.assignedId || ''}
                        onChange={(e) => handleOwnerChange(e.target.value)}
                        disabled={updatingOwner}
                        className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-[8px] border border-black/10 outline-none cursor-pointer hover:bg-gray-50 transition-all disabled:opacity-50 bg-[#F5F1EB] text-[#1A1A1A] shadow-sm font-semibold"
                      >
                        <option value="" className="bg-white text-[#1A1A1A]">Unassigned</option>
                        {staff.map(u => (
                          <option key={u.id} value={u.id} className="bg-white text-[#1A1A1A]">
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[8px] text-slate-500 hover:text-slate-800 transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-[12px] flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                <CheckCircle2 size={18} />
                <p className="text-sm font-medium">{successMsg}</p>
              </div>
            )}

            <section className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Phone</p>
                <div className="flex items-center gap-3 text-slate-800">
                  <Phone size={14} className="text-slate-400" />
                  <span className="text-sm font-medium">{lead.phone}</span>
                  <div className="flex gap-1.5 ml-auto">
                    <button
                      onClick={() => setActiveCommTab('chat')}
                      className="p-1.5 bg-[#1A1A1A] hover:bg-black/90 text-[#F5F1EB] rounded-[8px] transition-all flex items-center gap-1 shadow-sm"
                      title="Open Communication Hub"
                    >
                      <MessageSquare size={12} />
                      <span className="text-[10px] font-bold uppercase">Hub</span>
                    </button>
                    <a href={`tel:${lead.phone}`} className="p-1.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-[8px] hover:bg-orange-100 transition-all shadow-sm" title="Call directly">
                      <PhoneCall size={12} />
                    </a>
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-[8px] hover:bg-emerald-100 transition-all shadow-sm" title="Message on WhatsApp">
                      <MessageCircle size={12} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Email</p>
                <div className="flex items-center gap-2 text-slate-800">
                  <Mail size={14} className="text-slate-400" />
                  <a href={`mailto:${lead.email}`} className="text-sm truncate hover:text-blue-600 transition-colors font-medium">{lead.email}</a>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Source</p>
                <div className="flex items-center gap-2 text-slate-800">
                  <Tag size={14} className="text-slate-400" />
                  <span className="text-sm font-medium">{lead.leadSource}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Campaign</p>
                <div className="flex items-center gap-2 text-slate-800">
                  <Megaphone size={14} className="text-slate-400" />
                  <span className="text-sm font-medium">{lead.campaign?.name || 'Organic / None'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Created</p>
                <div className="flex items-center gap-2 text-slate-800">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-sm font-medium">{new Date(lead.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Drip Status</p>
                <div className="flex items-center gap-2 text-slate-800">
                  <MessageSquare size={14} className="text-blue-600" />
                  <span className="text-sm font-medium">
                    {lead.stage === 'NEW' ? 'Active (Pending)' : 'Completed / N/A'}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{currentConfig.backgroundLabel}</p>
                <div className="flex items-center gap-2 text-slate-800">
                  <FileText size={14} className="text-slate-400" />
                  <span className="text-sm font-medium">{lead.eduBackground || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{currentConfig.interestLabel}</p>
                <div className="flex items-center gap-2 text-slate-800">
                  <Tag size={14} className="text-slate-400" />
                  <span className="text-sm font-medium truncate" title={lead.program?.name || 'None'}>
                    {lead.program?.name || 'None'}
                  </span>
                </div>
              </div>
            </section>

            {lead.additionalData && Object.keys(lead.additionalData).length > 0 && (
              <section className="bg-gray-50 rounded-[12px] p-4 border border-black/5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-[#1A1A1A]" /> Custom Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(lead.additionalData).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-sm text-slate-800 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <FollowUpPanel leadId={lead.id} initialFollowUps={lead.followUps || []} />

            <section className="bg-gray-50 rounded-[12px] p-4 border border-black/5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3 flex items-center gap-2">
                <Activity size={14} /> Quick Follow-up Logging
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => openLogModal('CALL')}
                  disabled={loggingInteraction}
                  className="flex flex-col items-center gap-2 p-3 rounded-[8px] bg-orange-50 border border-orange-100 text-orange-700 hover:bg-orange-100 transition-all shadow-sm"
                >
                  <Phone size={18} />
                  <span className="text-[10px] font-bold uppercase">Log Call</span>
                </button>
                <button
                  onClick={() => openLogModal('WHATSAPP')}
                  disabled={loggingInteraction}
                  className="flex flex-col items-center gap-2 p-3 rounded-[8px] bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-all shadow-sm"
                >
                  <MessageCircle size={18} />
                  <span className="text-[10px] font-bold uppercase">WhatsApp</span>
                </button>
                <button
                  onClick={() => openLogModal('SMS')}
                  disabled={loggingInteraction}
                  className="flex flex-col items-center gap-2 p-3 rounded-[8px] bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 transition-all shadow-sm"
                >
                  <Smartphone size={18} />
                  <span className="text-[10px] font-bold uppercase">Log SMS</span>
                </button>
              </div>
            </section>

            {lead.application && (
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold flex items-center gap-2 text-[#1A1A1A]">
                    <FileText size={18} className="text-[#1A1A1A]" />
                    {currentConfig.applicationLabel}
                  </h3>
                  <div className="p-1.5 px-3 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase rounded-[8px] shadow-sm">
                    {lead.application.status}
                  </div>
                </div>

                <div className="space-y-3">
                  {lead.application.documents?.map((doc: any) => (
                    <div key={doc.id} className="p-4 rounded-[12px] bg-white border border-black/10 flex justify-between items-center shadow-sm text-[#1A1A1A]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
                          <FileType size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1A1A1A]">{doc.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{doc.type} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-[6px] border ${doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : doc.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {doc.status}
                        </span>
                        <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${doc.url}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-gray-100 rounded-[8px] text-slate-500 hover:text-slate-800 transition-colors">
                          <Download size={14} />
                        </a>
                        {doc.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'APPROVED')}
                              disabled={verifyingDocId === doc.id}
                              className="p-1.5 hover:bg-emerald-50 rounded-[8px] text-emerald-600 transition-colors disabled:opacity-30"
                            >
                              <Check size={14} className={verifyingDocId === doc.id ? 'animate-pulse' : ''} />
                            </button>
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                              disabled={verifyingDocId === doc.id}
                              className="p-1.5 hover:bg-rose-50 rounded-[8px] text-rose-600 transition-colors disabled:opacity-30"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-4 border-2 border-dashed border-black/10 rounded-[12px] text-center hover:bg-gray-50/50 transition-colors bg-gray-50/20">
                    <input type="file" onChange={handleFileUpload} className="hidden" id="doc-upload" />
                    <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <UploadCloud size={24} className="text-slate-400 hover:text-[#1A1A1A] transition-colors" />
                      <span className="text-xs font-bold text-slate-600 hover:text-[#1A1A1A] transition-colors">{currentConfig.uploadPlaceholder}</span>
                    </label>
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-[#1A1A1A]">
                <History size={18} className="text-[#1A1A1A]" />
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[10px] font-bold uppercase transition-all whitespace-nowrap border ${filterType === tab.id
                      ? 'bg-[#1A1A1A] border-transparent text-[#F5F1EB] shadow-sm'
                      : 'bg-white border-black/10 text-slate-600 hover:bg-gray-50 shadow-xs'
                      }`}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-6 border-l-2 border-black/5 ml-2 pl-6 pt-2">

                {filteredTimelineItems.length > 0 ? filteredTimelineItems.map((item: any) => {
                  if (item.type === 'communication') {
                    const log = item.content;
                    const isCall = log.type === 'CALL';
                    const isWhatsapp = log.type === 'WHATSAPP';
                    const Icon = isCall ? PhoneCall : isWhatsapp ? MessageCircle : Mail;
                    const colorClass = isCall ? 'text-orange-600' : isWhatsapp ? 'text-emerald-600' : 'text-blue-600';

                    return (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#1A1A1A] border-2 border-white shadow-sm" />
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-slate-500 uppercase flex gap-2 items-center">
                            <Icon size={10} className={colorClass} />
                            {log.type} Interaction • {item.date.toLocaleString()}
                            <span className={log.status === 'SENT' ? 'text-blue-600' : 'text-rose-600'}>{log.status}</span>
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
                              className="p-1 hover:bg-gray-100 rounded-[6px] text-slate-500 hover:text-[#1A1A1A] transition-all flex items-center gap-1"
                              title="Reuse this message"
                            >
                              <RotateCcw size={10} />
                              <span className="text-[8px] font-bold uppercase">Reuse</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap font-medium">{log.message}</p>
                        {(log.duration || log.result) && (
                          <div className="flex gap-3 mt-2">
                            {log.duration && (
                              <span className="text-[9px] font-bold text-slate-600 uppercase bg-gray-100 border border-black/5 px-2 py-0.5 rounded-[6px]">
                                Duration: {log.duration}m
                              </span>
                            )}
                            {log.result && (
                              <span className="text-[9px] font-bold text-blue-700 uppercase bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-[6px]">
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
                    const catColor = cat === 'REMARK' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      cat === 'FEEDBACK' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        cat === 'SUMMARY' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          'bg-slate-50 text-slate-700 border border-slate-200';
                    return (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#1A1A1A] border-2 border-white shadow-sm" />
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded-[6px] text-[8px] uppercase tracking-wider ${catColor}`}>
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
                            className="p-1 hover:bg-gray-100 rounded-[6px] text-slate-500 hover:text-[#1A1A1A] transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
                            title="Reuse this note"
                          >
                            <RotateCcw size={10} />
                            <span className="text-[8px] font-bold uppercase">Reuse</span>
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 mt-1 italic font-medium">"{note.content}"</p>
                      </div>
                    );
                  }
                  if (item.type === 'counseling') {
                    const clog = item.content;
                    return (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow-sm" />
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded-[6px] bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] uppercase tracking-wider font-semibold">{currentConfig.counselingLabel.replace(' Log', '')}</span>
                            {clog.assignedTo?.name || 'COUNSELOR'} • {item.date.toLocaleString()}
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
                            className="p-1 hover:bg-gray-100 rounded-[6px] text-slate-500 hover:text-emerald-600 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
                            title="Reuse these remarks"
                          >
                            <RotateCcw size={10} />
                            <span className="text-[8px] font-bold uppercase">Reuse</span>
                          </button>
                        </div>
                        {clog.notes && <p className="text-sm text-slate-600 mt-1 italic font-medium">"{clog.notes}"</p>}
                        {clog.recommendation && (
                          <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                            <ArrowRight size={10} /> Rec: {clog.recommendation}
                          </p>
                        )}
                      </div>
                    );
                  }
                  if (item.type === 'webinar') {
                    const reg = item.content;
                    return (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-pink-600 border-2 border-white shadow-sm" />
                        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded-[6px] bg-pink-50 text-pink-700 border border-pink-100 text-[8px] uppercase tracking-wider font-semibold">Webinar</span>
                          {reg.attended ? 'Attended' : 'Registered'} • {item.date.toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-800 mt-1 font-medium">"{reg.webinar?.title || 'Webinar'}" event.</p>
                      </div>
                    );
                  }
                  if (item.type === 'followup') {
                    const f = item.content;
                    return (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow-sm" />
                        <p className="text-[10px] font-bold text-slate-500">Follow-up Call Completed • {item.date.toLocaleString()}</p>
                        <p className="text-sm text-slate-800 mt-1 font-medium">{f.notes}</p>
                      </div>
                    );
                  }
                  return null;
                }) : (
                  <p className="text-sm text-slate-400 italic">No activity recorded yet.</p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-[#1A1A1A]">
                <MessageSquare size={18} className="text-[#1A1A1A]" />
                Add Detailed History Entry
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {noteTypes.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setNoteType(t.value)}
                    className={`px-3 py-2 rounded-[8px] text-[10px] font-bold uppercase tracking-wider transition-all border ${noteType === t.value ? 'bg-[#1A1A1A] border-transparent text-[#F5F1EB] shadow-sm' : 'bg-gray-50 border-black/10 text-slate-500 hover:bg-gray-100'
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
                  className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all text-[#1A1A1A] resize-none font-medium"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="bg-[#1A1A1A] hover:bg-black/90 px-4 rounded-[8px] text-sm font-bold shadow-sm transition-all disabled:opacity-50 text-[#F5F1EB]"
                >
                  {addingNote ? 'Saving...' : 'Save'}
                </button>
              </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-black/10">
              <h3 className="font-semibold flex items-center gap-2 text-[#1A1A1A]">
                <MessageSquare size={18} className="text-[#1A1A1A]" />
                Dispatch Custom Template
              </h3>
              <div className="flex gap-2">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all text-slate-600 font-medium"
                >
                  <option value="" className="bg-white text-slate-600">Select a template to send...</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id} className="bg-white text-[#1A1A1A]">
                      {t.name} ({t.channel})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSendTemplate}
                  disabled={sendingTemplate || !selectedTemplate}
                  className="bg-[#1A1A1A] hover:bg-black/90 px-4 rounded-[8px] text-sm font-bold shadow-sm transition-all disabled:opacity-50 text-[#F5F1EB]"
                >
                  {sendingTemplate ? 'Sending...' : 'Send'}
                </button>
              </div>
            </section>

            {/* Webinar History Section (Keep existing) */}
            {sector === 'EDUCATION' && (
              <section className="space-y-4 pt-6 border-t border-black/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2 text-[#1A1A1A]">
                    <Calendar size={18} className="text-[#1A1A1A]" />
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
                      className="bg-gray-50 border border-black/10 rounded-[8px] px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-black/10 transition-all text-slate-600 font-semibold"
                    >
                      <option value="">+ Register for...</option>
                      {webinars
                        .filter(w => !lead.webinarRegistrations?.some((r: any) => r.webinarId === w.id))
                        .map(w => (
                          <option key={w.id} value={w.id} className="bg-white text-[#1A1A1A]">{w.title}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="space-y-3 bg-white">
                  {!lead.webinarRegistrations?.length ? (
                    <p className="text-xs text-slate-500 italic px-2">No webinars registered yet.</p>
                  ) : lead.webinarRegistrations.map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 rounded-[12px] bg-gray-50 border border-black/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${reg.attended ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{reg.webinar?.title}</p>
                          <p className="text-[10px] text-slate-500">{new Date(reg.webinar?.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-[6px] border ${reg.attended ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {reg.attended ? 'Attended' : 'Registered'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="p-6 border-t border-black/10 flex gap-3 bg-gray-50">
            {lead.stage === 'CONVERTED' ? (
              <button
                onClick={handleDownloadLetter}
                disabled={downloadingLetter}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-3 rounded-[8px] text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50 cursor-pointer"
              >
                <Download size={16} className={downloadingLetter ? 'animate-bounce' : ''} />
                {downloadingLetter ? 'Downloading...' : currentConfig.downloadLabel}
              </button>
            ) : (lead.stage === 'RE_ENGAGEMENT' || lead.stage === 'LOST') ? (
              <button
                onClick={handleReactivate}
                disabled={loading || reactivating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-3 rounded-[8px] text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw size={16} className={reactivating ? 'animate-spin' : ''} />
                {reactivating ? 'Re-activating...' : 'Re-activate Lead'}
              </button>
            ) : (
              <button
                onClick={() => handleStageChange(stages[stages.indexOf(lead.stage) + 1] || lead.stage)}
                disabled={loading || updatingStage}
                className="flex-1 bg-[#1A1A1A] hover:bg-black/90 py-3 rounded-[8px] text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-[#F5F1EB] cursor-pointer"
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogModal(false)} />
          <div className="relative w-full max-w-md bg-white border border-black/10 rounded-[16px] shadow-2xl animate-in zoom-in-95 overflow-hidden text-[#1A1A1A]">
            <form onSubmit={submitLogInteraction}>
              <div className="p-5 border-b border-black/10 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="font-bold flex items-center gap-2 uppercase tracking-tight text-[#1A1A1A]">
                    <Activity size={18} className="text-[#1A1A1A]" />
                    Log {logType} Interaction
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Recording manual outbound follow-up</p>
                </div>
                <button type="button" onClick={() => setShowLogModal(false)} className="p-2 hover:bg-gray-100 rounded-[8px] text-slate-500">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4 bg-white">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Interaction Notes</label>
                  <textarea
                    required
                    value={logForm.message}
                    onChange={(e) => setLogForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="What did you discuss? e.g. Student needs more time, interested in scholarship..."
                    rows={4}
                    className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all text-[#1A1A1A] resize-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Outcome / Result</label>
                    <select
                      value={logForm.result}
                      onChange={(e) => setLogForm(p => ({ ...p, result: e.target.value }))}
                      className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all text-[#1A1A1A] font-semibold"
                    >
                      <option value="" className="bg-white text-slate-500">Select outcome...</option>
                      <option value="INTERESTED" className="bg-white text-[#1A1A1A]">Interested</option>
                      <option value="FOLLOW_UP_NEEDED" className="bg-white text-[#1A1A1A]">Follow-up Needed</option>
                      <option value="NOT_REACHABLE" className="bg-white text-[#1A1A1A]">Not Reachable</option>
                      <option value="NOT_INTERESTED" className="bg-white text-[#1A1A1A]">Not Interested</option>
                      <option value="WRONG_NUMBER" className="bg-white text-[#1A1A1A]">Wrong Number</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Duration (mins)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={logForm.duration}
                      onChange={(e) => setLogForm(p => ({ ...p, duration: e.target.value }))}
                      className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all text-[#1A1A1A] font-semibold"
                    />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-black/10 bg-gray-50 flex gap-3">
                <button type="button" onClick={() => setShowLogModal(false)} className="flex-1 py-2.5 text-sm font-semibold hover:bg-gray-100 rounded-[8px] transition-colors text-slate-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingInteraction}
                  className="flex-1 bg-[#1A1A1A] hover:bg-black/90 py-2.5 rounded-[8px] text-sm font-bold shadow-sm transition-all disabled:opacity-50 text-[#F5F1EB]"
                >
                  {loggingInteraction ? 'Saving...' : 'Save Interaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Communication Hub Modal ────────────────────────── */}
      {activeCommTab && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveCommTab(null)} />
          <div className="relative w-full max-w-lg bg-white border border-black/10 rounded-[16px] shadow-2xl animate-in zoom-in-95 overflow-hidden text-[#1A1A1A]">
            <div className="p-5 border-b border-black/10 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold flex items-center gap-2 uppercase tracking-tight text-[#1A1A1A]">
                  <MessageSquare size={18} className="text-[#1A1A1A]" />
                  Communication Hub
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Connect with {lead.name}</p>
              </div>
              <button type="button" onClick={() => setActiveCommTab(null)} className="p-2 hover:bg-gray-100 rounded-[8px] text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-black/10 bg-gray-50/50">
              <button
                onClick={() => setActiveCommTab('chat')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeCommTab === 'chat' ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A]' : 'text-slate-500 hover:text-[#1A1A1A]'}`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveCommTab('call')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeCommTab === 'call' ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A]' : 'text-slate-500 hover:text-[#1A1A1A]'}`}
              >
                Call
              </button>
              <button
                onClick={() => setActiveCommTab('history')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeCommTab === 'history' ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A]' : 'text-slate-500 hover:text-[#1A1A1A]'}`}
              >
                History
              </button>
            </div>

            <div className="p-5 h-[400px] overflow-y-auto bg-white">
              {activeCommTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-4 overflow-y-auto mb-4 pr-1">
                    {fetchingComms ? (
                      <div className="text-center text-slate-400 py-4 text-xs italic">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-slate-400 py-4 text-xs italic">No messages yet.</div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`${msg.direction === 'OUTBOUND' ? 'bg-[#1A1A1A] text-[#F5F1EB] rounded-[12px] rounded-tr-none' : 'bg-gray-100 text-[#1A1A1A] border border-black/5 rounded-[12px] rounded-tl-none'} p-3 max-w-[80%] shadow-xs`}>
                            <p className="text-sm font-medium">{msg.message}</p>
                            <p className={`text-[9px] mt-1 font-bold ${msg.direction === 'OUTBOUND' ? 'text-[#F5F1EB]/70' : 'text-slate-500'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all text-[#1A1A1A] font-medium"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-[#1A1A1A] hover:bg-black/90 px-5 rounded-[8px] text-sm font-bold shadow-sm transition-all text-[#F5F1EB]"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              {activeCommTab === 'call' && (
                <div className="flex flex-col items-center justify-between h-full py-6 bg-[#F5F1EB] text-[#1A1A1A] rounded-[12px] -m-5">
                  {/* Top: Status & Timer */}
                  <div className="text-center mt-4">
                    <p className="text-2xl font-bold text-[#1A1A1A] mb-1">{lead.name}</p>
                    <p className="text-sm text-slate-600 mb-2">{lead.phone}</p>
                    <p className={`text-sm font-bold ${callStatus === 'Ready' || callStatus === 'Connected' ? 'text-emerald-600' : callStatus === 'Error' ? 'text-rose-600' : 'text-slate-500'}`}>
                      {callStatus === 'Connected' ? `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : callStatus}
                    </p>
                  </div>

                  {/* Center: Avatar */}
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="w-32 h-32 rounded-[24px] bg-emerald-50 text-emerald-600 border-4 border-emerald-100 flex items-center justify-center shadow-lg">
                      <span className="text-5xl font-bold">{lead.name.charAt(0)}</span>
                    </div>
                  </div>

                  {/* Bottom: Controls */}
                  <div className="w-full max-w-sm px-6 mb-2">
                    <div className="bg-white border border-black/10 rounded-[12px] p-4 flex items-center justify-around shadow-sm">
                      {/* Mute Button */}
                      <button
                        onClick={toggleMute}
                        className={`p-4 rounded-[8px] border transition-colors ${isMuted ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-gray-50 text-slate-600 border-black/10 hover:bg-gray-100 hover:text-[#1A1A1A]'}`}
                      >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                      </button>

                      {/* Hang Up Button */}
                      <button
                        onClick={callStatus === 'Connected' || callStatus === 'Calling' || callStatus === 'Ringing' ? disconnectCall : initiateCall}
                        className={`p-5 rounded-[12px] transition-colors text-white shadow-sm cursor-pointer ${callStatus === 'Connected' || callStatus === 'Calling' || callStatus === 'Ringing' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      >
                        <Phone size={28} className={callStatus === 'Connected' || callStatus === 'Calling' || callStatus === 'Ringing' ? 'rotate-[135deg]' : ''} />
                      </button>

                      {/* Speaker Button */}
                      <button
                        onClick={toggleSpeaker}
                        className={`p-4 rounded-[8px] border transition-colors ${isSpeakerOn ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-gray-50 text-slate-600 border-black/10 hover:bg-gray-100 hover:text-[#1A1A1A]'}`}
                      >
                        <Volume2 size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeCommTab === 'history' && (
                <div className="space-y-4 bg-white">
                  {fetchingComms ? (
                    <div className="text-center text-slate-400 py-4 text-xs italic">Loading calls...</div>
                  ) : calls.length === 0 ? (
                    <div className="text-center text-slate-400 py-4 text-xs italic">No call history.</div>
                  ) : (
                    calls.map((call) => (
                      <div key={call.id} className="p-3 rounded-[12px] bg-gray-50 border border-black/5 flex justify-between items-center shadow-xs">
                        <div className="flex items-center gap-3">
                          <PhoneCall size={16} className={call.direction === 'INBOUND' ? 'text-emerald-600' : 'text-blue-600'} />
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {call.direction === 'INBOUND' ? 'Incoming Call' : 'Outgoing Call'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {new Date(call.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 font-bold">{call.duration ? `${call.duration}s` : '--'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
};
