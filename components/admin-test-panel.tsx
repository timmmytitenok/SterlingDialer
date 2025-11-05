'use client';

import { useState, useEffect } from 'react';
import { Phone, Settings, X, Loader2, Zap } from 'lucide-react';

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
  const [realCallLoading, setRealCallLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string>('Loading...');
  const [adminPhone, setAdminPhone] = useState<string>('');
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

  const handleTestCall = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test call failed');
      }

      setResult({
        success: true,
        message: data.message || 'Test call initiated successfully!',
        details: data,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to initiate test call',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRealCallTest = async () => {
    if (!adminPhone || adminPhone.length < 10) {
      setResult({
        success: false,
        message: 'Please enter a valid phone number',
      });
      return;
    }

    setRealCallLoading(true);
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
          adminTestPhone: adminPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start AI');
      }

      setResult({
        success: true,
        message: '🎯 AI Agent Launched! Calling first lead (you) now...',
        details: data,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to launch AI agent',
      });
    } finally {
      setRealCallLoading(false);
    }
  };

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    let formatted = '';

    if (input.length > 0) {
      formatted = '(' + input.substring(0, 3);
    }
    if (input.length >= 4) {
      formatted += ') ' + input.substring(3, 6);
    }
    if (input.length >= 7) {
      formatted += '-' + input.substring(6, 10);
    }

    setAdminPhone(formatted);
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

              {/* Admin Phone Number Input */}
              <div className="bg-[#0B1437] rounded-lg p-3 border border-blue-500/30">
                <label className="block text-xs text-gray-400 mb-2">
                  📱 Screen Your Phone Number
                </label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  className="w-full px-3 py-2 bg-[#1A2647] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="text-xs text-gray-500 mt-2">
                  💡 Enter your number to receive a real AI test call
                </div>
              </div>

              {/* Test Real Call Button - New Feature */}
              <div className="space-y-2">
                <button
                  onClick={handleRealCallTest}
                  disabled={realCallLoading || !adminPhone || adminPhone.length < 10}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    realCallLoading 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : !adminPhone || adminPhone.length < 10
                      ? 'bg-gray-700 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/50'
                  }`}
                >
                  {realCallLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Launching AI...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>🎯 Launch AI - Call Me</span>
                    </>
                  )}
                </button>
                <div className="text-xs text-center text-gray-500">
                  Reads 1 lead (you) from actual lead list
                </div>
              </div>

              {/* Test Call Button - Original */}
              <div className="space-y-2">
                <button
                  onClick={handleTestCall}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-green-500/50'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Initiating Test Call...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      <span>📞 Quick Test (ENV)</span>
                    </>
                  )}
                </button>
                <div className="text-xs text-center text-gray-500">
                  Uses ADMIN_TEST_PHONE_NUMBER from env
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

