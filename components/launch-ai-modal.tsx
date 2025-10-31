'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { X, AlertTriangle, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LaunchAIModalProps {
  userId: string;
  initialLimit: number;
  initialTransfer: boolean;
  onClose: () => void;
  onLaunched: () => void;
}

export function LaunchAIModal({ userId, initialLimit, initialTransfer, onClose, onLaunched }: LaunchAIModalProps) {
  const router = useRouter();
  const [dailyLimit, setDailyLimit] = useState(initialLimit);
  const [liveTransfer, setLiveTransfer] = useState(initialTransfer);
  const [showWarning, setShowWarning] = useState(false);
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    setShowWarning(true);
  };

  const handleConfirm = async () => {
    setLaunching(true);

    // Show launching animation for 2 seconds, then close modal
    setTimeout(() => {
      onLaunched();
      router.refresh();
    }, 2000);

    // Start AI in background
    try {
      fetch('/api/ai-control/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, liveTransfer, dailyCallLimit: dailyLimit }),
      });
    } catch (error) {
      console.error('Error launching AI:', error);
    }
  };

  if (launching) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl animate-pulse">
              <Activity className="w-16 h-16 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 animate-ping opacity-50" />
          </div>
          <h2 className="text-3xl font-semibold text-white mb-2">Initializing AI Agent</h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (showWarning) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300">
        <div className="bg-[#1A2647] rounded-xl border border-orange-500/30 max-w-lg w-full p-8 shadow-2xl transition-transform duration-300 scale-100">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-orange-500/10 border border-orange-500/30 mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Confirm Deployment</h2>
            <p className="text-gray-400 text-sm">Please review your settings before launching</p>
          </div>

          <div className="bg-orange-950/20 border border-orange-500/20 rounded-lg p-4 mb-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              The AI Agent will run automated calls until completion. Emergency stop is available 
              but may interrupt active conversations.
            </p>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between items-center p-4 bg-[#0B1437] rounded-lg border border-gray-800">
              <span className="text-gray-400 text-sm">Daily Call Limit</span>
              <span className="text-white font-semibold">{dailyLimit} calls</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-[#0B1437] rounded-lg border border-gray-800">
              <span className="text-gray-400 text-sm">Live Transfer</span>
              <span className={`font-semibold ${liveTransfer ? 'text-emerald-400' : 'text-gray-400'}`}>
                {liveTransfer ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowWarning(false)}
              variant="outline"
              className="flex-1 border-gray-800 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 hover:border-gray-700 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-all duration-200"
            >
              Confirm & Launch
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-[#1A2647] rounded-xl border border-gray-800 max-w-lg w-full shadow-2xl transition-transform duration-300 scale-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Deploy AI Agent</h2>
            <p className="text-gray-400 text-sm mt-1">Configure calling parameters</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Daily Call Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Daily Call Limit
            </label>
            <div className="space-y-4">
              <input
                type="range"
                min="1"
                max="600"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer transition-all duration-200"
                style={{
                  background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${(dailyLimit / 600) * 100}%, #374151 ${(dailyLimit / 600) * 100}%, #374151 100%)`
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">1</span>
                <div className="text-center px-4 py-2 bg-[#0B1437] rounded-lg border border-gray-800">
                  <span className="text-3xl font-semibold text-white">{dailyLimit}</span>
                  <span className="text-gray-400 text-sm ml-2">calls</span>
                </div>
                <span className="text-gray-500 text-xs">600</span>
              </div>
            </div>
          </div>

          {/* Live Transfer Toggle */}
          <div className="p-4 bg-[#0B1437] rounded-lg border border-gray-800">
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="text-white font-medium">Live Transfer</span>
                <p className="text-xs text-gray-500 mt-1">Forward qualified leads to your line</p>
              </div>
              <div
                onClick={() => setLiveTransfer(!liveTransfer)}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                  liveTransfer ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ease-out ${
                    liveTransfer ? 'transform translate-x-7' : ''
                  }`}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Launch Button */}
        <div className="p-6 border-t border-gray-800">
          <Button
            onClick={handleLaunch}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg py-5 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
          >
            Deploy Agent
          </Button>
        </div>
      </div>
    </div>
  );
}

