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
        {/* Header - Mobile optimized */}
        <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4 sm:mb-6">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            <span className="text-blue-400 font-semibold text-xs sm:text-sm">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-6xl font-bold text-white mb-2 sm:mb-4 px-4">Terms of Service</h1>
          <p className="text-gray-400 text-sm sm:text-base">Last updated: November 13th, 2025</p>
        </div>

        {/* Content - Mobile optimized */}
        <div className="bg-[#1A2647] rounded-xl sm:rounded-2xl p-4 sm:p-8 md:p-12 border border-gray-800 shadow-2xl">
          <div className="prose prose-invert max-w-none text-sm sm:text-base">
            <div className="space-y-6 sm:space-y-8 text-gray-300">
              <div className="mb-6 sm:mb-8">
                <p className="text-sm sm:text-lg leading-relaxed">
                  Welcome to SterlingAI ("SterlingAI," "we," "us," or "our"). These Terms of Service ("Terms") govern your 
                  access to and use of our AI calling platform, website, software, and related services ("Service").
                </p>
                <p className="text-lg leading-relaxed mt-4">
                  By creating an account, subscribing, or using SterlingAI, you agree to these Terms.
                </p>
                <p className="text-lg leading-relaxed mt-2">
                  <span className="font-bold text-white">If you do not agree, do not use the Service.</span>
                </p>
              </div>

              <section>
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">1. Service Description</h2>
                <p>
                  SterlingAI provides AI-powered calling, appointment booking, lead follow-up, analytics, and automation 
                  tools designed to help insurance professionals contact and re-engage their leads.
                </p>
                <p className="mt-3">
                  Features may include automated dialing, AI conversation handling, live transfer, appointment scheduling, 
                  call recordings, and performance dashboards.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Subscription & Billing</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>SterlingAI uses a <span className="font-bold">monthly subscription</span> model.</li>
                  <li>Subscription cost: <span className="font-bold">$499/month</span>, billed automatically through Stripe.</li>
                  <li>Calls are billed <span className="font-bold">pay-as-you-go at $0.30 per minute</span>.</li>
                  <li>A valid payment method is required to place calls.</li>
                  <li>Subscription renews automatically until canceled.</li>
                  <li><span className="font-bold">No refunds</span> for subscription fees or unused call minutes.</li>
                  <li>You may cancel anytime through your dashboard; cancellation stops future billing but does not refund prior charges.</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="font-bold text-white mb-2">Free Trial Terms:</p>
                  <ul className="space-y-1 list-disc list-inside text-sm">
                    <li>Free trial lasts <span className="font-bold">7 days</span>.</li>
                    <li>Calls during the trial are still billed at $0.30/min.</li>
                    <li>Your subscription begins automatically unless canceled before the trial ends.</li>
                    <li>By starting the trial, you authorize SterlingAI to charge your payment method at renewal unless you cancel.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Call Balance & Credits</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Calls deduct from your <span className="font-bold">prepaid call balance</span>, charged at $0.30/min.</li>
                  <li>You must maintain sufficient balance to allow calls to continue.</li>
                  <li>Auto-refill can be enabled to automatically add funds when the balance falls below $1.</li>
                  <li><span className="font-bold">All call credit purchases are final and non-refundable.</span></li>
                  <li>SterlingAI is not responsible for disruptions caused by insufficient balance.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. User Responsibilities (VERY IMPORTANT)</h2>
                <p className="mb-4">By using SterlingAI, you agree to the following:</p>
                
                <h3 className="text-xl font-bold text-white mb-3 mt-6">4.1 Compliance With Laws</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>You must comply with <span className="font-bold">all telemarketing, TCPA, FCC, state, federal, and industry regulations.</span></li>
                  <li>SterlingAI DOES NOT monitor your lead compliance and is NOT responsible for legal violations you commit.</li>
                </ul>

                <h3 className="text-xl font-bold text-white mb-3 mt-6">4.2 Lead Quality & Consent</h3>
                <p className="mb-2">You are fully responsible for:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Ensuring leads have provided proper consent to be contacted</li>
                  <li>Ensuring leads are legally callable</li>
                  <li>Ensuring leads are not on Do Not Call lists (if applicable for your business)</li>
                  <li>Ensuring numbers were legally acquired</li>
                  <li>Ensuring your use of AI calling is compliant with all applicable laws</li>
                </ul>

                <h3 className="text-xl font-bold text-white mb-3 mt-6">4.3 Illegal or Prohibited Use</h3>
                <p className="mb-2">You may NOT use SterlingAI to:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Contact illegally obtained leads</li>
                  <li>Contact numbers without proper opt-in consent</li>
                  <li>Harass or harm individuals</li>
                  <li>Engage in fraudulent, abusive, deceptive, or illegal activities</li>
                  <li>Upload viruses, automated bots, or malicious content</li>
                  <li>Use the platform to deceive individuals about your identity, product, or licensing</li>
                </ul>

                <h3 className="text-xl font-bold text-white mb-3 mt-6">4.4 Full Responsibility for Outcomes</h3>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                  <p className="font-bold text-red-300">
                    SterlingAI is not responsible or liable for any fines, penalties, legal fees, damages, or 
                    consequences resulting from your use of the Service or your choice of leads.
                  </p>
                </div>
                <p>
                  You accept <span className="font-bold">all legal responsibility</span> for the leads you upload and the calls made on your behalf.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. AI Calling Behavior & Configuration</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>AI agents may take 24–72 hours for initial configuration after signup.</li>
                  <li>During setup, certain platform features may be temporarily limited.</li>
                  <li>You can customize scripts, settings, and preferences, but SterlingAI does not guarantee specific call outcomes.</li>
                  <li>SterlingAI is not responsible for lost deals, incorrect conversations, or missed opportunities; AI behavior may vary.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Service Availability</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>We aim for 99.9% uptime but do not guarantee uninterrupted service.</li>
                  <li>Scheduled maintenance or outages may occur.</li>
                  <li>SterlingAI is not liable for downtime, call failures, dropped calls, or service interruptions outside our control.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
                <p className="mb-3">To the fullest extent permitted by law:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>SterlingAI is provided <span className="font-bold">"as is" and "as available."</span></li>
                  <li>We make <span className="font-bold">no warranties</span> regarding call accuracy, AI behavior, lead outcomes, sales results, or performance.</li>
                  <li>We are <span className="font-bold">not liable</span> for missed opportunities, lost revenue, lost data, inaccurate AI responses, or any direct or indirect damages.</li>
                  <li><span className="font-bold">Maximum liability</span> is limited to the amount you paid SterlingAI in the current billing month.</li>
                </ul>
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="font-bold text-yellow-300 mb-2">You agree that SterlingAI is NOT liable for:</p>
                  <ul className="space-y-1 list-disc list-inside text-sm">
                    <li>TCPA violations</li>
                    <li>Carrier flags or spam labeling</li>
                    <li>Legal fines due to your leads or calling behavior</li>
                    <li>Complaints filed against your phone numbers</li>
                    <li>Incorrect AI responses</li>
                    <li>Technical issues from third-party providers (Twilio, RetellAI, Cal.com, etc.)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Termination</h2>
                <p className="mb-3">We may suspend or terminate your account immediately if:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>You violate these Terms</li>
                  <li>You upload illegal, non-consented, or prohibited leads</li>
                  <li>You misuse the system</li>
                  <li>Fraudulent or suspicious activity is detected</li>
                </ul>
                <p className="mt-4 font-bold">Upon termination:</p>
                <ul className="space-y-2 list-disc list-inside mt-2">
                  <li>Subscription fees are not refunded</li>
                  <li>Remaining call credits are forfeited</li>
                  <li>Access to the platform will be revoked</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
                <p>
                  We may update these Terms at any time.
                </p>
                <p className="mt-2">
                  Continued use of the Service after updates constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Data & Privacy</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>You retain ownership of your uploaded leads.</li>
                  <li>We only use your data to provide and improve the Service.</li>
                  <li>We do not sell your data to third parties.</li>
                  <li>You are responsible for securing your account credentials.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Contact</h2>
                <p>
                  For questions about these Terms, contact:
                </p>
                <p className="mt-3">
                  <a href="mailto:SterlingDialer@gmail.com" className="text-blue-400 hover:text-blue-300 font-semibold">
                    SterlingDialer@gmail.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>

      </div>

      <PublicFooter />
      <MobileFooter />
    </div>
  );
}

