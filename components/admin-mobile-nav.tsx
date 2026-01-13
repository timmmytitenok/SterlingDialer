'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function AdminMobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/signup');
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A1129]/90 backdrop-blur-xl border-t border-purple-500/20 z-50">
      <div className="flex items-center justify-around">
        {/* Sterling Stats - Only option on mobile */}
        <Link
          href="/admin/sterling-stats"
          className={`flex flex-col items-center gap-1 py-4 px-6 flex-1 ${
            pathname === '/admin/sterling-stats'
              ? 'text-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-xs font-medium">Sterling Stats</span>
        </Link>
        
        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-1 py-4 px-6 flex-1 text-red-400 hover:text-red-300"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}

