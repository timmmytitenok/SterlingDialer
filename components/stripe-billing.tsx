'use client';

import { useState, useEffect } from 'react';
import { CreditCard, ExternalLink, Sparkles, CheckCircle, Zap, Calendar, AlertCircle } from 'lucide-react';

interface StripeBillingProps {
  userId: string;
  userEmail: string;
  hasSubscription: boolean;
  currentTier?: 'none' | 'starter' | 'pro' | 'elite' | 'free_trial' | 'free_access';
  subscriptionData?: any;
  accountCreatedAt?: string;
  referralBonusDays?: number;
  trialEndsAt?: string;
}

export function StripeBilling({ userId, userEmail, hasSubscription, currentTier = 'none', subscriptionData, accountCreatedAt, referralBonusDays = 0, trialEndsAt }: StripeBillingProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);

  // Fetch payment method
  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const pmResponse = await fetch('/api/stripe/get-payment-method');
        if (pmResponse.ok) {
          const pmData = await pmResponse.json();
          setPaymentMethod(pmData.paymentMethod);
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
      }
    };

    if (hasSubscription) {
      fetchBillingData();
    }
  }, [hasSubscription]);

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
        } else {
          alert(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      alert('Error opening billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTierInfo = () => {
    const tiers = {
      starter: { name: 'Starter Plan', price: 499, color: 'blue' },
      pro: { name: 'Pro Plan', price: 499, color: 'purple' },
      elite: { name: 'Elite Plan', price: 1499, color: 'amber' },
      free_trial: { name: 'Free Trial', price: 0, color: 'green' },
      free_access: { name: 'VIP Access', price: 0, color: 'amber' },
    };
    return tiers[currentTier as keyof typeof tiers] || { name: 'No Plan', price: 0, color: 'gray' };
  };

  const tierInfo = getTierInfo();

  // Calculate next billing date or show appropriate status
  const getNextBillingDate = () => {
    if (currentTier === 'free_trial') {
      // Use the actual trial end date if provided
      if (trialEndsAt) {
        const trialEnd = new Date(trialEndsAt);
        const firstChargeDate = trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `Free Trial — First charge on ${firstChargeDate}`;
      }
      
      // Fallback: Calculate from start date + days
      const startDate = subscriptionData?.created_at || accountCreatedAt;
      
      if (!startDate) return 'Free Trial — First charge pending';
      
      const created = new Date(startDate);
      const trialEnd = new Date(created);
      
      // Add base 30 days + referral bonus days
      const totalTrialDays = 30 + (referralBonusDays || 0);
      
      trialEnd.setDate(created.getDate() + totalTrialDays);
      const firstChargeDate = trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      return `Free Trial — First charge on ${firstChargeDate}`;
    }
    
    if (!subscriptionData?.created_at) return 'Pending First Charge';
    
    const created = new Date(subscriptionData.created_at);
    const next = new Date(created);
    next.setDate(next.getDate() + 30);
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get billing status message
  const getBillingStatus = () => {
    if (currentTier === 'free_trial') {
      // Use the actual trial end date if provided
      if (trialEndsAt) {
        const trialEnd = new Date(trialEndsAt);
        const endDate = trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return { text: `Free Trial — Ends ${endDate}`, color: 'purple' };
      }
      
      // Fallback: Calculate from start date
      const startDate = subscriptionData?.created_at || accountCreatedAt;
      if (!startDate) return { text: 'Free Trial', color: 'purple' };
      
      const created = new Date(startDate);
      const trialEnd = new Date(created);
      const totalTrialDays = 30 + (referralBonusDays || 0);
      trialEnd.setDate(trialEnd.getDate() + totalTrialDays);
      const endDate = trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return { text: `Free Trial — Ends ${endDate}`, color: 'purple' };
    }
    return { text: 'Billing Active — Renewing Monthly', color: 'green' };
  };

  const billingStatus = getBillingStatus();

  if (currentTier === 'free_access') {
  return (
      <div className="space-y-6">
        {/* VIP Access Card - Special Gold/Yellow Theme */}
        <div className="relative bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-2xl p-10 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/30 overflow-hidden">
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-yellow-500/10 to-amber-500/0 animate-pulse" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 text-center">
            {/* Crown Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500/30 to-yellow-500/30 rounded-2xl border-2 border-amber-400/50 mb-6 shadow-lg shadow-amber-500/40">
              <Sparkles className="w-12 h-12 text-amber-400 animate-pulse" />
            </div>
            
            {/* VIP Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border-2 border-amber-400/50 rounded-full mb-4">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-amber-400 font-bold text-sm">EXCLUSIVE ACCESS</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
            
            <h2 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent mb-3">
              ✨ VIP ACCESS ✨
            </h2>
            <p className="text-lg text-amber-400/90 mb-6">Unlimited Access • Only Pay for Minutes</p>
            
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-5 mb-4">
              <p className="text-amber-300 font-semibold mb-2">🎉 You have exclusive VIP status</p>
              <p className="text-sm text-amber-400/70 mb-3">
                Enjoy unlimited access to all features — only pay for the minutes you use.
              </p>
              <p className="text-sm text-amber-300/80 italic">
                You're VIP — nothing to bill here.
              </p>
            </div>
            
            <p className="text-xs text-amber-400/60">
              Have questions about your VIP status? Contact your concierge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-blue-500/30 shadow-xl">
        {/* Plan Info */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-1">{tierInfo.name}</h2>
          <p className="text-2xl font-bold text-blue-400 mb-1">
            {tierInfo.price > 0 ? `$${tierInfo.price}` : '$0'}<span className="text-base text-gray-400 font-normal">/month</span>
          </p>
          <p className="text-sm text-gray-400 mb-3">+ $0.30 per minute for calls</p>
          
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
            billingStatus.color === 'purple'
              ? 'bg-purple-500/10 border border-purple-500/30'
              : 'bg-green-500/10 border border-green-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              billingStatus.color === 'purple' ? 'bg-purple-400' : 'bg-green-400'
            } animate-pulse`} />
            <span className={`font-medium text-xs ${
              billingStatus.color === 'purple' ? 'text-purple-400' : 'text-green-400'
            }`}>
              {billingStatus.text}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-6"></div>

        {/* Next Billing Date */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-semibold text-gray-300">Next Billing Date</p>
          </div>
          <p className="text-lg text-white font-medium pl-8">{getNextBillingDate()}</p>
              </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-6"></div>

        {/* Card on File */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-5 h-5 text-green-400" />
            <p className="text-sm font-semibold text-gray-300">Card on File</p>
                    </div>
          {paymentMethod ? (
            <div className="pl-8">
              <p className="text-lg text-white font-medium mb-2">
                {paymentMethod.brand?.charAt(0).toUpperCase()}{paymentMethod.brand?.slice(1)} •••• {paymentMethod.last4}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                This card will be used for all charges, including subscription fees, call minutes, and auto-refills.
              </p>
              </div>
          ) : (
            <p className="text-lg text-gray-500 pl-8">No payment method on file</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-6"></div>

        {/* Manage Payment Method Button */}
        <button
          onClick={handleManageBilling}
          disabled={loading}
          className="group relative overflow-hidden w-full px-6 py-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border-2 border-blue-500/40 hover:border-blue-500/60 text-blue-400 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-3"
        >
          <span className="relative z-10 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Manage Payment Method
            <ExternalLink className="w-4 h-4" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </button>

        {/* Cancel Subscription / Free Trial */}
        {hasSubscription && (
          <button
            onClick={handleManageBilling}
            className="w-full px-4 py-2 mt-4 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
          >
            {currentTier === 'free_trial' ? 'Cancel Free Trial' : 'Cancel Subscription'}
          </button>
        )}
      </div>

    </div>
  );
}
