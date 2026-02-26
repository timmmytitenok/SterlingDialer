'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Sparkles, User } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const hasJoinedWaitlist = success.length > 0;

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');

    if (value.length <= 10) {
      let formatted = value;
      if (value.length > 6) {
        formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
      } else if (value.length > 3) {
        formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      } else if (value.length > 0) {
        formatted = `(${value}`;
      }
      setPhoneNumber(formatted);
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        setError('Please enter a valid 10-digit phone number.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone: phoneNumber || undefined,
          message: `WAITLIST SIGNUP\n\nName: ${name}\nEmail: ${email}\nPhone: ${phoneNumber || 'Not provided'}\nSource: /signup maintenance waitlist`,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to join waitlist');
      }

      setSuccess('joined');
      setName('');
      setPhoneNumber('');
      setEmail('');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center p-4 py-26">
      {/* Animated Background - Soft gradual glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-blue-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-purple-500/8 rounded-full bottom-[-200px] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-500/20 to-gray-600/20 backdrop-blur-sm border border-gray-500/30 hover:border-gray-400/50 text-white rounded-lg transition-all duration-300 shadow-lg shadow-gray-500/20 hover:shadow-xl hover:shadow-gray-400/40 hover:scale-110 hover:from-gray-500/30 hover:to-gray-600/30 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Back to Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 mt-4 sm:mt-0">
          <div className="group relative inline-block cursor-pointer mb-2 sm:mb-3">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-all duration-300" />
            <div className="relative inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-800 via-purple-600 to-pink-600 rounded-2xl shadow-lg group-hover:scale-110 group-hover:shadow-purple-500/30 transition-all duration-300">
              <span className="text-lg sm:text-xl font-bold text-white">SD</span>
            </div>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium mb-3">
            Temporary Maintenance
          </div>
          <h1 className="text-[1.9rem] sm:text-[2.35rem] font-semibold text-white leading-[1.1] tracking-tight mb-3">
            Sterling Dialer is Down
          </h1>
          <p className="text-gray-300/90 text-base sm:text-lg leading-relaxed max-w-[34ch] mx-auto">
            Join the waitlist and we'll notify you as soon as Sterling Dialer is up and ready to use.
          </p>
        </div>

        {/* Waitlist Form */}
        <div className="bg-[#1A2647] rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm">
              <span className="block">You're on the waitlist!</span>
              <span className="block sm:hidden">We'll notify you when Sterling Dialer is ready.</span>
              <span className="hidden sm:block">We'll notify you as soon as Sterling Dialer is ready.</span>
            </div>
          )}
          {hasJoinedWaitlist && (
            <Link
              href="/"
              className="mb-4 inline-flex w-full items-center justify-center gap-2 px-4 py-3 bg-[#0B1437] border border-blue-500/30 text-blue-300 rounded-lg font-semibold hover:border-blue-400/50 hover:text-blue-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          )}

          <form onSubmit={handleJoinWaitlist} className="space-y-3.5 sm:space-y-4">
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
                  disabled={loading || hasJoinedWaitlist}
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
                  disabled={loading || hasJoinedWaitlist}
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  inputMode="numeric"
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
                  disabled={loading || hasJoinedWaitlist}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || hasJoinedWaitlist}
              className="w-full px-6 py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining Waitlist...
                </>
              ) : hasJoinedWaitlist ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Joined Waitlist
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Join Waitlist
                </>
              )}
            </button>
          </form>

          {/* Waitlist Note */}
          <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-800">
            <p className="text-xs text-gray-400 mb-2">What happens next:</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <Sparkles className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span>We'll review your waitlist request</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <Sparkles className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span>You'll get notified once Sterling Dialer is ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
