'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { User, Shield, Bell, Database, Key, UserPlus, Mail, ShieldCheck, Trash2, Loader2, AlertCircle } from 'lucide-react';
import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/useThemeStore';
import { authService } from '@/services/auth.service';

import { UserManagement } from '@/components/settings/UserManagement';

export default function SettingsPage() {
  const { user, setAuth, token } = useAuthStore();
  const { theme, setTheme, accent, setAccent } = useThemeStore();
  const [activeTab, setActiveTab] = React.useState('Profile');
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState({ type: '', text: '' });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const updatedUser = await authService.updateProfile(formData);
      if (token) {
        setAuth(updatedUser, token);
      }
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { icon: User, label: 'Profile' },
    // { icon: Shield, label: 'Security' },
    // { icon: Bell, label: 'Notifications' },
    // { icon: Database, label: 'Integrations' },
    // { icon: Key, label: 'API Keys' },
  ];

  if (user?.role === 'ADMIN') {
    tabs.push({ icon: UserPlus, label: 'Users' });
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-slate-400 text-sm">Manage preferences and platform configurations</p>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl mb-8 w-fit overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${activeTab === tab.label
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'text-muted-foreground hover:bg-white/5'
              }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl border-white/5 p-8 relative overflow-hidden">
        {isSaving && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        )}

        {activeTab === 'Users' ? (
          <UserManagement />
        ) : (
          <div className="max-w-2xl space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {activeTab} Configuration
              </h3>

              {message.text && (
                <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                  {message.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* ... Display Name and Email ... */}
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Theme Preference</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setTheme('ocean')}
                      className={`p-4 rounded-2xl border transition-all text-center ${theme === 'ocean' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      <div className="w-full h-2 bg-slate-900 rounded mb-2 overflow-hidden flex">
                        <div className="w-1/3 h-full bg-blue-600" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Ocean Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme('slate')}
                      className={`p-4 rounded-2xl border transition-all text-center ${theme === 'slate' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      <div className="w-full h-2 bg-slate-800 rounded mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Midnight Slate</span>
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-2xl border transition-all text-center ${theme === 'light' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      <div className="w-full h-2 bg-white border border-slate-200 rounded mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">High Contrast</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Accent Color</label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { id: 'blue', color: 'bg-blue-500' },
                      { id: 'indigo', color: 'bg-indigo-500' },
                      { id: 'emerald', color: 'bg-emerald-500' },
                      { id: 'rose', color: 'bg-rose-500' },
                      { id: 'purple', color: 'bg-purple-500' },
                      { id: 'violet', color: 'bg-violet-500' },
                      { id: 'pink', color: 'bg-pink-500' },
                      { id: 'fuchsia', color: 'bg-fuchsia-500' },

                      { id: 'cyan', color: 'bg-cyan-500' },
                      { id: 'teal', color: 'bg-teal-500' },
                      { id: 'lime', color: 'bg-lime-500' },
                      { id: 'amber', color: 'bg-amber-500' },

                      { id: 'orange', color: 'bg-orange-500' },
                      { id: 'red', color: 'bg-red-500' },
                      { id: 'yellow', color: 'bg-yellow-500' },

                      { id: 'slate', color: 'bg-slate-500' },
                      { id: 'gray', color: 'bg-gray-500' },
                      { id: 'zinc', color: 'bg-zinc-500' },

                    ].map((a: any) => (
                      <button
                        key={a.id}
                        onClick={() => setAccent(a.id)}
                        className={`w-12 h-12 rounded-2xl ${a.color} transition-all relative flex items-center justify-center hover:scale-110 active:scale-95 ${accent === a.id ? 'ring-4 ring-white/20 shadow-xl' : 'opacity-60 hover:opacity-100'}`}
                      >
                        {accent === a.id && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex justify-end gap-3">
              <button
                onClick={() => setFormData({ name: user?.name || '', email: user?.email || '' })}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all text-slate-400"
              >
                Reset Changes
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 text-primary-foreground"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
