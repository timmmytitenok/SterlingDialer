'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import { Lock, User, CreditCard, Activity, Database, Settings, Cookie, UserCheck, Clock, Globe, Baby, AlertTriangle, RefreshCw } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050a1a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-blue-900/15 rounded-full blur-[130px]" />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 font-semibold text-sm">Your Privacy Matters</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-500 text-sm sm:text-base">Last Updated: January 12, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-[#0a1628]/80 backdrop-blur-sm rounded-2xl p-6 sm:p-10 md:p-12 border border-gray-800/50 shadow-2xl">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-gray-300 text-sm sm:text-base leading-relaxed">
              
              {/* Intro */}
              <div className="pb-6 border-b border-gray-800/50">
                <p className="text-base sm:text-lg">
                  Sterling Dialer ("Sterling," "we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, store, and protect information when you access or use our website, software, and AI-powered calling services (the "Service").
                </p>
                <p className="mt-4 font-semibold text-white">By using the Service, you consent to the practices described in this Privacy Policy.</p>
              </div>

              {/* Section 1 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">1. Information We Collect</h2>
                </div>
                <p className="mb-4">We collect only the information necessary to operate, secure, and improve the Service.</p>

                <h3 className="text-lg font-semibold text-white mt-5 mb-2">1.1 Account Information</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Company name</li>
                  <li>Login credentials (encrypted)</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-5 mb-2">1.2 Payment Information</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Payment details are processed exclusively by <span className="font-semibold text-blue-400">Stripe</span></li>
                  <li>Sterling does not store or access full credit card numbers</li>
                  <li>Stripe is PCI-DSS compliant</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-5 mb-2">1.3 Usage & Technical Data</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Calls placed and minutes used</li>
                  <li>Appointment activity</li>
                  <li>AI interaction logs</li>
                  <li>Platform usage metrics</li>
                  <li>IP address, browser type, device information</li>
                  <li>Security and audit logs</li>
                </ul>
                <p className="mt-2 text-gray-400 text-sm">This data is used strictly for service operation, analytics, and abuse prevention.</p>

                <h3 className="text-lg font-semibold text-white mt-5 mb-2">1.4 Lead Data (Uploaded by You)</h3>
                <p className="mb-2">Contact names, phone numbers, notes, tags, and related metadata that you upload.</p>
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="font-bold text-purple-300 mb-2">🔒 Your leads remain private to your account.</p>
                  <p className="mb-2">We do NOT:</p>
                  <ul className="space-y-1 list-disc list-inside text-sm">
                    <li>Sell your leads</li>
                    <li>Share your leads</li>
                    <li>Use your leads for our own marketing</li>
                    <li>Analyze your leads outside of providing the Service</li>
                  </ul>
                  <p className="mt-3 font-semibold text-white">You retain full ownership of all uploaded lead data.</p>
                </div>

                <h3 className="text-lg font-semibold text-white mt-5 mb-2">1.5 Referral Data</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Referral codes</li>
                  <li>Referral relationships and attribution</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-green-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">2. How We Use Your Information</h2>
                </div>
                <p className="mb-3">We use collected information solely to:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Provide, operate, and maintain the Service</li>
                  <li>Process payments and usage-based billing</li>
                  <li>Deliver AI calling and appointment functionality</li>
                  <li>Send critical service-related communications</li>
                  <li>Improve performance, reliability, and security</li>
                  <li>Prevent fraud, abuse, and unauthorized use</li>
                  <li>Generate analytics and reporting</li>
                  <li>Sync calendars and appointments (via Cal.com)</li>
                </ul>
                <p className="mt-4 font-semibold text-green-400">We do not use your data for advertising or third-party marketing.</p>
              </section>

              {/* Section 3 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Database className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">3. Data Storage & Security</h2>
                </div>
                <p className="mb-3">We implement industry-standard security practices, including:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Encrypted databases hosted via Supabase (AWS)</li>
                  <li>Encryption in transit (TLS) and at rest</li>
                  <li>Strict row-level access controls</li>
                  <li>Secure authentication and authorization</li>
                  <li>Role-based access restrictions</li>
                </ul>
                <p className="mt-4 text-gray-400">While no system is 100% secure, Sterling takes reasonable measures to protect your data from unauthorized access, loss, or misuse.</p>
              </section>

              {/* Section 4 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">4. Third-Party Service Providers</h2>
                </div>
                <p className="mb-3">Sterling integrates with trusted third-party services strictly to operate the platform:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li><span className="font-semibold text-white">Stripe</span> – Payment processing</li>
                  <li><span className="font-semibold text-white">Supabase</span> – Database and authentication</li>
                  <li><span className="font-semibold text-white">Cal.ai / Cal.com</span> – Scheduling and calendar integrations</li>
                  <li><span className="font-semibold text-white">Telephony & AI Providers</span> – Call delivery and AI processing</li>
                </ul>
                <p className="mt-4">We share only the minimum data required for functionality. Each provider operates under its own privacy policy.</p>
              </section>

              {/* Section 5 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Cookie className="w-4 h-4 text-amber-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">5. Cookies & Tracking Technologies</h2>
                </div>
                <p className="mb-3">Sterling uses essential cookies only, including for:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Authentication</li>
                  <li>Session management</li>
                  <li>Security and fraud prevention</li>
                </ul>
                <p className="mt-4 font-semibold text-amber-400">We do not use advertising cookies, behavioral tracking, third-party tracking pixels, data resale, or profiling.</p>
              </section>

              {/* Section 6 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-pink-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">6. Your Rights & Choices</h2>
                </div>
                <p className="mb-3">You have the right to:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Access your personal information</li>
                  <li>Update or correct your data</li>
                  <li>Delete your account and associated data</li>
                  <li>Export your data (upon request)</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
                <p className="mt-4">Requests can be made by contacting support.</p>
              </section>

              {/* Section 7 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">7. Data Retention</h2>
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Data is retained while your account is active</li>
                  <li>Upon cancellation, data is retained for up to 90 days for potential reactivation</li>
                  <li>After 90 days, data is permanently deleted unless legally required to retain it</li>
                </ul>
              </section>

              {/* Section 8 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">8. GDPR & CCPA Compliance</h2>
                </div>

                <h3 className="text-lg font-semibold text-white mt-4 mb-2">EU Users (GDPR)</h3>
                <p className="mb-2">You have the right to:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Access</li>
                  <li>Rectification</li>
                  <li>Erasure</li>
                  <li>Data portability</li>
                  <li>Restriction of processing</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-5 mb-2">California Residents (CCPA)</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>We do not sell personal information</li>
                  <li>You may request disclosure or deletion of data</li>
                </ul>
              </section>

              {/* Section 9 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <Baby className="w-4 h-4 text-rose-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">9. Children's Privacy</h2>
                </div>
                <p>Sterling is not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors.</p>
              </section>

              {/* Section 10 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">10. Responsibility for Uploaded Leads & Legal Compliance</h2>
                </div>
                <p className="mb-3">You are solely responsible for:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>The legality of uploaded leads</li>
                  <li>Consent and opt-in compliance</li>
                  <li>Compliance with TCPA, DNC, FCC, and other regulations</li>
                </ul>
                
                <p className="mt-4 mb-2">You may not upload:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Non-consented or illegally obtained leads</li>
                  <li>Numbers on Do-Not-Call lists (where applicable)</li>
                  <li>Sensitive or protected personal data</li>
                </ul>

                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mt-4">
                  <p className="text-red-300">Sterling is not liable for violations arising from your uploaded data. We reserve the right to suspend or terminate accounts that violate these rules.</p>
                </div>
              </section>

              {/* Section 11 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">11. Changes to This Privacy Policy</h2>
                </div>
                <p>We may update this Privacy Policy periodically. Material changes will be communicated via email or dashboard notification.</p>
                <p className="mt-3 font-semibold text-white">Continued use of the Service constitutes acceptance of the updated policy.</p>
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
