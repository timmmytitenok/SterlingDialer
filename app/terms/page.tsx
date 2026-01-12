'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import { Shield, FileText, AlertTriangle, CreditCard, Phone, Bot, Server, Scale, UserX, RefreshCw, Database, Gavel } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050a1a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[180px]" />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-semibold text-sm">Legal</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-500 text-sm sm:text-base">Last Updated: January 12, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-[#0a1628]/80 backdrop-blur-sm rounded-2xl p-6 sm:p-10 md:p-12 border border-gray-800/50 shadow-2xl">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-gray-300 text-sm sm:text-base leading-relaxed">
              
              {/* Intro */}
              <div className="pb-6 border-b border-gray-800/50">
                <p className="text-base sm:text-lg">
                  Welcome to Sterling Dialer ("Sterling," "we," "us," or "our"). These Terms of Service ("Terms") govern your access to and use of Sterling's software, AI calling platform, website, and related services (collectively, the "Service").
                </p>
                <p className="mt-4">
                  By creating an account, accessing, or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms.
                </p>
                <p className="mt-3 font-bold text-white">If you do not agree, do not use the Service.</p>
              </div>

              {/* Section 1 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">1. Service Description</h2>
                </div>
                <p>Sterling provides AI-powered outbound calling, appointment booking, lead follow-up, analytics, and automation tools intended to assist users in contacting leads.</p>
                <p className="mt-3">Sterling does not provide legal advice, compliance services, lead verification, or consent validation. All features are provided as tools only — you control how they are used.</p>
              </section>

              {/* Section 2 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-green-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">2. Billing, Pricing & Payments</h2>
                </div>
                
                <h3 className="text-lg font-semibold text-white mt-4 mb-2">2.1 Pay-As-You-Go Calling</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Calls are billed at <span className="text-green-400 font-semibold">$0.65 per minute</span></li>
                  <li>No monthly subscription fees (unless otherwise stated)</li>
                  <li>Charges accrue based on actual call duration</li>
                  <li>A valid payment method is required to place calls</li>
                  <li>All charges are non-refundable, including unused minutes</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-2">2.2 Authorization to Charge</h3>
                <p>By providing payment information, you authorize Sterling to charge your payment method for all usage, fees, taxes, and applicable charges.</p>
                <p className="mt-2">Sterling may suspend calling immediately if payment fails or balance is insufficient.</p>
              </section>

              {/* Section 3 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-purple-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">3. Call Credits & Balances</h2>
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Minutes are deducted in real time</li>
                  <li>Auto-refill may be enabled at your discretion</li>
                  <li>All purchases are final</li>
                  <li>Sterling is not responsible for interrupted service due to low balance</li>
                </ul>
              </section>

              {/* Section 4 - Critical */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">4. User Responsibilities & Legal Compliance</h2>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">CRITICAL</span>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">4.1 Full Compliance Obligation</h3>
                  <p className="mb-3">You are solely responsible for complying with all applicable laws and regulations, including but not limited to:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>TCPA</li>
                    <li>FCC rules</li>
                    <li>State and federal telemarketing laws</li>
                    <li>Do-Not-Call regulations</li>
                    <li>Consent and opt-in requirements</li>
                  </ul>
                  <p className="mt-3 font-semibold text-red-300">Sterling does not monitor, validate, or verify compliance.</p>
                </div>

                <h3 className="text-lg font-semibold text-white mt-6 mb-2">4.2 Lead Ownership & Consent</h3>
                <p className="mb-2">You represent and warrant that:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>You own or have lawful rights to all uploaded leads</li>
                  <li>Each lead has provided valid, documented consent</li>
                  <li>Leads are legally callable at the time of dialing</li>
                  <li>You maintain proof of consent if required by law</li>
                </ul>
                <p className="mt-3 text-amber-400">Sterling assumes no responsibility for lead quality, legality, or consent status.</p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-2">4.3 Prohibited Use</h3>
                <p className="mb-2">You may not use Sterling to:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Call numbers without proper consent</li>
                  <li>Call restricted, emergency, or protected numbers</li>
                  <li>Engage in fraud, harassment, deception, or impersonation</li>
                  <li>Violate carrier policies or laws</li>
                  <li>Upload malicious code or attempt system abuse</li>
                </ul>
                <p className="mt-3 font-semibold text-red-400">Violation may result in immediate termination without refund.</p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-2">4.4 Assumption of Risk & Indemnification</h3>
                <p className="mb-2">You agree that:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>You assume all legal risk associated with your use of the Service</li>
                  <li>You will defend, indemnify, and hold harmless Sterling, its owners, affiliates, and providers from any claims, fines, penalties, lawsuits, damages, or legal fees arising from your leads, calls, scripts, or compliance failures</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">5. AI Behavior & Performance Disclaimer</h2>
                </div>
                <p className="mb-3">AI behavior may vary and is not guaranteed to:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Book appointments</li>
                  <li>Follow scripts perfectly</li>
                  <li>Produce specific sales outcomes</li>
                </ul>
                <p className="mt-4">Sterling makes no guarantees regarding conversion rates, sales results, lead responses, or AI accuracy.</p>
                <p className="mt-2 text-amber-400">You accept that AI systems may misinterpret, misrespond, or behave unpredictably.</p>
              </section>

              {/* Section 6 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Server className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">6. Service Availability</h2>
                </div>
                <p>The Service is provided "as-is" and "as-available."</p>
                <p className="mt-3">Sterling does not guarantee continuous uptime, error-free operation, or uninterrupted calling.</p>
                <p className="mt-3">We are not liable for outages caused by carriers, infrastructure providers, third-party services, or force majeure events.</p>
              </section>

              {/* Section 7 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-orange-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">7. Limitation of Liability</h2>
                </div>
                <p className="mb-3">To the maximum extent permitted by law:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Sterling shall not be liable for any indirect, incidental, consequential, special, or punitive damages</li>
                  <li>Sterling's total liability shall not exceed the amount paid by you in the preceding 30 days</li>
                </ul>
                <p className="mt-4">Sterling is not liable for TCPA violations, regulatory fines, carrier blocking or spam labeling, legal claims from called parties, third-party service failures, or lost revenue or missed opportunities.</p>
              </section>

              {/* Section 8 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    <UserX className="w-4 h-4 text-pink-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">8. Account Suspension & Termination</h2>
                </div>
                <p className="mb-3">Sterling may suspend or terminate your account at any time, without notice, if:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>You violate these Terms</li>
                  <li>Compliance risk is detected</li>
                  <li>Abuse or fraud is suspected</li>
                </ul>
                <p className="mt-4">Upon termination: All balances are forfeited, no refunds are issued, and access is revoked immediately.</p>
              </section>

              {/* Section 9 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-yellow-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">9. Modifications to Terms</h2>
                </div>
                <p>Sterling may update these Terms at any time. Continued use after changes constitutes acceptance.</p>
              </section>

              {/* Section 10 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Database className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">10. Data & Privacy</h2>
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  <li>You retain ownership of your data</li>
                  <li>Sterling may process data solely to provide the Service</li>
                  <li>You are responsible for securing your account credentials</li>
                </ul>
                <p className="mt-3">Refer to our <a href="/privacy" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</a> for full details.</p>
              </section>

              {/* Section 11 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center">
                    <Gavel className="w-4 h-4 text-slate-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">11. Governing Law</h2>
                </div>
                <p>These Terms shall be governed by the laws of the State of Florida, without regard to conflict-of-law principles.</p>
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
