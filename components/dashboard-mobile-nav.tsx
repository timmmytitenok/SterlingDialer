'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Sparkles, DollarSign, Phone, ChevronRight, LogOut, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DashboardMobileNavProps {
  user: User;
  profile: any;
}

export function DashboardMobileNav({ user, profile }: DashboardMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Lead Manager', href: '/dashboard/leads', icon: Users },
    { name: 'AI Dialer', href: '/dashboard/ai-dialer', icon: Sparkles },
    { name: 'Billing', href: '/dashboard/settings/billing', icon: DollarSign },
    { name: 'Balance', href: '/dashboard/settings/balance', icon: Phone },
  ];

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';

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

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Header - Fixed */}
      <header 
        className={`md:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          hidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        } ${
          scrolled 
            ? 'bg-[#0B1437]/80 backdrop-blur-xl border-b border-blue-500/20 shadow-2xl shadow-blue-500/10' 
            : 'bg-gradient-to-b from-[#0B1437]/60 to-transparent backdrop-blur-md'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          {/* Logo - Bigger */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
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
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 w-full max-w-sm bg-gradient-to-br from-[#0A1129] via-[#0B1437] to-[#0A1129] border-l border-gray-800/50 z-50 transform transition-all duration-700 ${
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

        {/* Menu Content */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-5 border-b border-gray-800/50"
            style={{
              animation: isOpen ? 'fadeInDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none'
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">SA</span>
              </div>
              <span className="text-base font-bold text-white">Dashboard Menu</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* User Profile */}
          <div 
            className="p-5 border-b border-gray-800/50"
            style={{
              animation: isOpen ? 'fadeInDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' : 'none'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-base font-bold shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {mainNavigation.map((item, index) => {
                const Icon = item.icon;
                // Fix: Dashboard should only be active on exact match, not subpages
                const isActive = item.href === '/dashboard' 
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/40 shadow-lg'
                        : 'bg-gray-800/20 border border-transparent hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 hover:border-blue-500/30'
                    }`}
                    style={{
                      animation: isOpen ? `slideInRightBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${(index + 2) * 0.08}s both` : 'none'
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
            </div>
          </nav>

          {/* Sign Out Section */}
          <div 
            className="p-4 border-t border-gray-800/50"
            style={{
              animation: isOpen ? 'fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both' : 'none'
            }}
          >
            <button
              onClick={handleSignOut}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/30 active:scale-95 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
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

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

