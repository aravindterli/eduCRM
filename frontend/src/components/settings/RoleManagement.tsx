'use client';

import React from 'react';
import { Shield, Check, Loader2, Save, AlertCircle, CheckCircle, Plus, Trash2, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const modules = [
  { key: 'leads', label: 'Leads', description: 'View, create, edit and delete leads' },
  { key: 'nurturing', label: 'Nurturing Pipeline', description: 'Manage kanban stages and move leads' },
  { key: 'reports', label: 'Reports & Analytics', description: 'View performance dashboards' },
  { key: 'marketing', label: 'Marketing Campaigns', description: 'Create and manage campaigns' },
  { key: 'finance', label: 'Finance', description: 'View fees, payments and invoices' },
  { key: 'settings', label: 'Settings', description: 'Modify organization settings' },
];

const actions = ['read', 'write', 'edit', 'delete'] as const;
type Action = typeof actions[number];

const roleTypes = [
  { value: 'ADMIN', label: 'Admin', description: 'Full access to all features and settings' },
  { value: 'STANDARDUSER', label: 'Standard User', description: 'Access controlled by permissions below' },
];

const roleTypeColors: Record<string, string> = {
  ADMIN: 'text-blue-700 bg-blue-50 border-blue-100',
  STANDARDUSER: 'text-slate-700 bg-slate-50 border-slate-100',
};

type CustomRole = {
  id: string;
  name: string;
  type: string;
  permissions: Record<string, Record<Action, boolean>>;
};

const defaultPermissions = () =>
  modules.reduce((acc, m) => {
    acc[m.key] = { read: false, write: false, edit: false, delete: false };
    return acc;
  }, {} as Record<string, Record<Action, boolean>>);

export const RoleManagement = () => {
  const { token } = useAuthStore();
  const [roles, setRoles] = React.useState<CustomRole[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [permissions, setPermissions] = React.useState(defaultPermissions());
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newRoleName, setNewRoleName] = React.useState('');
  const [newRoleType, setNewRoleType] = React.useState('STANDARDUSER');
  const [creating, setCreating] = React.useState(false);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${apiUrl}/auth/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRoles(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
        setPermissions({ ...defaultPermissions(), ...data[0].permissions });
      }
    } catch (e) {
      console.error('Failed to fetch roles', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchRoles(); }, []);

  const handleSelectRole = (role: CustomRole) => {
    setSelectedId(role.id);
    setPermissions({ ...defaultPermissions(), ...role.permissions });
    setMessage(null);
  };

  const togglePermission = (moduleKey: string, action: Action) => {
    setPermissions(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [action]: !prev[moduleKey][action],
        ...(action !== 'read' && !prev[moduleKey][action] ? { read: true } : {}),
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedId) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/auth/roles/${selectedId}/permissions`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      if (!res.ok) throw new Error();
      const updatedRole = await res.json();
      setRoles(roles.map(r => r.id === selectedId ? updatedRole : r));
      setMessage({ type: 'success', text: 'Permissions saved successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${apiUrl}/auth/roles`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName.trim(),
          type: newRoleType,
          permissions: defaultPermissions(),
        }),
      });
      if (!res.ok) throw new Error();
      const newRole = await res.json();
      setRoles([...roles, newRole]);
      setSelectedId(newRole.id);
      setPermissions(defaultPermissions());
      setShowCreateModal(false);
      setNewRoleName('');
      setNewRoleType('STANDARDUSER');
    } catch {
      setMessage({ type: 'error', text: 'Failed to create role.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Delete this role? Users assigned to this role will not be affected immediately.')) return;
    try {
      const res = await fetch(`${apiUrl}/auth/roles/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updatedRoles = roles.filter(r => r.id !== roleId);
      setRoles(updatedRoles);
      if (selectedId === roleId) {
        setSelectedId(updatedRoles[0]?.id || null);
        setPermissions(updatedRoles[0] ? { ...defaultPermissions(), ...updatedRoles[0].permissions } : defaultPermissions());
      }
    } catch {
      alert('Failed to delete role.');
    }
  };

  const selectedRole = roles.find(r => r.id === selectedId);

  if (loading) {
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
            Role Management
          </h3>
          <p className="text-[12px] text-[#999] mt-0.5">
            Create roles and configure permissions for each module. Admin always has full access.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-bold transition-all rounded-[8px]"
        >
          <Plus size={14} />
          Create Role
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-black/10 text-center rounded-[16px] bg-[#F9F7F4]">
          <Shield size={32} className="text-[#888] mb-3" />
          <p className="text-[#1A1A1A] font-semibold text-[14px]">No Custom Roles Yet</p>
          <p className="text-[#999] text-xs mt-1">Click "Create Role" to add your first role</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Role List Sidebar */}
          <div className="w-full lg:w-48 shrink-0 space-y-1">
            <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2 px-2">Roles</p>
            <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {roles.map(role => (
                <div key={role.id} className="flex items-center group w-full shrink-0 lg:shrink">
                  <button
                    onClick={() => handleSelectRole(role)}
                    className={`flex-1 text-left px-3 py-2.5 text-xs font-semibold transition-all flex items-center gap-2 border rounded-[8px] ${selectedId === role.id
                        ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-sm'
                        : 'border-transparent text-[#777] hover:bg-black/5 hover:text-[#1A1A1A]'
                      }`}
                  >
                    <Shield size={12} className={selectedId === role.id ? 'text-white' : 'text-[#777]'} />
                    <div className="min-w-0">
                      <p className="truncate">{role.name}</p>
                      {role.type && (
                        <p className={`text-[8px] font-bold uppercase mt-0.5 ${selectedId === role.id ? 'text-white/70' : 'text-[#888]'}`}>
                          {roleTypes.find(t => t.value === role.type)?.label || role.type}
                        </p>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-[#777] hover:text-red-600 hover:bg-red-50 rounded-[6px] transition-all ml-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Permission Matrix */}
          {selectedRole && (
            <div className="flex-1 min-w-0 space-y-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold border rounded-[6px] ${roleTypeColors[selectedRole.type] || 'text-[#1A1A1A] bg-[#F9F7F4] border-black/6'}`}>
                <Shield size={12} />
                {selectedRole.name}
                {selectedRole.type && (
                  <span className="opacity-60 font-normal">· {roleTypes.find(t => t.value === selectedRole.type)?.label || selectedRole.type}</span>
                )}
              </div>

              <div className="bg-white border border-black/6 rounded-[16px] overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_repeat(4,_80px)] bg-[#F9F7F4] px-4 py-3 border-b border-black/6">
                  <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Module</span>
                  {actions.map(a => (
                    <span key={a} className="text-[10px] font-bold text-[#888] uppercase tracking-wider text-center">{a}</span>
                  ))}
                </div>

                {/* Table Rows */}
                {modules.map((module, idx) => (
                  <div
                    key={module.key}
                    className={`grid grid-cols-[1fr_repeat(4,_80px)] px-4 py-3.5 items-center hover:bg-[#F9F7F4]/40 transition-colors ${idx < modules.length - 1 ? 'border-b border-black/5' : ''
                      }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">{module.label}</p>
                      <p className="text-[10px] text-[#777] mt-0.5">{module.description}</p>
                    </div>
                    {actions.map(action => {
                      const enabled = permissions[module.key]?.[action] ?? false;
                      return (
                        <div key={action} className="flex justify-center">
                          <button
                            onClick={() => togglePermission(module.key, action)}
                            className={`w-7 h-7 flex items-center justify-center border transition-all rounded-[8px] ${enabled
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-[#F9F7F4] border-black/8 text-transparent hover:border-black/25'
                              }`}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                {message ? (
                  <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-[8px] border ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {message.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                    {message.text}
                  </div>
                ) : <div />}
                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-50 text-white text-xs font-bold transition-all rounded-[8px] shadow-sm ml-auto"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Permissions
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-black/8 w-96 shadow-2xl rounded-[16px] overflow-hidden text-[#1A1A1A] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-[#F9F7F4]">
              <h3 className="font-bold text-sm text-[#1A1A1A]">Create New Role</h3>
              <button onClick={() => { setShowCreateModal(false); setNewRoleName(''); }} className="text-[#888] hover:text-[#1A1A1A] p-1 rounded-full hover:bg-black/5 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Role Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="e.g. Sales Manager, Support Agent..."
                  className="mt-1.5 w-full px-3 py-2.5 bg-[#F9F7F4] border border-black/8 text-sm outline-none focus:border-black/20 rounded-[8px] transition-all text-[#1A1A1A]"
                  onKeyDown={e => e.key === 'Enter' && handleCreateRole()}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Role Type</label>
                <p className="text-[9px] text-[#999] mt-0.5 mb-2">Determines backend access level</p>
                <div className="space-y-2">
                  {roleTypes.map(rt => (
                    <button
                      key={rt.value}
                      type="button"
                      onClick={() => setNewRoleType(rt.value)}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 border text-left transition-all rounded-[8px] ${newRoleType === rt.value
                          ? 'bg-white border-[#1A1A1A] text-[#1A1A1A] shadow-sm'
                          : 'bg-[#F9F7F4] border-black/8 text-[#777] hover:bg-black/5'
                        }`}
                    >
                      <div className={`w-4 h-4 mt-0.5 border rounded-full flex items-center justify-center shrink-0 ${newRoleType === rt.value ? 'border-[#1A1A1A]' : 'border-black/20'
                        }`}>
                        {newRoleType === rt.value && <div className="w-2 h-2 bg-[#1A1A1A] rounded-full" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{rt.label}</p>
                        <p className="text-[10px] opacity-60 mt-0.5 leading-normal">{rt.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-black/5 bg-[#F9F7F4]/30">
              <button
                onClick={() => { setShowCreateModal(false); setNewRoleName(''); }}
                className="px-4 py-2 text-xs font-semibold text-[#777] hover:bg-black/5 transition-all rounded-[8px]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={creating || !newRoleName.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-50 text-white text-xs font-bold transition-all rounded-[8px]"
              >
                {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
;
