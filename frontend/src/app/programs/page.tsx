
'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Book, Edit3, DollarSign, Plus, X, Save } from 'lucide-react';
import API from '@/services/api';

export default function ProgramsPage() {
  const [programs, setPrograms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editData, setEditData] = React.useState({ name: '', description: '', baseFee: 0 });

  const fetchPrograms = async () => {
    try {
      const res = await API.get('/programs');
      setPrograms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPrograms();
  }, []);

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditData({ name: p.name, description: p.description || '', baseFee: p.baseFee || 0 });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await API.patch(`/programs/${editingId}`, editData);
      setEditingId(null);
      fetchPrograms();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Program Management</h1>
          <p className="text-slate-400 text-sm">Configure courses and academic fees</p>
        </div>
        <button 
          onClick={() => {
            setEditingId('new');
            setEditData({ name: '', description: '', baseFee: 0 });
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          <span>Add Program</span>
        </button>
      </div>

      {editingId === 'new' && (
        <div className="mb-8 p-8 rounded-3xl glass border-blue-500/20 bg-blue-500/5 animate-in slide-in-from-top-4 duration-300">
           <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
             <Plus size={20} className="text-blue-400" />
             Create New Academic Program
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Program Name</label>
                <input 
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all"
                  placeholder="e.g. Master of Business Administration"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Base Tuition Fee ($)</label>
                <input 
                  type="number"
                  value={editData.baseFee}
                  onChange={e => setEditData({...editData, baseFee: parseFloat(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Detailed Description</label>
                <textarea 
                  value={editData.description}
                  onChange={e => setEditData({...editData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all resize-none"
                  placeholder="Outline the course curriculum and objectives..."
                  rows={3}
                />
              </div>
           </div>
           <div className="flex justify-end gap-3">
              <button 
                onClick={() => setEditingId(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all text-slate-400"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await API.post('/programs', editData);
                    setEditingId(null);
                    fetchPrograms();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-500 px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
              >
                Create Program
              </button>
           </div>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading programs...</div>
        ) : programs.map((p) => (
          <div key={p.id} className="p-6 rounded-2xl glass border-white/5 hover:border-white/10 transition-all group">
            <div className="flex justify-between items-start">
              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Book size={28} />
                </div>
                
                {editingId === p.id ? (
                  <div className="space-y-3 flex-grow max-w-md">
                    <input 
                      value={editData.name}
                      onChange={e => setEditData({...editData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500/50"
                      placeholder="Program Name"
                    />
                    <textarea 
                      value={editData.description}
                      onChange={e => setEditData({...editData, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500/50"
                      placeholder="Description"
                      rows={2}
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-bold text-slate-200">{p.name}</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-xl line-clamp-2">{p.description || 'No description provided.'}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Base Tuition Fee</p>
                  {editingId === p.id ? (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input 
                        type="number"
                        value={editData.baseFee}
                        onChange={e => setEditData({...editData, baseFee: parseFloat(e.target.value)})}
                        className="w-32 bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-emerald-400 outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  ) : (
                    <p className="text-xl font-black text-emerald-400">${p.baseFee?.toLocaleString() || '0'}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  {editingId === p.id ? (
                    <>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-slate-500/10 hover:text-red-400 transition-all"
                      >
                        <X size={20} />
                      </button>
                      <button 
                        onClick={saveEdit}
                        className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                      >
                        <Save size={20} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => startEdit(p)}
                      className="p-3 rounded-xl bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-blue-400 transition-all"
                    >
                      <Edit3 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
