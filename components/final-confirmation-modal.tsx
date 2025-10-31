'use client';

import { useState } from 'react';
import { Shield, CheckSquare, Square, AlertTriangle } from 'lucide-react';

interface FinalConfirmationModalProps {
  currentTier: 'starter' | 'pro' | 'elite';
  newTier: 'starter' | 'pro' | 'elite';
  onConfirm: () => void;
  onCancel: () => void;
}

const TIER_INFO = {
  starter: { name: 'Starter', price: 999 },
  pro: { name: 'Pro', price: 1399 },
  elite: { name: 'Elite', price: 1999 },
};

export function FinalConfirmationModal({
  currentTier,
  newTier,
  onConfirm,
  onCancel,
}: FinalConfirmationModalProps) {
  const [agreed, setAgreed] = useState(false);
  
  const current = TIER_INFO[currentTier];
  const next = TIER_INFO[newTier];
  const isUpgrade = next.price > current.price;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 pt-20 md:pt-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border-3 border-red-500/60 max-w-md w-full shadow-2xl shadow-red-500/30 animate-in zoom-in-95 duration-300 my-4">
        {/* Header */}
        <div className="relative p-4 md:p-6 pb-3 md:pb-4 border-b border-gray-700">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-red-500/20 flex items-center justify-center border-2 border-red-500/50">
              <Shield className="w-6 h-6 md:w-7 md:h-7 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold text-white">
                Final Confirmation Required
              </h3>
              <p className="text-xs md:text-sm text-gray-400">Please read and agree to continue</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Plan Change Summary */}
          <div className="bg-[#0B1437] rounded-lg p-3 md:p-4 border-2 border-yellow-500/40">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
              <h4 className="text-yellow-400 font-bold text-sm md:text-base">ACTION SUMMARY</h4>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-xs md:text-sm mb-1.5 md:mb-2">You are {isUpgrade ? 'upgrading' : 'downgrading'} from:</p>
              <div className="flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg">
                <span className="font-bold text-white">{current.name}</span>
                <span className="text-gray-500">→</span>
                <span className="font-bold text-yellow-400">{next.name}</span>
              </div>
              {isUpgrade && (
                <p className="text-red-400 font-bold text-sm md:text-base mt-2 md:mt-3">
                  💳 You will be charged immediately
                </p>
              )}
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="space-y-3 md:space-y-4">
            <div 
              onClick={() => setAgreed(!agreed)}
              className={`cursor-pointer bg-[#0B1437] rounded-lg p-3 md:p-5 border-2 transition-all duration-200 ${
                agreed 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0 mt-0.5 md:mt-1">
                  {agreed ? (
                    <CheckSquare className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                  ) : (
                    <Square className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold mb-1.5 md:mb-2 text-sm md:text-base">
                    {isUpgrade ? 'I Agree to Upgrade & Payment Terms' : 'I Agree to Plan Change'}
                  </p>
                  <div className="text-xs md:text-sm text-gray-300 space-y-1 md:space-y-1.5">
                    {isUpgrade ? (
                      <>
                        <p>• I understand my card will be <strong className="text-red-400">charged immediately</strong> for the prorated difference</p>
                        <p>• I understand this charge is <strong className="text-red-400">non-refundable</strong></p>
                        <p>• I understand my subscription will upgrade to <strong className="text-yellow-400">{next.name}</strong> immediately</p>
                        <p>• I have reviewed the pricing and agree to the <strong className="text-yellow-400">${next.price}/mo</strong> billing</p>
                      </>
                    ) : (
                      <>
                        <p>• I understand my subscription will change to <strong className="text-yellow-400">{next.name}</strong> immediately</p>
                        <p>• I understand my features and limits will be adjusted to the new plan</p>
                        <p>• I understand a credit will be applied for the unused portion of my current plan</p>
                        <p>• I have reviewed the new plan pricing of <strong className="text-yellow-400">${next.price}/mo</strong></p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!agreed && (
              <div className="flex items-center gap-2 text-yellow-400 text-xs md:text-sm">
                <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                <span>You must check the box above to proceed</span>
              </div>
            )}
          </div>

          {/* Legal Notice */}
          <div className="bg-gray-800/30 rounded-lg p-2.5 md:p-3 border border-gray-700">
            <p className="text-[10px] md:text-xs text-gray-400 text-center leading-relaxed">
              By proceeding, you acknowledge that you have read and agree to our terms. 
              {isUpgrade && ' All payments are processed securely through Stripe and are non-refundable.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 pt-0 flex gap-2 md:gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-sm md:text-base"
          >
            ← Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={!agreed}
            className={`flex-1 px-4 md:px-6 py-2.5 md:py-3 font-bold rounded-lg transition-all text-sm md:text-base ${
              agreed
                ? isUpgrade
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white md:hover:scale-105 shadow-lg shadow-red-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white md:hover:scale-105 shadow-lg shadow-blue-500/30'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUpgrade ? '✓ Yes, Charge Me & Upgrade' : '✓ Yes, Change Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

