'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Sparkles, DollarSign, TrendingUp, HelpCircle, Mail, ChevronRight, Rocket, Scale, ArrowLeft, FileText, Shield, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function MobilePublicNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [legalOpen, setLegalOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const supabase = createClient();

  // Check auth state - only show dashboard if they have completed payment
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if they have completed payment and have stripe customer ID
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, has_active_subscription, stripe_customer_id, onboarding_all_complete')
            .eq('user_id', user.id)
            .single();
          
          // Only show dashboard if they have:
          // 1. Completed onboarding AND have stripe customer (payment method added)
          // 2. OR have an active subscription (already paying customers)
          const hasCompletedPayment = profile?.stripe_customer_id && profile?.onboarding_all_complete;
          const hasActiveSubscription = profile?.has_active_subscription === true;
          
          if (profile && (hasCompletedPayment || hasActiveSubscription)) {
            setUser(user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, has_active_subscription, stripe_customer_id, onboarding_all_complete')
          .eq('user_id', session.user.id)
          .single();
        
        // Only show dashboard if they have:
        // 1. Completed onboarding AND have stripe customer (payment method added)
        // 2. OR have an active subscription (already paying customers)
        const hasCompletedPayment = profile?.stripe_customer_id && profile?.onboarding_all_complete;
        const hasActiveSubscription = profile?.has_active_subscription === true;
        
        if (profile && (hasCompletedPayment || hasActiveSubscription)) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Handle scroll for header style and hide/show behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update scrolled state for styling
      setScrolled(currentScrollY > 20);
      
      // Hide/show logic
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past 100px -> hide
        setHidden(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up -> show
        setHidden(false);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset legal submenu when main menu closes
  useEffect(() => {
    if (!isOpen) {
      setLegalOpen(false);
    }
  }, [isOpen]);

  const navigation = [
    { name: 'Home', href: '/', icon: Sparkles },
    { name: 'Pricing', href: '/pricing', icon: DollarSign },
    { name: 'Demo', href: '/demo', icon: TrendingUp },
    // { name: 'Case Studies', href: '/case-studies', icon: TrendingUp }, // Hidden for now
    { name: 'FAQ', href: '/faq', icon: HelpCircle },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  return (
    <>
      {/* Mobile Header - Fixed */}
      <header 
        className={`lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          hidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        } ${
          scrolled 
            ? 'bg-[#0B1437]/80 backdrop-blur-xl border-b border-blue-500/20 shadow-2xl shadow-blue-500/10' 
            : 'bg-gradient-to-b from-[#0B1437]/60 to-transparent backdrop-blur-md'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          {/* Logo - Bigger */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
                <span className="text-lg font-bold text-white">SA</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-30 blur-md transition-all duration-300" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Sterling AI</span>
          </Link>

          {/* Hamburger Button - Bigger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-blue-500/20"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span 
                className={`block h-0.5 w-full bg-blue-400 rounded-full transition-all duration-300 ${
                  isOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span 
                className={`block h-0.5 w-full bg-purple-400 rounded-full transition-all duration-300 ${
                  isOpen ? 'opacity-0' : ''
                }`}
              />
              <span 
                className={`block h-0.5 w-full bg-pink-400 rounded-full transition-all duration-300 ${
                  isOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-full max-w-sm bg-gradient-to-br from-[#0A1129] via-[#0B1437] to-[#0A1129] border-l border-gray-800/50 z-50 transform transition-all duration-700 ${
          isOpen ? 'translate-x-0 scale-100 opacity-100 shadow-2xl' : 'translate-x-full scale-95 opacity-0'
        }`}
        style={{
          transitionTimingFunction: isOpen ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
          <div className="absolute w-64 h-64 bg-purple-500/10 rounded-full blur-3xl top-1/2 -right-32 animate-pulse" style={{ animationDelay: '700ms' }} />
          <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '1400ms' }} />
        </div>

        {/* Menu Content - Fully Scrollable */}
        <div className="relative h-full flex flex-col overflow-hidden">
          {/* Header - Fixed at top */}
          <div 
            className="flex-shrink-0 flex items-center justify-between p-5 border-b border-gray-800/50"
            style={{
              animation: isOpen ? 'fadeInDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none'
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">SA</span>
              </div>
              <span className="text-base font-bold text-white">Menu</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {/* Navigation Links - Sliding Panels */}
          <nav ref={navRef} className="py-4 px-3 relative">
            {/* Main Menu */}
            <div 
              className={`space-y-1 transition-all duration-400 ease-out ${
                legalOpen 
                  ? 'opacity-0 -translate-x-full absolute inset-x-3 top-4' 
                  : 'opacity-100 translate-x-0'
              }`}
            >
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/40 shadow-lg'
                        : 'bg-gray-800/20 border border-transparent hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 hover:border-blue-500/30'
                    }`}
                    style={{
                      animation: isOpen && !legalOpen ? `slideInRightBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both` : 'none'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30' 
                          : 'bg-gray-800/50 group-hover:bg-gradient-to-br group-hover:from-blue-500/20 group-hover:to-purple-600/20'
                      }`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-400'}`} />
                      </div>
                      <span className={`font-medium text-base ${
                        isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                      }`}>
                        {item.name}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                      isActive 
                        ? 'text-blue-400 translate-x-1' 
                        : 'text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1'
                    }`} />
                  </Link>
                );
              })}

              {/* Legal Button - Opens Submenu */}
              <button
                onClick={() => setLegalOpen(true)}
                className="group w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 bg-gray-800/20 border border-transparent hover:bg-gradient-to-r hover:from-amber-600/20 hover:to-orange-600/20 hover:border-amber-500/30 mt-2"
                style={{
                  animation: isOpen && !legalOpen ? `slideInRightBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${navigation.length * 0.08}s both` : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 bg-gray-800/50 group-hover:bg-gradient-to-br group-hover:from-amber-500/20 group-hover:to-orange-600/20">
                    <Scale className="w-4 h-4 text-gray-400 group-hover:text-amber-400" />
                  </div>
                  <span className="font-medium text-base text-gray-300 group-hover:text-white">
                    Legal
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300" />
              </button>
            </div>

            {/* Legal Submenu - Full Size Buttons */}
            <div 
              className={`space-y-1 transition-all duration-400 ease-out ${
                legalOpen 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-full absolute inset-x-3 top-4'
              }`}
            >
              {/* Back Button */}
              <button
                onClick={() => setLegalOpen(false)}
                className="group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 bg-gray-800/30 border border-gray-700/50 hover:bg-gray-800/50 hover:border-gray-600/50 mb-3"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-800/50 group-hover:bg-gray-700/50 transition-all duration-300">
                  <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </div>
                <span className="font-medium text-base text-gray-400 group-hover:text-white">
                  Back to Menu
                </span>
              </button>

              {/* Legal Title */}
              <div className="px-4 py-2 mb-1">
                <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">Legal Pages</span>
              </div>

              {/* Terms of Service */}
              <Link
                href="/terms"
                onClick={() => setIsOpen(false)}
                className="group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 bg-gray-800/20 border border-transparent hover:bg-gradient-to-r hover:from-amber-600/20 hover:to-orange-600/20 hover:border-amber-500/30"
                style={{
                  animation: legalOpen ? 'slideInRightBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both' : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-800/50 group-hover:bg-gradient-to-br group-hover:from-amber-500/20 group-hover:to-orange-600/20 transition-all duration-300">
                    <FileText className="w-4 h-4 text-gray-400 group-hover:text-amber-400" />
                  </div>
                  <span className="font-medium text-base text-gray-300 group-hover:text-white">
                    Terms of Service
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300" />
              </Link>

              {/* Privacy Policy */}
              <Link
                href="/privacy"
                onClick={() => setIsOpen(false)}
                className="group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 bg-gray-800/20 border border-transparent hover:bg-gradient-to-r hover:from-amber-600/20 hover:to-orange-600/20 hover:border-amber-500/30"
                style={{
                  animation: legalOpen ? 'slideInRightBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-800/50 group-hover:bg-gradient-to-br group-hover:from-amber-500/20 group-hover:to-orange-600/20 transition-all duration-300">
                    <Shield className="w-4 h-4 text-gray-400 group-hover:text-amber-400" />
                  </div>
                  <span className="font-medium text-base text-gray-300 group-hover:text-white">
                    Privacy Policy
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300" />
              </Link>

              {/* Cancel & Refund */}
              <Link
                href="/refund-policy"
                onClick={() => setIsOpen(false)}
                className="group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 bg-gray-800/20 border border-transparent hover:bg-gradient-to-r hover:from-amber-600/20 hover:to-orange-600/20 hover:border-amber-500/30"
                style={{
                  animation: legalOpen ? 'slideInRightBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both' : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-800/50 group-hover:bg-gradient-to-br group-hover:from-amber-500/20 group-hover:to-orange-600/20 transition-all duration-300">
                    <RotateCcw className="w-4 h-4 text-gray-400 group-hover:text-amber-400" />
                  </div>
                  <span className="font-medium text-base text-gray-300 group-hover:text-white">
                    Cancel & Refund
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            </div>
          </nav>

          {/* CTA Section - Conditional - Now inside scrollable area */}
          <div 
            className="p-4 border-t border-gray-800/50 space-y-3"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {isLoading ? (
              // LOADING: Show skeleton
              <div className="space-y-3">
                <div className="h-20 bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl animate-pulse" />
                <div className="h-12 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl animate-pulse" />
                <div className="h-8 bg-gray-800/30 rounded-lg animate-pulse mx-auto w-48" />
              </div>
            ) : !user ? (
              // LOGGED OUT: Show trial banner + Start Free Trial + Sign In
              <>
                {/* Free Trial Banner */}
                <div 
                  className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-3 text-center"
                  style={{
                    animation: isOpen ? 'fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both' : 'none'
                  }}
                >
                  <p className="text-xs text-green-400 font-semibold mb-1">🚀 30-DAY FREE TRIAL</p>
                  <p className="text-sm text-white font-bold mb-1">$499/month after trial</p>
                  <p className="text-xs text-gray-400">+ $0.30/min for calls</p>
                </div>

                {/* Start Free Trial Button */}
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="block w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/40 active:scale-95 text-center"
                  style={{
                    animation: isOpen ? 'fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both' : 'none'
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Start Free Trial
                  </span>
                </Link>

                {/* Sign In Link */}
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full py-3 px-4 text-center text-white/70 hover:text-white font-medium transition-colors"
                  style={{
                    animation: isOpen ? 'fadeInUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both' : 'none'
                  }}
                >
                  Already have an account? Sign In
                </Link>
              </>
            ) : (
              // LOGGED IN: Show Dashboard button
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/40 active:scale-95 text-center"
                style={{
                  animation: isOpen ? 'fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both' : 'none'
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Go to Dashboard
                </span>
              </Link>
            )}
          </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRightBounce {
          0% {
            opacity: 0;
            transform: translateX(50px) scale(0.9);
          }
          60% {
            opacity: 1;
            transform: translateX(-5px) scale(1.02);
          }
          80% {
            transform: translateX(2px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

