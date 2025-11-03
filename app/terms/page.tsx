'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import { Shield, FileText, Gift, Rocket, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B1437]">
      <PublicNav />
      <MobilePublicNav />
      
      <div className="max-w-4xl mx-auto px-4 py-30">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-semibold">Legal</span>
          </div>
          <h1 className="text-6xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-400">Last updated: October 9th, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-[#1A2647] rounded-2xl p-8 md:p-12 border border-gray-800 shadow-2xl">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Service Description</h2>
                <p>
                  Sterling AI ("we", "us", "our") provides AI-powered calling automation software for insurance sales professionals. 
                  The service includes automated dialing, conversation AI, appointment booking, and analytics dashboard.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Subscription & Billing</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Subscriptions are billed monthly at the selected tier price (Starter: $499, Pro: $899, Elite: $1,499) plus per-minute calling costs</li>
                  <li>Payment is processed through Stripe on a recurring basis</li>
                  <li>You may cancel your subscription at any time through the billing portal</li>
                  <li>No refunds. <span className="font-bold">All sales are final.</span></li>
                  <li>Free trial includes 30 days of access with pay-per-minute calling ($0.30/min for Starter tier)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Call Balance & Credits</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Calls cost between $0.20 and $0.30 per minute, charged from your prepaid call balance</li>
                  <li>You must maintain sufficient balance to use the AI calling service</li>
                  <li>Auto-refill can be enabled to automatically add funds when balance drops below $10</li>
                  <li>All refills are final and non-refundable</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. User Responsibilities</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>You must comply with all applicable telemarketing laws and regulations</li>
                  <li>You are responsible for obtaining proper consent before calling leads</li>
                  <li>You must not use the service for illegal, fraudulent, or malicious purposes</li>
                  <li>You are responsible for the accuracy of lead data you upload</li>
                  <li>You must maintain the confidentiality of your account credentials</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. AI Agent Setup</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>New subscriptions and upgrades require 24-72 hours for AI configuration</li>
                  <li>During setup, access to AI Control Center will be temporarily restricted</li>
                  <li>We will notify you via email when your AI agent is ready to launch</li>
                  <li>Configuration includes dedicated N8N workflows specific to your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Service Availability</h2>
                <p>
                  We strive to provide 99.9% uptime but do not guarantee uninterrupted service. 
                  Scheduled maintenance will be announced in advance when possible.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
                <p>
                  Sterling AI is provided "as is" without warranties. We are not liable for lost revenue, 
                  missed opportunities, or indirect damages arising from service use. Maximum liability is limited 
                  to the amount paid in the current billing month.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Termination</h2>
                <p>
                  We reserve the right to suspend or terminate accounts that violate these terms, 
                  engage in fraudulent activity, or misuse the service. Upon cancellation, 
                  remaining call balance credits are forfeited.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
                <p>
                  We may update these terms at any time. Continued use of the service after changes 
                  constitutes acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Contact</h2>
                <p>
                  For questions about these terms, contact us at SterlingDailer@gmail.com
                </p>
              </section>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8 border border-purple-500/30 animate-in fade-in duration-700">
          <p className="text-white font-bold text-lg mb-4">Ready to get started?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 flex items-center justify-center gap-2"
            >
              <Rocket className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            <Zap className="w-4 h-4 inline mr-1 text-green-400" />
            30 Days Free • Only Pay <span className="text-green-400 font-bold">$0.30/min</span> for Calls
          </p>
        </div>
      </div>

      <PublicFooter />
      <MobileFooter />
    </div>
  );
}

