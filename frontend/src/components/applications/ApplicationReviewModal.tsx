
'use client';

import React from 'react';
import { X, User, Mail, Phone, MapPin, FileText, ExternalLink, CheckCircle, AlertCircle, Clock, Upload } from 'lucide-react';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useAuthStore } from '@/store/auth.store';

interface ApplicationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
}

const statusColors: any = {
  STARTED: 'text-amber-700 bg-amber-50 border border-amber-200 rounded-[6px]',
  SUBMITTED: 'text-blue-700 bg-blue-50 border border-blue-200 rounded-[6px]',
  VERIFIED: 'text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-[6px]',
  REJECTED: 'text-rose-700 bg-rose-50 border border-rose-200 rounded-[6px]',
};

export const ApplicationReviewModal = ({ isOpen, onClose, application }: ApplicationReviewModalProps) => {
  const { updateApplicationStatus, loading } = useApplicationStore();
  const { user } = useAuthStore();
  const sector = user?.sector || 'GENERIC';

  const labels = {
    GENERIC: {
      title: 'Review Application',
      studentDetails: 'Student Details',
      appliedProgram: 'Applied Program',
    },
    REAL_ESTATE: {
      title: 'Review Booking',
      studentDetails: 'Client Details',
      appliedProgram: 'Selected Property',
    },
    HEALTHCARE: {
      title: 'Review Case',
      studentDetails: 'Patient Details',
      appliedProgram: 'Assigned Service',
    },
  };

  const currentLabels = (labels as any)[sector] || labels.GENERIC;

  if (!isOpen || !application) return null;

  const handleStatusUpdate = async (status: string) => {
    let reason = '';
    if (status === 'REJECTED') {
      const input = prompt('Please enter the reason for rejection:');
      if (input === null) return; // Cancelled
      reason = input;
    }

    if (confirm(`Are you sure you want to mark this application as ${status}${reason ? ' (Reason: ' + reason + ')' : ''}?`)) {
      await updateApplicationStatus(application.id, status, reason);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-[#1A1A1A]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white border border-black/10 rounded-[16px] shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-black/10 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-[8px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
               <FileText size={20} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-[#1A1A1A]">{currentLabels.title}</h2>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mt-1 font-bold">ID: {application.id.split('-')[0]}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[8px] text-slate-500 hover:text-slate-800 transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto bg-white text-[#1A1A1A]">
          {/* Student Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{currentLabels.studentDetails}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-[12px] bg-gray-50 border border-black/5 flex items-center gap-3">
                <User size={18} className="text-blue-600" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Full Name</p>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{application.lead?.name}</p>
                </div>
              </div>
              <div className="p-4 rounded-[12px] bg-gray-50 border border-black/5 flex items-center gap-3">
                <Mail size={18} className="text-indigo-600" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Email</p>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{application.lead?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="p-4 rounded-[12px] bg-gray-50 border border-black/5 flex items-center gap-3">
                <Phone size={18} className="text-emerald-600" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Phone</p>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{application.lead?.phone}</p>
                </div>
              </div>
              <div className="p-4 rounded-[12px] bg-gray-50 border border-black/5 flex items-center gap-3">
                <MapPin size={18} className="text-rose-600" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Location</p>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{application.lead?.location || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Program Info Section */}
          <div className="p-5 rounded-[12px] bg-[#F5F1EB]/40 border border-black/10 border-dashed">
            <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">{currentLabels.appliedProgram}</h3>
            <div className="flex justify-between items-end">
               <div>
                  <p className="text-base font-bold text-[#1A1A1A]">{application.program?.name}</p>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">{application.program?.description || 'No description available'}</p>
               </div>
               <div className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${statusColors[application.status]}`}>
                 {application.status}
               </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Submitted Documents</h3>
            {application.documents?.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-black/10 rounded-[12px] text-center text-slate-400 italic text-xs font-semibold">
                No documents have been uploaded yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {application.documents.map((doc: any) => (
                  <div key={doc.id} className="p-4 rounded-[12px] bg-white border border-black/10 flex items-center justify-between group hover:bg-[#F5F1EB]/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[8px] bg-gray-50 text-slate-500 border border-black/5 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1A1A1A]">{doc.type}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Uploaded on {new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {(() => {
                      const fileUrl = doc.url.startsWith('http') 
                        ? doc.url 
                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${doc.url}`;
                      return (
                        <a 
                          href={fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-[8px] bg-gray-50 text-slate-500 border border-black/10 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer"
                        >
                          <ExternalLink size={18} />
                        </a>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-black/10 bg-gray-50 flex justify-between items-center">
           <button 
             onClick={() => {
               onClose();
               window.dispatchEvent(new CustomEvent('open-upload', { detail: { appId: application.id } }));
             }}
             className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors uppercase tracking-widest cursor-pointer"
           >
             <Upload size={14} />
             Add Missing Document
           </button>
           <div className="flex gap-3">
              <button 
                onClick={() => handleStatusUpdate('REJECTED')}
                disabled={loading}
                className="px-6 py-2.5 rounded-[8px] text-sm font-bold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all disabled:opacity-50 cursor-pointer"
              >
                Reject
              </button>
              <button 
                onClick={() => handleStatusUpdate('VERIFIED')}
                disabled={loading}
                className="bg-[#1A1A1A] hover:bg-black px-8 py-2.5 rounded-[8px] text-sm font-bold text-[#F5F1EB] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
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
