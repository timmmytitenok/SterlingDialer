'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface DebugInfo {
  retell_api_key_set: boolean;
  user_has_config: boolean;
  config_details?: {
    has_agent_id: boolean;
    has_phone_number: boolean;
    agent_id?: string;
    phone_number?: string;
  };
  callable_leads_count: number;
  last_error?: string;
}

export default function AIDebugPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<DebugInfo | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      const response = await fetch('/api/ai-control/debug-info');
      const data = await response.json();
      setInfo(data);
    } catch (error) {
      console.error('Error loading debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCall = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ai-control/test-call', {
        method: 'POST',
      });
      
      // Handle both JSON and non-JSON responses
      const contentType = response.headers.get('content-type');
      let result: any;
      
      if (contentType?.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { error: 'Server returned non-JSON response', raw: text };
      }
      
      if (response.ok && result.success) {
        setTestResult(`✅ SUCCESS! Call initiated successfully!\n\n📞 Call ID: ${result.call_id || 'N/A'}\n\n🎉 Check your phone - you should receive a call soon!`);
      } else {
        setTestResult(`❌ ERROR: ${result.error || 'Unknown error'}\n\nDetails: ${JSON.stringify(result.details || result, null, 2)}`);
      }
    } catch (error: any) {
      setTestResult(`❌ NETWORK ERROR: ${error.message}\n\n${error.stack || ''}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1437] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1437] p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard/ai-control')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg mb-6 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Control
        </button>

        <h1 className="text-4xl font-bold text-white mb-8">🔍 AI System Debug</h1>

        {/* Checks */}
        <div className="space-y-4 mb-8">
          {/* API Key Check */}
          <div className={`p-6 rounded-xl border-2 ${info?.retell_api_key_set ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center gap-3">
              {info?.retell_api_key_set ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400" />
              )}
              <div>
                <h3 className="text-xl font-bold text-white">Retell API Key</h3>
                <p className={info?.retell_api_key_set ? 'text-green-300' : 'text-red-300'}>
                  {info?.retell_api_key_set ? '✅ SET' : '❌ NOT SET'}
                </p>
                {!info?.retell_api_key_set && (
                  <p className="text-sm text-red-200 mt-2">
                    Add RETELL_API_KEY=your_key to .env.local and restart server
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User Config Check */}
          <div className={`p-6 rounded-xl border-2 ${info?.user_has_config ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center gap-3">
              {info?.user_has_config ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400" />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">Your Retell Configuration</h3>
                <p className={info?.user_has_config ? 'text-green-300' : 'text-red-300'}>
                  {info?.user_has_config ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}
                </p>
                {info?.config_details && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className={info.config_details.has_agent_id ? 'text-green-300' : 'text-red-300'}>
                      Agent ID: {info.config_details.has_agent_id ? `✅ ${info.config_details.agent_id?.substring(0, 20)}...` : '❌ Missing'}
                    </p>
                    <p className={info.config_details.has_phone_number ? 'text-green-300' : 'text-red-300'}>
                      Phone: {info.config_details.has_phone_number ? `✅ ${info.config_details.phone_number}` : '❌ Missing'}
                    </p>
                  </div>
                )}
                {!info?.user_has_config && (
                  <p className="text-sm text-red-200 mt-2">
                    Go to Admin → Manage Users → Configure to set your Agent ID and Phone Number
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Callable Leads Check */}
          <div className={`p-6 rounded-xl border-2 ${info && info.callable_leads_count > 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center gap-3">
              {info && info.callable_leads_count > 0 ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400" />
              )}
              <div>
                <h3 className="text-xl font-bold text-white">Callable Leads</h3>
                <p className={info && info.callable_leads_count > 0 ? 'text-green-300' : 'text-red-300'}>
                  {info?.callable_leads_count || 0} leads ready to call
                </p>
                {info && info.callable_leads_count === 0 && (
                  <p className="text-sm text-red-200 mt-2">
                    Import leads from Google Sheets or add them manually
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test Call Button */}
        {info?.retell_api_key_set && info?.user_has_config && info.callable_leads_count > 0 && (
          <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-white mb-4">🧪 Test System</h3>
            <p className="text-gray-300 mb-4">
              Everything looks good! Click below to test making a call.
            </p>
            <button
              onClick={testCall}
              disabled={testing}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Testing...
                </>
              ) : (
                '🚀 Test Call Now'
              )}
            </button>

            {testResult && (
              <div className={`mt-4 p-4 rounded-lg ${testResult.includes('SUCCESS') ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                <pre className="text-white whitespace-pre-wrap font-mono text-sm">
                  {testResult}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-white mb-2">📋 What to Do:</h3>
              <ul className="space-y-2 text-gray-300">
                {!info?.retell_api_key_set && (
                  <li>1️⃣ Add RETELL_API_KEY to your .env.local file and restart server</li>
                )}
                {!info?.user_has_config && (
                  <li>2️⃣ Go to Admin → Manage Users and configure your Retell settings</li>
                )}
                {info && info.callable_leads_count === 0 && (
                  <li>3️⃣ Add some leads to your Lead Manager</li>
                )}
                {info?.retell_api_key_set && info?.user_has_config && info.callable_leads_count > 0 && (
                  <li className="text-green-300 font-bold">✅ Everything is ready! Click "Test Call Now" above!</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

