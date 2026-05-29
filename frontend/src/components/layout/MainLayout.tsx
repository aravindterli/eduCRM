'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X, ShieldAlert, Settings, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useThemeStore } from '@/store/useThemeStore';
import { NotificationBell } from '../notifications/NotificationBell';
import { useNotificationStore } from '@/store/useNotificationStore';

const routeRoles: Record<string, string[]> = {
  '/leads': ['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR'],
  '/counseling': ['ADMIN', 'TELECALLER', 'COUNSELOR'],
  '/applications': ['ADMIN', 'COUNSELOR'],
  '/finances': ['ADMIN', 'FINANCE'],
  '/programs': ['ADMIN'],
  '/reports': ['ADMIN', 'MARKETING_TEAM', 'FINANCE'],
  '/marketing': ['ADMIN', 'MARKETING_TEAM'],
};

const routePermissions: Record<string, string> = {
  '/leads': 'leads',
  '/leads/nurturing': 'nurturing',
  '/follow-ups': 'leads',
  '/counseling': 'leads',
  '/applications': 'leads',
  '/finances': 'finance',
  '/programs': 'settings',
  '/reports': 'reports',
  '/marketing': 'marketing',
  '/webinars': 'marketing',
  '/broadcast': 'marketing',
  '/settings/templates': 'settings',
};

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const { user, token, tokenExpired, setTokenExpired, logout, hasPermission } = useAuthStore();
  const { theme, accent, syncWithUser } = useThemeStore();
  const { init, disconnect } = useNotificationStore();
  const router = useRouter();
  const pathname = usePathname();
  const prevUserRef = React.useRef(user?.id);
  const [branding, setBranding] = React.useState<{ name: string; logo: string | null } | null>(null);

  React.useEffect(() => {
    setMounted(true);
    
    // Check mobile screen size on client side
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (user?.role !== 'SUPERADMIN' && user?.tenantId && token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/tenant/branding`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.name) {
            setBranding(data);
          }
        })
        .catch(err => console.error('Failed to fetch branding:', err));
    }
  }, [user, token]);

  React.useEffect(() => {
    if (user && user.id !== prevUserRef.current) {
      syncWithUser(user);
      prevUserRef.current = user.id;
    }
  }, [user, syncWithUser]);

  React.useEffect(() => {
    if (mounted && !token) {
      router.push('/auth/login');
    }

    if (mounted && token && user) {
      init(user.id, token);
    }

    return () => {
      disconnect();
    };
  }, [mounted, token, user, init, disconnect, router]);

  const isAuthorized = React.useMemo(() => {
    if (!user) return false;

    // SUPERADMIN and ADMIN bypass all permission checks
    if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') return true;

    // Check dynamic permissionModule for STANDARDUSER
    const requiredPermissionModule = routePermissions[pathname];
    if (user.role === 'STANDARDUSER' && requiredPermissionModule) {
      return hasPermission(requiredPermissionModule, 'read');
    }

    // Fallback to legacy role checks
    const allowed = routeRoles[pathname];
    if (!allowed) return true;

    if (user.role === 'STANDARDUSER') {
      return allowed.some(r =>
        ['STANDARDUSER', 'STANDARD', 'COUNSELOR', 'TELECALLER', 'MARKETING_TEAM', 'FINANCE'].includes(r)
      );
    }

    return allowed.includes(user.role);
  }, [user, pathname, hasPermission]);

  if (!mounted || (!token && pathname !== '/auth/login')) return null;

  return (
    <div className="min-h-screen bg-background text-foreground text-sm selection:bg-primary/30 transition-all duration-500">
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar isCollapsed={false} />
          </div>
        </div>
      )}

      {!isMobile && (
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      )}

      <main className="transition-all duration-300 lg:pl-20 min-h-screen">
        <header className="h-20 border-b border-border glass sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground"
              >
                <Menu size={24} />
              </button>
            )}
            {branding?.logo && (
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-border">
                <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <h2 className="text-sm lg:text-lg font-semibold text-foreground/80 truncate">
              {branding?.name || 'centraCRM'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <h2 className="text-sm lg:text-base font-medium text-foreground/70 hidden md:block">
              Welcome back, {user?.name || 'User'}
            </h2>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Link
                href="/settings"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 border border-white/20 shadow-lg shadow-primary/10 flex items-center justify-center hover:scale-110 transition-transform group cursor-pointer"
                title="Profile Settings"
              >
                <span className="text-xs font-bold text-primary-foreground group-hover:hidden">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </span>
                <Settings size={14} className="text-primary-foreground hidden group-hover:block animate-spin-slow" />
              </Link>
            </div>
          </div>
        </header>
        {user?.subscriptionStatus && user.subscriptionStatus !== 'ACTIVE' && user.role !== 'SUPERADMIN' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 p-3 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <ShieldAlert size={14} /> Account is inactive. Read-only mode active.
          </div>
        )}
        <div className="p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isAuthorized ? children : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive mb-6">
                <ShieldAlert size={40} />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>
              <p className="text-muted-foreground max-w-sm">You don't have the necessary permissions to view this section. Please contact your administrator if you believe this is an error.</p>
              <button
                onClick={() => router.push('/')}
                className="mt-8 bg-white/5 hover:bg-white/10 px-8 py-3 rounded-2xl text-sm font-bold transition-all border border-border"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Mobile Floating Action Button */}
        {isMobile && (
          <button
            onClick={() => router.push('/leads?create=true')}
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-xl shadow-primary/40 flex items-center justify-center text-primary-foreground active:scale-95 transition-all z-40"
          >
            <Plus size={28} />
          </button>
        )}
      </main>

    </div>
  );
};
