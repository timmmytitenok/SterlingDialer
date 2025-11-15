'use client';

import { useState } from 'react';
import { StripeBilling } from './stripe-billing';
import { SubscriptionTierSelector } from './subscription-tier-selector';

interface BillingManagementContentProps {
  userId: string;
  userEmail: string;
  hasSubscription: boolean;
  currentTier: 'none' | 'free_trial' | 'starter' | 'pro' | 'elite' | 'free_access';
  subscriptionData?: any;
  accountCreatedAt?: string;
  referralBonusDays?: number;
  trialEndsAt?: string;
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
}: BillingManagementContentProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Billing</h1>
        <p className="text-gray-400">Manage your subscription and payment information</p>
      </div>

      <div className="max-w-4xl">
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
    </>
  );
}

