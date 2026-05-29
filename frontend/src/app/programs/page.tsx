
'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Book, Edit3, IndianRupee, Plus, X, Save } from 'lucide-react';
import API from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

export default function ProgramsPage() {
  const [programs, setPrograms] = React.useState<any[]>([]);
  const { user } = useAuthStore();
  const sector = user?.sector || 'GENERIC';

  const labels = {
    GENERIC: {
      title: 'Program Management',
      subtitle: 'Configure courses and academic fees',
      addBtn: 'Add Program',
      createTitle: 'Create New Academic Program',
      nameLabel: 'Program Name',
      feeLabel: 'Base Tuition Fee (₹)',
      feeHeader: 'Base Tuition Fee',
      placeholderName: 'e.g. Master of Business Administration',
      placeholderDesc: 'Outline the course curriculum and objectives...',
      createBtn: 'Create Program',
      loading: 'Loading programs...',
    },
    REAL_ESTATE: {
      title: 'Property Management',
      subtitle: 'Configure properties and unit details',
      addBtn: 'Add Property',
      createTitle: 'Create New Property / Project',
      nameLabel: 'Property Name',
      feeLabel: 'Starting Price (₹)',
      feeHeader: 'Starting Price',
      placeholderName: 'e.g. Luxury 3BHK Apartment',
      placeholderDesc: 'Outline property specifications and amenities...',
      createBtn: 'Create Property',
      loading: 'Loading properties...',
    },
    HEALTHCARE: {
      title: 'Service Management',
      subtitle: 'Configure medical services and consultation fees',
      addBtn: 'Add Service',
      createTitle: 'Create New Medical Service',
      nameLabel: 'Service Name',
      feeLabel: 'Consultation Fee (₹)',
      feeHeader: 'Consultation Fee',
      placeholderName: 'e.g. Cardiology Consultation',
      placeholderDesc: 'Outline service details and procedures...',
      createBtn: 'Create Service',
      loading: 'Loading services...',
    },
  };

  const currentLabels = (labels as any)[sector] || labels.GENERIC;
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
      <div className="flex justify-between items-center mb-8 text-[#1A1A1A]">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">{currentLabels.title}</h1>
          <p className="text-[#1A1A1A]/60 text-sm mt-1">{currentLabels.subtitle}</p>
        </div>
        <button 
          onClick={() => {
            setEditingId('new');
            setEditData({ name: '', description: '', baseFee: 0 });
          }}
          className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white px-4 py-2 rounded-[8px] border border-black/10 transition-all font-semibold tracking-wider text-sm shadow-sm"
        >
          <Plus size={18} />
          <span>{currentLabels.addBtn}</span>
        </button>
      </div>

      {editingId === 'new' && (
        <div className="mb-8 p-8 rounded-[16px] bg-white border border-black/10 shadow-sm animate-in slide-in-from-top-4 duration-300 text-[#1A1A1A]">
           <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-[#1A1A1A]">
             <Plus size={20} className="text-blue-600 bg-blue-50 border border-blue-100 rounded-[6px]" />
             {currentLabels.createTitle}
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{currentLabels.nameLabel}</label>
                <input 
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 placeholder:text-slate-400 outline-none focus:border-black/20 text-[#1A1A1A] transition-all"
                  placeholder={currentLabels.placeholderName}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{currentLabels.feeLabel}</label>
                <input 
                  type="number"
                  value={editData.baseFee}
                  onChange={e => setEditData({...editData, baseFee: parseFloat(e.target.value)})}
                  className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 font-bold text-emerald-600 outline-none focus:border-black/20 text-[#1A1A1A] transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Detailed Description</label>
                <textarea 
                  value={editData.description}
                  onChange={e => setEditData({...editData, description: e.target.value})}
                  className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-3 text-sm outline-none focus:border-black/20 text-[#1A1A1A] transition-all resize-none"
                  placeholder={currentLabels.placeholderDesc}
                  rows={3}
                />
              </div>
           </div>
           <div className="flex justify-end gap-3">
              <button 
                onClick={() => setEditingId(null)}
                className="px-6 py-2.5 rounded-[8px] text-sm font-semibold hover:bg-gray-100 transition-all text-slate-500"
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
                className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white px-8 py-2.5 rounded-[8px] text-sm font-bold border border-black/10 transition-all shadow-sm"
              >
                {currentLabels.createBtn}
              </button>
           </div>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="p-10 text-center text-slate-400 font-semibold">{currentLabels.loading}</div>
        ) : programs.map((p) => (
          <div key={p.id} className="p-6 rounded-[12px] bg-white border border-black/10 hover:bg-[#F5F1EB]/30 transition-all group text-[#1A1A1A]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-5 flex-grow">
                <div className="w-14 h-14 rounded-[8px] bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Book size={28} />
                </div>
                
                {editingId === p.id ? (
                  <div className="space-y-3 flex-grow max-w-md">
                    <input 
                      value={editData.name}
                      onChange={e => setEditData({...editData, name: e.target.value})}
                      className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-2 text-sm outline-none focus:border-black/20 text-[#1A1A1A]"
                      placeholder="Name"
                    />
                    <textarea 
                      value={editData.description}
                      onChange={e => setEditData({...editData, description: e.target.value})}
                      className="w-full bg-gray-50 border border-black/10 rounded-[8px] px-4 py-2 text-xs outline-none focus:border-black/20 text-[#1A1A1A] resize-none"
                      placeholder="Description"
                      rows={2}
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">{p.name}</h3>
                    <p className="text-sm text-slate-550 mt-1 max-w-xl line-clamp-2">{p.description || 'No description provided.'}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 justify-between w-full md:w-auto">
                <div className="text-right">
                  <p className="text-[10px] text-slate-450 uppercase font-black tracking-widest mb-1">{currentLabels.feeHeader}</p>
                  {editingId === p.id ? (
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="number"
                        value={editData.baseFee}
                        onChange={e => setEditData({...editData, baseFee: parseFloat(e.target.value)})}
                        className="w-32 bg-gray-50 border border-black/10 rounded-[8px] pl-8 pr-3 py-2 text-sm font-bold text-emerald-600 outline-none focus:border-black/20 text-[#1A1A1A]"
                      />
                    </div>
                  ) : (
                    <p className="text-xl font-black text-emerald-600">₹{p.baseFee?.toLocaleString() || '0'}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  {editingId === p.id ? (
                    <>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-2.5 rounded-[8px] bg-gray-50 border border-black/10 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center"
                        title="Cancel"
                      >
                        <X size={20} />
                      </button>
                      <button 
                        onClick={saveEdit}
                        className="p-2.5 rounded-[8px] bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 border border-black/10 text-white transition-all shadow-sm flex items-center justify-center"
                        title="Save"
                      >
                        <Save size={20} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => startEdit(p)}
                      className="p-2.5 rounded-[8px] bg-gray-50 border border-black/10 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                      title="Edit"
                    >
                      <Edit3 size={18} />
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
