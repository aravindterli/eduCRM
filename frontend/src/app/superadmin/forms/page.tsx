'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { superadminService } from '@/services/superadmin.service';
import { Layout, Plus, Settings2, Trash2, Save, Type, List, CheckSquare, Hash, Globe } from 'lucide-react';

export default function FormManagementPage() {
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newTemplate, setNewTemplate] = React.useState({
    name: '',
    sector: 'EDUCATION',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'phone', label: 'Phone Number', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
    ]
  });

  React.useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await superadminService.getForms();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    setNewTemplate({
      ...newTemplate,
      fields: [...newTemplate.fields, { name: '', label: '', type: 'text', required: false }]
    });
  };

  const removeField = (index: number) => {
    setNewTemplate({
      ...newTemplate,
      fields: newTemplate.fields.filter((_, i) => i !== index)
    });
  };

  const updateField = (index: number, updates: any) => {
    const updatedFields = [...newTemplate.fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setNewTemplate({ ...newTemplate, fields: updatedFields });
  };

  const handleSave = async () => {
    try {
      await superadminService.createForm(newTemplate);
      setIsCreating(false);
      fetchTemplates();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save template');
    }
  };

  return (
    <MainLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Form Architecture</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage sector-specific lead capture templates</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-white text-black px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Create Template
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Template Name</label>
                <input 
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Ex: Standard Education Admission"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-blue-500/30 transition-all text-white font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Sector</label>
                <select 
                  value={newTemplate.sector}
                  onChange={e => setNewTemplate({ ...newTemplate, sector: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-blue-500/30 transition-all text-white font-bold"
                >
                  <option value="EDUCATION">Education</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="HEALTHCARE">Healthcare</option>
                  <option value="GENERIC">Generic</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Field Configuration</h3>
                <button 
                  onClick={addField}
                  className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Field
                </button>
              </div>

              <div className="space-y-3">
                {newTemplate.fields.map((field, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-4 items-end group">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Label</label>
                        <input 
                          value={field.label}
                          onChange={e => updateField(idx, { label: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-3 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Key (Slug)</label>
                        <input 
                          value={field.name}
                          onChange={e => updateField(idx, { name: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-3 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Type</label>
                        <select 
                          value={field.type}
                          onChange={e => updateField(idx, { type: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-3 text-xs text-white outline-none"
                        >
                          <option value="text">Text Input</option>
                          <option value="select">Dropdown</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                          <option value="tel">Phone</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-4 h-10">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={field.required}
                            onChange={e => updateField(idx, { required: e.target.checked })}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0 outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Required</span>
                        </label>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeField(idx)}
                      className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              onClick={() => setIsCreating(false)}
              className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="bg-blue-600 text-white px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 shadow-xl shadow-blue-500/20"
            >
              <Save size={16} /> Save Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="glass h-64 rounded-[2rem] border-white/5 animate-pulse" />
            ))
          ) : templates.length === 0 ? (
            <div className="col-span-full py-20 text-center glass rounded-[2rem] border-white/5">
              <Layout size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No form templates defined yet</p>
            </div>
          ) : templates.map(template => (
            <div key={template.id} className="glass p-8 rounded-[2rem] border-white/5 group hover:border-white/10 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-white/5 text-blue-500">
                    <Layout size={24} />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 uppercase tracking-widest">
                    {template.sector}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">{template.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">
                  {template.fields.length} Fields Configured
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Edit Layout
                </button>
                <button className="p-3 rounded-2xl hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
