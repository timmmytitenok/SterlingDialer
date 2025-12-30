import Link from 'next/link';
import { Smartphone, Shield, Lock, CheckCircle, Mail, Zap, Award, ArrowRight } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="hidden lg:block relative z-10 border-t border-gray-800/50">
      {/* Main Footer */}
      <div className="bg-[#0A1129]/80 backdrop-blur-sm">
        <div className="container mx-auto px-8 py-16">
          <div className="grid grid-cols-6 gap-12">
            {/* Brand Column - Takes 2 cols */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">SD</span>
                </div>
                <span className="text-white font-bold text-xl tracking-tight">Sterling Dialer</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-[280px]">
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
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <div className="space-y-2.5">
                <Link href="/pricing" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Pricing
                </Link>
                <Link href="/demo" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Demo
                </Link>
                <Link href="/case-studies" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Case Studies
                </Link>
                <Link href="/faq" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <div className="space-y-2.5">
                <Link href="/contact" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
                <a href="mailto:support@sterlingdialer.com" className="block text-gray-500 hover:text-white transition-colors text-sm">
                  Support
                </a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
              <div className="space-y-2.5">
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

            {/* Connect */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Connect</h4>
              <div className="space-y-2.5">
                <a href="mailto:support@sterlingdialer.com" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
                  <Mail className="w-4 h-4" />
                  Email Us
                </a>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile App Soon</span>
                </div>
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
                © 2024 Sterling Dialer
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
                <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-500/70" />
                  <span>SOC 2</span>
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
