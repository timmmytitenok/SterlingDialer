'use client';

import Link from 'next/link';
import { Mail, Phone, Smartphone } from 'lucide-react';

export function MobileFooter() {
  return (
    <footer className="lg:hidden relative bg-gradient-to-b from-[#0B1437] to-[#0A1129] border-t border-gray-800/50 pt-10 pb-6 px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -bottom-20 -left-20" />
        <div className="absolute w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20" />
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-8">
        {/* Logo & Description */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-lg font-bold text-white">SA</span>
            </div>
            <span className="text-xl font-bold text-white">Sterling AI</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
            Revive your old leads into booked appointments.
          </p>
        </div>

        {/* Mobile App */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Mobile App</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 py-2.5 px-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-300">iOS App (Coming Soon)</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2.5 px-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-300">Android App (Coming Soon)</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Contact</h3>
          <div className="space-y-2">
            <a 
              href="mailto:SterlingDialer@gmail.com" 
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-800 hover:border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-xs">SterlingDialer@gmail.com</span>
            </a>
            <Link 
              href="/contact" 
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/30 rounded-lg text-sm text-blue-400 hover:text-blue-300 transition-all duration-200"
            >
              <Phone className="w-4 h-4" />
              <span className="text-xs font-semibold">Send us a message</span>
            </Link>
          </div>
        </div>

        {/* Legal Links - Removed (now in nav dropdown) */}
        <div className="space-y-2 pt-4 border-t border-gray-800/50">
          <p className="text-xs text-gray-600 text-center">
            © 2025 Sterling AI. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 text-center">
            Start your <span className="text-gray-300 font-bold">7 day</span> free trial today
          </p>
        </div>
      </div>
    </footer>
  );
}

