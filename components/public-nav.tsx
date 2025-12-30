'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function PublicNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state for auth check
  const supabase = createClient();

  // Check auth state - only show dashboard if they have completed payment
  useEffect(() => {
    let mounted = true;
    
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (user) {
          // Check if they have completed payment and have stripe customer ID
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, has_active_subscription, stripe_customer_id, onboarding_all_complete')
            .eq('user_id', user.id)
            .single();
          
          if (!mounted) return;
          
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
      } catch (err) {
        console.error('Auth check failed:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    // Timeout fallback - show buttons after 2s even if auth check hangs
    const timeout = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 2000);
    
    checkUser();
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };

    // Listen for auth changes
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
          console.log('🔄 Auth state changed: FULLY SIGNED UP (payment complete)');
          setUser(session.user);
        } else {
          console.log('🔄 Auth state changed: NOT FULLY SIGNED UP (no payment)');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide nav when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      
      setScrolled(currentScrollY > 20);
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav className={`hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      hidden ? '-translate-y-full' : 'translate-y-0'
    } ${
      scrolled 
        ? 'bg-[#0B1437]/98 backdrop-blur-xl border-b border-blue-500/20 shadow-2xl shadow-blue-500/10' 
        : 'bg-gradient-to-b from-[#0B1437]/80 to-transparent backdrop-blur-sm'
    }`}>
      {/* Glowing Line Effect */}
      {scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      )}
      
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between gap-8">
          {/* Logo - Cleaner */}
          <Link href="/" className="flex items-center gap-3 group relative flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-bold text-lg">SD</span>
              </div>
            </div>
            <span className="text-xl font-bold text-white">
              Sterling Dialer
            </span>
          </Link>

          {/* Navigation - Centered with pill hover & active state */}
          <div className="hidden lg:flex items-center gap-3 flex-1 justify-center">
            <Link 
              href="/" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/'
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/pricing" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/pricing'
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Pricing
            </Link>
            <Link 
              href="/demo" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/demo'
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Demo
            </Link>
            <Link 
              href="/case-studies" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/case-studies'
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Case Studies
            </Link>
            <Link 
              href="/faq" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/faq'
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              FAQ
            </Link>
            <Link 
              href="/contact" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/contact'
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Contact
            </Link>
          </div>
          
          {/* Right Side: Conditional Based on Auth */}
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0 min-w-[220px] justify-end">
            {isLoading ? (
              // LOADING: Show skeleton that matches actual button sizes
              <div className="flex items-center gap-4">
                {/* Sign In skeleton - matches px-4 py-2 */}
                <div className="w-[60px] h-[40px] bg-white/5 rounded-lg" />
                {/* Button skeleton - matches px-7 py-3 with icon */}
                <div className="w-[156px] h-[44px] bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full" />
              </div>
            ) : user === null ? (
              // NOT LOGGED IN: Show Sign In + Start Free Trial
              <>
                {/* Sign In Link */}
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors font-medium"
                >
                  Sign In
                </Link>

                {/* Start Free Trial Button - Larger with glow */}
                <Link 
                  href="/signup" 
                  className="group relative px-7 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 overflow-hidden inline-flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Start Free Trial</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
                </Link>
              </>
            ) : (
              // LOGGED IN: Show Dashboard button only
              <Link 
                href="/dashboard" 
                className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 overflow-hidden inline-flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Go to Dashboard
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
              </Link>
            )}
          </div>

          {/* Mobile CTA - Conditional */}
          <div className="lg:hidden min-w-[100px]">
            {isLoading ? (
              // Mobile skeleton - matches actual button size
              <div className="w-[100px] h-[42px] bg-gradient-to-r from-purple-600/15 to-indigo-600/15 rounded-lg" />
            ) : user !== null ? (
              <Link 
                href="/dashboard" 
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:scale-105 transition-transform text-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                href="/signup" 
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:scale-105 transition-transform text-sm"
              >
                Start Trial
              </Link>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </nav>
  );
}

