import Link from 'next/link';
import { Smartphone } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="hidden lg:block relative z-10 border-t border-gray-800 bg-[#0A1129]/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-5 gap-6 lg:gap-8 xl:gap-12 mb-8">
          {/* Company */}
          <div>
            <h3 className="text-white font-bold mb-4">Sterling Dialer</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Revive your old leads into booked appointments.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <div className="space-y-2">
              <Link href="/pricing" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Pricing
              </Link>
              <Link href="/demo" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Demo
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <div className="space-y-2">
              <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Contact Us
              </Link>
              <Link href="/faq" className="block text-gray-400 hover:text-white transition-colors text-sm">
                FAQ
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <div className="space-y-2">
              <Link href="/terms" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="/privacy" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/refund-policy" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Refund & Cancellation
              </Link>
            </div>
          </div>

          {/* Mobile App - FAR RIGHT */}
          <div>
            <h4 className="text-white font-semibold mb-4">Mobile App</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>iOS App (Coming Soon)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>Android App (Coming Soon)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 Sterling Dialer. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Start your <span className="text-gray-300 font-bold">7 day</span> free trial today
          </p>
        </div>
      </div>
    </footer>
  );
}

