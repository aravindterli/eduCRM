import React from 'react';
import { LayoutDashboard, Users, FileText, CreditCard, Calendar, BarChart3, Settings, LogOut, Megaphone, Book, Video, MessageSquare, CalendarClock, Send, Filter } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR', 'FINANCE'] },
  { icon: Users, label: 'Leads', href: '/leads', roles: ['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR'] },
  { icon: Filter, label: 'Nurturing', href: '/leads/nurturing', roles: ['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR'] },
  { icon: CalendarClock, label: 'Follow-ups', href: '/follow-ups', roles: ['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR'] },
  { icon: Calendar, label: 'Counseling', href: '/counseling', roles: ['ADMIN', 'TELECALLER', 'COUNSELOR'] },
  { icon: FileText, label: 'Applications', href: '/applications', roles: ['ADMIN', 'COUNSELOR'] },
  { icon: CreditCard, label: 'Finances', href: '/finances', roles: ['ADMIN', 'FINANCE'] },
  { icon: Book, label: 'Programs', href: '/programs', roles: ['ADMIN'] },
  { icon: BarChart3, label: 'Reports', href: '/reports', roles: ['ADMIN', 'MARKETING_TEAM', 'FINANCE'] },
  { icon: Megaphone, label: 'Marketing', href: '/marketing', roles: ['ADMIN', 'MARKETING_TEAM'] },
  { icon: Video, label: 'Webinars', href: '/webinars', roles: ['ADMIN', 'MARKETING_TEAM'] },
  { icon: MessageSquare, label: 'Templates', href: '/settings/templates', roles: ['ADMIN', 'MARKETING_TEAM', 'COUNSELOR'] },
  { icon: Send, label: 'Bulk Broadcast', href: '/broadcast', roles: ['ADMIN', 'MARKETING_TEAM', 'COUNSELOR'] },
];

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const filteredItems = sidebarItems.filter(item =>
    !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-border flex flex-col z-50">
      <div className="p-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          CentraCRM
        </h1>
        <span className="text-xs text-muted-foreground">v1.0.0</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
            >
              <item.icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/settings"
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all group ${pathname === '/settings'
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
        >
          <Settings size={20} className={pathname === '/settings' ? '' : 'group-hover:rotate-45 transition-transform'} />
          <span className="font-medium">Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all hover:bg-destructive/10 text-muted-foreground hover:text-destructive group"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
