'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Mail, Lock, User, ArrowRight, Zap, CheckCircle, Phone, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create account with Supabase (disable email confirmation for faster onboarding)
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone_number: phoneNumber,
          },
          emailRedirectTo: undefined, // Don't require email confirmation
        },
      });

      if (signupError) throw signupError;

      if (data.user) {
        // Save phone number to profile
        await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            full_name: name,
            phone_number: phoneNumber,
            updated_at: new Date().toISOString(),
          });

        // Account created! Now go to trial activation page
        router.push('/trial-activate');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center p-4 py-26">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl top-20 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl bottom-20 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg transition-all hover:scale-105 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        {/* Header - MATCHES LOGIN */}
        <div className="text-center mb-4 sm:mb-6 mt-4 sm:mt-0">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-2 sm:mb-3 shadow-lg">
            <span className="text-lg sm:text-xl font-bold text-white">SA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
            Start Your Free Trial
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            Create an account to activate your 30-day trial
          </p>
        </div>

        {/* Benefits - COMPACT */}
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 font-bold text-xs">30 Days Free — No Charge Today</span>
          </div>
          <p className="text-gray-300 text-xs">
            We'll ask for a card, but you won't be charged until after your trial ends.
          </p>
        </div>

        {/* Form Card - COMPACT */}
        <div className="bg-[#1A2647] rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3.5 sm:space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Continue to Trial Activation
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* What's Next - Compact */}
          <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-800">
            <p className="text-xs text-gray-400 mb-2">What happens next:</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span>Add your card (no charge today)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span>30 days of full access</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span>Cancel anytime before trial ends</span>
              </div>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-4 sm:mt-5 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Badges - Compact on mobile */}
        <div className="mt-3 sm:mt-4 flex items-center justify-center gap-3 sm:gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Secure</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">No charge for 30 days</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}

