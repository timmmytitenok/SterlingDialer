'use client';

import { useState } from 'react';
import { Globe, CheckCircle2, AlertCircle, Link as LinkIcon, Save, TestTube } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WebhookManagerProps {
  userId: string;
  currentWebhookUrl?: string | null;
  webhookEnabled?: boolean;
  lastTestedAt?: string | null;
  appointmentWebhookUrl?: string | null;
  appointmentWebhookEnabled?: boolean;
}

export function WebhookManager({ 
  userId, 
  currentWebhookUrl,
  webhookEnabled = true,
  lastTestedAt,
  appointmentWebhookUrl,
  appointmentWebhookEnabled = false
}: WebhookManagerProps) {
  const router = useRouter();
  const [webhookUrl, setWebhookUrl] = useState(currentWebhookUrl || '');
  const [enabled, setEnabled] = useState(webhookEnabled);
  const [apptWebhookUrl, setApptWebhookUrl] = useState(appointmentWebhookUrl || '');
  const [apptEnabled, setApptEnabled] = useState(appointmentWebhookEnabled);
  const [loading, setLoading] = useState(false);
  const [apptLoading, setApptLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [apptTesting, setApptTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [apptMessage, setApptMessage] = useState('');

  const isValidUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!webhookUrl.trim()) {
      setMessage('❌ Webhook URL is required');
      return;
    }

    if (!isValidUrl(webhookUrl)) {
      setMessage('❌ Invalid URL format. Must start with http:// or https://');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/update-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          webhookType: 'ai_agent',
          webhookUrl: webhookUrl.trim(),
          enabled 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ AI Agent webhook saved successfully!');
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApptSave = async () => {
    if (apptEnabled && !apptWebhookUrl.trim()) {
      setApptMessage('❌ Webhook URL is required when enabled');
      return;
    }

    if (apptWebhookUrl.trim() && !isValidUrl(apptWebhookUrl)) {
      setApptMessage('❌ Invalid URL format. Must start with http:// or https://');
      return;
    }

    setApptLoading(true);
    setApptMessage('');

    try {
      const response = await fetch('/api/admin/update-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          webhookType: 'appointment',
          webhookUrl: apptWebhookUrl.trim() || null,
          enabled: apptEnabled 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setApptMessage('✅ Appointment webhook saved successfully!');
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setApptMessage(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setApptMessage(`❌ Error: ${error.message}`);
    } finally {
      setApptLoading(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl.trim()) {
      setMessage('❌ Enter a webhook URL first');
      return;
    }

    if (!isValidUrl(webhookUrl)) {
      setMessage('❌ Invalid URL format');
      return;
    }

    setTesting(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webhookUrl: webhookUrl.trim() 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Webhook test successful! N8N responded correctly.');
        router.refresh();
      } else {
        setMessage(`❌ Test failed: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-[#1A2647] rounded-xl p-8 border border-gray-800">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">N8N Webhook Configuration</h2>
        </div>
        <p className="text-gray-400">Configure per-user N8N workflow webhook URL</p>
        <div className="mt-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded-full inline-block border border-indigo-500/30">
          🔗 Each user has their own dedicated N8N workflow
        </div>
      </div>

      {/* Current Status */}
      {currentWebhookUrl && (
        <div className="mb-6 bg-[#0B1437] rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm font-medium">Current Status:</span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              enabled 
                ? 'bg-green-900/40 border border-green-500/50 text-green-300'
                : 'bg-red-900/40 border border-red-500/50 text-red-300'
            }`}>
              {enabled ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-semibold">ACTIVE</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-semibold">DISABLED</span>
                </>
              )}
            </div>
          </div>
          {lastTestedAt && (
            <p className="text-xs text-gray-500">
              Last tested: {new Date(lastTestedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Webhook URL Input */}
      <div className="space-y-4 mb-6">
        <label className="block text-sm font-medium text-gray-300">
          AI Agent Webhook URL
        </label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://yourn8n.app.n8n.cloud/webhook/user-workflow-id"
            className="w-full pl-11 pr-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono text-sm"
          />
        </div>
        <p className="text-xs text-gray-500">
          💡 This is the webhook URL from N8N that triggers this user's AI calling workflow
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-14 h-8 rounded-full transition-all duration-200 ${
              enabled 
                ? 'bg-green-600 group-hover:bg-green-500' 
                : 'bg-gray-700 group-hover:bg-gray-600'
            }`}>
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </div>
          </div>
          <span className="text-gray-300 font-medium">
            {enabled ? 'Webhook Enabled' : 'Webhook Disabled'}
          </span>
        </label>
        <p className="text-xs text-gray-500 ml-17 mt-1">
          {enabled 
            ? '✅ AI agent can be launched' 
            : '⚠️ User cannot launch AI until enabled'}
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border mb-6 ${
          message.includes('✅') 
            ? 'bg-green-900/20 border-green-500/50 text-green-300'
            : 'bg-red-900/20 border-red-500/50 text-red-300'
        }`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleTest}
          disabled={testing || !webhookUrl.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TestTube className="w-5 h-5" />
          {testing ? 'Testing...' : 'Test Webhook'}
        </button>
        
        <button
          onClick={handleSave}
          disabled={loading || !webhookUrl.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          💡 <strong>How to get the webhook URL:</strong>
        </p>
        <ol className="text-blue-300/80 text-sm mt-2 space-y-1 ml-4 list-decimal">
          <li>Create a new N8N workflow for this user (or duplicate your template)</li>
          <li>Add a "Webhook" trigger node at the start</li>
          <li>Copy the webhook URL from N8N</li>
          <li>Paste it above and click Save</li>
          <li>Click "Test Webhook" to verify it works</li>
        </ol>
      </div>

      {/* DIVIDER */}
      <div className="my-8 border-t border-gray-700"></div>

      {/* APPOINTMENT STATUS WEBHOOK */}
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Appointment Status Webhook</h2>
            <div className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded border border-purple-500/30">
              Optional
            </div>
          </div>
          <p className="text-gray-400">Send appointment updates to N8N for reminders/confirmations</p>
        </div>

        {/* Current Status */}
        {appointmentWebhookUrl && (
          <div className="mb-6 bg-[#0B1437] rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm font-medium">Appointment Webhook:</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                apptEnabled 
                  ? 'bg-green-900/40 border border-green-500/50 text-green-300'
                  : 'bg-gray-900/40 border border-gray-500/50 text-gray-400'
              }`}>
                {apptEnabled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-semibold">ACTIVE</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold">INACTIVE</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appointment Webhook URL Input */}
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium text-gray-300">
            Appointment Webhook URL
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="url"
              value={apptWebhookUrl}
              onChange={(e) => setApptWebhookUrl(e.target.value)}
              placeholder="https://yourn8n.app.n8n.cloud/webhook/appointment-workflow-id"
              className="w-full pl-11 pr-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono text-sm"
            />
          </div>
          <p className="text-xs text-gray-500">
            💡 Optional: Webhook for appointment reminders, confirmations, or status updates
          </p>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={apptEnabled}
                onChange={(e) => setApptEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-14 h-8 rounded-full transition-all duration-200 ${
                apptEnabled 
                  ? 'bg-purple-600 group-hover:bg-purple-500' 
                  : 'bg-gray-700 group-hover:bg-gray-600'
              }`}>
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                  apptEnabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
            </div>
            <span className="text-gray-300 font-medium">
              {apptEnabled ? 'Appointment Webhook Enabled' : 'Appointment Webhook Disabled'}
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-17 mt-1">
            {apptEnabled 
              ? '✅ Appointments will trigger N8N workflow' 
              : 'ℹ️ Appointment updates won\'t trigger N8N'}
          </p>
        </div>

        {/* Appointment Message Display */}
        {apptMessage && (
          <div className={`p-4 rounded-lg border mb-6 ${
            apptMessage.includes('✅') 
              ? 'bg-green-900/20 border-green-500/50 text-green-300'
              : 'bg-red-900/20 border-red-500/50 text-red-300'
          }`}>
            <p className="text-sm font-medium">{apptMessage}</p>
          </div>
        )}

        {/* Appointment Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={async () => {
              if (!apptWebhookUrl.trim()) {
                setApptMessage('❌ Enter a webhook URL first');
                return;
              }
              if (!isValidUrl(apptWebhookUrl)) {
                setApptMessage('❌ Invalid URL format');
                return;
              }
              setApptTesting(true);
              setApptMessage('');
              try {
                const response = await fetch('/api/admin/test-webhook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ webhookUrl: apptWebhookUrl.trim() }),
                });
                const data = await response.json();
                if (response.ok) {
                  setApptMessage('✅ Webhook test successful! N8N responded correctly.');
                  router.refresh();
                } else {
                  setApptMessage(`❌ Test failed: ${data.error}`);
                }
              } catch (error: any) {
                setApptMessage(`❌ Test failed: ${error.message}`);
              } finally {
                setApptTesting(false);
              }
            }}
            disabled={apptTesting || !apptWebhookUrl.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="w-5 h-5" />
            {apptTesting ? 'Testing...' : 'Test Webhook'}
          </button>
          
          <button
            onClick={handleApptSave}
            disabled={apptLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Save className="w-5 h-5" />
            {apptLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        {/* Appointment Help Text */}
        <div className="mt-6 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <p className="text-purple-300 text-sm">
            ℹ️ <strong>Use case:</strong> Send appointment data to N8N for automated reminders, confirmations, or follow-ups.
          </p>
        </div>
      </div>
    </div>
  );
}

