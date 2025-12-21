export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0B1437] py-12 px-4">
      <div className="max-w-4xl mx-auto bg-[#1A2647] rounded-2xl p-8 border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-400">Last Updated: November 19, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Sterling AI (&ldquo;the Service&rdquo;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">2. Description of Service</h2>
              <p>
                Sterling AI provides AI-powered automated calling services to help businesses contact leads, book appointments, and manage customer relationships. The Service includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Automated AI calling and lead management</li>
                <li>Calendar integration and appointment booking</li>
                <li>Call recordings, transcripts, and analytics</li>
                <li>CRM integration and lead tracking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">3. Account Registration</h2>
              <p>
                You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">4. Subscription and Billing</h2>
              <p className="mb-3">
                <strong className="text-white">Free Trial:</strong> New users receive a 7-day free trial. Your payment method will be charged automatically when the trial ends unless you cancel before Day 7.
              </p>
              <p className="mb-3">
                <strong className="text-white">Subscription Fees:</strong> Pro Access is billed at $499/month plus $0.30 per minute for calls made by the AI agent.
              </p>
              <p className="mb-3">
                <strong className="text-white">Auto-Refill:</strong> When you enable auto-refill for call balance, your payment method will be automatically charged $25 when your balance drops below $1. You can disable auto-refill at any time.
              </p>
              <p>
                <strong className="text-white">Cancellation:</strong> You may cancel your subscription at any time. Upon cancellation, you will continue to have access until the end of your current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">5. Acceptable Use</h2>
              <p className="mb-3">You agree to use the Service only for lawful purposes and in compliance with all applicable laws and regulations, including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Telephone Consumer Protection Act (TCPA)</li>
                <li>Telemarketing Sales Rule (TSR)</li>
                <li>Do Not Call Registry compliance</li>
                <li>CAN-SPAM Act for any text messages</li>
              </ul>
              <p className="mt-3">
                You are solely responsible for ensuring your use of the AI calling service complies with all applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">6. Prohibited Activities</h2>
              <p className="mb-3">You may not use the Service to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Make calls to numbers on the National Do Not Call Registry without proper consent</li>
                <li>Harass, abuse, or harm another person</li>
                <li>Transmit any unlawful, threatening, or fraudulent communications</li>
                <li>Violate any laws or regulations</li>
                <li>Interfere with or disrupt the Service or servers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">7. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by Sterling AI and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">8. Limitation of Liability</h2>
              <p>
                Sterling AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. Our total liability shall not exceed the amount you paid to Sterling AI in the past 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">9. Disclaimer of Warranties</h2>
              <p>
                The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. Sterling AI does not guarantee that the Service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">10. Data and Privacy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of your information as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">11. Modifications to Terms</h2>
              <p>
                Sterling AI reserves the right to modify these Terms of Service at any time. We will notify users of any material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">12. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account and access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">13. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="mt-3">
                <strong className="text-white">Email:</strong>{' '}
                <a href="mailto:SterlingDialer@gmail.com" className="text-blue-400 hover:text-blue-300 underline">
                  SterlingDialer@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
          <a 
            href="/"
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

