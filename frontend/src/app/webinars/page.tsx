'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMarketingStore } from '@/store/useMarketingStore';
import { useAuthStore } from '@/store/auth.store';
import { Calendar, Plus, Users, Trash2, Edit2, Clock, QrCode } from 'lucide-react';
import { WebinarQRModal } from '@/components/marketing/WebinarQRModal';

export default function WebinarsPage() {
  const { webinars, fetchWebinars, createWebinar, updateWebinar, deleteWebinar, isLoading } = useMarketingStore();
  const { user } = useAuthStore();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({ id: '', title: '', description: '', date: '' });
  const [viewingRegistrations, setViewingRegistrations] = React.useState<any>(null);

  React.useEffect(() => {
    fetchWebinars();
  }, [fetchWebinars]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      await updateWebinar(formData.id, formData);
    } else {
      await createWebinar(formData);
    }
    setIsFormOpen(false);
    setFormData({ id: '', title: '', description: '', date: '' });
  };

  const handleEdit = (w: any) => {
    setFormData({
      id: w.id,
      title: w.title,
      description: w.description || '',
      date: new Date(w.date).toISOString().slice(0, 16)
    });
    setIsFormOpen(true);
  };

  const [isQRModalOpen, setIsQRModalOpen] = React.useState(false);
  const [selectedWebinar, setSelectedWebinar] = React.useState<any>(null);

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Webinars & Events</h1>
          <p className="text-slate-400 text-sm">Schedule and manage your live events</p>
        </div>
        <button
          onClick={() => { setFormData({ id: '', title: '', description: '', date: '' }); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Schedule Webinar
        </button>
      </div>

      {selectedWebinar && (
        <WebinarQRModal
          isOpen={isQRModalOpen}
          onClose={() => {
            setIsQRModalOpen(false);
            setSelectedWebinar(null);
          }}
          webinarId={selectedWebinar.id}
          webinarTitle={selectedWebinar.title}
        />
      )}

      {isFormOpen && (
        <div className="glass p-6 rounded-2xl border-white/5 mb-8 animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Webinar Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Intro to Data Science"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the event..."
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
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {formData.id ? 'Update Webinar' : 'Schedule Webinar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {webinars.map((w: any) => {
          const wDate = new Date(w.date);
          const isPast = wDate < new Date();

          return (
            <div key={w.id} className={`glass p-6 rounded-2xl border-white/5 relative group ${isPast ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPast ? 'bg-slate-500/20 text-slate-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 truncate pr-2 max-w-[200px]">{w.title}</h3>
                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase flex items-center gap-1">
                      <Clock size={10} /> {wDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(w)} className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => deleteWebinar(w.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-6 line-clamp-2 h-10">
                {w.description || 'No description provided.'}
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button
                  onClick={() => setViewingRegistrations(w)}
                  className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                >
                  <span className="font-bold">{w._count?.registrations || 0}</span>
                  <span className="text-xs text-slate-500">Registered</span>
                </button>
                {!isPast && w.meetingUrl && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedWebinar(w);
                        setIsQRModalOpen(true);
                      }}
                      className="p-2 text-slate-500 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all"
                      title="Show QR Code"
                    >
                      <QrCode size={16} />
                    </button>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/webinars/${w.id}/register`;
                        navigator.clipboard.writeText(link);
                        alert('Registration link copied to clipboard!');
                      }}
                      className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                    >
                      Copy Link
                    </button>
                    <a
                      href={`${w.meetingUrl}&userInfo.displayName="${encodeURIComponent(user?.name || 'EduCRM Host')}"`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20"
                    >
                      Start Meeting
                    </a>
                  </div>
                )}
                {isPast && <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-500/10 px-2 py-1 rounded">Archived</span>}
              </div>
            </div>
          );
        })}

        {!isLoading && webinars.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
            No webinars scheduled.
          </div>
        )}
      </div>
      {viewingRegistrations && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setViewingRegistrations(null)} />
          <div className="relative w-full max-w-2xl glass border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="text-xl font-bold">{viewingRegistrations.title}</h3>
                <p className="text-slate-400 text-sm">Registered Participants ({viewingRegistrations._count?.registrations || 0})</p>
              </div>
              <button onClick={() => setViewingRegistrations(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {viewingRegistrations.registrations?.length > 0 ? (
                <div className="space-y-3">
                  {viewingRegistrations.registrations.map((reg: any) => (
                    <div key={reg.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/[0.08] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                          {reg.lead?.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{reg.lead?.name}</p>
                          <div className="flex gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            <span className="flex items-center gap-1"><Users size={10} /> {reg.lead?.email}</span>
                            <span className="flex items-center gap-1"><Users size={10} /> {reg.lead?.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${reg.attended ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {reg.attended ? 'Attended' : 'Registered'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 italic">
                  No registrations recorded yet.
                </div>
              )}
            </div>
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
              <button
                onClick={() => setViewingRegistrations(null)}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
