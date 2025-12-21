'use client';

import { useState } from 'react';
import { X, ChevronRight, Shield, Home, Medal, ArrowLeft } from 'lucide-react';

// Lead type values that will be stored and sent to Retell
// NULL/default = 1
// Final Expense (non-veteran) = 2
// Final Expense (veteran) = 3
// Mortgage Protection = 4
export type LeadTypeValue = 2 | 3 | 4;

export interface LeadTypeResult {
  leadType: LeadTypeValue;
  scriptType: 'final_expense' | 'mortgage_protection';
  isVeteran: boolean;
  label: string;
}

interface LeadTypeSelectorProps {
  onSelect: (result: LeadTypeResult) => void;
  onCancel: () => void;
}

type Step = 'main' | 'veteran';

export function LeadTypeSelector({ onSelect, onCancel }: LeadTypeSelectorProps) {
  const [step, setStep] = useState<Step>('main');

  const handleFinalExpense = () => {
    setStep('veteran');
  };

  const handleMortgageProtection = () => {
    onSelect({
      leadType: 4,
      scriptType: 'mortgage_protection',
      isVeteran: false,
      label: 'Mortgage Protection',
    });
  };

  const handleVeteranChoice = (isVeteran: boolean) => {
    if (isVeteran) {
      onSelect({
        leadType: 3,
        scriptType: 'final_expense',
        isVeteran: true,
        label: 'Final Expense (Veterans)',
      });
    } else {
      onSelect({
        leadType: 2,
        scriptType: 'final_expense',
        isVeteran: false,
        label: 'Final Expense',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Modal Container with Glow */}
      <div className="relative animate-in zoom-in-95 fade-in duration-300">
        {/* Background Glows */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl animate-pulse" />
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-3xl blur-xl" />

        {/* Main Modal */}
        <div className="relative bg-gradient-to-br from-[#1A2647] via-[#15203a] to-[#0F172A] rounded-2xl border border-blue-500/30 max-w-lg w-full overflow-hidden shadow-2xl shadow-blue-500/20">
          {/* Header Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          {/* Header */}
          <div className="p-6 border-b border-gray-800/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {step === 'veteran' && (
                <button
                  onClick={() => setStep('main')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all group mr-2"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              )}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {step === 'main' ? 'Select Lead Type' : 'Veteran Leads?'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {step === 'main' 
                    ? 'Choose the type of leads you\'re uploading'
                    : 'Are these veteran leads?'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-all group"
            >
              <X className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {step === 'main' ? (
              <>
                {/* Info Banner */}
                <div className="p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/30 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <p className="text-blue-300 font-semibold mb-1">Why does this matter?</p>
                    <p className="text-gray-300 text-sm">
                      This determines which AI script is used when calling these leads. Different lead types require different conversation approaches.
                    </p>
                  </div>
                </div>

                {/* Final Expense Button */}
                <button
                  onClick={handleFinalExpense}
                  className="w-full p-5 bg-gradient-to-br from-green-500/10 to-emerald-600/5 hover:from-green-500/20 hover:to-emerald-600/15 rounded-xl border-2 border-green-500/30 hover:border-green-500/60 transition-all duration-300 group text-left flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                    💚
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">
                      Final Expense
                    </h3>
                    <p className="text-gray-400 text-sm">Life insurance for seniors</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Mortgage Protection Button */}
                <button
                  onClick={handleMortgageProtection}
                  className="w-full p-5 bg-gradient-to-br from-blue-500/10 to-indigo-600/5 hover:from-blue-500/20 hover:to-indigo-600/15 rounded-xl border-2 border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 group text-left flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Home className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      Mortgage Protection
                    </h3>
                    <p className="text-gray-400 text-sm">Insurance for homeowners</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </button>
              </>
            ) : (
              <>
                {/* Veteran Question */}
                <div className="p-4 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/30 rounded-xl">
                  <p className="text-green-300 font-semibold mb-1 flex items-center gap-2">
                    <Medal className="w-5 h-5" />
                    Veteran-Specific Script
                  </p>
                  <p className="text-gray-300 text-sm">
                    Veteran leads use a specialized script that acknowledges their service.
                  </p>
                </div>

                {/* Yes - Veterans Button */}
                <button
                  onClick={() => handleVeteranChoice(true)}
                  className="w-full p-5 bg-gradient-to-br from-amber-500/10 to-orange-600/5 hover:from-amber-500/20 hover:to-orange-600/15 rounded-xl border-2 border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 group text-left flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Medal className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      Yes, Veterans
                    </h3>
                    <p className="text-gray-400 text-sm">Use veteran-specific script</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </button>

                {/* No - Regular Button */}
                <button
                  onClick={() => handleVeteranChoice(false)}
                  className="w-full p-5 bg-gradient-to-br from-gray-500/10 to-slate-600/5 hover:from-gray-500/20 hover:to-slate-600/15 rounded-xl border-2 border-gray-500/30 hover:border-gray-500/60 transition-all duration-300 group text-left flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                    👤
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-gray-300 transition-colors">
                      No, Regular Leads
                    </h3>
                    <p className="text-gray-400 text-sm">Use standard final expense script</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800/50 bg-[#0F172A]/50">
            <button
              onClick={onCancel}
              className="w-full px-6 py-4 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 border-2 border-gray-600 hover:border-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

