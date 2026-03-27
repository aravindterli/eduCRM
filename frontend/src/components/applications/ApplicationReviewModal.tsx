
'use client';

import React from 'react';
import { X, User, Mail, Phone, MapPin, FileText, ExternalLink, CheckCircle, AlertCircle, Clock, Upload } from 'lucide-react';
import { useApplicationStore } from '@/store/useApplicationStore';

interface ApplicationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
}

const statusColors: any = {
  STARTED: 'text-amber-400 bg-amber-500/10',
  SUBMITTED: 'text-blue-400 bg-blue-500/10',
  VERIFIED: 'text-green-400 bg-green-500/10',
  REJECTED: 'text-red-400 bg-red-500/10',
};

export const ApplicationReviewModal = ({ isOpen, onClose, application }: ApplicationReviewModalProps) => {
  const { updateApplicationStatus, loading } = useApplicationStore();

  if (!isOpen || !application) return null;

  const handleStatusUpdate = async (status: string) => {
    if (confirm(`Are you sure you want to mark this application as ${status}?`)) {
      await updateApplicationStatus(application.id, status);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl glass rounded-3xl border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
               <FileText size={20} />
             </div>
             <div>
               <h2 className="text-xl font-bold">Review Application</h2>
               <p className="text-xs text-slate-500 uppercase tracking-widest leading-none mt-1">ID: {application.id.split('-')[0]}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto">
          {/* Student Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Student Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <User size={18} className="text-blue-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Full Name</p>
                  <p className="text-sm font-medium text-slate-200">{application.lead?.name}</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <Mail size={18} className="text-indigo-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Email</p>
                  <p className="text-sm font-medium text-slate-200">{application.lead?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <Phone size={18} className="text-emerald-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Phone</p>
                  <p className="text-sm font-medium text-slate-200">{application.lead?.phone}</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <MapPin size={18} className="text-rose-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Location</p>
                  <p className="text-sm font-medium text-slate-200">{application.lead?.location || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Program Info Section */}
          <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 border-dashed">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Applied Program</h3>
            <div className="flex justify-between items-end">
               <div>
                  <p className="text-lg font-bold text-slate-200">{application.program?.name}</p>
                  <p className="text-sm text-slate-400 mt-1">{application.program?.description || 'No description available'}</p>
               </div>
               <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${statusColors[application.status]}`}>
                 {application.status}
               </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Submitted Documents</h3>
            {application.documents?.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-white/5 rounded-2xl text-center text-slate-500 italic text-sm">
                No documents have been uploaded yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {application.documents.map((doc: any) => (
                  <div key={doc.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{doc.type}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Uploaded on {new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
           <button 
             onClick={() => {
               // This will be handled by parent state
               onClose();
               window.dispatchEvent(new CustomEvent('open-upload', { detail: { appId: application.id } }));
             }}
             className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
           >
             <Upload size={14} />
             Add Missing Document
           </button>
           <div className="flex gap-3">
              <button 
                onClick={() => handleStatusUpdate('REJECTED')}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
              >
                Reject
              </button>
              <button 
                onClick={() => handleStatusUpdate('VERIFIED')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-500 px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                Verify & Approve
                <CheckCircle size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
