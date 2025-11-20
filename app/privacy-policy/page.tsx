export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0B1437] py-12 px-4">
      <div className="max-w-4xl mx-auto bg-[#1A2647] rounded-2xl p-8 border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400">Last Updated: November 19, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">1. Information We Collect</h2>
              <p className="mb-3">We collect information you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Account Information:</strong> Name, email address, phone number, and password</li>
                <li><strong className="text-white">Payment Information:</strong> Credit card details (processed securely through Stripe)</li>
                <li><strong className="text-white">Lead Data:</strong> Contact information for leads you upload or connect via Google Sheets</li>
                <li><strong className="text-white">Call Data:</strong> Call recordings, transcripts, duration, outcomes, and metadata</li>
                <li><strong className="text-white">Usage Data:</strong> Information about how you use the Service, including features accessed and settings configured</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">2. How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process transactions and send related information</li>
                <li>Send administrative messages, updates, and security alerts</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns and optimize the Service</li>
                <li>Detect, prevent, and address technical issues and security vulnerabilities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">3. Information Sharing</h2>
              <p className="mb-3">We do not sell your personal information. We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Service Providers:</strong> We share information with third-party vendors who perform services on our behalf (Stripe for payments, Retell AI for voice services, Cal.com for calendar integration)</li>
                <li><strong className="text-white">Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests</li>
                <li><strong className="text-white">Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">4. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">5. Call Recordings</h2>
              <p>
                All calls made through the Service are recorded for quality assurance, training, and compliance purposes. By using the Service, you consent to the recording of calls. You are responsible for obtaining any necessary consent from call recipients as required by applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">6. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide you the Service. Call recordings and transcripts are stored for up to 90 days. You may request deletion of your data by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">7. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access, update, or delete your personal information</li>
                <li>Object to processing of your personal information</li>
                <li>Request restriction of processing your personal information</li>
                <li>Request transfer of your personal information</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">8. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">9. Third-Party Services</h2>
              <p className="mb-3">Our Service integrates with third-party services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Stripe:</strong> Payment processing</li>
                <li><strong className="text-white">Retell AI:</strong> Voice AI technology</li>
                <li><strong className="text-white">Cal.com:</strong> Calendar and appointment booking</li>
                <li><strong className="text-white">Google Sheets:</strong> Lead data synchronization</li>
              </ul>
              <p className="mt-3">
                These services have their own privacy policies. We encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">10. Children's Privacy</h2>
              <p>
                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">11. Changes to Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &ldquo;Last Updated&rdquo; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us:
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

