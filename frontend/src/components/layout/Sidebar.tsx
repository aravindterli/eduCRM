import React from 'react';
import { LayoutDashboard, Users, FileText, CreditCard, Calendar, BarChart3, Settings, LogOut, Megaphone, Book, Video, MessageSquare, CalendarClock, Send, Filter, Building, Layout, ChevronLeft, ChevronRight, Plug, Folder } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['SUPERADMIN', 'ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR', 'FINANCE'] },

  // Superadmin Exclusive Sections
  { icon: Building, label: 'Tenant Directory', href: '/superadmin/tenants', roles: ['SUPERADMIN'] },
  { icon: Users, label: 'Global Leads', href: '/superadmin/leads', roles: ['SUPERADMIN'] },
  { icon: Layout, label: 'Form Builder', href: '/superadmin/forms', roles: ['SUPERADMIN'] },
  { icon: BarChart3, label: 'Platform Analytics', href: '/superadmin/analytics', roles: ['SUPERADMIN'] },
  { icon: CreditCard, label: 'Billing & Revenue', href: '/superadmin/billing', roles: ['SUPERADMIN'] },
  { icon: Plug, label: 'Connectors', href: '/superadmin/connectors', roles: ['SUPERADMIN'] },

  // Tenant Operations
  { icon: Megaphone, label: 'Marketing', href: '/marketing', roles: ['ADMIN', 'MARKETING_TEAM'], permissionModule: 'marketing' },
  { icon: Users, label: 'Leads', href: '/leads', roles: ['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR'], permissionModule: 'leads' },
  { icon: Filter, label: 'Nurturing', href: '/leads/nurturing', roles: ['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR'], permissionModule: 'nurturing' },
  { icon: CalendarClock, label: 'Meetings', href: '/follow-ups', roles: ['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR'], permissionModule: 'leads' },
  { icon: Calendar, label: 'Counseling', href: '/counseling', roles: ['ADMIN', 'TELECALLER', 'COUNSELOR'], sectorLabels: { REAL_ESTATE: 'Site Visits', HEALTHCARE: 'Consultations' }, permissionModule: 'leads' },
  { icon: FileText, label: 'Applications', href: '/applications', roles: ['ADMIN', 'COUNSELOR'], sectorLabels: { REAL_ESTATE: 'Bookings' }, permissionModule: 'leads' },
  { icon: Folder, label: 'Documents', href: '/documents', roles: ['SUPERADMIN', 'ADMIN', 'COUNSELOR'], permissionModule: 'leads' },
  { icon: CreditCard, label: 'Finances', href: '/finances', roles: ['ADMIN', 'FINANCE'], permissionModule: 'finance' },
  { icon: Book, label: 'Programs', href: '/programs', roles: ['ADMIN'], sectorLabels: { REAL_ESTATE: 'Properties', HEALTHCARE: 'Medical Services', GENERIC: 'Offerings' }, permissionModule: 'settings' },
  { icon: BarChart3, label: 'Reports', href: '/reports', roles: ['ADMIN', 'MARKETING_TEAM', 'FINANCE'], permissionModule: 'reports' },
  { icon: Video, label: 'Webinars', href: '/webinars', roles: ['ADMIN', 'MARKETING_TEAM'], hiddenSectors: ['REAL_ESTATE'], permissionModule: 'marketing' },
  { icon: MessageSquare, label: 'Templates', href: '/settings/templates', roles: ['ADMIN', 'MARKETING_TEAM', 'COUNSELOR'], permissionModule: 'settings' },
  { icon: Send, label: 'Bulk Broadcast', href: '/broadcast', roles: ['ADMIN', 'MARKETING_TEAM', 'COUNSELOR'], permissionModule: 'marketing' },
  { icon: Plug, label: 'Connectors', href: '/settings?tab=connectors', roles: ['ADMIN'], permissionModule: 'settings' },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar = ({ isCollapsed = false, onToggle }: SidebarProps) => {
  const { user, logout, hasPermission } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const filteredItems = sidebarItems.filter(item => {
    // 1. Sector matching
    const sectorMatch = !(item as any).hiddenSectors || !(item as any).hiddenSectors.includes(user?.sector);
    if (!sectorMatch) return false;

    // 2. Role matching
    let roleMatch = false;
    if (user?.role) {
      if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') {
        roleMatch = !item.roles || item.roles.includes(user.role);
      } else if (user.role === 'STANDARDUSER') {
        roleMatch = !item.roles || item.roles.some(r =>
          ['STANDARDUSER', 'STANDARD', 'COUNSELOR', 'TELECALLER', 'MARKETING_TEAM', 'FINANCE'].includes(r)
        );
      } else {
        roleMatch = !item.roles || item.roles.includes(user.role);
      }
    }
    if (!roleMatch) return false;

    // 3. Dynamic permissions matching for STANDARDUSER
    if (user?.role === 'STANDARDUSER' && (item as any).permissionModule) {
      return hasPermission((item as any).permissionModule, 'read');
    }

    return true;
  });

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-white border-r border-border flex flex-col z-50 shadow-[4px_0_24px_-4px_rgba(26,26,26,0.02)]">
      {/* squircle logo */}
      <div className="p-4 flex items-center justify-center border-b border-border h-20 shrink-0">
        <div className="w-12 h-12 bg-[#1A1A1A] rounded-[16px] flex items-center justify-center text-white font-bold text-lg shadow-sm">
          P
        </div>
      </div>

      {/* icon-only navigation with small labels */}
      <nav className="flex-1 py-6 space-y-4 overflow-y-auto scrollbar-hide flex flex-col items-center w-full">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          const label = (item as any).sectorLabels?.[user?.sector || ''] || item.label;
          return (
            <div key={item.label} className="relative w-full flex flex-col items-center justify-center">
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-[#1A1A1A] rounded-r-md" />
              )}
              <Link
                href={item.href}
                className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all duration-200 group ${isActive
                  ? 'bg-[#F5F1EB] text-[#1A1A1A] shadow-sm'
                  : 'text-slate-400 hover:bg-[#1A1A1A]/5 hover:text-[#1A1A1A]'
                  }`}
                title={label}
              >
                <item.icon size={20} className="transition-transform duration-200 group-hover:scale-105 text-black" />
              </Link>
              <span className={`text-[8px] font-bold mt-0.5 text-center truncate w-full px-1.5 tracking-tight uppercase ${isActive ? 'text-[#1A1A1A]' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </nav>

      {/* footer settings / logout with small labels */}
      <div className="p-4 border-t border-border flex flex-col items-center gap-4 shrink-0 w-full">
        <div className="relative w-full flex flex-col items-center justify-center">
          {pathname === '/settings' && (
            <div className="absolute left-0 w-1 h-8 bg-[#1A1A1A] rounded-r-md" />
          )}
          <Link
            href="/settings"
            className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all duration-200 group ${pathname === '/settings'
              ? 'bg-[#F5F1EB] text-[#1A1A1A] shadow-sm'
              : 'text-slate-400 hover:bg-[#1A1A1A]/5 hover:text-[#1A1A1A]'
              }`}
            title="Settings"
          >
            <Settings size={20} className={pathname === '/settings' ? '' : 'group-hover:rotate-45 transition-transform duration-300 text-black'} />
          </Link>
          {/* <span className={`text-[8px] font-bold mt-0.5 text-center truncate w-full px-1.5 tracking-tight uppercase ${pathname === '/settings' ? 'text-[#1A1A1A]' : 'text-slate-400'}`}>
            Settings
          </span> */}
        </div>
        <div className="w-full flex flex-col items-center justify-center">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200 group"
            title="Logout"
          >
            <LogOut size={20} className="group-hover:scale-105 transition-transform duration-200" />
          </button>
          <span className="text-[8px] font-bold mt-0.5 text-red-500 text-center truncate w-full px-1.5 tracking-tight uppercase">
            Logout
          </span>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white border border-black/8 rounded-[16px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-md font-bold mb-1 text-[#1A1A1A] tracking-tight">Are You Sure?</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">
              Do You Really Want to Log Out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-[8px] text-xs font-bold bg-[#F9F7F4] border border-black/5 hover:bg-black/5 text-[#1A1A1A] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logout();
                  router.push('/auth/login');
                }}
                className="flex-1 px-4 py-2.5 rounded-[8px] text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
