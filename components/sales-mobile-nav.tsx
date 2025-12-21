'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, LogOut, DollarSign } from 'lucide-react';

interface SalesMobileNavProps {
  salesPerson: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function SalesMobileNav({ salesPerson }: SalesMobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('sales_session');
    document.cookie = 'sales_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/sales/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/sales/dashboard', icon: LayoutDashboard },
    { name: 'My Users', href: '/sales/users', icon: Users },
  ];

  return (
    <>
      {/* Top Header - Mobile Only */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A1129]/95 backdrop-blur-lg border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold">
              $
            </div>
            <span className="font-bold text-sm">Sales Portal</span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A1129]/95 backdrop-blur-lg border-t border-gray-800">
        <div className="flex items-center justify-around py-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-green-400'
                    : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

