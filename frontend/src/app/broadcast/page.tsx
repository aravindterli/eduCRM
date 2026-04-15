'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Send, Upload, FileText, Smartphone, Mail, Image as ImageIcon, Loader2, Eye } from 'lucide-react';
import { useTemplateStore } from '@/store/useTemplateStore';
import { useLeadStore } from '@/store/useLeadStore';
import api from '@/services/api';

export default function BulkBroadcastPage() {
  const { templates, fetchTemplates } = useTemplateStore();
  const { uploadMedia } = useLeadStore();

  const [file, setFile] = React.useState<File | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [results, setResults] = React.useState<any>(null);

  const [formData, setFormData] = React.useState({
    sendWhatsApp: true,
    sendEmail: false,
    templateName: '',
    emailSubject: '',
    emailContent: ''
  });

  const [history, setHistory] = React.useState<any[]>([]);
  const [selectedReport, setSelectedReport] = React.useState<any | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/campaigns/broadcasts/history');
      setHistory(res.data);
    } catch (e) {}
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchTemplates();
    fetchHistory();
  }, [fetchTemplates]);

  const whatsappTemplates = templates.filter(t => t.channel === 'WHATSAPP');
  const selectedTemplateObj = whatsappTemplates.find(t => t.name === formData.templateName);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create instant local preview to avoid Ngrok blocking images
    setImagePreviewUrl(URL.createObjectURL(file));
    
    setIsUploadingImage(true);
    const url = await uploadMedia(file);
    if (url) setImageUrl(url);
    setIsUploadingImage(false);
  };

  const handleBroadcast = async () => {
    if (!file) return alert('Please upload an Excel or CSV file');
    if (!formData.sendWhatsApp && !formData.sendEmail) return alert('Select at least WhatsApp or Email');
    
    setIsSending(true);
    setResults(null);

    const payload = new FormData();
    payload.append('file', file);
    payload.append('sendWhatsApp', String(formData.sendWhatsApp));
    payload.append('sendEmail', String(formData.sendEmail));
    
    if (formData.templateName) payload.append('templateName', formData.templateName);
    if (formData.emailSubject) payload.append('emailSubject', formData.emailSubject);
    if (formData.emailContent) payload.append('emailContent', formData.emailContent);
    if (imageUrl) payload.append('imageUrl', imageUrl);

    try {
      const response = await api.post('/campaigns/broadcast', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(response.data.results);
      fetchHistory(); // refresh the list
      alert('Broadcast dispatch complete!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to dispatch broadcast');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mass Bulk Broadcast</h1>
        <p className="text-slate-400 text-sm">Upload an Excel file to dispatch WhatsApp templates and Emails directly to numbers without needing them inside the CRM.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          
          {/* File Upload zone */}
          <div className="glass p-6 rounded-2xl border-white/5 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><FileText size={20} className="text-blue-400"/> 1. Upload Contacts (Excel/CSV)</h2>
            <p className="text-xs text-slate-400">Ensure your file has a <code>Phone</code> and/or <code>Email</code> column.</p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-primary/50'} rounded-2xl p-8 text-center cursor-pointer transition-all`}
            >
              <Upload size={32} className={`mx-auto mb-3 ${file ? 'text-emerald-400' : 'text-slate-400'}`} />
              <p className="font-medium text-sm">{file ? file.name : 'Click to Browse an Excel File'}</p>
            </div>
          </div>

          {/* Media Header */}
          <div className="glass p-6 rounded-2xl border-white/5 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><ImageIcon size={20} className="text-purple-400"/> 2. Attach Media Header (Optional)</h2>
            <p className="text-xs text-slate-400">This image will be sent as the header for your WhatsApp Template and Email.</p>
            
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            
            {!imagePreviewUrl ? (
              <div 
                onClick={() => imageInputRef.current?.click()}
                className="w-full h-24 border border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-white/40 cursor-pointer transition-all"
              >
                {isUploadingImage ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                <span className="text-sm font-medium">{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
              </div>
            ) : (
              <div className="relative w-max">
                <img src={imagePreviewUrl} alt="Attached Media" className="h-32 rounded-xl object-contain border border-white/10" />
                <button onClick={() => { setImageUrl(null); setImagePreviewUrl(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-xs">✕</button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Channels */}
        <div className="space-y-6">
          
          <div className="glass p-6 rounded-2xl border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white">3. Configure Channels</h2>
            
            {/* WhatsApp Integration */}
            <div className={`p-5 rounded-xl border transition-all ${formData.sendWhatsApp ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-slate-900/50'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.sendWhatsApp}
                  onChange={(e) => setFormData({...formData, sendWhatsApp: e.target.checked})}
                  className="w-5 h-5 rounded border-white/20 text-emerald-500 focus:ring-emerald-500/20"
                />
                <Smartphone size={20} className={formData.sendWhatsApp ? 'text-emerald-400' : 'text-slate-500'} />
                <span className="font-bold">Send WhatsApp</span>
              </label>

              {formData.sendWhatsApp && (
                <div className="mt-4 pl-8">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Select WhatsApp Template</label>
                  <select
                    value={formData.templateName}
                    onChange={(e) => setFormData({...formData, templateName: e.target.value})}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white"
                  >
                    <option value="">-- Choose Template --</option>
                    {whatsappTemplates.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Email Integration */}
            <div className={`p-5 rounded-xl border transition-all ${formData.sendEmail ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/5 bg-slate-900/50'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.sendEmail}
                  onChange={(e) => setFormData({...formData, sendEmail: e.target.checked})}
                  className="w-5 h-5 rounded border-white/20 text-orange-500 focus:ring-orange-500/20"
                />
                <Mail size={20} className={formData.sendEmail ? 'text-orange-400' : 'text-slate-500'} />
                <span className="font-bold">Send Email</span>
              </label>

              {formData.sendEmail && (
                <div className="mt-4 pl-8 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Email Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Exciting News from EduCRM!"
                      value={formData.emailSubject}
                      onChange={(e) => setFormData({...formData, emailSubject: e.target.value})}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Email Content</label>
                    <textarea
                      placeholder="Email Body (HTML allowed)"
                      rows={4}
                      value={formData.emailContent}
                      onChange={(e) => setFormData({...formData, emailContent: e.target.value})}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 text-white resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          <button
            onClick={handleBroadcast}
            disabled={isSending || !file}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:grayscale transition-all"
          >
            {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
            {isSending ? 'Dispatching Broadcast...' : 'Initiate Mass Broadcast'}
          </button>

          {/* Results Summary */}
          {results && (
            <div className="glass p-6 rounded-2xl border-white/5 animate-in slide-in-from-bottom-4">
              <h3 className="font-bold text-lg mb-4 text-emerald-400">Broadcast Results</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <p className="text-slate-400 mb-1">WhatsApp Sent</p>
                  <p className="text-2xl font-bold text-emerald-500">{results.whatsappSuccess} <span className="text-sm text-slate-500">/ {results.totalRows}</span></p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <p className="text-slate-400 mb-1">Email Sent</p>
                  <p className="text-2xl font-bold text-orange-500">{results.emailSuccess} <span className="text-sm text-slate-500">/ {results.totalRows}</span></p>
                </div>
              </div>
              
              {results.errors?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Delivery Errors</p>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-xs font-mono text-slate-400 bg-black/20 p-3 rounded-xl">
                    {results.errors.map((err: any, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-red-500">Row {err.row}:</span>
                        <span>[{err.type}]</span>
                        <span>{err.phone || err.email} -</span>
                        <span className="text-slate-300 truncate">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Past Broadcasts List */}
          <div className="glass p-6 rounded-2xl border-white/5 animate-in fade-in">
            <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2"><FileText size={18} className="text-slate-400" /> Previous Broadcasts</h3>
            
            {history.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">
                No past broadcast logs found. Hit Initiate Broadcast!
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {history.map((log) => (
                  <div key={log.id} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                      <button 
                        onClick={() => setSelectedReport(log)}
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors text-white"
                      >
                        View Report
                      </button>
                    </div>
                    <div className="flex gap-4">
                      {log.details?.templateName && (
                        <div className="text-xs"><span className="text-emerald-400 font-bold">Template:</span> {log.details.templateName}</div>
                      )}
                      {log.details?.emailSubject && (
                        <div className="text-xs"><span className="text-orange-400 font-bold">Subject:</span> {log.details.emailSubject}</div>
                      )}
                    </div>
                    <div className="text-xs font-mono bg-black/20 p-2 rounded flex justify-between">
                      <span className="text-emerald-400">WA: {log.details?.whatsappSuccess}</span>
                      <span className="text-orange-400">Email: {log.details?.emailSuccess}</span>
                      <span className="text-slate-400">Failed: {log.details?.errors?.length || 0}</span>
                      <span className="text-white">Total: {log.details?.totalRows}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Live Preview */}
        <div className="space-y-6 lg:sticky lg:top-8 self-start">
          <div className="glass p-6 rounded-2xl border-white/5 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Eye size={20} className="text-pink-400"/> Live Content Preview</h2>
            <p className="text-xs text-slate-400 mb-4">See how your messages will look to recipients before dispatching.</p>

            {/* WhatsApp Preview */}
            <div className={`transition-all duration-300 ${!formData.sendWhatsApp ? 'opacity-30 grayscale' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">WhatsApp Preview</span>
              </div>
              <div className="bg-[#efeae2] p-4 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-40 bg-[url('https://i.ibb.co/3s2X2Ld/wa-bg.png')] mix-blend-multiply pointer-events-none"></div>
                <div className="bg-white p-2 rounded-xl rounded-tl-none shadow-sm max-w-[90%] relative z-10">
                  {imagePreviewUrl && (
                    <img src={imagePreviewUrl} alt="preview" className="w-full rounded-lg mb-2 border border-slate-100 object-cover" />
                  )}
                  <p className="text-[#111b21] text-[13px] whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedTemplateObj ? selectedTemplateObj.content.replace(/\[Meta Template: .*?\]\n?/, '') : <span className="text-slate-400 italic">Select a template to view content...</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 text-right mt-1">12:00 PM</p>
                </div>
              </div>
            </div>

            <div className="my-6 border-b border-white/5"></div>

            {/* Email Preview */}
            <div className={`transition-all duration-300 ${!formData.sendEmail ? 'opacity-30 grayscale' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <Mail size={14} className="text-orange-400" />
                <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">Email Preview</span>
              </div>
              <div className="bg-white rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <div className="bg-slate-100 p-3 border-b border-slate-200">
                  <p className="text-xs text-slate-500"><strong>Subject:</strong> {formData.emailSubject || '(No Subject)'}</p>
                </div>
                <div className="p-4 bg-white min-h-[150px]">
                  {imagePreviewUrl && (
                    <img src={imagePreviewUrl} alt="preview" className="w-full max-h-40 rounded-lg mb-4 object-cover" />
                  )}
                  <div className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                    {formData.emailContent ? formData.emailContent.replace(/\${name}/g, 'John Doe') : <span className="text-slate-400 italic">Type email content to preview...</span>}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* DETAILED REPORT MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-lg font-bold">Broadcast Report <span className="text-slate-400 text-sm font-normal">({new Date(selectedReport.createdAt).toLocaleString()})</span></h2>
              <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Side: What was Sent */}
              <div className="space-y-6">
                <h3 className="font-bold text-slate-300 border-b border-white/10 pb-2">What Was Sent</h3>
                
                {selectedReport.details.imageUrl && (
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase mb-2 block">Attached Media</span>
                    <img src={selectedReport.details.imageUrl} className="max-h-40 rounded-xl border border-white/10" alt="broadcast media" />
                  </div>
                )}

                {selectedReport.details.templateName && (
                  <div>
                     <span className="text-xs text-slate-400 font-bold uppercase mb-2 block">WhatsApp Template</span>
                     <div className="bg-emerald-900/20 border border-emerald-500/20 p-3 rounded-xl text-emerald-100 text-sm">
                       <span className="font-bold text-emerald-400">Name:</span> {selectedReport.details.templateName}
                     </div>
                  </div>
                )}

                {(selectedReport.details.emailSubject || selectedReport.details.emailContent) && (
                  <div>
                     <span className="text-xs text-slate-400 font-bold uppercase mb-2 block">Email Payload</span>
                     <div className="bg-orange-900/20 border border-orange-500/20 p-4 rounded-xl text-orange-100 text-sm space-y-2">
                       <p><strong className="text-orange-400">Subject:</strong> {selectedReport.details.emailSubject}</p>
                       <div className="w-full h-px bg-orange-500/20"></div>
                       <p className="whitespace-pre-wrap">{selectedReport.details.emailContent}</p>
                     </div>
                  </div>
                )}
              </div>

              {/* Right Side: Who was Sent to */}
              <div className="space-y-6 border-l border-white/5 pl-8">
                <h3 className="font-bold text-slate-300 border-b border-white/10 pb-2">Delivery Log</h3>

                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">WA Success: {selectedReport.details.whatsappSuccess}</div>
                  <div className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full border border-orange-500/20">Email Success: {selectedReport.details.emailSuccess}</div>
                  <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20">Failed: {selectedReport.details.errors?.length || 0}</div>
                </div>

                {selectedReport.details.successes?.length > 0 && (
                  <div>
                    <span className="text-xs text-emerald-500 font-bold uppercase mb-2 block">Successfully Sent To</span>
                    <div className="bg-black/20 rounded-xl max-h-40 overflow-y-auto p-2 border border-white/5">
                      {selectedReport.details.successes.map((s: any, idx: number) => (
                        <div key={idx} className="flex gap-2 text-xs py-1 px-2 hover:bg-white/5 rounded">
                           <span className={s.type === 'WhatsApp' ? 'text-emerald-400 w-16' : 'text-orange-400 w-16'}>{s.type}</span>
                           <span className="text-slate-300 font-mono">{s.phone || s.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReport.details.errors?.length > 0 && (
                  <div>
                    <span className="text-xs text-red-500 font-bold uppercase mb-2 mt-4 block">Delivery Failures</span>
                    <div className="bg-black/20 rounded-xl max-h-40 overflow-y-auto p-2 border border-white/5">
                      {selectedReport.details.errors.map((e: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-1 text-xs py-2 px-2 hover:bg-white/5 rounded border-b border-white/5 last:border-0">
                           <div className="flex gap-2">
                             <span className="text-red-400 font-bold">Row {e.row}</span>
                             <span className="text-slate-400">({e.type})</span>
                             <span className="text-slate-300 font-mono">{e.phone || e.email}</span>
                           </div>
                           <span className="text-red-300/80 italic">{e.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
