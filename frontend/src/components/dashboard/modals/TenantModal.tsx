'use client';

import React from 'react';
import { X, Building2, Globe, Layout, Send } from 'lucide-react';
import { superadminService } from '@/services/superadmin.service';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TenantModal = ({ isOpen, onClose, onSuccess }: TenantModalProps) => {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    sector: 'EDUCATION',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await superadminService.createTenant(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create tenant:', error);
      alert('Failed to create tenant. Please check if the slug/email is unique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl bg-white border border-black/8 rounded-[16px] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-black/6 flex justify-between items-center bg-[#F9F7F4]">
          <div>
            <h2 className="text-md font-bold text-[#1A1A1A] tracking-tight">Onboard New Tenant</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Setup Organization and Initial Admin</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-black/5 rounded-[8px] text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto bg-white">
          {/* Organization Info */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider border-b border-black/5 pb-2">Organization Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Organization Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Centra University"
                    className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] py-3 pl-12 pr-6 text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] font-semibold placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Primary Sector</label>
                <div className="relative">
                  <Layout className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="appearance-none w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] py-3 pl-12 pr-6 text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] font-semibold cursor-pointer"
                  >
                    <option value="EDUCATION">Education</option>
                    <option value="REAL_ESTATE">Real Estate</option>
                    <option value="HEALTHCARE">Healthcare</option>
                    <option value="GENERIC">Generic</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">URL Slug</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="Ex: centra-edu"
                  className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] py-3 pl-12 pr-6 text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] font-semibold placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Admin User Info */}
          <div className="space-y-4 pt-4 border-t border-black/5">
            <h3 className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider border-b border-black/5 pb-2">Administrative User</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Admin Full Name</label>
                <input
                  required
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  placeholder="Ex: John Doe"
                  className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] py-3 px-4 text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] font-semibold placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Admin Email</label>
                  <input
                    required
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@tenant.com"
                    className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] py-3 px-4 text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] font-semibold placeholder-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Initial Password</label>
                  <input
                    required
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] py-3 px-4 text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] font-semibold placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-black/6 bg-[#F9F7F4] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-black/5 transition-all">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-black hover:bg-black/90 text-[#F5F1EB] px-8 py-2.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? 'Registering...' : (
              <>
                <Send size={12} /> Register Tenant
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
