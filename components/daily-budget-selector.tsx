'use client';

import { useState } from 'react';
import { DollarSign, X, Check, Zap, Sparkles, Rocket } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl -top-40 left-1/4 animate-pulse" />
        <div className="absolute w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -bottom-40 right-1/4 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative bg-gradient-to-br from-[#1A2647] via-[#1A2647] to-[#0F172A] rounded-3xl border-2 border-green-500/40 max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in duration-500">
        {/* Animated Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 animate-pulse" />
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 p-8 overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:20px_20px] animate-pulse" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-green-500/50 animate-pulse">
                <DollarSign className="w-9 h-9 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                  Set Daily Budget
                  <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                </h2>
                <p className="text-green-100">Choose your spending limit for today</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-xl transition-all hover:scale-110"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Budget Display - GLOWY */}
          <div className="relative">
            <div className="text-center py-12 relative">
              {/* Glow Effect Behind Number */}
              <div className={`absolute inset-0 flex items-center justify-center ${
                isUnlimited 
                  ? 'blur-3xl opacity-40 animate-pulse' 
                  : 'blur-2xl opacity-30'
              }`}>
                <p className={`text-8xl font-bold ${
                  isUnlimited ? 'text-purple-400' : 'text-green-400'
                }`}>
                  {isUnlimited ? '∞' : `$${dailyBudget}`}
                </p>
              </div>
              
              {/* Actual Number */}
              <p className={`relative text-8xl font-bold mb-4 transition-all duration-300 ${
                isUnlimited 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-pulse' 
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-green-400'
              }`}>
                {isUnlimited ? '∞' : `$${dailyBudget}`}
              </p>
              
              <p className={`text-sm font-semibold ${
                isUnlimited ? 'text-purple-300' : 'text-gray-400'
              }`}>
                {isUnlimited ? '🚀 Unlimited Power Mode' : `AI stops when $${dailyBudget} is spent today`}
              </p>
            </div>
          </div>

          {/* Slider - Enhanced */}
          <div className="space-y-4">
            <div className="relative">
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
                className="w-full h-4 rounded-full appearance-none cursor-pointer transition-all"
                style={{
                  background: isUnlimited 
                    ? 'linear-gradient(to right, #10B981 0%, #8B5CF6 100%)'
                    : `linear-gradient(to right, #10B981 0%, #10B981 ${((dailyBudget - 10) / 90) * 100}%, #1F2937 ${((dailyBudget - 10) / 90) * 100}%, #1F2937 100%)`
                }}
              />
              {/* Glow under slider */}
              <div className={`absolute -inset-2 blur-xl opacity-50 pointer-events-none ${
                isUnlimited ? 'bg-purple-500' : 'bg-green-500'
              }`} />
            </div>
            
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-500">$10</span>
              <span className="text-gray-500">$25</span>
              <span className="text-gray-500">$50</span>
              <span className="text-gray-500">$75</span>
              <span className="text-gray-500">$100</span>
              <span className={`${isUnlimited ? 'text-purple-400 scale-110' : 'text-gray-500'} transition-all flex items-center gap-1`}>
                ∞ {isUnlimited && <Sparkles className="w-4 h-4 animate-pulse" />}
              </span>
            </div>
          </div>

          {/* Info Box - Glowy */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl" />
            <div className="relative p-6 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-blue-500/40 rounded-2xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold mb-3 text-base flex items-center gap-2">
                    💡 How Daily Budget Works
                  </p>
                  <ul className="text-gray-300 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 flex-shrink-0 mt-0.5">✓</span>
                      <span>Spend will <strong className="text-white">NOT</strong> go over your budget, unless it's unlimited</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 flex-shrink-0 mt-0.5">✓</span>
                      <span>If budget not met and calling hours end, AI will stop</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - GLOWY */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-4 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-bold transition-all border-2 border-gray-600 hover:border-gray-500 hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="relative flex-1 px-6 py-4 bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 hover:from-green-500 hover:via-emerald-400 hover:to-green-500 text-white rounded-xl font-bold transition-all hover:scale-110 flex items-center justify-center gap-3 overflow-hidden group shadow-2xl shadow-green-500/50"
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              
              <Rocket className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform" />
              <span className="relative z-10">Launch AI Dialer</span>
              <Sparkles className="w-5 h-5 relative z-10 animate-pulse" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

