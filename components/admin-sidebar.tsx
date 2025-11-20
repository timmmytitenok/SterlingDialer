'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  LogOut,
  DollarSign,
  Gift,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const mainNavigation = [
    { name: 'My Revenue', href: '/admin/my-revenue', icon: DollarSign },
    { name: 'User Management', href: '/admin/user-management', icon: Users },
    { name: 'Affiliate Program', href: '/admin/affiliate-program', icon: Gift },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/signup');
  };

  return (
    <aside className="hidden md:block w-full bg-[#0A1129] border-b border-gray-800">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xl font-bold">
            SA
          </div>
          <div>
            <h1 className="text-lg font-bold">Sterling AI</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>

        {/* Main Navigation - Horizontal */}
        <nav className="flex items-center gap-2">
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button - Top Right (Desktop Only) */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-5 py-3 rounded-lg transition-all duration-200 text-red-400 hover:bg-red-900/20 hover:text-red-300 border border-transparent hover:border-red-500/30 hover:scale-105"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

