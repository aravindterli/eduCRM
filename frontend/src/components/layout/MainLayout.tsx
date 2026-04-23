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
  '/leads': ['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'assignedTo'],
  '/counseling': ['ADMIN', 'TELECALLER', 'assignedTo'],
  '/applications': ['ADMIN', 'assignedTo'],
  '/finances': ['ADMIN', 'FINANCE'],
  '/programs': ['ADMIN'],
  '/reports': ['ADMIN', 'MARKETING_TEAM', 'FINANCE'],
  '/marketing': ['ADMIN', 'MARKETING_TEAM'],
};

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { user, token } = useAuthStore();
  const { theme, accent, syncWithUser } = useThemeStore();
  const { init, disconnect } = useNotificationStore();
  const router = useRouter();
  const pathname = usePathname();
  const prevUserRef = React.useRef(user?.id);

  React.useEffect(() => {
    setMounted(true);
    // ... SW registration ...
  }, []);

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

  const isAuthorized = !routeRoles[pathname] || (user && routeRoles[pathname].includes(user.role));

  const themeClass = mounted ? `theme-${theme}` : 'theme-ocean';
  const accentClass = mounted ? `accent-${accent}` : 'accent-blue';

  if (!mounted || (!token && pathname !== '/auth/login')) return null;

  return (
    <div className={`min-h-screen bg-background text-foreground selection:bg-primary/30 transition-all duration-500 ${themeClass} ${accentClass}`}>
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="relative w-64 h-full">
           <Sidebar />
        </div>
      </div>
 
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="lg:pl-64 min-h-screen">
        <header className="h-20 border-b border-border glass sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-muted-foreground"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-sm lg:text-lg font-semibold text-foreground/80 truncate max-w-[150px] lg:max-w-none">
              <span className="hidden sm:inline">Welcome back, </span>
              {user?.name || 'User'}
            </h2>
          </div>
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
        </header>
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
        <button 
          onClick={() => router.push('/leads?create=true')}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-xl shadow-primary/40 flex items-center justify-center text-primary-foreground active:scale-95 transition-all z-40"
        >
          <Plus size={28} />
        </button>
      </main>
    </div>
  );
};
