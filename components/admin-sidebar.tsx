'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  LogOut,
  DollarSign,
  Gift,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const mainNavigation = [
    { name: 'My Revenue', href: '/admin/my-revenue', icon: DollarSign },
    { name: 'Sterling Stats', href: '/admin/sterling-stats', icon: TrendingUp },
    { name: 'User Management', href: '/admin/user-management', icon: Users },
    { name: 'Sales Team', href: '/admin/sales-team', icon: Gift },
    // { name: 'Affiliate Program', href: '/admin/affiliate-program', icon: Gift }, // Hidden for now
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/signup');
  };

  return (
    <aside className="hidden md:flex w-64 bg-[#0A1129] border-r border-gray-800 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-xl font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Sterling Dialer</h1>
            <p className="text-xs text-purple-400">Admin Panel</p>
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
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:scale-[1.02] hover:translate-x-1'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out at Bottom */}
      <div className="border-t border-gray-800 p-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-red-400 hover:bg-red-900/20 hover:text-red-300 border border-transparent hover:border-red-500/30"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
