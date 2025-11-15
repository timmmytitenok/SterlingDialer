'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, CreditCard, Gift, Wallet, Sparkles } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';
import { useEffect, useState } from 'react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [subscriptionTier, setSubscriptionTier] = useState<string>('none'); // Default to 'none' instead of null

  // Check user's subscription tier silently in background
  useEffect(() => {
    const checkSubscriptionTier = async () => {
      try {
        const response = await fetch('/api/balance/get');
        const data = await response.json();
        
        // Get subscription tier from the response (API returns subscription_tier in snake_case)
        if (data.subscription_tier) {
          setSubscriptionTier(data.subscription_tier);
          console.log('✅ User subscription tier:', data.subscription_tier);
        } else {
          setSubscriptionTier('none');
        }
      } catch (error) {
        console.error('Error checking subscription tier:', error);
        setSubscriptionTier('none');
      }
    };

    checkSubscriptionTier();
  }, []);

  const baseNav = [
    { name: 'Profile', href: '/dashboard/settings/profile', icon: User },
    { name: 'Billing', href: '/dashboard/settings/billing', icon: CreditCard },
    { name: 'Balance', href: '/dashboard/settings/balance', icon: Wallet },
    { name: 'Dialer', href: '/dashboard/settings/dialer-automation', icon: Sparkles },
  ];

  // Only add Referrals if user is on FREE TRIAL
  const settingsNav = subscriptionTier === 'free_trial'
    ? [...baseNav, { name: 'Referrals', href: '/dashboard/settings/referrals', icon: Gift }]
    : baseNav;

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '700ms' }}></div>
        <div className="absolute w-96 h-96 bg-pink-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '1000ms' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none"></div>

      <div className="flex min-h-screen relative z-10">
        {/* Settings Sidebar - Hidden on Mobile */}
        <aside className="hidden md:block w-72 border-r border-gray-800 bg-[#0A1129]/80 backdrop-blur-sm p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Settings</h1>
            <p className="text-gray-400 text-sm">Manage your account</p>
          </div>
          
          <nav className="space-y-2">
            {settingsNav.map((item) => {
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
        </aside>

        {/* Settings Content - Full width on mobile */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300 ease-out">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

