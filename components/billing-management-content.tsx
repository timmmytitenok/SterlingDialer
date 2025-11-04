'use client';

import { useState } from 'react';
import { StripeBilling } from './stripe-billing';
import { SubscriptionTierSelector } from './subscription-tier-selector';

interface BillingManagementContentProps {
  userEmail: string;
  hasSubscription: boolean;
  currentTier: 'none' | 'free_trial' | 'starter' | 'pro' | 'elite' | 'free_access';
}

export function BillingManagementContent({
  userEmail,
  hasSubscription,
  currentTier,
}: BillingManagementContentProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      {!showUpgrade ? (
        <>
          {/* Normal Billing View */}
          <div className="bg-[#1A2647] rounded-lg md:rounded-xl p-4 md:p-8 border border-gray-800">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 md:mb-2">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-1 md:mb-2">Subscription & Billing</h2>
                <p className="text-sm md:text-base text-gray-400 mb-4 md:mb-8">Manage your payment methods and invoices</p>
              </div>
              
              {/* Upgrade Button - Hide for VIP users */}
              {currentTier !== 'free_access' && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-sm font-medium">Upgrade Plan</span>
                </button>
              )}
            </div>
            
            <StripeBilling 
              userEmail={userEmail} 
              hasSubscription={hasSubscription}
              currentTier={currentTier}
            />
          </div>
        </>
      ) : (
        /* Upgrade View */
        <div className="bg-[#1A2647] rounded-lg md:rounded-xl p-4 md:p-8 border border-gray-800 relative">
          {/* Back Button */}
          <button
            onClick={() => setShowUpgrade(false)}
            className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg transition-all duration-200 text-sm z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden md:inline text-sm">Close</span>
          </button>

          <div className="mb-4 md:mb-6 pr-12 md:pr-0">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-1 md:mb-2">Choose Your Plan</h2>
            <p className="text-sm md:text-base text-gray-400">Upgrade to unlock more features and higher call limits</p>
          </div>

          <SubscriptionTierSelector currentTier={currentTier as any} />
        </div>
      )}
    </>
  );
}

