'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SalesSidebar } from '@/components/sales-sidebar';
import { Monitor, Smartphone, LogOut, TrendingUp, Copy, Check } from 'lucide-react';

interface SalesPerson {
  id: string;
  full_name: string;
  email: string;
  referral_code: string;
}

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [salesPerson, setSalesPerson] = useState<SalesPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Don't apply layout to login/signup pages or presentation
  const isAuthPage = pathname === '/sales/login' || pathname === '/sales/signup';
  const isPresentationPage = pathname === '/sales/presentation';

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    // For presentation page, still check auth but don't show sidebar
    if (isPresentationPage) {
      // Check session without sidebar layout
    }

    // Check for admin impersonation first
    const checkSession = async () => {
      try {
        const impersonateResponse = await fetch('/api/sales/check-impersonation');
        const impersonateData = await impersonateResponse.json();
        
        if (impersonateData.impersonating) {
          setSalesPerson({
            id: impersonateData.salesPersonId,
            full_name: impersonateData.salesPersonName,
            email: impersonateData.salesPersonEmail,
            referral_code: '',
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('No impersonation session');
      }

      // Normal session check
      const session = localStorage.getItem('sales_session');
      if (!session) {
        router.push('/sales/login');
        return;
      }

      try {
        const parsed = JSON.parse(session);
        setSalesPerson(parsed);
      } catch {
        router.push('/sales/login');
      }
      setLoading(false);
    };

    checkSession();
  }, [pathname, isAuthPage, router]);

  const handleSignOut = () => {
    localStorage.removeItem('sales_session');
    router.push('/sales/login');
  };

  const copyReferralLink = () => {
    if (!salesPerson?.referral_code) return;
    const link = `${window.location.origin}/signup?ref=${salesPerson.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // For auth pages, just render children without layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  // For presentation page, render fullscreen without sidebar (but still require auth)
  if (isPresentationPage && salesPerson) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1437] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!salesPerson) {
    return null;
  }

  // Mobile restriction screen
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#0B1437] text-white overflow-hidden relative">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-72 h-72 bg-green-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
          <div className="absolute w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '700ms' }}></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none"></div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800/50 bg-[#0B1437]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">Sales Portal</div>
                  <div className="text-xs text-gray-400">{salesPerson.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            {/* Icon */}
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-2 border-gray-600/30 flex items-center justify-center mb-4">
                <Smartphone className="w-12 h-12 text-gray-400" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border-4 border-[#0B1437]">
                <Monitor className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Message */}
            <h1 className="text-2xl font-bold text-white mb-3">
              Desktop Only
            </h1>
            <p className="text-gray-400 mb-8 max-w-xs leading-relaxed">
              The Sales Portal is optimized for desktop. Please access it from a computer for the best experience.
            </p>

            {/* Quick Stats */}
            <div className="w-full max-w-xs bg-gradient-to-br from-[#1A2647]/60 to-[#0F1629]/60 rounded-2xl p-5 border border-gray-700/30 mb-6">
              <div className="text-xs text-gray-400 uppercase font-bold mb-3">Quick Info</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Logged in as</span>
                  <span className="text-white font-semibold text-sm">{salesPerson.full_name}</span>
                </div>
                {salesPerson.referral_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Referral Code</span>
                    <span className="text-green-400 font-mono font-bold text-sm">{salesPerson.referral_code}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Copy Referral Link Button */}
            {salesPerson.referral_code && (
              <button
                onClick={copyReferralLink}
                className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-400 border border-green-500/30 rounded-xl font-semibold transition-all mb-4"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-5 h-5" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Referral Link
                  </>
                )}
              </button>
            )}

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-xl font-semibold transition-all border border-gray-700/30"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500">
              Open on a desktop browser to access the full Sales Portal
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0B1437] text-white overflow-hidden relative">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-green-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '700ms' }}></div>
        <div className="absolute w-96 h-96 bg-teal-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '1000ms' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none"></div>

      <SalesSidebar salesPerson={salesPerson} />
      <main className="flex-1 overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}

