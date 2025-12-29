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
        {/* Header - Mobile optimized */}
        <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4 sm:mb-6">
            <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            <span className="text-purple-400 font-semibold text-xs sm:text-sm">Your Privacy Matters</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-4 px-4">Privacy Policy</h1>
          <p className="text-gray-400 text-sm sm:text-base">Last updated: November 13th, 2025</p>
        </div>

        {/* Content - Mobile optimized */}
        <div className="bg-[#1A2647] rounded-xl sm:rounded-2xl p-4 sm:p-8 md:p-12 border border-gray-800 shadow-2xl">
          <div className="prose prose-invert max-w-none text-sm sm:text-base">
            <div className="space-y-6 sm:space-y-8 text-gray-300">
              <section>
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">1. Information We Collect</h2>
                <p className="mb-4">When you use Sterling, we collect only the information necessary to operate the AI dialing and appointment-booking service:</p>
                
                <h3 className="text-xl font-bold text-white mb-3 mt-6">Account Information</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Name</li>
                  <li>Email</li>
                  <li>Phone number</li>
                  <li>Company name</li>
                </ul>

                <h3 className="text-xl font-bold text-white mb-3 mt-6">Payment Information</h3>
                <p className="mb-2">Processed securely through <span className="font-bold">Stripe</span>.</p>
                <p className="font-bold text-blue-300">We never store or see your full credit card details.</p>

                <h3 className="text-xl font-bold text-white mb-3 mt-6">Usage Data</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Calls made</li>
                  <li>Minutes used</li>
                  <li>Appointments booked</li>
                  <li>AI session logs</li>
                  <li>Device and activity logs for security</li>
                </ul>

                <h3 className="text-xl font-bold text-white mb-3 mt-6">Lead Data (Uploaded by You)</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Contact information you upload for the AI to call</li>
                  <li>Lead details (name, phone, notes, tags, etc.)</li>
                </ul>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mt-3">
                  <p className="font-bold text-blue-300">
                    📌 We NEVER sell, rent, share, trade, or distribute your leads to anyone — ever.
                  </p>
                  <p className="mt-2">Your leads remain 100% private to your account.</p>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 mt-6">Referral Data</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Referral codes used</li>
                  <li>Referral relationships</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                <p className="mb-3">We use your information to:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Provide and improve the AI calling service</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Send service-related notifications and updates</li>
                  <li>Manage free trials and billing</li>
                  <li>Prevent fraud, abuse, and unauthorized use</li>
                  <li>Deliver accurate analytics and reporting</li>
                  <li>Sync appointments with your calendar (Cal.com)</li>
                </ul>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mt-4">
                  <p className="font-bold text-blue-300">
                    📌 We will NEVER use your lead data for our own marketing or share it with third parties.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Data Storage & Security</h2>
                <p className="mb-3">Your data is stored securely using:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Supabase</strong> (hosted on AWS) for encrypted databases</li>
                  <li><strong>Stripe</strong> for secure payment processing (PCI-DSS compliant)</li>
                  <li><strong>Cal.ai/Cal.com</strong> for appointment booking</li>
                  <li><strong>Encryption in transit & at rest</strong></li>
                </ul>
                <p className="mt-4">
                  We enforce strict row-level security so users can access <span className="font-bold">only their own data.</span>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Services</h2>
                <p className="mb-3">We integrate with the following trusted services:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Stripe:</strong> Payment processing</li>
                  <li><strong>Supabase:</strong> Database + authentication</li>
                  <li><strong>Cal.ai / Cal.com:</strong> Scheduling & calendar integration</li>
                </ul>
                <p className="mt-4 text-sm">
                  Each service has its own privacy policy. We only share the minimum data required for functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Cookies & Tracking</h2>
                <p className="mb-3">We only use essential cookies for:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Authentication</li>
                  <li>Session management</li>
                  <li>Preventing fraud</li>
                </ul>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mt-4">
                  <p className="font-bold text-green-300">
                    ➡️ We do NOT use advertising cookies, tracking pixels, or sell your data.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
                <p className="mb-3">You have the right to:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Access your personal data</li>
                  <li>Update or correct your information</li>
                  <li>Delete your account and all associated data</li>
                  <li>Export your data (contact support)</li>
                  <li>Opt out of non-essential emails</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Your data is stored while your account is active</li>
                  <li>If canceled, we retain data for 90 days for potential reactivation</li>
                  <li>After 90 days, all data is permanently deleted (unless required by law)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. GDPR & CCPA Compliance</h2>
                <p className="mb-3">
                  <span className="font-bold">For EU users:</span> You have rights to access, erase, rectify, and export data.
                </p>
                <p className="mb-3">
                  <span className="font-bold">For California residents:</span> We comply with CCPA — we <span className="font-bold">do not sell your personal information.</span>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
                <p>
                  Sterling is <span className="font-bold">not intended for anyone under 18.</span>
                </p>
                <p className="mt-2">
                  We do not knowingly collect data from minors.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Illegal, Non-Consented, or Prohibited Lead Uploads</h2>
                <p className="mb-3">By using Sterling, you agree to upload <span className="font-bold">only leads you are legally allowed to contact.</span></p>
                <p className="mb-3">You may <span className="font-bold">not</span> upload:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Purchased leads without consent</li>
                  <li>Numbers on Do-Not-Call lists</li>
                  <li>Leads obtained illegally</li>
                  <li>Contacts without TCPA-compliant permission</li>
                  <li>Sensitive or protected information</li>
                </ul>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mt-4">
                  <p className="font-bold text-red-300">
                    ➡️ If you upload illegal or non-consented leads, you are fully responsible. Sterling is not liable for 
                    any resulting fines, penalties, or damages.
                  </p>
                </div>
                <p className="mt-4">
                  We reserve the right to suspend or terminate accounts violating these rules.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
                <p>
                  We may update this policy as needed.
                </p>
                <p className="mt-2">
                  You'll be notified of significant changes via email or dashboard notification.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
                <p className="mb-3">
                  For privacy questions, contact:
                </p>
                <p>
                  <a href="mailto:SterlingDialer@gmail.com" className="text-blue-400 hover:text-blue-300 font-semibold text-lg">
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

