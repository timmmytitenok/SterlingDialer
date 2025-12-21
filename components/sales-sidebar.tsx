'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';

interface SalesSidebarProps {
  salesPerson: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function SalesSidebar({ salesPerson }: SalesSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/sales/dashboard', icon: LayoutDashboard },
    { name: 'My Users', href: '/sales/users', icon: Users },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('sales_session');
    document.cookie = 'sales_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/sales/login');
  };

  const displayName = salesPerson.full_name || salesPerson.email?.split('@')[0] || 'Sales';

  return (
    <aside className="hidden md:flex w-64 bg-[#0A1129] border-r border-gray-800 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-green-500/20">
            $
          </div>
          <h1 className="text-2xl font-black text-white">Sales Portal</h1>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:scale-[1.02] hover:translate-x-1'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-8 py-4 w-full text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{salesPerson.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

