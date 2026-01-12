'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import { DollarSign, CreditCard, Phone, AlertTriangle, Ban, UserX, TrendingDown, RefreshCw } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#050a1a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-red-900/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-900/10 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[180px]" />
      </div>
      
      {/* Subtle grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem'
        }}
      />

      <PublicNav />
      <MobilePublicNav />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-28 sm:py-32">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
            <DollarSign className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-semibold text-sm">Billing Policy</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">Refund Policy</h1>
          <p className="text-gray-500 text-sm sm:text-base">Last Updated: January 12, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-[#0a1628]/80 backdrop-blur-sm rounded-2xl p-6 sm:p-10 md:p-12 border border-gray-800/50 shadow-2xl">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-gray-300 text-sm sm:text-base leading-relaxed">
              
              {/* Intro */}
              <div className="pb-6 border-b border-gray-800/50">
                <p className="text-base sm:text-lg">
                  Sterling Dialer ("Sterling," "we," "us," or "our") operates on a pay-as-you-go usage model. This Refund Policy explains how payments, balances, and refunds are handled.
                </p>
                <p className="mt-4 font-semibold text-white">By using the Service, you agree to this Refund Policy.</p>
              </div>

              {/* Section 1 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">1. No Monthly Subscriptions</h2>
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Sterling Dialer does not offer monthly subscriptions</li>
                  <li>All usage is billed through prepaid call balance top-ups</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">2. Call Balance & Top-Ups</h2>
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Users must add funds to their account to place calls</li>
                  <li>Funds are converted into call minutes at the current per-minute rate</li>
                  <li>All call balance purchases are final and non-refundable</li>
                  <li>Unused balances do not expire while your account remains active</li>
                </ul>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mt-4">
                  <p className="font-semibold text-red-300">Once funds are added, they cannot be refunded, reversed, or withdrawn.</p>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-purple-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">3. Usage Charges Are Final</h2>
                </div>
                <p className="mb-3">Call minutes are deducted based on:</p>
                <ul className="space-y-1 list-disc list-inside mb-4">
                  <li>Call duration</li>
                  <li>AI processing time</li>
                  <li>Live transfers</li>
                  <li>Voicemail detection</li>
                  <li>Call attempts (connected or not)</li>
                </ul>
                <p className="mb-3">Once minutes are used, they are non-refundable, including but not limited to:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Calls with no answer</li>
                  <li>Busy signals or call drops</li>
                  <li>Short calls</li>
                  <li>Voicemail interactions</li>
                  <li>AI conversations that do not convert</li>
                  <li>User configuration errors</li>
                  <li>Poor lead quality</li>
                  <li>Carrier issues or call routing delays</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">4. No Refunds for Technical Issues or Errors</h2>
                </div>
                <p className="mb-3">Sterling is not responsible for refunds related to:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Network latency</li>
                  <li>Carrier issues</li>
                  <li>Telephony provider outages</li>
                  <li>AI misinterpretation or unexpected responses</li>
                  <li>Call delays, drops, or partial connections</li>
                  <li>Platform bugs, lag, or temporary service interruptions</li>
                  <li>Third-party service issues (e.g., telephony providers, AI services)</li>
                </ul>
                <p className="mt-4 font-semibold text-orange-400">All usage during such events is still billable and non-refundable.</p>
              </section>

              {/* Section 5 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Ban className="w-4 h-4 text-red-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">5. Chargebacks & Payment Disputes</h2>
                </div>
                <p className="mb-3">Unauthorized chargebacks or payment disputes may result in:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Immediate account suspension</li>
                  <li>Permanent termination</li>
                  <li>Forfeiture of remaining call balance</li>
                  <li>Collection or recovery actions</li>
                </ul>
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mt-4">
                  <p className="text-amber-300">If you have a billing concern, you must contact Sterling before initiating a dispute.</p>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    <UserX className="w-4 h-4 text-pink-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">6. Account Termination & Remaining Balance</h2>
                </div>
                <p className="mb-3">If your account is:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Canceled by you</li>
                  <li>Suspended or terminated for violations</li>
                  <li>Closed for inactivity</li>
                </ul>
                <p className="mt-4 font-semibold text-red-400">Any remaining call balance is forfeited and not refundable.</p>
              </section>

              {/* Section 7 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">7. No Guarantees or Performance Refunds</h2>
                </div>
                <p className="mb-3">Sterling does not guarantee:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Call answer rates</li>
                  <li>Appointment bookings</li>
                  <li>Sales outcomes</li>
                  <li>Revenue results</li>
                  <li>Lead conversions</li>
                </ul>
                <p className="mt-4 font-semibold text-cyan-400">Refunds are not issued based on performance expectations, ROI, or business results.</p>
              </section>

              {/* Section 8 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">8. Changes to This Policy</h2>
                </div>
                <p>Sterling reserves the right to update this Refund Policy at any time.</p>
                <p className="mt-3 font-semibold text-white">Continued use of the Service after updates constitutes acceptance of the revised policy.</p>
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
