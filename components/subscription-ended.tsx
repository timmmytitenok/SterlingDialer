'use client';

import { Calendar, CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionEndedProps {
  wasFreeTrial?: boolean;
  endDate?: string;
}

export function SubscriptionEnded({ wasFreeTrial = false, endDate }: SubscriptionEndedProps) {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full mb-6 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20">
            <Calendar className="w-12 h-12 text-amber-400" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {wasFreeTrial ? 'Your Free Trial Has Ended' : 'Your Subscription Has Ended'}
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-400 mb-2">
            {wasFreeTrial 
              ? 'Thanks for trying Sterling AI!' 
              : 'Your subscription period has ended'}
          </p>
          {endDate && (
            <p className="text-sm text-gray-500">
              Ended on {new Date(endDate).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          )}
        </div>

        {/* What You Still Have Access To */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/30 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-green-400" />
            You Still Have Access To:
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-gray-300">
              <span className="text-green-400 text-xl">✓</span>
              <span><strong className="text-white">Your Dashboard</strong> - View all your data and metrics</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300">
              <span className="text-green-400 text-xl">✓</span>
              <span><strong className="text-white">Leads & Appointments</strong> - Access all your contact information</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300">
              <span className="text-green-400 text-xl">✓</span>
              <span><strong className="text-white">Call History</strong> - Review past calls and outcomes</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300">
              <span className="text-green-400 text-xl">✓</span>
              <span><strong className="text-white">Account Settings</strong> - Manage your profile and preferences</span>
            </li>
          </ul>
        </div>

        {/* What's Blocked */}
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-8 border border-red-500/30 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-red-400" />
            Subscription Required For:
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-gray-300">
              <span className="text-red-400 text-xl">✗</span>
              <span><strong className="text-white">AI Dialer</strong> - Make automated calls to leads</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300">
              <span className="text-red-400 text-xl">✗</span>
              <span><strong className="text-white">Auto Schedule</strong> - Automatically start calling sessions</span>
            </li>
          </ul>
        </div>

        {/* Reactivate CTA */}
        <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-2xl p-8 border-2 border-blue-500/30 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Continue?
          </h2>
          <p className="text-gray-300 mb-6 text-lg">
            Reactivate your subscription to unlock AI calling and auto scheduling.
          </p>
          
          {/* Reactivate Button */}
          <Link href="/dashboard/settings/billing">
            <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2 mx-auto">
              <CreditCard className="w-6 h-6" />
              Reactivate Subscription
              <ArrowRight className="w-6 h-6" />
            </button>
          </Link>

          <p className="text-sm text-gray-500 mt-4">
            Get instant access to all features as soon as you subscribe
          </p>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Have questions?{' '}
            <Link href="/dashboard/settings/profile" className="text-blue-400 hover:text-blue-300 underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

