import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="hidden lg:block relative z-10 border-t border-gray-800 bg-[#0A1129]/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <h3 className="text-white font-bold mb-4">Sterling AI</h3>
            <p className="text-gray-400 text-sm">
              Revive your old leads into booked appointments — automatically.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <div className="space-y-2">
              <Link href="/how-it-works" className="block text-gray-400 hover:text-white transition-colors text-sm">
                How It Works
              </Link>
              <Link href="/pricing" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Pricing
              </Link>
              {/* <Link href="/case-studies" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Case Studies
              </Link> */}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <div className="space-y-2">
              <Link href="/faq" className="block text-gray-400 hover:text-white transition-colors text-sm">
                FAQ
              </Link>
              <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Contact Us
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
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 Sterling AI. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Start your <span className="text-gray-300 font-bold">30 day</span> free trial today
          </p>
        </div>
      </div>
    </footer>
  );
}

