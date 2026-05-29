'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { MoreVertical, CheckCircle, Clock, AlertCircle, Upload, FileText, ChevronRight, IndianRupee } from 'lucide-react';
import { DocumentUpload } from '@/components/applications/DocumentUpload';

import { useApplicationStore } from '@/store/useApplicationStore';
import React from 'react';
import { useAuthStore } from '@/store/auth.store';

import { ApplicationReviewModal } from '@/components/applications/ApplicationReviewModal';

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  STARTED: { color: 'text-amber-700 bg-amber-50 border border-amber-200 rounded-[6px]', icon: Clock, label: 'Started' },
  SUBMITTED: { color: 'text-blue-700 bg-blue-50 border border-blue-200 rounded-[6px]', icon: AlertCircle, label: 'Submitted' },
  VERIFIED: { color: 'text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-[6px]', icon: CheckCircle, label: 'Verified' },
  VERIFICATION_PENDING: { color: 'text-amber-700 bg-amber-50 border border-amber-200 rounded-[6px]', icon: Clock, label: 'Verification Pending' },
  ADMISSION_CONFIRMED: { color: 'text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-[6px]', icon: CheckCircle, label: 'Enrolled' },
  REJECTED: { color: 'text-rose-700 bg-rose-50 border border-rose-200 rounded-[6px]', icon: AlertCircle, label: 'Rejected' },
};

export default function ApplicationsPage() {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [uploadAppId, setUploadAppId] = React.useState<string | undefined>(undefined);
  const [selectedApp, setSelectedApp] = React.useState<any>(null);
  const { applications, fetchApplications, confirmAdmission, loading } = useApplicationStore();
  const { user } = useAuthStore();
  const sector = user?.sector || 'GENERIC';

  const labels = {
    GENERIC: {
      title: 'Application Tracking',
      subtitle: 'Review and verify student enrollment applications',
      uploadBtn: 'Upload Batch',
      loading: 'Loading applications...',
      empty: 'No applications found in the system.',
      confirmPrompt: 'Are you sure you want to confirm admission for this student?',
      confirmBtn: 'Confirm Admission',
      enrolledLabel: 'Enrolled',
    },
    REAL_ESTATE: {
      title: 'Booking Tracking',
      subtitle: 'Review and verify property bookings',
      uploadBtn: 'Upload Bookings',
      loading: 'Loading bookings...',
      empty: 'No bookings found in the system.',
      confirmPrompt: 'Are you sure you want to confirm booking for this lead?',
      confirmBtn: 'Confirm Booking',
      enrolledLabel: 'Booked',
    },
    HEALTHCARE: {
      title: 'Case Tracking',
      subtitle: 'Review and verify patient cases and registrations',
      uploadBtn: 'Upload Cases',
      loading: 'Loading cases...',
      empty: 'No cases found in the system.',
      confirmPrompt: 'Are you sure you want to confirm registration for this patient?',
      confirmBtn: 'Confirm Registration',
      enrolledLabel: 'Registered',
    },
  };

  const currentLabels = (labels as any)[sector] || labels.GENERIC;

  React.useEffect(() => {
    fetchApplications();
    
    const handleOpenUpload = (e: any) => {
      setUploadAppId(e.detail.appId);
      setIsUploadOpen(true);
    };

    window.addEventListener('open-upload', handleOpenUpload);
    return () => window.removeEventListener('open-upload', handleOpenUpload);
  }, [fetchApplications]);

  const handleConfirm = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(currentLabels.confirmPrompt)) {
      await confirmAdmission(id);
    }
  };

  const openReview = (app: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedApp(app);
  };

  return (
    <MainLayout>
      <DocumentUpload 
        isOpen={isUploadOpen} 
        onClose={() => {
          setIsUploadOpen(false);
          setUploadAppId(undefined);
        }} 
        applicationId={uploadAppId}
      />
      <ApplicationReviewModal 
        isOpen={!!selectedApp} 
        onClose={() => setSelectedApp(null)} 
        application={selectedApp} 
      />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{currentLabels.title}</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase mt-0.5 tracking-wider">{currentLabels.subtitle}</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-black/90 text-[#F5F1EB] px-4 py-2.5 rounded-[8px] transition-all font-bold shadow-sm cursor-pointer"
        >
          <Upload size={18} />
          <span>{currentLabels.uploadBtn}</span>
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-10 text-center text-slate-400 italic font-semibold">{currentLabels.loading}</div>
        ) : applications.length === 0 ? (
          <div className="p-10 text-center text-slate-400 italic font-semibold">{currentLabels.empty}</div>
        ) : (
          applications.map((app) => (
            <div 
              key={app.id} 
              onClick={(e) => openReview(app, e)}
              className="p-5 rounded-[12px] bg-white border border-black/10 flex items-center justify-between group hover:bg-[#F5F1EB]/30 transition-all cursor-pointer shadow-xs text-[#1A1A1A]"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-[8px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1A1A1A] group-hover:text-blue-600 transition-colors">{app.lead?.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{app.program?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Status</p>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 ${statusConfig[app.status]?.color || 'bg-slate-50 text-slate-700 border border-slate-200 rounded-[6px]'} text-[9px] font-bold uppercase tracking-wider`}>
                    {statusConfig[app.status] ? React.createElement(statusConfig[app.status].icon, { size: 12 }) : null}
                    {statusConfig[app.status]?.label || app.status}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Created</p>
                  <p className="text-xs font-bold text-[#1A1A1A]">{new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => openReview(app, e)}
                    className="bg-white hover:bg-gray-50 border border-black/10 text-slate-600 px-4 py-2 rounded-[8px] text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Details
                  </button>
                  {app.status === 'REJECTED' ? (
                    <div className="px-4 py-2 rounded-[8px] text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 flex items-center">
                      Rejected
                    </div>
                  ) : app.admission || app.status === 'ADMISSION_CONFIRMED' ? (
                    <div className="flex gap-2">
                       <div className="px-4 py-2 rounded-[8px] text-xs font-bold text-slate-500 bg-gray-50 border border-black/5 flex items-center">
                        {currentLabels.enrolledLabel}
                      </div>
                      <a 
                        href="/finances"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-[8px] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <IndianRupee size={14} />
                        Go to Finance
                      </a>
                    </div>
                  ) : app.status === 'VERIFIED' ? (
                    <button 
                      onClick={(e) => handleConfirm(app.id, e)}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-[8px] text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      {currentLabels.confirmBtn}
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => openReview(app, e)}
                      className="bg-[#1A1A1A] hover:bg-black text-[#F5F1EB] px-4 py-2 rounded-[8px] text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Review Docs
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
}
