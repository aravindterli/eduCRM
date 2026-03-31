'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { MoreVertical, CheckCircle, Clock, AlertCircle, Upload, FileText, ChevronRight, IndianRupee } from 'lucide-react';
import { DocumentUpload } from '@/components/applications/DocumentUpload';

import { useApplicationStore } from '@/store/useApplicationStore';
import React from 'react';

import { ApplicationReviewModal } from '@/components/applications/ApplicationReviewModal';

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  STARTED: { color: 'text-amber-400 bg-amber-500/10', icon: Clock, label: 'Started' },
  SUBMITTED: { color: 'text-blue-400 bg-blue-500/10', icon: AlertCircle, label: 'Submitted' },
  VERIFIED: { color: 'text-indigo-400 bg-indigo-500/10', icon: CheckCircle, label: 'Verified' },
  VERIFICATION_PENDING: { color: 'text-amber-500 bg-amber-500/10', icon: Clock, label: 'Verification Pending' },
  ADMISSION_CONFIRMED: { color: 'text-green-400 bg-green-500/10', icon: CheckCircle, label: 'Enrolled' },
  REJECTED: { color: 'text-red-400 bg-red-500/10', icon: AlertCircle, label: 'Rejected' },
};

export default function ApplicationsPage() {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [uploadAppId, setUploadAppId] = React.useState<string | undefined>(undefined);
  const [selectedApp, setSelectedApp] = React.useState<any>(null);
  const { applications, fetchApplications, confirmAdmission, loading } = useApplicationStore();

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
    if (confirm('Are you sure you want to confirm admission for this student?')) {
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
          <h1 className="text-2xl font-bold">Application Tracking</h1>
          <p className="text-slate-400 text-sm">Review and verify student enrollment applications</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <Upload size={18} />
          <span>Upload Batch</span>
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-10 text-center text-slate-500 italic">No applications found in the system.</div>
        ) : (
          applications.map((app) => (
            <div 
              key={app.id} 
              onClick={(e) => openReview(app, e)}
              className="p-6 rounded-2xl glass border-white/5 flex items-center justify-between group hover:border-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 text-slate-400">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">{app.lead?.name}</h3>
                  <p className="text-xs text-slate-500">{app.program?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[app.status]?.color || 'bg-white/5 text-slate-400'}`}>
                    {statusConfig[app.status] ? React.createElement(statusConfig[app.status].icon, { size: 12 }) : null}
                    {statusConfig[app.status]?.label || app.status}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Created</p>
                  <p className="text-sm font-medium">{new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => openReview(app, e)}
                    className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                  >
                    Details
                  </button>
                  {app.status === 'REJECTED' ? (
                    <div className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-500/10">
                      Rejected
                    </div>
                  ) : app.admission || app.status === 'ADMISSION_CONFIRMED' ? (
                    <div className="flex gap-2">
                       <div className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-white/5">
                        Enrolled
                      </div>
                      <a 
                        href="/finances"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <IndianRupee size={14} />
                        Go to Finance
                      </a>
                    </div>
                  ) : app.status === 'VERIFIED' ? (
                    <button 
                      onClick={(e) => handleConfirm(app.id, e)}
                      className="bg-green-600/20 hover:bg-green-600/40 text-green-400 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      Confirm Admission
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => openReview(app, e)}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-blue-500/20"
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
