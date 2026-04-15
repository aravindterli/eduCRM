'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTemplateStore } from '@/store/useTemplateStore';
import { MessageSquare, Mail, Smartphone, Plus, Trash2, Edit, RefreshCw } from 'lucide-react';

export default function TemplatesPage() {
  const { templates, fetchTemplates, createTemplate, updateTemplate, deleteTemplate, syncWhatsAppTemplates, loading } = useTemplateStore();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({ id: '', name: '', content: '', channel: 'WHATSAPP' });
  const [isSyncing, setIsSyncing] = React.useState(false);

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
        if (!success) throw new Error("Failed to create template. The template name might already exist or the Meta format is invalid.");
      }
      setIsFormOpen(false);
      setFormData({ id: '', name: '', content: '', channel: 'WHATSAPP' });
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

  const handleSyncMeta = async () => {
    setIsSyncing(true);
    const result = await syncWhatsAppTemplates();
    setIsSyncing(false);
    if (!result.success) {
      alert(result.message || 'Failed to sync templates. Ensure META_WABA_ID is configured in the backend.');
    } else {
      alert(result.message);
    }
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
            onClick={handleSyncMeta}
            disabled={isSyncing}
            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 border border-emerald-500/20 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> 
            {isSyncing ? 'Syncing...' : 'Sync Meta Tpls'}
          </button>
          <button 
            onClick={() => { setFormData({ id: '', name: '', content: '', channel: 'WHATSAPP' }); setIsFormOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> New Template
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="glass p-6 rounded-2xl border-white/5 mb-8 animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Message Content</label>
              <textarea 
                required
                rows={4}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="Hi ${name}, welcome to EduCRM!..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t: any) => (
          <div key={t.id} className="glass p-6 rounded-2xl border-white/5 relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.channel === 'WHATSAPP' ? 'bg-emerald-500/20 text-emerald-400' : t.channel === 'SMS' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {getIcon(t.channel)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">{t.name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{t.channel}</p>
                    {t.channel === 'WHATSAPP' && t.status && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                        t.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 
                        t.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {t.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(t)} className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"><Edit size={14} /></button>
                <button onClick={() => deleteTemplate(t.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 text-sm text-slate-300 font-mono text-xs whitespace-pre-wrap">
              {t.content}
            </div>
          </div>
        ))}
        {!loading && templates.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
            No templates configured yet.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
