'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import { DollarSign } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0B1437]">
      <PublicNav />
      <MobilePublicNav />
      
      <div className="max-w-4xl mx-auto px-4 py-30">
        {/* Header - Mobile optimized */}
        <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-4 sm:mb-6">
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
            <span className="text-red-400 font-semibold text-xs sm:text-sm">Refund & Cancellation</span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-bold text-white mb-2 sm:mb-4 px-4 leading-tight">Refund & Cancellation Policy</h1>
          <p className="text-gray-400 text-sm sm:text-base">Last Updated: November 13th, 2025</p>
        </div>

        {/* Content - Mobile optimized */}
        <div className="bg-[#1A2647] rounded-xl sm:rounded-2xl p-4 sm:p-8 md:p-12 border border-gray-800 shadow-2xl">
          <div className="prose prose-invert max-w-none text-sm sm:text-base">
            <div className="space-y-6 sm:space-y-8 text-gray-300">
              <p className="text-sm sm:text-lg leading-relaxed">
                Thank you for using Sterling. This policy explains how cancellations, refunds, trial periods, and call-credit charges work. Because Sterling provides digital, automated calling services that incur real telephony costs, all users must agree to this policy.
              </p>

              <section>
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">1. Subscription Refund Policy</h2>
                <p className="mb-3">All subscription payments are <span className="font-bold">non-refundable</span>, including:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Monthly subscription fees</li>
                  <li>Renewal payments</li>
                  <li>Partial month usage</li>
                  <li>Unused time remaining in your billing period</li>
                </ul>
                <p className="mt-4">
                  Once a payment is processed, <span className="font-bold">no refunds</span> will be issued for any reason, including but not limited to:
                </p>
                <ul className="space-y-2 list-disc list-inside mt-3">
                  <li>Not using the service</li>
                  <li>No appointments booked</li>
                  <li>Change of business direction</li>
                  <li>User error or incorrect setup</li>
                  <li>Illegal or purchased leads</li>
                  <li>Any fines, penalties, or legal consequences resulting from misuse</li>
                </ul>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mt-4">
                  <p className="font-bold text-red-300">
                    If you upload illegal leads, <span className="underline">you are responsible for all resulting costs</span>, and no refunds will be issued under any circumstance.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Free Trial Policy</h2>
                <p className="mb-3">Sterling offers a <span className="font-bold">7-Day Free Trial</span> which includes full platform access.</p>
                <p className="mb-3 font-bold text-white">During the free trial:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>You will only pay for <span className="font-bold">call minutes used</span></li>
                  <li>You may cancel at any time before the trial ends</li>
                  <li>If you do not cancel, your subscription will automatically begin</li>
                </ul>
                <p className="mt-4 font-bold text-white">The trial cannot be:</p>
                <ul className="space-y-2 list-disc list-inside mt-2">
                  <li>Extended</li>
                  <li>Transferred</li>
                  <li>Refunded</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Call Credit & Minute Charges (Important)</h2>
                <p className="mb-3">All AI calling incurs real telephony costs. Therefore:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li><span className="font-bold">Call minutes are non-refundable</span>, whether used intentionally or by mistake</li>
                  <li>You are responsible for maintaining a sufficient call balance</li>
                  <li>Auto-refill charges (if enabled) are also non-refundable</li>
                </ul>
                <p className="mt-4">This includes minutes used for:</p>
                <ul className="space-y-2 list-disc list-inside mt-2">
                  <li>Wrong numbers</li>
                  <li>Voicemails</li>
                  <li>Disconnected numbers</li>
                  <li>Leads without valid consent</li>
                  <li>Any AI activity started from your account</li>
                </ul>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mt-4">
                  <p className="font-bold text-blue-300">
                    ➡️ If your AI agent calls a number, the minutes are billable and non-refundable.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Cancellation Policy</h2>
                <p className="mb-3">You may cancel your subscription at any time through your billing portal.</p>
                <p className="mb-3 font-bold text-white">When you cancel:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>You will retain access until the end of your billing period</li>
                  <li>You will not be charged again</li>
                  <li>No refund will be issued for the current month</li>
                  <li>Any remaining call balance will be forfeited after 90 days</li>
                </ul>
                <p className="mt-4">
                  You may request full deletion separately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Chargeback Policy</h2>
                <p className="mb-3">Because Sterling clearly states pricing, offers a free trial, and charges only for minutes used:</p>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                  <p className="font-bold text-red-300 text-lg">
                    ➡️ Any chargeback filed against Sterling will be considered fraudulent.
                  </p>
                </div>
                <p className="mb-3">If a chargeback is submitted:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Your account will be automatically terminated</li>
                  <li>All remaining balances will be forfeited</li>
                  <li>We may provide evidence to your bank including:</li>
                </ul>
                <ul className="space-y-1 list-disc list-inside ml-8 mt-2 text-sm">
                  <li>Login history</li>
                  <li>Lead uploads</li>
                  <li>AI call logs</li>
                  <li>Billing activity</li>
                </ul>
                <p className="mt-4">
                  We reserve the right to pursue recovery of unpaid balances.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Illegal, Non-Consented, or Prohibited Lead Uploads</h2>
                <p className="mb-3">You are solely responsible for the legality of the leads you upload.</p>
                <p className="mb-3">Sterling is <span className="font-bold">not liable</span> for:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>TCPA violations</li>
                  <li>DNC (Do Not Call) violations</li>
                  <li>Non-consented leads</li>
                  <li>Illegal or purchased leads</li>
                  <li>Any fines, penalties, or legal consequences resulting from misuse</li>
                </ul>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mt-4">
                  <p className="font-bold text-red-300">
                    If you upload illegal leads, <span className="underline">you are responsible for all resulting costs</span>, and no refunds will be issued under any circumstance.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Contact Us</h2>
                <p className="mb-3">Questions about this policy?</p>
                <p>
                  <a href="mailto:SterlingDialer@gmail.com" className="text-blue-400 hover:text-blue-300 font-semibold text-lg">
                    📧 SterlingDialer@gmail.com
                  </a>
                </p>
                <p className="mt-4 text-sm">
                  We're here to help.
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

