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
  const [webhookUrl, setWebhookUrl] = useState<string>('Loading...');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Fetch webhook URL when panel opens
  useEffect(() => {
    if (isOpen && webhookUrl === 'Loading...') {
      fetch('/api/admin/get-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.webhookUrl) {
            setWebhookUrl(data.webhookUrl);
          } else {
            setWebhookUrl('Not configured');
          }
        })
        .catch(() => setWebhookUrl('Error loading'));
    }
  }, [isOpen, userId, webhookUrl]);

  const handleLaunchAI = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai-control/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          dailyCallLimit: 1,
          executionMode: 'leads',
          targetLeadCount: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start AI');
      }

      setResult({
        success: true,
        message: '🎯 AI Agent Launched! Calling first lead from Google Sheet...',
        details: data,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to launch AI agent',
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
            <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
              {/* User Info */}
              <div className="bg-[#0B1437] rounded-lg p-3 border border-purple-500/20">
                <div className="text-xs text-gray-400 mb-2">Current User</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{userName}</span>
                    <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded">
                      {subscriptionTier}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{userEmail}</div>
                  <div className="text-xs text-gray-400 font-mono break-all">
                    <div className="text-gray-500 mb-1">User ID:</div>
                    {userId}
                  </div>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="bg-[#0B1437] rounded-lg p-3 border border-purple-500/20">
                <div className="text-xs text-gray-400 mb-2">N8N Webhook URL</div>
                <div className="text-xs text-green-400 font-mono break-all">
                  {webhookUrl}
                </div>
              </div>

              {/* Launch AI Button */}
              <div className="space-y-2">
                <button
                  onClick={handleLaunchAI}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/50'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Launching AI...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      <span>Launch AI Agent</span>
                    </>
                  )}
                </button>
                <div className="text-xs text-center text-gray-500">
                  Calls 1 lead from Google Sheet
                </div>
              </div>

              {/* Result Message */}
              {result && (
                <div className={`p-3 rounded-lg border ${
                  result.success 
                    ? 'bg-green-600/10 border-green-500/30 text-green-300' 
                    : 'bg-red-600/10 border-red-500/30 text-red-300'
                }`}>
                  <div className="text-sm font-medium mb-1">
                    {result.success ? '✅ Success' : '❌ Error'}
                  </div>
                  <div className="text-xs">{result.message}</div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer hover:text-white">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="text-xs text-gray-500 text-center pt-2 border-t border-purple-500/20">
                🛡️ Admin Mode Active • Test calls use this user's N8N workflow
              </div>
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

