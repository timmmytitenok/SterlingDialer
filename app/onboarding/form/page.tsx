'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Loader2, ArrowRight, ExternalLink, Calendar, Key, FileSpreadsheet, AlertCircle } from 'lucide-react';

export default function OnboardingFormPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    calApiKey: '',
    calEventId: '',
    googleSheetConfirmed: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in to continue');
        setLoading(false);
        return;
      }

      // Send onboarding data to Sterling AI team via email
      const emailResponse = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userEmail: user.email,
          userId: user.id,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to send onboarding data');
      }

      // Update profile with onboarding completion
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: `${formData.firstName} ${formData.lastName}`,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError('Failed to save. Please try again.');
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '700ms' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-6 md:py-10 overflow-y-auto max-h-screen">
        {/* Card */}
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl p-4 md:p-8 border border-gray-800 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-4 md:mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-3 shadow-lg">
              <span className="text-xl md:text-2xl font-bold text-white">SA</span>
            </div>
            <h1 className="text-xl md:text-3xl font-bold text-white mb-2">AI Onboarding Setup</h1>
            <p className="text-xs md:text-base text-gray-400">Complete these steps to activate your Sterling AI</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            
            {/* SECTION 1: Personal Information */}
            <div className="bg-gray-800/30 rounded-lg p-3 md:p-5 border border-gray-700/50">
              <h2 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-sm font-bold">1</span>
                Your Information
              </h2>
              
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="John"
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs md:text-sm"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Smith"
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs md:text-sm"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@agency.com"
                    className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs md:text-sm"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Cal.ai Setup */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-3 md:p-5 border border-purple-500/30">
              <h2 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-sm font-bold">2</span>
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                Cal.ai Calendar Setup
              </h2>

              {/* Instructions */}
              <div className="bg-gray-900/50 rounded-lg p-3 md:p-4 mb-3 md:mb-4 space-y-4 md:space-y-5">
                <p className="text-xs md:text-sm text-gray-300 font-semibold">Follow these steps:</p>
                
                {/* Step 1 */}
                <div className="space-y-2">
                  <h3 className="text-sm md:text-base font-bold text-white">Step 1:</h3>
                  <ul className="space-y-1.5 text-xs md:text-sm text-gray-400 ml-4 list-disc list-inside">
                    <li>
                      <a 
                        href="https://app.cal.com/signup" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                      >
                        Create a Cal.com account <ExternalLink className="w-3 h-3 md:w-4 md:h-4 inline" />
                      </a> (if you don't have one)
                    </li>
                    <li>
                      <a 
                        href="https://app.cal.com/settings/my-account/calendars" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                      >
                        Connect your Google Calendar <ExternalLink className="w-3 h-3 md:w-4 md:h-4 inline" />
                      </a>
                    </li>
                    <li>Configure your <strong className="text-white">timezone</strong> correctly</li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className="space-y-2">
                  <h3 className="text-sm md:text-base font-bold text-white">Step 2:</h3>
                  <ul className="space-y-1.5 text-xs md:text-sm text-gray-400 ml-4 list-disc list-inside">
                    <li>
                      <a 
                        href="https://app.cal.com/event-types" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                      >
                        Create a new event <ExternalLink className="w-3 h-3 md:w-4 md:h-4 inline" />
                      </a>
                    </li>
                    <li><strong className="text-white">Event Name:</strong> "Life Insurance" or similar</li>
                    <li><strong className="text-red-400">⚠️ IMPORTANT - Set Duration: 20 minutes (DO NOT set anything else!)</strong></li>
                    <li>Fill out basic event info (description, etc.)</li>
                    <li className="mt-2 pt-2 border-t border-gray-800">
                      <strong className="text-white">Get your Event ID:</strong>
                      <ul className="ml-4 mt-1 space-y-1 list-disc list-inside">
                        <li>While editing your event, look at the URL</li>
                        <li>Copy the <strong className="text-amber-400">7-digit number</strong> from the URL</li>
                        <li className="text-xs text-gray-500">Example: app.cal.com/event-types/<span className="text-amber-400 font-mono">3685354</span>?tabName=setup</li>
                        <li className="text-green-400 font-semibold">Paste Event ID in the field below (we need this!)</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="space-y-2">
                  <h3 className="text-sm md:text-base font-bold text-white">Step 3:</h3>
                  <p className="text-xs md:text-sm text-gray-400 ml-4 mb-2">Create an API Key:</p>
                  <ul className="space-y-1.5 text-xs md:text-sm text-gray-400 ml-4 list-disc list-inside">
                    <li>
                      Go to{' '}
                      <a 
                        href="https://app.cal.com/settings/developer/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                      >
                        API Keys page <ExternalLink className="w-3 h-3 md:w-4 md:h-4 inline" />
                      </a>
                    </li>
                    <li>Click "Add API Key"</li>
                    <li>Name it "Life Insurance" or "Sterling AI"</li>
                    <li><strong className="text-red-400">Set expiry to "Never Expire"</strong></li>
                    <li>Copy the API key immediately (you won't see it again!)</li>
                    <li className="text-green-400 font-semibold">Paste in the field below (we need this!)</li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className="space-y-2">
                  <h3 className="text-sm md:text-base font-bold text-white">Step 4:</h3>
                  <p className="text-xs md:text-sm text-gray-400 ml-4 mb-2">Create On-Booking Webhook:</p>
                  <ul className="space-y-1.5 text-xs md:text-sm text-gray-400 ml-4 list-disc list-inside">
                    <li>
                      Go to{' '}
                      <a 
                        href="https://app.cal.com/settings/developer/webhooks" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                      >
                        Webhooks page <ExternalLink className="w-3 h-3 md:w-4 md:h-4 inline" />
                      </a>
                    </li>
                    <li>Click "New Webhook"</li>
                    <li>Use this URL for testing: <span className="text-amber-400 font-mono text-xs">https://test.sterlingai.com/webhook</span></li>
                    <li>Select trigger: <strong className="text-white">"Booking Created"</strong></li>
                    <li>Click "Create"</li>
                  </ul>
                </div>
              </div>

              {/* Cal.ai Inputs */}
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                    <Key className="w-3 h-3 md:w-4 md:h-4" />
                    Cal.ai API Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.calApiKey}
                    onChange={(e) => handleInputChange('calApiKey', e.target.value)}
                    placeholder="cal_live_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs md:text-sm font-mono"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5">Event ID (7 digits) *</label>
                  <input
                    type="text"
                    required
                    value={formData.calEventId}
                    onChange={(e) => handleInputChange('calEventId', e.target.value)}
                    placeholder="3685354"
                    className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs md:text-sm font-mono"
                    disabled={loading}
                    maxLength={7}
                  />
                  <p className="text-xs text-gray-500 mt-1">From your event URL: app.cal.com/event-types/<span className="text-amber-400">XXXXXXX</span></p>
                </div>
              </div>
            </div>

            {/* SECTION 3: Google Sheets */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-3 md:p-5 border border-green-500/30">
              <h2 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                <span className="bg-green-600 text-white w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-sm font-bold">3</span>
                <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5" />
                Share Your Leads
              </h2>

              {/* Instructions */}
              <div className="bg-gray-900/50 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                <p className="text-xs md:text-sm text-gray-300 font-semibold mb-2">Share your Google Sheet:</p>
                
                <ol className="space-y-2 text-xs md:text-sm text-gray-400 list-decimal list-inside">
                  <li>Open your Google Sheet with all your leads</li>
                  <li>Click the <strong className="text-white">"Share"</strong> button (top right)</li>
                  <li>
                    Add this email: <span className="text-green-400 font-semibold">SterlingDailer@gmail.com</span>
                  </li>
                  <li>
                    Grant <strong className="text-white">"Editor"</strong> access
                    <span className="block text-xs text-gray-500 ml-6 mt-1">(You can change to "Viewer" after AI is confirmed working)</span>
                  </li>
                </ol>
              </div>

              {/* Confirmation Checkbox */}
              <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 border border-green-500/50">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.googleSheetConfirmed}
                    onChange={(e) => handleInputChange('googleSheetConfirmed', e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-gray-600 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 bg-gray-700"
                    disabled={loading}
                  />
                  <span className="text-xs md:text-sm text-gray-300">
                    <strong className="text-white">✓ I confirm</strong> that I have shared my Google Sheet with <span className="text-green-400 font-semibold">SterlingDailer@gmail.com</span> and granted <strong className="text-white">Editor</strong> access.
                  </span>
                </label>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 md:p-4 flex gap-2 md:gap-3">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs md:text-sm text-amber-300 font-semibold mb-1">Important!</p>
                <p className="text-xs md:text-sm text-amber-200">
                  Double-check all information before submitting. Our team will use these details to set up your AI agent. Incorrect information will delay your setup.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.firstName || !formData.lastName || !formData.email || !formData.calApiKey || !formData.calEventId || !formData.googleSheetConfirmed}
              className={`w-full px-4 py-3 md:px-6 md:py-4 font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base ${
                loading || !formData.firstName || !formData.lastName || !formData.email || !formData.calApiKey || !formData.calEventId || !formData.googleSheetConfirmed
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/50'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  Submitting Setup...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                  Complete Setup & Activate AI
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </>
              )}
            </button>

            {/* Skip Link */}
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              disabled={loading}
              className="w-full text-xs md:text-sm text-gray-400 hover:text-white transition-colors text-center disabled:opacity-50 py-2"
            >
              I'll complete this later
            </button>
          </form>

          {/* Help Text */}
          <div className="text-center text-xs md:text-sm text-gray-500 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-800">
            <p className="mb-1">Need help with setup?</p>
            <a href="mailto:SterlingDailer@gmail.com" className="text-blue-400 hover:text-blue-300 underline font-semibold">
              Email SterlingDailer@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

