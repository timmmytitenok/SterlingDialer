'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import { Shield, Lock, Eye, Database, Gift, Rocket, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B1437]">
      <PublicNav />
      <MobilePublicNav />
      
      <div className="max-w-4xl mx-auto px-4 py-30">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 font-semibold">Your Privacy Matters</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: October 9th, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-[#1A2647] rounded-2xl p-8 md:p-12 border border-gray-800 shadow-2xl">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                <p className="mb-3">When you use Sterling AI, we collect:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Account Information:</strong> Name, email, phone number, company name</li>
                  <li><strong>Payment Information:</strong> Processed securely through Stripe (we never store card details)</li>
                  <li><strong>Usage Data:</strong> Calls made, appointments booked, AI session logs</li>
                  <li><strong>Lead Data:</strong> Contact information you upload for calling</li>
                  <li><strong>Referral Data:</strong> Referral codes used and referral relationships</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>To provide and improve the AI calling service</li>
                  <li>To process payments and manage subscriptions</li>
                  <li>To send service notifications and updates</li>
                  <li>To manage free trials and track referrals</li>
                  <li>To provide customer support</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Data Storage & Security</h2>
                <p>
                  Your data is stored securely using Supabase (hosted on AWS) with industry-standard encryption. 
                  We implement row-level security policies to ensure users can only access their own data. 
                  Payment processing is handled exclusively by Stripe (PCI-DSS compliant).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Services</h2>
                <p className="mb-3">We use the following third-party services:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Stripe:</strong> Payment processing and subscription management</li>
                  <li><strong>Supabase:</strong> Database and authentication</li>
                  <li><strong>Cal.ai/Cal.com:</strong> Calendar integration and appointment booking</li>
                  <li><strong>N8N:</strong> Workflow automation (self-hosted)</li>
                </ul>
                <p className="mt-3">
                  Each service has its own privacy policy. We share only necessary data to provide our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Cookies & Tracking</h2>
                <p>
                  We use essential cookies for authentication and session management. 
                  We do not use advertising cookies or sell your data to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
                <p className="mb-3">You have the right to:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Access your personal data at any time through your dashboard</li>
                  <li>Update or correct your information in Settings → Profile</li>
                  <li>Delete your account and all associated data</li>
                  <li>Export your data (contact support for assistance)</li>
                  <li>Opt-out of non-essential communications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
                <p>
                  We retain your data while your account is active. If you cancel your subscription, 
                  we retain data for 90 days for potential reactivation. After 90 days, 
                  all data is permanently deleted unless required by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. GDPR & CCPA Compliance</h2>
                <p>
                  For EU users: We comply with GDPR. You have rights to access, rectification, erasure, and data portability.
                  <br /><br />
                  For California users: We comply with CCPA. We do not sell your personal information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
                <p>
                  Sterling AI is not intended for users under 18. We do not knowingly collect data from minors.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Changes to Privacy Policy</h2>
                <p>
                  We may update this policy. We'll notify you of significant changes via email or dashboard notification.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
                <p>
                  Questions about privacy? Contact us at:
                  <br />
                  <a href="mailto:privacy@sterlingai.com" className="text-blue-400 hover:text-blue-300">SterlingDailer@gmail.com</a>
                </p>
              </section>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-blue-500/30 animate-in fade-in duration-700">
          <p className="text-white font-bold text-lg mb-4">Your data is safe with us</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50"
          >
            <Rocket className="w-5 h-5" />
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-400 mt-4">
            <Zap className="w-4 h-4 inline mr-1 text-green-400" />
            30 Days Free • Only Pay <span className="text-green-400 font-bold">$0.30/min</span>
          </p>
        </div>
      </div>

      <PublicFooter />
      <MobileFooter />
    </div>
  );
}

