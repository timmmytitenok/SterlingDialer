'use client';

import { useState } from 'react';
import { X, Clock, Zap, Sparkles } from 'lucide-react';

interface LeadAgeSelectorProps {
  onSave: (minAgeDays: number) => void;
  onCancel: () => void;
  sheetName: string;
  hasDateColumn: boolean;
}

export function LeadAgeSelector({ onSave, onCancel, sheetName, hasDateColumn }: LeadAgeSelectorProps) {
  const [callImmediately, setCallImmediately] = useState(true);
  const [selectedAge, setSelectedAge] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-3xl border-2 border-blue-500/30 max-w-2xl w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Lead Calling Strategy</h2>
                <p className="text-blue-100 text-sm mt-0.5">Choose when the AI should start calling</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <p className="text-gray-400 text-sm">
              Sheet: <span className="text-blue-400 font-semibold">{sheetName}</span>
            </p>
          </div>

          {/* Option 1: Call Immediately */}
          <button
                  onClick={() => {
                    setCallImmediately(true);
                    setSelectedAge(1);
                  }}
            className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
              callImmediately
                ? 'border-green-500/60 bg-green-500/10 shadow-lg shadow-green-500/20'
                : 'border-gray-700/50 bg-[#0B1437]/40 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">Call All Leads Immediately</h3>
                <p className="text-gray-400 text-sm">Start calling leads as soon as they're imported into the system</p>
              </div>
              {callImmediately && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Option 2: Wait for Lead Age */}
          <button
            onClick={() => setCallImmediately(false)}
            className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
              !callImmediately
                ? 'border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                : 'border-gray-700/50 bg-[#0B1437]/40 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">Wait for Lead Maturity</h3>
                <p className="text-gray-400 text-sm">Only call leads after they've been in the system for a certain number of days</p>
              </div>
              {!callImmediately && (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Slider (only show when waiting for age) */}
          {!callImmediately && (
            <div className="bg-[#0B1437]/60 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
              {!hasDateColumn && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-300 font-medium text-sm">
                    ⚠️ Make sure to map a "Date" column in the next step to enable age-based calling
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white font-semibold text-sm">Minimum Lead Age</label>
                  <div className="px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <span className="text-blue-300 font-bold text-lg">{selectedAge}</span>
                    <span className="text-blue-400 text-sm ml-1">{selectedAge === 1 ? 'day' : 'days'}</span>
                  </div>
                </div>
                
                        <div className="relative">
                          <input
                            type="range"
                            min="1"
                            max="31"
                            value={selectedAge}
                            onChange={(e) => setSelectedAge(parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                              background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((selectedAge - 1) / 30) * 100}%, rgb(55, 65, 81) ${((selectedAge - 1) / 30) * 100}%, rgb(55, 65, 81) 100%)`
                            }}
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>1 day</span>
                            <span>31 days</span>
                          </div>
                        </div>
                
                <p className="text-gray-400 text-sm">
                  {selectedAge >= 1 && selectedAge <= 3 && '⚡ Leads will be called after a short waiting period'}
                  {selectedAge >= 4 && selectedAge <= 7 && '📞 Leads will be called after about a week'}
                  {selectedAge >= 8 && selectedAge <= 14 && '🕐 Leads will be called after 1-2 weeks'}
                  {selectedAge >= 15 && '⏰ Leads will be called after an extended waiting period'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0B1437]/80 backdrop-blur-sm border-t border-gray-700/50 p-6 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            {callImmediately ? (
              <span>✨ Ready to call all leads immediately</span>
            ) : (
              <span>⏱️ Calling leads older than <span className="text-white font-semibold">{selectedAge} {selectedAge === 1 ? 'day' : 'days'}</span></span>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-gray-700/50 hover:bg-gray-600 backdrop-blur-sm text-white rounded-lg font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(callImmediately ? 0 : selectedAge)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              Continue to Columns →
            </button>
          </div>
        </div>

        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgb(59, 130, 246), rgb(147, 51, 234));
            cursor: pointer;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
            border: 3px solid white;
          }
          
          .slider::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgb(59, 130, 246), rgb(147, 51, 234));
            cursor: pointer;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
            border: 3px solid white;
          }
        `}</style>
      </div>
    </div>
  );
}

