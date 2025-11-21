'use client';

import { useState, useEffect } from 'react';
import { DollarSign, X, Check, Zap, Sparkles, Rocket } from 'lucide-react';

interface DailyBudgetSelectorProps {
  onConfirm: (budget: number, isUnlimited: boolean) => void;
  onCancel: () => void;
}

export function DailyBudgetSelector({ onConfirm, onCancel }: DailyBudgetSelectorProps) {
  // Load last used budget from localStorage
  const [dailyBudget, setDailyBudget] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lastDailyBudget');
      return saved ? parseInt(saved) : 25;
    }
    return 25;
  });

  const handleConfirm = () => {
    // Save to localStorage for next time
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastDailyBudget', dailyBudget.toString());
    }
    onConfirm(dailyBudget, false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
      {/* Subtle Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-green-500/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>

      <div className="relative bg-gradient-to-br from-[#1A2647] via-[#1A2647] to-[#0F172A] rounded-3xl border-2 border-green-500/40 max-w-xl w-full overflow-hidden animate-in zoom-in-90 duration-700" style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.15), 0 0 80px rgba(16, 185, 129, 0.08)' }}>
        {/* Subtle Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500" style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }} />
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 p-6 overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:20px_20px]" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                  Set Daily Budget
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                </h2>
                <p className="text-green-50">Choose your spending limit for today</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/30 rounded-xl transition-all hover:scale-110 hover:rotate-90 duration-300"
            >
              <X className="w-6 h-6 text-white drop-shadow-lg" />
            </button>
          </div>
        </div>
        
        {/* Add keyframes */}
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes slide {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div className="p-6 space-y-5">
          {/* Budget Display */}
          <div className="relative">
            <div className="text-center py-6 relative">
              {/* Subtle glow behind number */}
              <div className="absolute inset-0 flex items-center justify-center blur-2xl opacity-25">
                <p className="text-7xl font-bold text-green-400">
                  ${dailyBudget}
                </p>
              </div>
              
              {/* Actual Number */}
              <p className="relative text-7xl font-black mb-4 transition-all duration-500 text-green-400" style={{
                filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.3))'
              }}>
                ${dailyBudget}
              </p>
              
              <p className="text-base font-semibold text-gray-400">
                AI stops when $${dailyBudget} is spent today
              </p>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <div className="relative p-4 bg-[#0F172A]/50 rounded-xl border border-gray-700">
              <input
                type="range"
                min="10"
                max="50"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(parseInt(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10B981 0%, #10B981 ${((dailyBudget - 10) / 40) * 100}%, #374151 ${((dailyBudget - 10) / 40) * 100}%, #374151 100%)`
                }}
              />
            </div>
            
            <div className="flex justify-between text-sm font-bold px-2">
              <span className="text-gray-500">$10</span>
              <span className="text-gray-500">$25</span>
              <span className="text-gray-500">$30</span>
              <span className="text-gray-500">$50 Max</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold mb-2">
                  💡 How Daily Budget Works
                </p>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span>Spend will <strong className="text-white">NOT</strong> go over your budget</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span>If budget is reached, AI stops for the day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span>If budget NOT met and calling hours end, AI stops</span>
                  </li>
                </ul>
                <p className="text-gray-500 text-xs mt-3 italic">
                  Calling hours: 8:00 AM - 9:00 PM
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-4 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-bold transition-all border-2 border-gray-600 hover:border-gray-500 hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="relative flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 overflow-hidden group"
              style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              
              <Rocket className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
              <span className="relative z-10">Launch AI Dialer</span>
              <Sparkles className="w-4 h-4 relative z-10 animate-pulse" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

