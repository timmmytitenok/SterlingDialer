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

export function AdminMobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A1129] border-t border-gray-800 z-50">
      <div className="flex items-center justify-around">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 px-4 flex-1 ${
                isActive
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-1 py-3 px-4 flex-1 text-red-400 hover:text-red-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}

