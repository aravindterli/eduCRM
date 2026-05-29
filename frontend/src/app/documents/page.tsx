'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  Folder, 
  Search, 
  Trash2, 
  Download, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  HardDrive, 
  RefreshCw,
  X,
  Check,
  Ban
} from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Toast } from '@/components/ui/Toast';

// Available document type display labels
const typeLabels: Record<string, string> = {
  PASSPORT_ID: 'Passport / ID Proof',
  TRANSCRIPT: 'Academic Transcripts',
  RECOMMENDATION: 'Letter of Recommendation',
  RESUME: 'Student Resume',
  GENERAL: 'General Document'
};

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', border: 'border-amber-200' },
  APPROVED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', border: 'border-rose-200' }
};

export default function DocumentDirectoryPage() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  // Storage Stats
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(10 * 1024 * 1024); // default 10MB
  const [subscriptionPlan, setSubscriptionPlan] = useState('FREE');
  const [typeStats, setTypeStats] = useState<Record<string, { size: number; count: number }>>({});
  const [formatStats, setFormatStats] = useState<Record<string, { size: number; count: number }>>({});

  // Review Modal State
  const [reviewDoc, setReviewDoc] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isVisible: true, message, type });
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/documents/storage-stats');
      if (res.data.success) {
        setStorageUsed(res.data.totalStorageUsed || 0);
        setStorageLimit(res.data.storageLimitBytes || 10 * 1024 * 1024);
        setSubscriptionPlan(res.data.plan || 'FREE');
        setTypeStats(res.data.typeBreakdown || {});
        setFormatStats(res.data.formatBreakdown || {});
      }
    } catch (error: any) {
      console.error('Error fetching storage stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10
      };
      const res = await api.get('/documents/all', { params });
      if (res.data.success) {
        setDocuments(res.data.documents || []);
        setTotalDocs(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      showToast('Failed to retrieve document records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [search, typeFilter, statusFilter, page]);

  const handleDownload = async (doc: any) => {
    try {
      showToast('Initializing download...', 'success');
      const subpath = doc.url.replace(/^\/?uploads\/documents\//, '');
      const response = await api.get(`/documents/files/${subpath}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Document downloaded successfully', 'success');
    } catch (error) {
      // Fallback to static direct server access if auth endpoint has restrictions
      const fallbackUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${doc.url}`;
      window.open(fallbackUrl, '_blank');
    }
  };

  const handleView = (doc: any) => {
    // Open standard unauthenticated static serving fallback path in new window
    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${doc.url}`;
    window.open(fileUrl, '_blank');
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to permanently delete this document from the server disk and database? This action is irreversible.')) {
      return;
    }

    try {
      const res = await api.delete(`/documents/${docId}`);
      if (res.data.success) {
        showToast('Document permanently deleted', 'success');
        fetchDocs();
        fetchStats();
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to delete document';
      showToast(errMsg, 'error');
    }
  };

  const openReviewModal = (doc: any) => {
    setReviewDoc(doc);
    setRemarks(doc.remarks || '');
  };

  const closeReviewModal = () => {
    setReviewDoc(null);
    setRemarks('');
  };

  const handleVerify = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewDoc) return;
    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/documents/${reviewDoc.id}/verify`, {
        status,
        remarks: remarks.trim()
      });
      if (res.data) {
        showToast(`Document marked as ${status.toLowerCase()}`, 'success');
        closeReviewModal();
        fetchDocs();
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to update document verification';
      showToast(errMsg, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Math helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const storagePercentage = Math.min((storageUsed / storageLimit) * 100, 100);

  // Storage meter dynamic color configurations (Strict solid bright colors, no gradients, square flat)
  const getMeterColor = () => {
    if (storagePercentage >= 95) return 'bg-rose-500'; // Critical Red
    if (storagePercentage >= 80) return 'bg-amber-400'; // Warning Amber
    return 'bg-blue-500'; // Normal Blue
  };

  return (
    <MainLayout>
      {/* Toast notifications */}
      <Toast 
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      {/* Main Container */}
      <div className="space-y-8 font-sans text-[#1A1A1A]">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
              DocumentDirectory
            </h1>
            <p className="text-[#1A1A1A]/60 text-sm mt-1">
              Manage student enrollment paperwork, review qualifications, and track system resources.
            </p>
          </div>
          <button 
            onClick={() => { fetchDocs(); fetchStats(); }} 
            className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white px-4 py-2 text-sm font-semibold rounded-[8px] border border-black/10 transition-all tracking-wider"
          >
            <RefreshCw size={16} />
            <span>SyncDirectory</span>
          </button>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Storage Quota Card */}
          <div className="lg:col-span-2 bg-white border border-black/10 p-6 rounded-[16px] shadow-sm flex flex-col justify-between text-[#1A1A1A]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#1A1A1A] tracking-wider">
                  StorageManagement
                </h2>
                <div className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 font-bold text-xs tracking-wider rounded-[8px]">
                  {subscriptionPlan === 'FREE' ? 'FreePlan' : `${subscriptionPlan}Plan`}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-semibold text-xs">SystemUsage</span>
                  <span className="text-[#1A1A1A] font-bold">{formatBytes(storageUsed)} of {formatBytes(storageLimit)}</span>
                </div>
                
                {/* Custom Flat Progress Bar Meter */}
                <div className="w-full bg-gray-100 h-3 rounded-[6px] overflow-hidden border border-black/5">
                  <div 
                    className={`h-full transition-all duration-500 rounded-[6px] ${getMeterColor()}`}
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block"></span>
                    <span className="text-slate-500 font-semibold">ActiveStorageLimit</span>
                  </div>
                  <span className="text-slate-500 font-medium">{storagePercentage.toFixed(1)}% Allocated</span>
                </div>
              </div>
            </div>

            {/* Storage Quota Warnings */}
            {storagePercentage >= 95 ? (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-[12px] flex items-start gap-3">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold tracking-wider">CriticalLimitReached</p>
                  <p className="mt-1 text-slate-500 font-medium">Disk quota is at full capacity. Student onboarding document uploads have been frozen automatically to preserve database integrity.</p>
                </div>
              </div>
            ) : storagePercentage >= 80 ? (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-100 text-amber-600 rounded-[12px] flex items-start gap-3">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold tracking-wider">StorageAlert</p>
                  <p className="mt-1 text-slate-500 font-medium">Disk quota has exceeded 80%. We recommend archiving legacy documentation or upgrading your subscription plan.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-[12px] flex items-start gap-3">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold tracking-wider">StorageHealthy</p>
                  <p className="mt-1 text-slate-500 font-medium">Tenant file size statistics are well within baseline thresholds. System upload pipelines operational.</p>
                </div>
              </div>
            )}
          </div>

          {/* Document Breakdown Widget */}
          <div className="bg-white border border-black/10 p-6 rounded-[16px] shadow-sm flex flex-col justify-between text-[#1A1A1A]">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A] tracking-wider mb-4">
                CategoryBreakdown
              </h2>
              
              <div className="space-y-3">
                {Object.keys(typeLabels).map((typeKey) => {
                  const data = typeStats[typeKey] || { count: 0, size: 0 };
                  return (
                    <div key={typeKey} className="flex justify-between items-center text-xs pb-2 border-b border-black/5">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-400" />
                        <span className="text-slate-700 font-medium">{typeLabels[typeKey]}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#1A1A1A] font-bold block">{data.count} Files</span>
                        <span className="text-slate-400 text-[10px]">{formatBytes(data.size)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-black/10 text-[10px] text-slate-450 flex justify-between font-bold tracking-wider">
              <span>TotalDocuments</span>
              <span className="text-[#1A1A1A] font-black">{totalDocs} Items</span>
            </div>
          </div>

        </div>

        {/* Directory Table Area */}
        <div className="bg-white border border-black/10 rounded-[16px] shadow-sm overflow-hidden text-[#1A1A1A]">
          
          {/* Filters Bar */}
          <div className="p-6 border-b border-black/10 grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#F5F1EB]/30">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search by student name or file name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-black/10 text-[#1A1A1A] placeholder-slate-450 rounded-[8px] focus:outline-none focus:border-black/20 text-sm"
              />
            </div>

            <div>
              <select 
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-50 border border-black/10 text-[#1A1A1A] rounded-[8px] focus:outline-none focus:border-black/20 text-sm cursor-pointer"
              >
                <option value="">AllCategories</option>
                {Object.keys(typeLabels).map(key => (
                  <option key={key} value={key}>{typeLabels[key]}</option>
                ))}
              </select>
            </div>

            <div>
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-50 border border-black/10 text-[#1A1A1A] rounded-[8px] focus:outline-none focus:border-black/20 text-sm cursor-pointer"
              >
                <option value="">AllStatuses</option>
                <option value="PENDING">PendingVerification</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-16 text-center text-slate-500">
                <RefreshCw className="animate-spin inline-block mr-2 text-blue-500" size={20} />
                <span className="font-semibold text-xs tracking-wider">SyncingDirectoryRecords...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-16 text-center text-slate-500 italic">
                <HardDrive className="inline-block mb-3 text-slate-400" size={32} />
                <p className="text-sm font-semibold text-slate-500">NoDocumentsFound</p>
                <p className="text-xs text-slate-400 mt-1">Try tweaking your search keywords or category filters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/10 bg-gray-50 text-slate-500 text-xs font-black uppercase tracking-wider">
                    <th className="py-4 px-6">DocumentDetails</th>
                    <th className="py-4 px-6">StudentProgram</th>
                    <th className="py-4 px-6">UploadCategory</th>
                    <th className="py-4 px-6">UploadDate</th>
                    <th className="py-4 px-6">VerificationStatus</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-sm">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#F5F1EB]/30 transition-all">
                      <td className="py-4 px-6 max-w-[240px]">
                        <div className="font-bold text-[#1A1A1A] truncate" title={doc.name}>
                          {doc.name}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-black mt-0.5">
                          ID: {doc.id.split('-')[0]}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-700">
                          {doc.application?.lead?.name || 'Unknown student'}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">
                          {doc.application?.program?.name || 'No program selected'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 bg-[#F5F1EB]/80 text-[#1A1A1A]/80 border border-black/10 text-[10px] font-bold uppercase tracking-wider rounded-[6px]">
                          {typeLabels[doc.type] || doc.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold text-xs">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest border rounded-[6px] ${
                          statusConfig[doc.status]?.bg || 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {doc.status}
                        </span>
                        {doc.remarks && (
                          <div className="text-[10px] text-slate-450 italic mt-1 truncate max-w-[180px]" title={doc.remarks}>
                            Remarks: {doc.remarks}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                        <button 
                          onClick={() => handleView(doc)}
                          className="p-2 bg-gray-50 hover:bg-blue-50 border border-black/10 hover:border-blue-200 text-slate-500 hover:text-blue-600 transition-all rounded-[8px]"
                          title="ViewDocument"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => handleDownload(doc)}
                          className="p-2 bg-gray-50 hover:bg-blue-50 border border-black/10 hover:border-blue-200 text-slate-500 hover:text-blue-600 transition-all rounded-[8px]"
                          title="DownloadDocument"
                        >
                          <Download size={15} />
                        </button>
                        <button 
                          onClick={() => openReviewModal(doc)}
                          className="p-2 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 border border-black/10 text-white transition-all rounded-[8px]"
                          title="VerifyDocument"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all rounded-[8px]"
                          title="PermanentlyDelete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-black/10 flex justify-between items-center bg-gray-50/50">
              <span className="text-xs text-slate-500 font-semibold">
                Showing {documents.length} of {totalDocs} records
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-1.5 bg-white border border-black/10 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider text-slate-700 disabled:opacity-30 disabled:hover:bg-white rounded-[8px] transition-all"
                >
                  PreviousPage
                </button>
                <div className="flex items-center px-4 bg-white border border-black/10 text-xs font-bold text-[#1A1A1A] rounded-[8px]">
                  Page {page} of {totalPages}
                </div>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-4 py-1.5 bg-white border border-black/10 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider text-slate-700 disabled:opacity-30 disabled:hover:bg-white rounded-[8px] transition-all"
                >
                  NextPage
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* VerificationReview Modal */}
      {reviewDoc && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeReviewModal} />
          
          <div className="relative w-full max-w-xl bg-white border border-black/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh] rounded-[16px] text-[#1A1A1A]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-black/10 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center rounded-[8px]">
                  <Folder size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1A1A1A]">
                    VerificationReview
                  </h2>
                  <p className="text-xs text-slate-400 font-black leading-none mt-1">
                    DocumentID: {reviewDoc.id.split('-')[0]}
                  </p>
                </div>
              </div>
              <button onClick={closeReviewModal} className="p-2 hover:bg-gray-100 text-slate-400 hover:text-[#1A1A1A] transition-colors rounded-[8px]">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Document Overview Panel */}
              <div className="p-4 bg-gray-50 border border-black/5 rounded-[12px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400 font-bold tracking-wider">DocumentName</span>
                  <span className="text-xs text-slate-700 font-semibold truncate max-w-[240px]" title={reviewDoc.name}>{reviewDoc.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400 font-bold tracking-wider">StudentName</span>
                  <span className="text-xs text-slate-700 font-semibold">{reviewDoc.application?.lead?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400 font-bold tracking-wider">ProgramApplied</span>
                  <span className="text-xs text-slate-700 font-semibold truncate max-w-[240px]">{reviewDoc.application?.program?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400 font-bold tracking-wider">UploadedCategory</span>
                  <span className="text-xs text-blue-600 font-bold tracking-wider">{typeLabels[reviewDoc.type] || reviewDoc.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400 font-bold tracking-wider">CurrentStatus</span>
                  <span className={`text-xs font-bold tracking-widest ${
                    reviewDoc.status === 'APPROVED' ? 'text-emerald-600' : reviewDoc.status === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'
                  }`}>{reviewDoc.status}</span>
                </div>
              </div>

              {/* Action Buttons to trigger direct view */}
              <button 
                onClick={() => handleView(reviewDoc)}
                className="w-full flex items-center justify-center gap-2 bg-[#F5F1EB]/50 hover:bg-[#F5F1EB]/80 text-[#1A1A1A] border border-black/10 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-[8px]"
              >
                <Eye size={14} />
                PreviewFileInNewTab
              </button>

              {/* Remarks Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  AssessorRemarksFeedback
                </label>
                <textarea 
                  rows={4}
                  placeholder="Enter comments, reasons for rejection, or general notes regarding this student's paperwork..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-gray-50 border border-black/10 text-[#1A1A1A] placeholder-slate-400 p-3 text-xs focus:outline-none focus:border-black/20 rounded-[8px] resize-none font-sans"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-black/10 bg-gray-50 flex justify-between items-center gap-3">
              <button 
                onClick={() => handleVerify('REJECTED')}
                disabled={updatingStatus}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-black text-xs py-3 uppercase tracking-widest disabled:opacity-50 transition-all rounded-[8px]"
              >
                <Ban size={14} />
                RejectPaperwork
              </button>
              <button 
                onClick={() => handleVerify('APPROVED')}
                disabled={updatingStatus}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white font-black text-xs py-3 uppercase tracking-widest disabled:opacity-50 transition-all rounded-[8px]"
              >
                <Check size={14} />
                VerifyAndApprove
              </button>
            </div>

          </div>
        </div>
      )}

    </MainLayout>
  );
}
