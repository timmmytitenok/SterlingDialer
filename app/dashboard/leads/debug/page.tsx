'use client';

import { useEffect, useState } from 'react';

export default function LeadsDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/leads/debug');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Debug fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Loading debug info...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">🐛 Leads System Debug</h1>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">👤 User Info</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300"><span className="text-blue-400">ID:</span> {debugInfo?.user?.id}</p>
              <p className="text-gray-300"><span className="text-blue-400">Email:</span> {debugInfo?.user?.email}</p>
            </div>
          </div>

          {/* Environment */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">🔐 Environment</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                <span className="text-blue-400">Google Key Set:</span>{' '}
                {debugInfo?.environment?.hasGoogleKey ? (
                  <span className="text-green-400">✅ Yes</span>
                ) : (
                  <span className="text-red-400">❌ No</span>
                )}
              </p>
              <p className="text-gray-300">
                <span className="text-blue-400">Google Key Valid:</span>{' '}
                {debugInfo?.environment?.googleKeyValid ? (
                  <span className="text-green-400">✅ Valid JSON</span>
                ) : (
                  <span className="text-red-400">❌ Invalid JSON</span>
                )}
              </p>
              <p className="text-gray-300"><span className="text-blue-400">App URL:</span> {debugInfo?.environment?.appUrl || 'Not set'}</p>
            </div>
          </div>

          {/* Google Sheets */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">📊 Google Sheets</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                <span className="text-blue-400">Connected:</span>{' '}
                {debugInfo?.database?.sheets?.count > 0 ? (
                  <span className="text-green-400">✅ {debugInfo.database.sheets.count} sheet(s)</span>
                ) : (
                  <span className="text-yellow-400">⚠️ No sheets connected</span>
                )}
              </p>
              {debugInfo?.database?.sheets?.error && (
                <p className="text-red-400">Error: {debugInfo.database.sheets.error}</p>
              )}
              {debugInfo?.database?.sheets?.data?.length > 0 && (
                <div className="mt-2 p-3 bg-black rounded">
                  <pre className="text-xs text-gray-400 overflow-auto">
                    {JSON.stringify(debugInfo.database.sheets.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Leads */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">📋 Leads</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                <span className="text-blue-400">Total Leads:</span>{' '}
                {debugInfo?.database?.leads?.count > 0 ? (
                  <span className="text-green-400">✅ {debugInfo.database.leads.count} lead(s)</span>
                ) : (
                  <span className="text-yellow-400">⚠️ No leads in database</span>
                )}
              </p>
              {debugInfo?.database?.leads?.error && (
                <p className="text-red-400">Error: {debugInfo.database.leads.error}</p>
              )}
              {debugInfo?.database?.leads?.data?.length > 0 && (
                <div className="mt-2 p-3 bg-black rounded">
                  <p className="text-xs text-gray-500 mb-2">First 3 leads:</p>
                  <pre className="text-xs text-gray-400 overflow-auto">
                    {JSON.stringify(debugInfo.database.leads.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Retell Config */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">📞 Retell Config</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                <span className="text-blue-400">Configured:</span>{' '}
                {debugInfo?.database?.retellConfig?.exists ? (
                  <span className="text-green-400">✅ Yes</span>
                ) : (
                  <span className="text-yellow-400">⚠️ Not configured</span>
                )}
              </p>
              {debugInfo?.database?.retellConfig?.error && (
                <p className="text-red-400">Error: {debugInfo.database.retellConfig.error}</p>
              )}
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-blue-900/30 rounded-lg p-6 border border-blue-500/30">
            <h2 className="text-xl font-bold text-white mb-4">🎯 What to Do Next</h2>
            <div className="space-y-3 text-sm text-gray-300">
              {!debugInfo?.environment?.hasGoogleKey && (
                <p className="text-red-400">❌ Add GOOGLE_SERVICE_ACCOUNT_KEY to .env.local</p>
              )}
              {!debugInfo?.environment?.googleKeyValid && debugInfo?.environment?.hasGoogleKey && (
                <p className="text-red-400">❌ Fix GOOGLE_SERVICE_ACCOUNT_KEY format (must be valid JSON on one line)</p>
              )}
              {debugInfo?.database?.sheets?.count === 0 && (
                <p className="text-yellow-400">⚠️ Go to Leads page and connect a Google Sheet</p>
              )}
              {debugInfo?.database?.sheets?.count > 0 && debugInfo?.database?.leads?.count === 0 && (
                <p className="text-yellow-400">⚠️ Click "Sync Leads" button to import leads</p>
              )}
              {debugInfo?.database?.leads?.count > 0 && (
                <p className="text-green-400">✅ Leads are in database! Go to Leads page to view them</p>
              )}
            </div>
          </div>

          {/* Raw Data */}
          <details className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <summary className="text-xl font-bold text-white mb-4 cursor-pointer">🔍 Raw Debug Data</summary>
            <pre className="text-xs text-gray-400 overflow-auto mt-4">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>

          {/* Back Button */}
          <div className="flex gap-4">
            <a
              href="/dashboard/leads"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all"
            >
              ← Back to Leads
            </a>
            <button
              onClick={fetchDebugInfo}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

