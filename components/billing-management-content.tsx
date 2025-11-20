'use client';

import { useState } from 'react';
import { StripeBilling } from './stripe-billing';
import { SubscriptionTierSelector } from './subscription-tier-selector';
import { CallBalanceCard } from './call-balance-card';
import { Wallet } from 'lucide-react';

interface BillingManagementContentProps {
  userId: string;
  userEmail: string;
  hasSubscription: boolean;
  currentTier: 'none' | 'free_trial' | 'starter' | 'pro' | 'elite' | 'free_access' | 'vip' | 'trial';
  subscriptionData?: any;
  accountCreatedAt?: string;
  referralBonusDays?: number;
  trialEndsAt?: string;
  // For mobile combined view
  initialBalance?: number;
  initialAutoRefill?: boolean;
  initialRefillAmount?: number;
}

export function BillingManagementContent({
  userId,
  userEmail,
  hasSubscription,
  currentTier,
  subscriptionData,
  accountCreatedAt,
  referralBonusDays,
  trialEndsAt,
  initialBalance,
  initialAutoRefill,
  initialRefillAmount,
}: BillingManagementContentProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      {/* Page Title */}
      <div className="pt-6 md:pt-8 pb-6 md:pb-8 px-4 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          <span className="md:hidden">Billing & Balance</span>
          <span className="hidden md:inline">Billing</span>
        </h1>
        <p className="text-sm md:text-base text-gray-400">
          <span className="md:hidden">Manage your subscription and call minutes</span>
          <span className="hidden md:inline">Manage your subscription and payment information</span>
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-0 space-y-8">
        {/* Call Balance Section - Mobile Only */}
        <div className="md:hidden">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-400" />
              Call Balance
            </h2>
            <p className="text-xs text-gray-400 mt-1">Manage your AI calling minutes</p>
          </div>
          <CallBalanceCard 
            userId={userId}
            initialBalance={initialBalance}
            initialAutoRefill={initialAutoRefill}
            initialRefillAmount={initialRefillAmount}
            currentTier={currentTier}
          />
        </div>

        {/* Subscription Section */}
        <div>
          <div className="mb-4 md:hidden">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Subscription
            </h2>
            <p className="text-xs text-gray-400 mt-1">Your plan and payment details</p>
          </div>
          {!showUpgrade ? (
            <StripeBilling 
              userId={userId}
              userEmail={userEmail} 
              hasSubscription={hasSubscription}
              currentTier={currentTier}
              subscriptionData={subscriptionData}
              accountCreatedAt={accountCreatedAt}
              referralBonusDays={referralBonusDays}
              trialEndsAt={trialEndsAt}
            />
          ) : (
            /* Upgrade View */
            <div className="bg-[#1A2647] rounded-xl p-8 border border-gray-800 relative">
              {/* Back Button */}
              <button
                onClick={() => setShowUpgrade(false)}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg transition-all duration-200 text-sm z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white mb-2">Choose Your Plan</h2>
                <p className="text-gray-400">Upgrade or downgrade your subscription</p>
              </div>

              <SubscriptionTierSelector currentTier={currentTier as any} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

