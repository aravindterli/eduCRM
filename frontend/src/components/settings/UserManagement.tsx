'use client';

import React from 'react';
import { UserPlus, Mail, ShieldCheck, Trash2, Loader2, AlertCircle, Shield, Clock, Send } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

const systemRoleMap: Record<string, string> = {
  ADMIN: 'ADMIN',
  STANDARD: 'TELECALLER',
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

type Role = { id: string; name: string; type: string };

interface Invitation {
  id: string;
  email: string;
  roleId: string;
  createdAt: string;
  status: string;
}

export const UserManagement = () => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const { user } = useAuthStore();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    roleId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, invitesData] = await Promise.all([
        authService.getUsers(),
        authService.getInvitations()
      ]);
      setUsers(usersData);
      setInvitations(invitesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const rolesData = await authService.getRoles();
      setRoles(rolesData);
    } catch { }
  };

  React.useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setFormError(null);
    try {
      await authService.invite({ name: formData.name, email: formData.email, roleId: formData.roleId });
      setShowCreateForm(false);
      setFormData({ name: '', email: '', roleId: '' });
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to invite user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await authService.resendInvitation(id);
      alert('Invitation resent successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resend');
    }
  };

  const allItems = [
    ...users.map(u => ({ ...u, isPending: false })),
    ...invitations.map(i => ({
      id: i.id,
      name: 'Invited User',
      email: i.email,
      role: roles.find(r => r.id === i.roleId)?.type || 'STANDARD',
      createdAt: i.createdAt,
      isPending: true
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#1A1A1A]" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-black/6 rounded-[16px] p-6 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
            User Management
          </h3>
          <p className="text-[12px] text-[#999] mt-0.5">Create and manage platform access for your team</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-[#1A1A1A] hover:bg-[#333] px-5 py-2.5 rounded-[8px] text-xs font-bold transition-all text-white flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus size={14} />
          {showCreateForm ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {/* Invite/Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-black/6 rounded-[16px] p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleCreateUser} className="space-y-5">
            <h4 className="text-[13px] font-bold text-[#1A1A1A] border-b border-black/5 pb-2">Invite New Team Member</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Full Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Assign Role</label>
                {roles.length === 0 ? (
                  <p className="text-xs text-[#999] italic mt-2.5">No roles available.</p>
                ) : (
                  <div className="relative">
                    <select
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                      className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">-- Select a Role --</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.type === 'ADMIN' ? 'Admin' : 'Standard'})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#888] text-[10px] font-bold">
                      ▼
                    </div>
                  </div>
                )}
              </div>
            </div>

            {formError && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-[8px] flex items-center gap-3 text-[13px]">
                <AlertCircle size={15} />
                <p>{formError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-[#777] hover:bg-black/5 hover:text-[#1A1A1A] transition-all"
              >
                Cancel
              </button>
              <button
                disabled={createLoading}
                type="submit"
                className="bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-50 px-6 py-2 rounded-[8px] text-[13px] font-bold text-white transition-all flex items-center gap-2"
              >
                {createLoading ? <Loader2 className="animate-spin" size={14} /> : 'Invite User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-[8px] flex items-center gap-3 text-[13px]">
          <AlertCircle size={15} />
          <p>{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-black/6 rounded-[16px] p-6 shadow-sm overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2.5">
          <thead>
            <tr className="text-left text-[10px] font-bold text-[#888] uppercase tracking-wider">
              <th className="pb-3 pl-4 text-center w-16">User</th>
              <th className="pb-3">Name & Email</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Date Added</th>
              <th className="pb-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((u) => (
              <tr key={u.id} className="group">
                <td className="bg-[#F9F7F4]/60 group-hover:bg-[#F9F7F4] py-3 pl-4 rounded-l-[12px] transition-all">
                  <div className="w-10 h-10 rounded-[8px] bg-[#1A1A1A] flex items-center justify-center text-xs font-bold text-white">
                    {u.isPending ? <Clock size={15} className="text-orange-400" /> : u.name[0]?.toUpperCase()}
                  </div>
                </td>
                <td className="bg-[#F9F7F4]/60 group-hover:bg-[#F9F7F4] py-3 transition-all">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className={`text-[13px] font-bold ${u.isPending ? 'text-[#999] italic' : 'text-[#1A1A1A]'}`}>{u.name}</p>
                      <p className="text-[11px] text-[#777] font-semibold mt-0.5">{u.email}</p>
                    </div>
                    {u.isPending && (
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 text-[9px] font-bold rounded-[4px]">Pending</span>
                    )}
                  </div>
                </td>
                <td className="bg-[#F9F7F4]/60 group-hover:bg-[#F9F7F4] py-3 transition-all">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold border ${
                    u.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    u.role === 'COUNSELOR' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    u.role === 'FINANCE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    u.role === 'MARKETING_TEAM' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    'bg-slate-50 text-slate-700 border-slate-100'
                  }`}>
                    <Shield size={10} />
                    {u.role.replace('_', ' ')}
                  </div>
                </td>
                <td className="bg-[#F9F7F4]/60 group-hover:bg-[#F9F7F4] py-3 transition-all">
                  <p className="text-[11px] text-[#555] font-semibold">{new Date(u.createdAt).toLocaleDateString('en-IN')}</p>
                </td>
                <td className="bg-[#F9F7F4]/60 group-hover:bg-[#F9F7F4] py-3 rounded-r-[12px] pr-4 text-right transition-all">
                  <div className="flex items-center justify-end gap-1">
                    {u.isPending && (
                      <button
                        onClick={() => handleResend(u.id)}
                        className="p-1.5 text-[#777] hover:text-[#1A1A1A] hover:bg-black/5 rounded-[6px] transition-all"
                        title="Resend Invitation"
                      >
                        <Send size={14} />
                      </button>
                    )}
                    <button className="p-1.5 text-[#777] hover:text-red-600 hover:bg-red-50 rounded-[6px] transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

