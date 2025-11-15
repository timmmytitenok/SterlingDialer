'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Webhook, Copy, CheckCircle, Activity, Clock } from 'lucide-react';

interface WebhookLog {
  id: string;
  call_id: string;
  call_status: string;
  outcome: string;
  duration: number;
  timestamp: string;
  userId: string;
}

export default function AdminWebhooksPage() {
  const router = useRouter();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the webhook URL
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/retell/call-result`
      : '';
    setWebhookUrl(url);

    // Fetch recent calls (for debugging)
    fetchRecentCalls();

    // Auto-refresh every 3 seconds to show new webhooks in real-time
    const interval = setInterval(fetchRecentCalls, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentCalls = async () => {
    try {
      const response = await fetch('/api/admin/recent-calls');
      if (response.ok) {
        const data = await response.json();
        setRecentCalls(data.calls || []);
      }
    } catch (error) {
      console.error('Error fetching recent calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B1437] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-all mb-4"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Back to Admin Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Webhook className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">Retell Webhooks</h1>
              <p className="text-gray-400">Configure and monitor call result webhooks</p>
            </div>
          </div>
        </div>

        {/* Webhook URL Card */}
        <div className="bg-[#1A2647]/40 backdrop-blur-xl rounded-2xl border-2 border-gray-700/30 overflow-hidden shadow-2xl mb-6">
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-green-500/30 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-green-400" />
              Webhook Endpoint
            </h2>
            <p className="text-gray-300 text-sm mt-2">
              Configure this URL in your Retell dashboard to receive call results
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Webhook URL */}
            <div>
              <label className="text-gray-400 text-sm font-semibold block mb-2">
                POST Endpoint URL
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#0B1437] border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm text-green-400 overflow-x-auto">
                  {webhookUrl || 'Loading...'}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/60 text-green-300 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                📋 Setup Instructions
              </h3>
              <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                <li>Copy the webhook URL above</li>
                <li>Go to your <a href="https://app.retellai.com" target="_blank" className="text-blue-400 hover:underline">Retell Dashboard</a></li>
                <li>Navigate to <strong>Settings → Webhooks</strong></li>
                <li>Add a new webhook with the URL above</li>
                <li>Select event type: <code className="bg-gray-800 px-2 py-1 rounded text-xs">call.ended</code></li>
                <li>Save and test the webhook</li>
              </ol>
            </div>

            {/* What Gets Sent */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-white font-bold mb-2">📦 Expected Payload</h3>
              <p className="text-gray-300 text-sm mb-2">
                Retell will POST the following data when a call ends:
              </p>
              <pre className="bg-[#0B1437] border border-gray-700 rounded p-3 text-xs text-gray-400 overflow-x-auto">
{`{
  "call_id": "abc123...",
  "call_status": "ended",
  "start_timestamp": 1234567890,
  "end_timestamp": 1234567900,
  "transcript": "...",
  "recording_url": "...",
  "call_analysis": {...},
  "metadata": {
    "user_id": "uuid",
    "lead_id": "uuid",
    "attempt_number": 1
  }
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Recent Webhook Calls */}
        <div className="bg-[#1A2647]/40 backdrop-blur-xl rounded-2xl border-2 border-gray-700/30 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/30 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-400" />
              Recent Calls
            </h2>
            <p className="text-gray-300 text-sm mt-2">
              Last 10 calls received via webhook (refreshes automatically)
            </p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading recent calls...</p>
              </div>
            ) : recentCalls.length === 0 ? (
              <div className="text-center py-12">
                <Webhook className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No calls received yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Calls will appear here once Retell sends webhooks
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCalls.map((call, index) => (
                  <div
                    key={call.id || index}
                    className="bg-[#0B1437]/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm text-gray-400">
                        {call.call_id || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(call.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 font-semibold ${
                          call.connected ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {call.connected ? 'Answered' : 'No Answer'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Outcome:</span>
                        <span className="ml-2 text-white font-semibold">
                          {call.outcome || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 text-white font-semibold">
                          {call.duration ? `${call.duration.toFixed(1)}min` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

