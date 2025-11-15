'use client';

import { useState } from 'react';
import { DollarSign, X, Check, AlertCircle, Zap } from 'lucide-react';

interface DailyBudgetSelectorProps {
  onConfirm: (budget: number, isUnlimited: boolean) => void;
  onCancel: () => void;
}

export function DailyBudgetSelector({ onConfirm, onCancel }: DailyBudgetSelectorProps) {
  const [dailyBudget, setDailyBudget] = useState(25);
  const [isUnlimited, setIsUnlimited] = useState(false);

  const handleConfirm = () => {
    onConfirm(dailyBudget, isUnlimited);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-2xl border-2 border-blue-500/40 max-w-lg w-full shadow-2xl shadow-blue-500/20 animate-in slide-in-from-bottom duration-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Set Daily Budget</h2>
              <p className="text-blue-100 text-sm">How much to spend today?</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Budget Display */}
          <div className="text-center py-8">
            <p className="text-6xl font-bold text-white mb-3">
              {isUnlimited ? '∞' : `$${dailyBudget}`}
            </p>
            <p className="text-gray-400">
              {isUnlimited ? 'Run until calling hours end' : 'AI stops when budget is reached'}
            </p>
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <input
              type="range"
              min="10"
              max="101"
              value={isUnlimited ? 101 : dailyBudget}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val > 100) {
                  setIsUnlimited(true);
                } else {
                  setIsUnlimited(false);
                  setDailyBudget(val);
                }
              }}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${isUnlimited ? 100 : ((dailyBudget - 10) / 90) * 100}%, #1F2937 ${isUnlimited ? 100 : ((dailyBudget - 10) / 90) * 100}%, #1F2937 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$10</span>
              <span>$100</span>
              <span className={isUnlimited ? 'text-blue-400 font-bold' : ''}>Unlimited</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-5 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-semibold mb-2 text-sm">How Daily Budget Works:</p>
                <ul className="text-gray-300 text-sm space-y-1.5">
                  <li>✓ Spend will <strong className="text-white">NOT</strong> go over your budget</li>
                  <li>✓ If budget is reached, AI stops for the day</li>
                  <li>✓ If budget NOT met and calling hours end, AI stops</li>
                  <li>✓ "Unlimited" runs until calling hours are over</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Continue to Launch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

