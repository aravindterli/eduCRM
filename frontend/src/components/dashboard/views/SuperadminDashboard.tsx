'use client';

import React from 'react';
import { Building2, Users, Layout, Activity, ArrowUpRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { superadminService } from '@/services/superadmin.service';

export const SuperadminDashboard = () => {
  const { user } = useAuthStore();
  const [tenants, setTenants] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  // Platform Control Center State
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [allowRegistrations, setAllowRegistrations] = React.useState(true);
  const [maxFreeUsers, setMaxFreeUsers] = React.useState(50);
  const [uploadLimit, setUploadLimit] = React.useState('50');

  // Load state safely on mount to avoid Next.js SSR hydration mismatch
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedMaint = localStorage.getItem('sa_maintenanceMode');
        if (storedMaint !== null) setMaintenanceMode(storedMaint === 'true');

        const storedReg = localStorage.getItem('sa_allowRegistrations');
        if (storedReg !== null) setAllowRegistrations(storedReg !== 'false');

        const storedMaxUsers = localStorage.getItem('sa_maxFreeUsers');
        if (storedMaxUsers !== null) setMaxFreeUsers(Number(storedMaxUsers));

        const storedLimit = localStorage.getItem('sa_uploadLimit');
        if (storedLimit !== null) setUploadLimit(storedLimit);
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('sa_maintenanceMode', String(maintenanceMode));
    } catch (e) {}
  }, [maintenanceMode]);

  React.useEffect(() => {
    try {
      localStorage.setItem('sa_allowRegistrations', String(allowRegistrations));
    } catch (e) {}
  }, [allowRegistrations]);

  React.useEffect(() => {
    try {
      localStorage.setItem('sa_maxFreeUsers', String(maxFreeUsers));
    } catch (e) {}
  }, [maxFreeUsers]);

  React.useEffect(() => {
    try {
      localStorage.setItem('sa_uploadLimit', uploadLimit);
    } catch (e) {}
  }, [uploadLimit]);

  // Sector Distribution Computation
  const sectors = ['EDUCATION', 'REAL_ESTATE', 'HEALTHCARE', 'GENERIC'];
  const totalCount = tenants.length;

  const sectorCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      EDUCATION: 0,
      REAL_ESTATE: 0,
      HEALTHCARE: 0,
      GENERIC: 0
    };
    tenants.forEach(t => {
      const sec = t.sector || 'GENERIC';
      if (counts[sec] !== undefined) {
        counts[sec]++;
      } else {
        counts.GENERIC++;
      }
    });
    return counts;
  }, [tenants]);

  const fetchData = async () => {
    try {
      const [tenantsData, statsData] = await Promise.all([
        superadminService.getTenants(),
        superadminService.getStats()
      ]);
      setTenants(tenantsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch superadmin data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-black/5 border-t-black rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Accessing System Core...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Tenants', value: stats?.totalTenants || 0, icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Active Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Global Leads', value: stats?.totalLeads || 0, icon: Layout, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'System Health', value: '99.9%', icon: Activity, color: 'text-amber-600 bg-amber-50 border-amber-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-black/6 p-6 rounded-[16px] group hover:border-black/15 transition-all duration-300 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-[8px] border ${stat.color} transition-all duration-300 group-hover:scale-105`}>
                <stat.icon size={18} className={i === 3 ? 'animate-pulse' : ''} />
              </div>
              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-[6px]">
                <ArrowUpRight size={10} /> +12%
              </span>
            </div>
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.15em] mb-1 group-hover:text-slate-600 transition-colors">{stat.label}</p>
            <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tight font-mono">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Platform Controls and Sector Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Control Center */}
        <div className="bg-white border border-black/6 p-6 rounded-[16px] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1A1A1A] tracking-tight mb-1">Platform Control Center</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Configure Live System Parameters and Restrictions</p>
            
            <div className="space-y-4">
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#F9F7F4] border border-black/5">
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Maintenance Mode</p>
                  <p className="text-[9px] text-slate-400 font-semibold">Offline standard user access</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 outline-none ${
                    maintenanceMode ? 'bg-[#1A1A1A]' : 'bg-black/10'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                      maintenanceMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Allow New Registrations */}
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#F9F7F4] border border-black/5">
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Allow Tenant Registrations</p>
                  <p className="text-[9px] text-slate-400 font-semibold">Allow new organizations to onboard</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowRegistrations(!allowRegistrations)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 outline-none ${
                    allowRegistrations ? 'bg-[#1A1A1A]' : 'bg-black/10'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                      allowRegistrations ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Grid for Numeric limit inputs */}
              <div className="grid grid-cols-2 gap-4">
                {/* Max Free Tier Users */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Free Users</label>
                  <input
                    type="number"
                    value={maxFreeUsers}
                    onChange={(e) => setMaxFreeUsers(Number(e.target.value))}
                    className="w-full mt-1.5 bg-[#F9F7F4] border border-black/8 rounded-[8px] py-2 px-3 text-xs outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] font-bold"
                  />
                </div>
                
                {/* File Upload Limit */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Limit (MB)</label>
                  <select
                    value={uploadLimit}
                    onChange={(e) => setUploadLimit(e.target.value)}
                    className="w-full mt-1.5 bg-[#F9F7F4] border border-black/8 rounded-[8px] py-2 px-3 text-xs outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] font-bold cursor-pointer"
                  >
                    <option value="10">10 MB</option>
                    <option value="25">25 MB</option>
                    <option value="50">50 MB</option>
                    <option value="100">100 MB</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {maintenanceMode && (
            <div className="mt-4 p-3 rounded-[8px] bg-red-50 border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider">System is active under maintenance mode</p>
            </div>
          )}
        </div>

        {/* Sector Distribution */}
        <div className="bg-white border border-black/6 p-6 rounded-[16px] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1A1A1A] tracking-tight mb-1">Sector Distribution</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Tenant Industry Verticals Partition Analysis</p>
            
            <div className="space-y-4">
              {sectors.map((sec) => {
                const count = sectorCounts[sec] || 0;
                const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                
                let barColor = 'bg-[#1A1A1A]';
                if (sec === 'EDUCATION') barColor = 'bg-blue-600';
                if (sec === 'REAL_ESTATE') barColor = 'bg-emerald-600';
                if (sec === 'HEALTHCARE') barColor = 'bg-purple-600';
                if (sec === 'GENERIC') barColor = 'bg-amber-600';

                return (
                  <div key={sec} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#1A1A1A] tracking-tight">{sec.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{count} {count === 1 ? 'tenant' : 'tenants'}</span>
                        <span className="font-mono font-bold text-[#1A1A1A]">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#F5F1EB] rounded-full overflow-hidden border border-black/5">
                      <div
                        className={`h-full ${barColor} transition-all duration-1000`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-[8px] bg-[#F9F7F4] border border-black/5 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Aggregated Tenant Pool</span>
            <span className="text-[#1A1A1A] font-black">{totalCount} total</span>
          </div>
        </div>
      </div>


    </div>
  );
};
