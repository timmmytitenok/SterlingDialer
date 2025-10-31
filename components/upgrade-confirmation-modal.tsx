'use client';

import { AlertTriangle, ArrowRight, CreditCard, X } from 'lucide-react';

interface UpgradeConfirmationModalProps {
  currentTier: 'starter' | 'pro' | 'elite';
  newTier: 'starter' | 'pro' | 'elite';
  onConfirm: () => void;
  onCancel: () => void;
}

const TIER_INFO = {
  starter: { name: 'Starter', price: 999, color: 'blue' },
  pro: { name: 'Pro', price: 1399, color: 'purple' },
  elite: { name: 'Elite', price: 1999, color: 'amber' },
};

export function UpgradeConfirmationModal({
  currentTier,
  newTier,
  onConfirm,
  onCancel,
}: UpgradeConfirmationModalProps) {
  const current = TIER_INFO[currentTier];
  const next = TIER_INFO[newTier];
  const isUpgrade = next.price > current.price;
  const priceDiff = Math.abs(next.price - current.price);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] flex items-center justify-center p-4 pt-20 md:pt-4 overflow-y-auto">
      <div className="bg-[#1A2647] rounded-2xl border-2 border-orange-500/50 max-w-lg w-full shadow-2xl shadow-orange-500/20 animate-in zoom-in-95 duration-200 my-4">
        {/* Header */}
        <div className="relative p-4 md:p-6 pb-3 md:pb-4 border-b border-gray-700">
          <button
            onClick={onCancel}
            className="absolute top-3 md:top-4 right-3 md:right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          </button>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                {isUpgrade ? 'Confirm Plan Upgrade' : 'Confirm Plan Change'}
              </h3>
              <p className="text-xs md:text-sm text-gray-400">Please review the details below</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          {/* Plan Change Visualization */}
          <div className="bg-[#0B1437] rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-center gap-4">
              {/* Current Plan */}
              <div className="flex-1 text-center">
                <div className={`inline-block px-4 py-2 bg-${current.color}-500/10 border border-${current.color}-500/30 rounded-lg mb-2`}>
                  <p className="text-xs text-gray-400">Current Plan</p>
                  <p className={`text-lg font-bold text-${current.color}-400`}>{current.name}</p>
                </div>
                <p className="text-sm text-gray-500">${current.price}/mo</p>
              </div>

              {/* Arrow */}
              <ArrowRight className={`w-6 h-6 ${isUpgrade ? 'text-green-400' : 'text-orange-400'}`} />

              {/* New Plan */}
              <div className="flex-1 text-center">
                <div className={`inline-block px-4 py-2 bg-${next.color}-500/10 border border-${next.color}-500/30 rounded-lg mb-2`}>
                  <p className="text-xs text-gray-400">New Plan</p>
                  <p className={`text-lg font-bold text-${next.color}-400`}>{next.name}</p>
                </div>
                <p className="text-sm text-white font-semibold">${next.price}/mo</p>
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className="space-y-2 md:space-y-3">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 md:p-4">
              <div className="flex items-start gap-2 md:gap-3">
                <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-orange-400 font-semibold mb-1.5 md:mb-2 text-sm md:text-base">
                    {isUpgrade ? 'Immediate Charge Notice' : 'Billing Adjustment'}
                  </h4>
                  <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>
                        Your subscription will be <strong className="text-white">{isUpgrade ? 'upgraded' : 'changed'} immediately</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>
                        {isUpgrade ? (
                          <>You will be charged a <strong className="text-white">prorated amount</strong> for the plan difference</>
                        ) : (
                          <>A <strong className="text-white">credit</strong> will be applied to your next invoice</>
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>
                        Estimated {isUpgrade ? 'charge' : 'adjustment'}: <strong className="text-white">~${priceDiff}/mo difference</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>
                        Proration is calculated based on <strong className="text-white">remaining days</strong> in your billing cycle
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* What Changes */}
            {isUpgrade ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 md:p-4">
                <h4 className="text-green-400 font-semibold mb-1.5 md:mb-2 text-xs md:text-sm">✨ What You'll Get:</h4>
                <ul className="space-y-1 md:space-y-1.5 text-xs md:text-sm text-gray-300">
                  {/* Starter to Pro */}
                  {currentTier === 'starter' && newTier === 'pro' && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>+1 extra AI Caller (2 total)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>+600 more leads per day (1,200 total)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Priority support</span>
                      </li>
                    </>
                  )}
                  {/* Starter to Elite */}
                  {currentTier === 'starter' && newTier === 'elite' && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>+2 extra AI Callers (3 total)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>+1,200 more leads per day (1,800 total)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Priority support</span>
                      </li>
                    </>
                  )}
                  {/* Pro to Elite */}
                  {currentTier === 'pro' && newTier === 'elite' && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>+1 extra AI Caller (3 total)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>+600 more leads per day (1,800 total)</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 md:p-4">
                <h4 className="text-red-400 font-semibold mb-1.5 md:mb-2 text-xs md:text-sm">⚠️ You'll Lose:</h4>
                <ul className="space-y-1 md:space-y-1.5 text-xs md:text-sm text-gray-300">
                  {/* Elite to Pro */}
                  {currentTier === 'elite' && newTier === 'pro' && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>-1 AI Caller (down to 2 total)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>-600 leads per day (down to 1,200 total)</span>
                      </li>
                    </>
                  )}
                  {/* Elite to Starter */}
                  {currentTier === 'elite' && newTier === 'starter' && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>-2 AI Callers (down to 1 total)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>-1,200 leads per day (down to 600 total)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>Priority support</span>
                      </li>
                    </>
                  )}
                  {/* Pro to Starter */}
                  {currentTier === 'pro' && newTier === 'starter' && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>-1 AI Caller (down to 1 total)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>-600 leads per day (down to 600 total)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>Priority support</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 pt-3 md:pt-4 border-t border-gray-700 flex gap-2 md:gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r ${
              isUpgrade
                ? 'from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                : 'from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600'
            } text-white font-bold rounded-lg transition-all md:hover:scale-105 shadow-lg text-sm md:text-base`}
          >
            {isUpgrade ? '✓ Yes, Upgrade Now' : '✓ Confirm Change'}
          </button>
        </div>
      </div>
    </div>
  );
}

