import Link from 'next/link';
import { Shield, Lock, ArrowRight, CheckCircle } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="hidden lg:block relative z-10 border-t border-gray-800/50 border-b-4 border-b-gray-700">
      {/* Main Footer */}
      <div className="bg-[#0A1129]/80 backdrop-blur-sm">
        <div className="container mx-auto px-8 py-10">
          <div className="grid grid-cols-5 gap-12 items-center">
            {/* Brand Column */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">SD</span>
                </div>
                <span className="text-white font-bold text-lg tracking-tight">Sterling Dialer</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-4 max-w-[280px]">
                AI-powered appointment setting for life insurance agents. Turn old leads into booked appointments today.
              </p>
              <Link 
                href="/signup" 
                className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors group"
              >
                Start your free trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Product</h4>
              <div className="space-y-2">
                <Link href="/pricing" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Pricing
                </Link>
                <Link href="/demo" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Demo
                </Link>
                <Link href="/faq" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Support</h4>
              <div className="space-y-2">
                <Link href="/schedule-call" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Consultation
                </Link>
                <Link href="/contact" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
                <Link href="/faq" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Legal</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Terms
                </Link>
                <Link href="/privacy" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Privacy
                </Link>
                <Link href="/refund-policy" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Refunds
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#0A1129]/90 border-t border-gray-800/50">
        <div className="container mx-auto px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <p className="text-gray-600 text-sm">
                © 2025 Sterling Dialer
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                  <Shield className="w-3.5 h-3.5 text-green-500/70" />
                  <span>TCPA Compliant</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                  <Lock className="w-3.5 h-3.5 text-blue-500/70" />
                  <span>SSL Secured</span>
                </div>
              </div>
            </div>
            
            <div className="text-gray-500 text-sm">
              Start your <span className="text-white font-semibold">7 day</span> free trial today
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
