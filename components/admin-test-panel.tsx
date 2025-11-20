'use client';

import { useState, useEffect } from 'react';
import { Phone, Settings, X, Loader2 } from 'lucide-react';

interface AdminTestPanelProps {
  userId: string;
  userEmail: string;
  userName: string;
  subscriptionTier: string;
  aiSetupStatus: string;
}

export function AdminTestPanel({ 
  userId, 
  userEmail, 
  userName,
  subscriptionTier,
  aiSetupStatus 
}: AdminTestPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleLaunchAI = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Call the admin test endpoint to make a test call to +6149403824
      const response = await fetch('/api/admin/test-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          testPhoneNumber: '+16149403824', // Your test number
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start test call');
      }

      setResult({
        success: true,
        message: '🎯 Test call launched to +1 (614) 940-3824!',
        details: data,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to launch test call',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Admin Badge - Always visible */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-purple-400/50"
        title="Admin Controls"
      >
        <Settings className="w-6 h-6 animate-spin-slow" />
      </button>

      {/* Admin Panel */}
      {isOpen && (
        <div 
          className={`fixed bottom-24 right-6 z-50 bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl shadow-2xl border-2 border-purple-500/50 transition-all duration-300 ${
            isMinimized ? 'w-80 h-16' : 'w-96 max-h-[600px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-500/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
              <h3 className="text-white font-semibold">🛡️ Admin Tools</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isMinimized ? '□' : '_'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="p-6 space-y-4">
              {/* User Name */}
              <div className="text-center pb-4 border-b border-purple-500/20">
                <div className="text-sm text-gray-400 mb-1">Testing as:</div>
                <div className="text-lg font-bold text-white">{userName}</div>
              </div>

              {/* Launch AI Button - ONLY THING WE NEED */}
              <button
                onClick={handleLaunchAI}
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                  loading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/50 hover:scale-105'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Calling...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-6 h-6" />
                    <span>Launch AI Agent</span>
                  </>
                )}
              </button>
              
              <div className="text-xs text-center text-gray-400">
                📞 Will call: <span className="font-mono text-blue-400">+1 (614) 940-3824</span>
              </div>

              {/* Result Message */}
              {result && (
                <div className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-600/10 border-green-500/30 text-green-300' 
                    : 'bg-red-600/10 border-red-500/30 text-red-300'
                }`}>
                  <div className="text-sm font-medium">
                    {result.success ? '✅ ' : '❌ '}{result.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </>
  );
}

