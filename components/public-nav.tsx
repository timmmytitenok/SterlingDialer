'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Rocket } from 'lucide-react';

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group relative flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="text-white font-bold text-2xl">SA</span>
              </div>
            </div>
            <span className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              Sterling<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"> AI</span>
            </span>
          </Link>

          {/* Navigation - Centered */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-center">
            <Link 
              href="/" 
              className="relative px-4 py-2 text-gray-300 hover:text-white transition-all font-medium group"
            >
              <span className="relative z-10">Home</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
            <Link 
              href="/pricing" 
              className="relative px-4 py-2 text-gray-300 hover:text-white transition-all font-medium group"
            >
              <span className="relative z-10">Pricing</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
            <Link 
              href="/how-it-works" 
              className="relative px-4 py-2 text-gray-300 hover:text-white transition-all font-medium group"
            >
              <span className="relative z-10">How It Works</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
            {/* Case Studies - Hidden for now */}
            {/* <Link 
              href="/case-studies" 
              className="relative px-4 py-2 text-gray-300 hover:text-white transition-all font-medium group"
            >
              <span className="relative z-10">Case Studies</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link> */}
            <Link 
              href="/faq" 
              className="relative px-4 py-2 text-gray-300 hover:text-white transition-all font-medium group"
            >
              <span className="relative z-10">FAQ</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
            <Link 
              href="/contact" 
              className="relative px-4 py-2 text-gray-300 hover:text-white transition-all font-medium group"
            >
              <span className="relative z-10">Contact</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
          </div>
          
          {/* Dashboard Button - Right Side */}
          <div className="hidden lg:block flex-shrink-0">
            <Link 
              href="/login" 
              className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 overflow-hidden inline-flex"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Rocket className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                Go to Dashboard
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Link 
              href="/login" 
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:scale-105 transition-transform"
            >
              Dashboard
            </Link>
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

