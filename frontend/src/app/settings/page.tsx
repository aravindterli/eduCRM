
'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  User, Shield, Bell, Key, UserPlus, ShieldCheck,
  AlertCircle, Loader2, Plug, Save, Mail, AtSign,
} from 'lucide-react';
import React, { Suspense } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { useSearchParams } from 'next/navigation';

import { UserManagement } from '@/components/settings/UserManagement';
import { NotificationRules } from '@/components/settings/NotificationRules';
import { ConnectorsManagement } from '@/components/settings/ConnectorsManagement';
import { RoleManagement } from '@/components/settings/RoleManagement';

// ─── Shared input style ───────────────────────────────────────────────────────
const inputCls =
  'w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]';
const labelCls = 'block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-1.5';

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, setAuth, token } = useAuthStore();
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState({ type: '', text: '' });

  React.useEffect(() => {
    if (user) setFormData({ name: user.name, email: user.email });
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const updatedUser = await authService.updateProfile(formData);
      if (token) setAuth(updatedUser, token);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  return (
    <div className="max-w-xl space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5 p-5 bg-[#F9F7F4] rounded-[16px] border border-black/6">
        <div className="w-16 h-16 rounded-[14px] bg-[#1A1A1A] flex items-center justify-center text-[22px] font-bold text-white flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-[15px] font-bold text-[#1A1A1A]">{user?.name || '—'}</p>
          <p className="text-[12px] text-[#999] mt-0.5">{user?.email || '—'}</p>
          <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-white">
            {user?.role?.replace('_', ' ') || 'User'}
          </span>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-[10px] flex items-center gap-3 text-[13px] font-medium border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {message.type === 'success' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Full Name</label>
          <div className="relative">
            <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BBB]" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your full name"
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Email Address</label>
          <div className="relative">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BBB]" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-50 px-5 py-2.5 rounded-[8px] text-[13px] font-bold transition-all text-white"
        >
          {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ─── Settings Page Content ────────────────────────────────────────────────────
function SettingsPageContent() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState('Profile');
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const formatted = tab.charAt(0).toUpperCase() + tab.slice(1);
      if (['Profile', 'Users', 'Roles', 'Notifications', 'Connectors'].includes(formatted)) {
        setActiveTab(formatted);
      }
    }
  }, [searchParams]);

  const tabs = [{ icon: User, label: 'Profile' }];
  if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') {
    tabs.push({ icon: UserPlus, label: 'Users' });
  }
  if (user?.role === 'ADMIN') {
    tabs.push({ icon: Shield, label: 'Roles' });
    tabs.push({ icon: Bell, label: 'Notifications' });
    tabs.push({ icon: Plug, label: 'Connectors' });
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">System Settings</h1>
        <p className="text-sm text-[#999] mt-0.5">Manage preferences and platform configurations</p>
      </div>

      <div className="flex flex-col md:flex-row bg-white border border-black/6 rounded-[16px] overflow-hidden min-h-[600px] shadow-sm">
        {/* Sidebar */}
        <div className="flex flex-col gap-1 p-3 bg-[#F9F7F4] border-r border-black/6 w-full md:w-56 shrink-0">
          <p className="text-[10px] font-bold text-[#BBB] uppercase tracking-wider px-3 py-2">Navigation</p>
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold transition-all rounded-[8px] ${
                activeTab === tab.label
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'text-[#777] hover:bg-black/5 hover:text-[#1A1A1A]'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto relative">
          {/* Section heading */}
          <div className="mb-6 pb-4 border-b border-black/5">
            <h2 className="text-[15px] font-bold text-[#1A1A1A]">{activeTab} Configuration</h2>
            <p className="text-[12px] text-[#999] mt-0.5">
              {activeTab === 'Profile'       && 'Update your personal information and account details'}
              {activeTab === 'Users'         && 'Invite and manage team members and their access levels'}
              {activeTab === 'Roles'         && 'Configure role permissions and access control'}
              {activeTab === 'Notifications' && 'Set up automated notification rules and delivery channels'}
              {activeTab === 'Connectors'    && 'Manage third-party integrations and API connections'}
            </p>
          </div>

          {activeTab === 'Profile'       && <ProfileTab />}
          {activeTab === 'Users'         && <UserManagement />}
          {activeTab === 'Roles'         && <RoleManagement />}
          {activeTab === 'Notifications' && <NotificationRules />}
          {activeTab === 'Connectors'    && <ConnectorsManagement />}
        </div>
      </div>
    </MainLayout>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="animate-spin text-[#1A1A1A] mx-auto" size={28} />
            <p className="text-xs font-semibold text-[#999] uppercase tracking-widest">Loading Settings…</p>
          </div>
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
