'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTemplateStore } from '@/store/useTemplateStore';
import { MessageSquare, Mail, Smartphone, Plus, Trash2, Edit, Eye, X } from 'lucide-react';

export default function TemplatesPage() {
  const { templates, fetchTemplates, createTemplate, updateTemplate, deleteTemplate, loading } = useTemplateStore();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({ id: '', name: '', content: '', subject: '', channel: 'WHATSAPP' });
  const [previewTemplate, setPreviewTemplate] = React.useState<any>(null);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        const success = await updateTemplate(formData.id, formData);
        if (!success) throw new Error("Failed to update template.");
      } else {
        const success = await createTemplate(formData);
        if (!success) throw new Error("Failed to create template.");
      }
      setIsFormOpen(false);
      setFormData({ id: '', name: '', content: '', subject: '', channel: 'WHATSAPP' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (t: any) => {
    setFormData(t);
    setIsFormOpen(true);
  };

  const getIcon = (channel: string) => {
    if (channel === 'WHATSAPP') return <MessageSquare size={18} className="text-emerald-400" />;
    if (channel === 'SMS') return <Smartphone size={18} className="text-blue-400" />;
    return <Mail size={18} className="text-orange-400" />;
  };

  // --- PREVIEW COMPONENT ---
  const PreviewModal = ({ template, onClose }: { template: any, onClose: () => void }) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {getIcon(template.channel)} {template.name}
              </h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-black mt-1">{template.channel} Preview</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
          </div>

          <div className="p-8 overflow-y-auto flex-grow bg-slate-950/50 flex justify-center items-start">
            {template.channel === 'EMAIL' ? (
              <div className="w-full bg-[#000000] rounded-3xl overflow-hidden shadow-2xl border border-white/5 animate-in zoom-in-95 duration-300">
                {/* Email Header Card */}
                <div className="p-8 bg-[#000000] border-b border-white/10 relative">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">CentraCRM Admissions</p>
                    <h1 className="text-2xl md:text-3xl font-light text-white leading-tight tracking-tight">
                      {template.subject || 'Your Application Update'}
                    </h1>
                  </div>
                </div>
                
                {/* Email Body */}
                <div className="p-8 md:p-12 bg-[#111111]">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap font-light">
                      {template.content.replace(/\${(\w+)}/g, '[$1]')}
                    </p>
                  </div>
                  
                  <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col items-center md:items-start">
                      <p className="text-sm font-black text-white uppercase tracking-[0.2em]">The Foundrys</p>
                      <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest font-bold">© 2026 CentraCRM System</p>
                    </div>
                    <div className="flex gap-6">
                       <div className="text-slate-500 hover:text-white transition-colors cursor-pointer"><MessageSquare size={16} /></div>
                       <div className="text-slate-500 hover:text-white transition-colors cursor-pointer"><Mail size={16} /></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : template.channel === 'INTERNAL' ? (
              <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-right-8 duration-300">
                <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Eye size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-white">In-App Notification Preview</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/20">
                      <MessageSquare size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">{template.subject || 'New Notification'}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {template.content.replace(/\${(\w+)}/g, '[$1]')}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold pt-1 uppercase tracking-widest">Just now • CRM System</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button className="flex-grow py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors">View Details</button>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors">Dismiss</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-[300px] h-[550px] bg-slate-800 rounded-[3rem] border-[8px] border-slate-700 shadow-xl relative overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
>
                <div className="bg-slate-900 p-4 pt-10 flex items-center gap-3 border-b border-white/5 relative">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/20 rounded-full" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-xs shadow-lg">TF</div>
                  <div>
                    <p className="text-xs font-bold text-white">{template.channel === 'WHATSAPP' ? 'Admissions' : 'The Foundrys'}</p>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                    </p>
                  </div>
                </div>
                <div className="flex-grow p-4 bg-[#0b141a] overflow-y-auto space-y-4">
                   <div className="flex justify-center">
                     <span className="bg-white/5 text-[9px] px-2 py-0.5 rounded text-slate-500 uppercase font-bold tracking-widest">Today</span>
                   </div>
                   <div className={`max-w-[85%] p-3 rounded-2xl text-sm relative shadow-sm ${template.channel === 'WHATSAPP' ? 'bg-[#005c4b] text-white rounded-tl-none ml-2' : 'bg-blue-600 text-white rounded-bl-none'}`}>
                     <p className="whitespace-pre-wrap leading-tight text-slate-100">{template.content.replace(/\${(\w+)}/g, '[$1]')}</p>
                     <span className="text-[9px] text-white/50 block mt-1 text-right italic">16:16</span>
                   </div>
                </div>

                <div className="p-4 bg-slate-900 flex items-center gap-2">
                   <div className="flex-grow h-8 bg-slate-800 rounded-full" />
                   <div className="w-8 h-8 rounded-full bg-emerald-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Message Templates</h1>
          <p className="text-slate-400 text-sm">Manage automated outbound communication formats</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setFormData({ id: '', name: '', content: '', subject: '', channel: 'WHATSAPP' }); setIsFormOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> New Template
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="glass p-6 rounded-2xl border-white/5 mb-8 animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Template Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. welcome_whatsapp"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Channel Type</label>
                <select 
                  value={formData.channel}
                  onChange={e => setFormData({...formData, channel: e.target.value})}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
              <div className={`space-y-1 ${formData.channel !== 'EMAIL' ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Subject</label>
                <input 
                  type="text" 
                  required={formData.channel === 'EMAIL'}
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  placeholder="Only for Email"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Message Content</label>
              <textarea 
                required
                rows={4}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="Hi ${name}, welcome to CentraCRM!..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-white resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {formData.id ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- LIST VIEW --- */}
      <div className="glass rounded-2xl border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <div className="col-span-1">Icon</div>
          <div className="col-span-3">Template Name</div>
          <div className="col-span-5">Subject / Preview</div>
          <div className="col-span-1">Channel</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y divide-white/5">
          {templates.map((t: any) => (
            <div key={t.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
              <div className="col-span-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.channel === 'WHATSAPP' ? 'bg-emerald-500/20 text-emerald-400' : t.channel === 'SMS' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {getIcon(t.channel)}
                </div>
              </div>
              <div className="col-span-3">
                <h3 className="font-bold text-slate-200">{t.name}</h3>
              </div>
              <div className="col-span-5">
                <p className="text-xs text-slate-400 truncate max-w-sm">
                  {t.channel === 'EMAIL' ? (
                    <span className="font-bold text-slate-300">{t.subject || 'No Subject'}</span>
                  ) : (
                    t.content
                  )}
                </p>
              </div>
              <div className="col-span-1">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">{t.channel}</span>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button 
                  onClick={() => setPreviewTemplate(t)}
                  className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold"
                  title="Preview"
                >
                  <Eye size={16} /> <span className="hidden lg:inline">Preview</span>
                </button>
                <button onClick={() => handleEdit(t)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors"><Edit size={16} /></button>
                <button onClick={() => deleteTemplate(t.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {!loading && templates.length === 0 && (
            <div className="p-12 text-center text-slate-500 uppercase tracking-widest text-xs font-black">
              No templates configured yet.
            </div>
          )}
        </div>
      </div>

      {previewTemplate && (
        <PreviewModal 
          template={previewTemplate} 
          onClose={() => setPreviewTemplate(null)} 
        />
      )}
    </MainLayout>
  );
}
