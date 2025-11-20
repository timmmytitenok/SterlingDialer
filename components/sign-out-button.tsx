'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signup');
    router.refresh();
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleSignOut}
      className="w-full border-red-700/50 text-red-400 hover:text-red-300 hover:bg-red-900/20 hover:border-red-600/50 transition-colors flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </Button>
  );
}

