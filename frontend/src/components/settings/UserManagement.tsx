'use client';

import React from 'react';
import { UserPlus, Mail, ShieldCheck, Trash2, Loader2, AlertCircle, Shield } from 'lucide-react';
import { authService } from '@/services/auth.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const UserManagement = () => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    roleType: 'COUNSELOR',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setFormError(null);
    try {
      await authService.register(formData);
      setShowCreateForm(false);
      setFormData({ name: '', email: '', password: '', roleType: 'COUNSELOR' });
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            User Management
          </h3>
          <p className="text-xs text-slate-500 font-medium">Create and manage platform access for your team</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <UserPlus size={18} />
          {showCreateForm ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all font-medium"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all font-medium"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Password</label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Assign Role</label>
                <select
                  value={formData.roleType}
                  onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all font-medium appearance-none"
                >
                  <option value="ADMIN" className="bg-slate-900">Admin</option>
                  <option value="MARKETING_TEAM" className="bg-slate-900">Marketing Team</option>
                  <option value="TELECALLER" className="bg-slate-900">Telecaller</option>
                  <option value="COUNSELOR" className="bg-slate-900">assignedTo</option>
                  <option value="FINANCE" className="bg-slate-900">Finance</option>
                </select>
              </div>
            </div>

            {formError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle size={18} />
                <p>{formError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all text-slate-400"
              >
                Cancel
              </button>
              <button
                disabled={createLoading}
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                {createLoading ? <Loader2 className="animate-spin" size={18} /> : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4">
              <th className="pb-4 pl-4 text-center w-16">User</th>
              <th className="pb-4">Name & Email</th>
              <th className="pb-4">Role</th>
              <th className="pb-4">Date Added</th>
              <th className="pb-4 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="group">
                <td className="bg-white/5 rounded-l-2xl py-4 pl-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-400">
                    {u.name[0]}
                  </div>
                </td>
                <td className="bg-white/5 py-4">
                  <div>
                    <p className="text-sm font-bold text-slate-200">{u.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{u.email}</p>
                  </div>
                </td>
                <td className="bg-white/5 py-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black border ${
                    u.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    u.role === 'COUNSELOR' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    u.role === 'FINANCE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    u.role === 'MARKETING_TEAM' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    <Shield size={10} />
                    {u.role.replace('_', ' ')}
                  </div>
                </td>
                <td className="bg-white/5 py-4">
                  <p className="text-[10px] text-slate-500 font-black">{new Date(u.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="bg-white/5 rounded-r-2xl py-4 pr-4 text-right">
                  <button className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
