'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, File, Link, ChevronRight, Loader2 } from 'lucide-react';
import { useApplicationStore } from '@/store/useApplicationStore';

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
}

export const DocumentUpload = ({ isOpen, onClose, applicationId }: DocumentUploadProps) => {
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [formData, setFormData] = useState({
    applicationId: '',
    type: 'Marksheet',
    url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { applications, uploadDocument, uploadDocumentFile, loading } = useApplicationStore();

  useEffect(() => {
    if (applicationId) {
      setFormData(prev => ({ ...prev, applicationId }));
    } else {
      setFormData(prev => ({ ...prev, applicationId: '' }));
    }
    setSelectedFile(null);
    setErrorMessage('');
  }, [applicationId, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Invalid file type. Only PDF, JPG, and PNG are allowed.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.applicationId) {
      setErrorMessage('Please select an application booking.');
      return;
    }

    if (activeTab === 'file') {
      if (!selectedFile) {
        setErrorMessage('Please select a local document file to upload.');
        return;
      }

      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      uploadData.append('applicationId', formData.applicationId);
      uploadData.append('type', formData.type);
      uploadData.append('name', selectedFile.name);

      const success = await uploadDocumentFile(uploadData);
      if (success) {
        onClose();
      } else {
        setErrorMessage('Failed to upload document file. Please verify organization storage quota limit.');
      }
    } else {
      if (!formData.url) {
        setErrorMessage('Please enter an external document file URL.');
        return;
      }

      const success = await uploadDocument(formData.applicationId, {
        type: formData.type,
        url: formData.url,
      });
      if (success) {
        onClose();
      } else {
        setErrorMessage('Failed to attach document URL.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 text-[#1A1A1A]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <form 
        onSubmit={handleSubmit} 
        className="relative w-full max-w-lg bg-white border border-black/10 shadow-2xl rounded-[16px] animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-black/10 flex justify-between items-center bg-gray-50">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-[8px] border border-blue-100 shadow-sm shrink-0">
               <Upload size={18} />
             </div>
             <h2 className="text-lg font-bold text-[#1A1A1A]">{applicationId ? 'Attach Dynamic Document' : 'Upload Document Paperwork'}</h2>
           </div>
           <button 
             type="button" 
             onClick={onClose} 
             className="p-1.5 hover:bg-gray-100 rounded-[8px] text-slate-500 hover:text-[#1A1A1A] transition-colors"
           >
             <X size={18} />
           </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-black/10 bg-gray-50/50">
          <button
            type="button"
            onClick={() => { setActiveTab('file'); setErrorMessage(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'file' 
                ? 'border-[#1A1A1A] bg-white text-[#1A1A1A]' 
                : 'border-transparent text-slate-500 hover:text-[#1A1A1A] hover:bg-gray-100/40'
            }`}
          >
            <Upload size={14} />
            Local File Upload
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('link'); setErrorMessage(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'link' 
                ? 'border-[#1A1A1A] bg-white text-[#1A1A1A]' 
                : 'border-transparent text-slate-500 hover:text-[#1A1A1A] hover:bg-gray-100/40'
            }`}
          >
            <Link size={14} />
            External Web Link
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 bg-white text-[#1A1A1A]">
           {errorMessage && (
             <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-[8px]">
               {errorMessage}
             </div>
           )}

           <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">
               Select Student Application
             </label>
             <select 
               required
               value={formData.applicationId}
               onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
               className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 outline-none focus:ring-2 focus:ring-black/10 transition-all text-slate-600 text-sm font-semibold shadow-xs"
             >
               <option value="" className="bg-white text-slate-500">Choose active application...</option>
               {applications.map(app => (
                 <option key={app.id} value={app.id} className="bg-white text-[#1A1A1A]">
                   {app.lead?.name || 'Unknown Student'} - {app.program?.name || 'No Program'}
                 </option>
               ))}
             </select>
           </div>
           
           <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">
               Document Type
             </label>
             <select 
               value={formData.type}
               onChange={(e) => setFormData({ ...formData, type: e.target.value })}
               className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 outline-none focus:ring-2 focus:ring-black/10 transition-all text-slate-600 text-sm font-semibold shadow-xs"
             >
               <option className="bg-white text-[#1A1A1A]" value="Marksheet">Marksheet / Transcript</option>
               <option className="bg-white text-[#1A1A1A]" value="ID Proof">Identification Proof (Passport/ID)</option>
               <option className="bg-white text-[#1A1A1A]" value="Experience Letter">Experience Certificate</option>
               <option className="bg-white text-[#1A1A1A]" value="Other">Other Miscellaneous Paperwork</option>
             </select>
           </div>

           {activeTab === 'file' ? (
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">
                 Choose Document File
               </label>
               
               <div 
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}
                 onClick={() => document.getElementById('file-input')?.click()}
                 className={`border-2 border-dashed rounded-[12px] py-8 px-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                   isDragOver 
                     ? 'border-blue-500 bg-blue-50/50' 
                     : selectedFile 
                       ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                       : 'border-black/10 bg-gray-50/20 hover:bg-gray-50/50 hover:border-black/20 text-[#1A1A1A]'
                 }`}
               >
                 <input 
                   id="file-input"
                   type="file"
                   accept=".pdf,.png,.jpg,.jpeg"
                   onChange={handleFileChange}
                   className="hidden"
                 />
                 
                 {selectedFile ? (
                   <div className="space-y-2 flex flex-col items-center">
                     <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 rounded-[8px] shadow-xs">
                       <File size={20} />
                     </div>
                     <div className="text-xs font-semibold text-emerald-700 max-w-[280px] truncate">
                       {selectedFile.name}
                     </div>
                     <div className="text-[10px] text-slate-400 uppercase font-bold">
                       {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                     </div>
                     <span className="text-[10px] text-blue-600 hover:underline font-bold mt-1 block">
                       Click to replace file
                     </span>
                   </div>
                 ) : (
                   <div className="space-y-2 flex flex-col items-center">
                     <div className="w-10 h-10 bg-gray-50 text-slate-500 border border-black/5 flex items-center justify-center rounded-[8px] shadow-xs">
                       <Upload size={18} />
                     </div>
                     <div className="text-xs font-bold text-slate-600">
                       Drag & drop files here or <span className="text-blue-600">browse</span>
                     </div>
                     <div className="text-[10px] text-slate-400 uppercase font-semibold">
                       PDF, PNG, JPG (MAX 10MB)
                     </div>
                   </div>
                 )}
               </div>
             </div>
           ) : (
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">
                 Enter External File URL
               </label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                   <Link size={16} />
                 </div>
                 <input 
                   type="url"
                   required
                   value={formData.url}
                   onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                   placeholder="https://example-storage.com/student-doc.pdf"
                   className="w-full bg-gray-50 border border-black/10 rounded-[8px] pl-10 pr-4 py-3 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-black/10 transition-all text-sm font-semibold text-[#1A1A1A]"
                 />
               </div>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/10 bg-gray-50 flex justify-end gap-3">
           <button 
             type="button" 
             onClick={onClose} 
             className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all text-slate-500 hover:bg-gray-150 rounded-[8px] border-none cursor-pointer"
             disabled={loading}
           >
             Cancel
           </button>
           <button 
             type="submit"
             disabled={loading}
             className="bg-[#1A1A1A] hover:bg-black disabled:opacity-50 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#F5F1EB] transition-all flex items-center gap-2 rounded-[8px] cursor-pointer shadow-sm"
           >
             {loading ? (
               <>
                 <Loader2 className="animate-spin" size={14} />
                 Uploading...
               </>
             ) : (
               <>
                 Confirm Upload
                 <ChevronRight size={14} />
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
};
