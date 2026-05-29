'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Plug, Plus, Edit2, Trash2, Save, X, HelpCircle, Link as LinkIcon } from 'lucide-react';

export default function SuperadminConnectorsPage() {
  const [connectors, setConnectors] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingConnector, setEditingConnector] = React.useState<any>(null);
  const [showForm, setShowForm] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    id: '',
    name: '',
    category: '',
    logo: 'Plug',
    fields: [] as any[],
    instructions: [] as string[]
  });

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchConnectors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${backendUrl}/superadmin/connectors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Data is not an array');
      }
      setConnectors(data);
    } catch (error) {
      console.error('Failed to fetch connectors:', error);
      setConnectors([
        { id: 'Twilio', name: 'Twilio', logo: 'MessageSquare', fields: [], instructions: [] },
        { id: 'Meta', name: 'Meta', logo: 'Globe', fields: [], instructions: [] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchConnectors();
  }, []);

  const handleEdit = (connector: any) => {
    setEditingConnector(connector);
    setFormData({
      id: connector.id,
      name: connector.name,
      category: connector.category || '',
      logo: connector.logo || 'Plug',
      fields: connector.fields || [],
      instructions: connector.instructions || []
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingConnector(null);
    setFormData({
      id: '',
      name: '',
      category: '',
      logo: 'Plug',
      fields: [],
      instructions: []
    });
    setShowForm(true);
  };

  const handleAddField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { name: '', label: '', placeholder: '', isSensitive: false }]
    });
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...formData.fields];
    newFields.splice(index, 1);
    setFormData({ ...formData, fields: newFields });
  };

  const handleFieldChange = (index: number, key: string, value: any) => {
    const newFields = [...formData.fields];
    newFields[index][key] = value;
    setFormData({ ...formData, fields: newFields });
  };

  const handleAddInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, '']
    });
  };

  const handleRemoveInstruction = (index: number) => {
    const newInstructions = [...formData.instructions];
    newInstructions.splice(index, 1);
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleSave = async () => {
    try {
      const url = editingConnector 
        ? `${backendUrl}/superadmin/connectors/${editingConnector.id}`
        : `${backendUrl}/superadmin/connectors`;
      
      const method = editingConnector ? 'PUT' : 'POST';
      const token = localStorage.getItem('centracrm_token');
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
 
      if (res.ok) {
        setShowForm(false);
        fetchConnectors();
      } else {
        const errorData = await res.json();
        alert(`Failed to save: ${errorData.message || res.statusText}`);
      }
    } catch (error) {
      console.error('Failed to save connector:', error);
      alert('Failed to save connector. See console for details.');
    }
  };

  return (
    <MainLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight">Connector Definitions</h1>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage fields and instructions for tenant connectors</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-white"
        >
          <Plus size={16} /> Add New Connector
        </button>
      </div>

      <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
        {showForm ? (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">{editingConnector ? `Edit ${editingConnector.name}` : 'New Connector'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connector ID (Unique)</label>
                <input
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingConnector}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm outline-none focus:border-blue-500/30 transition-all text-white disabled:opacity-50"
                  placeholder="e.g., twilio, meta"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Display Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm outline-none focus:border-blue-500/30 transition-all text-white"
                  placeholder="e.g., Twilio, Meta (WhatsApp)"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm outline-none focus:border-blue-500/30 transition-all text-white [&>option]:text-black"
                >
                  <option value="">Select Category</option>
                  <option value="Communication">Communication</option>
                  <option value="Lead Source">Lead Source</option>
                  <option value="Payment">Payment</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Support">Support</option>
                  <option value="Calendar">Calendar</option>
                  <option value="AI">AI</option>
                </select>
              </div>
            </div>

            {/* Fields Editor */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Required Fields</label>
                <button
                  onClick={handleAddField}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <Plus size={12} /> Add Field
                </button>
              </div>
              <div className="space-y-3">
                {formData.fields.map((field, index) => (
                  <div key={index} className="grid grid-cols-4 gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/5 items-center">
                    <input
                      placeholder="Field Name (key)"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/30 transition-all text-white"
                    />
                    <input
                      placeholder="Label"
                      value={field.label}
                      onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/30 transition-all text-white"
                    />
                    <input
                      placeholder="Placeholder"
                      value={field.placeholder}
                      onChange={(e) => handleFieldChange(index, 'placeholder', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/30 transition-all text-white"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.isSensitive}
                          onChange={(e) => handleFieldChange(index, 'isSensitive', e.target.checked)}
                          className="rounded border-white/10 bg-white/5 text-primary"
                        />
                        <span className="text-xs text-slate-400">Sensitive</span>
                      </label>
                      <button onClick={() => handleRemoveField(index)} className="p-1.5 hover:bg-white/5 rounded-lg text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions Editor */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Help Instructions</label>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tip: Use <code>[Text](URL)</code> to create clickable links.</p>
                </div>
                <button
                  onClick={handleAddInstruction}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <Plus size={12} /> Add Step
                </button>
              </div>
              <div className="space-y-3">
                {formData.instructions.map((step, index) => (
                  <div key={index} className="flex gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5 items-center">
                    <span className="text-xs font-bold text-slate-500">{index + 1}.</span>
                    <input
                      placeholder="Step instruction or HTML content"
                      value={step}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/30 transition-all text-white"
                    />
                    <button onClick={() => handleRemoveInstruction(index)} className="p-1.5 hover:bg-white/5 rounded-lg text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-white flex items-center gap-2"
              >
                <Save size={14} /> Save Definition
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Connector</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fields</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Instructions</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-6 h-16 bg-white/[0.01]" />
                    </tr>
                  ))
                ) : connectors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center">
                      <p className="text-sm text-slate-500 font-medium">No connector definitions found.</p>
                    </td>
                  </tr>
                ) : connectors.map((connector) => (
                  <tr key={connector.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                          <Plug size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{connector.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-medium text-slate-400 font-mono">{connector.id}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-medium text-slate-300">{connector.category || 'N/A'}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-medium text-slate-300">{(connector.fields || []).length} fields</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-medium text-slate-300">{(connector.instructions || []).length} steps</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(connector)}
                          className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-xl text-red-500 hover:text-red-400 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
