'use client';

import { useState } from 'react';
import { Wallet, CreditCard } from 'lucide-react';
import { StripeBilling } from './stripe-billing';
import { CallBalanceCard } from './call-balance-card';
import { SubscriptionTierSelector } from './subscription-tier-selector';

interface BillingTabsProps {
  userId: string;
  userEmail: string;
  hasSubscription: boolean;
  currentTier: 'none' | 'starter' | 'pro' | 'elite';
  callBalance?: {
    balance: number;
    auto_refill_enabled: boolean;
    auto_refill_amount: number;
  };
}

export function BillingTabs({
  userId,
  userEmail,
  hasSubscription,
  currentTier,
  callBalance,
}: BillingTabsProps) {
  const [activeTab, setActiveTab] = useState<'billing' | 'balance'>('billing');
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-[#0B1437] rounded-xl p-2 border border-gray-800">
        <div className="flex gap-2">
          {/* Billing Management Tab */}
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'billing'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>Billing Management</span>
          </button>

          {/* Call Balance Tab */}
          <button
            onClick={() => setActiveTab('balance')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'balance'
                ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg shadow-green-500/30'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span>Call Balance</span>
          </button>
        </div>
      </div>

      {/* Tab Content with Smooth Animations */}
      <div className="relative min-h-[600px]">
        {/* Billing Management Content */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            activeTab === 'billing'
              ? 'opacity-100 scale-100 relative z-10'
              : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
          }`}
        >
          {!showUpgrade ? (
            <>
              {/* Normal Billing View */}
              <div className="bg-[#1A2647] rounded-xl p-8 border border-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Subscription & Billing</h2>
                    <p className="text-gray-400 mb-8">Manage your payment methods and invoices</p>
                  </div>
                  
                  {/* Small Upgrade Button */}
                  {hasSubscription && (
                    <button
                      onClick={() => setShowUpgrade(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-sm font-medium">Upgrade Plan</span>
                    </button>
                  )}
                </div>
                
                <StripeBilling 
                  userId={userId}
                  userEmail={userEmail} 
                  hasSubscription={hasSubscription}
                  currentTier={currentTier}
                />
              </div>
            </>
          ) : (
            /* Upgrade View */
            <div className="bg-[#1A2647] rounded-xl p-8 border border-gray-800 relative">
              {/* Back Button */}
              <button
                onClick={() => setShowUpgrade(false)}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm">Close</span>
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white mb-2">Choose Your Plan</h2>
                <p className="text-gray-400">Upgrade to unlock more features and higher call limits</p>
              </div>

              <SubscriptionTierSelector currentTier={currentTier as any} />
            </div>
          )}
        </div>

        {/* Call Balance Content */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            activeTab === 'balance'
              ? 'opacity-100 scale-100 relative z-10'
              : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
          }`}
        >
          <CallBalanceCard
            userId={userId}
            initialBalance={callBalance?.balance || 0}
            initialAutoRefill={callBalance?.auto_refill_enabled ?? false}
            initialRefillAmount={callBalance?.auto_refill_amount || 50}
            currentTier={currentTier}
          />
        </div>
      </div>
    </div>
  );
}

