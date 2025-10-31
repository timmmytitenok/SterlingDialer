'use client';

import { useState } from 'react';
import { StripeBilling } from './stripe-billing';
import { SubscriptionTierSelector } from './subscription-tier-selector';
import { ArrowUpCircle, X } from 'lucide-react';

interface BillingPageWrapperProps {
  userEmail: string;
  hasSubscription: boolean;
  currentTier: 'none' | 'starter' | 'pro' | 'elite';
}

export function BillingPageWrapper({ 
  userEmail, 
  hasSubscription, 
  currentTier 
}: BillingPageWrapperProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <div className="space-y-8 relative">
      {/* Normal Billing View */}
      <div 
        className={`transition-all duration-500 ease-in-out space-y-8 ${
          showUpgrade 
            ? 'opacity-0 scale-95 pointer-events-none absolute inset-0' 
            : 'opacity-100 scale-100'
        }`}
      >
        {/* Billing Management */}
        <div className="bg-[#1A2647] rounded-xl p-8 border border-gray-800">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">Billing Management</h2>
              <p className="text-gray-400 mb-8">Manage your payment methods and invoices</p>
            </div>
            
            {/* Small Upgrade Button */}
            {hasSubscription && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <ArrowUpCircle className="w-4 h-4" />
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
      </div>

      {/* Upgrade View (Plan Selector) */}
      <div 
        className={`transition-all duration-500 ease-in-out ${
          showUpgrade 
            ? 'opacity-100 scale-100 delay-200' 
            : 'opacity-0 scale-95 pointer-events-none absolute inset-0'
        }`}
      >
        <div className="bg-[#1A2647] rounded-xl p-8 border border-gray-800 relative">
          {/* Never Mind Button */}
          <button
            onClick={() => setShowUpgrade(false)}
            className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg transition-all duration-200"
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Never mind</span>
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">Choose Your Plan</h2>
            <p className="text-gray-400">Upgrade to unlock more features and higher call limits</p>
          </div>

          <SubscriptionTierSelector currentTier={currentTier === 'none' ? null : currentTier as 'starter' | 'pro' | 'elite'} />
        </div>
      </div>
    </div>
  );
}

