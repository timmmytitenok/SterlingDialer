'use client';

import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Sparkles, CalendarDays, Phone } from 'lucide-react';

interface DashboardSidebarProps {
  user: User;
  profile: any;
}

export function DashboardSidebar({ user, profile }: DashboardSidebarProps) {
  const pathname = usePathname();

  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Control Center', href: '/dashboard/ai-control', icon: Sparkles },
    { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarDays },
    { name: 'Activity Logs', href: '/dashboard/activity-logs', icon: Phone },
  ];

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <aside className="hidden md:flex w-64 bg-[#0A1129] border-r border-gray-800 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xl font-bold">
            SA
          </div>
          <div>
            <h1 className="text-lg font-bold">Sterling AI</h1>
            <p className="text-xs text-gray-400">Command Center</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {mainNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:scale-[1.02] hover:translate-x-1'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings at Bottom */}
      <div className="border-t border-gray-800">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-8 py-4 transition-all duration-200 ${
            pathname.startsWith('/dashboard/settings')
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:scale-[1.02] hover:translate-x-1'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-sm font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

