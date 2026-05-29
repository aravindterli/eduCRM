'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { superadminService } from '@/services/superadmin.service';
import { TenantModal } from '@/components/dashboard/modals/TenantModal';
import { TenantConfigModal } from '@/components/dashboard/modals/TenantConfigModal';
import { Building2, Plus, Search, Send } from 'lucide-react';

export default function TenantDirectoryPage() {
  const [tenants, setTenants] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = React.useState(false);
  const [selectedTenantForConfig, setSelectedTenantForConfig] = React.useState<any>(null);

  const fetchData = async () => {
    try {
      const tenantsData = await superadminService.getTenants();
      setTenants(tenantsData);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (tenantId: string, newStatus: string) => {
    try {
      await superadminService.updateTenant(tenantId, { subscriptionStatus: newStatus });
      fetchData(); // refresh list
    } catch (error) {
      console.error('Failed to update tenant status:', error);
    }
  };

  const filteredTenants = React.useMemo(() => {
    return tenants.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sector.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tenants, searchQuery]);

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Tenant Directory</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Manage Platform Organizations and System Sectors
          </p>
        </div>

        {/* Tenant Directory Container */}
        <div className="bg-white border border-black/6 rounded-[16px] overflow-hidden hover:border-black/15 shadow-sm transition-all duration-300">
          <div className="p-6 border-b border-black/6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#F9F7F4]">
            <div>
              <h2 className="text-md font-bold text-[#1A1A1A] tracking-tight">Registered Organizations</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Active multi-tenant nodes inside Centra CRM
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Tenants..."
                  className="bg-white border border-black/10 rounded-[8px] py-2.5 pl-11 pr-6 text-xs outline-none focus:border-black transition-all w-full sm:w-64 text-[#1A1A1A] font-semibold placeholder-slate-400"
                />
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-black hover:bg-black/90 text-[#F5F1EB] px-6 py-2.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm"
              >
                <Plus size={16} /> New Tenant
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-black/5 border-t-black rounded-full animate-spin" />
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Loading Tenant Pool...</p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-20 bg-white">
              <Building2 className="mx-auto text-slate-300 mb-4" size={40} />
              <p className="text-xs font-bold text-[#1A1A1A]">No Organizations Found</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">
                Try adjusting your search query or create a new tenant
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F7F4] border-b border-black/6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-8 py-4 font-bold text-slate-500">Organization</th>
                    <th className="px-8 py-4 font-bold text-slate-500">Sector</th>
                    <th className="px-8 py-4 font-bold text-slate-500">Usage Status</th>
                    <th className="px-8 py-4 font-bold text-slate-500">Subscription</th>
                    <th className="px-8 py-4 font-bold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-xs font-semibold">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="group hover:bg-[#F9F7F4]/40 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[8px] bg-slate-50 border border-black/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <span className="text-[#1A1A1A] font-bold text-xs">{tenant.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1A1A1A]">{tenant.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">/{tenant.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[9px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-[8px] border border-black/10 uppercase tracking-wider">
                          {tenant.sector}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <p className="text-xs font-black text-[#1A1A1A]">{tenant._count?.users || 0}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Users</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-black text-[#1A1A1A]">{tenant._count?.leads || 0}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Leads</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {tenant.subscriptionStatus === 'ACTIVE' ? (
                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-[6px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-[6px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Suspended
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setSelectedTenantForConfig(tenant);
                              setIsConfigModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-500 transition-colors"
                          >
                            Configure
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(tenant.id, tenant.subscriptionStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${tenant.subscriptionStatus === 'ACTIVE' ? 'text-red-500 hover:text-red-400' : 'text-emerald-500 hover:text-emerald-400'
                              }`}
                          >
                            {tenant.subscriptionStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
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
      </div>

      {/* Onboarding and configuration Modals */}
      <TenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
      {selectedTenantForConfig && (
        <TenantConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => {
            setIsConfigModalOpen(false);
            setSelectedTenantForConfig(null);
          }}
          tenant={selectedTenantForConfig}
          onSuccess={fetchData}
        />
      )}
    </MainLayout>
  );
}
