'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Activity } from 'lucide-react';
import { LaunchAIModal } from './launch-ai-modal';
import { createClient } from '@/lib/supabase/client';

interface AIControlCenterProps {
  userId: string;
  initialSettings: any;
  hasSubscription: boolean;
}

export function AIControlCenter({ userId, initialSettings, hasSubscription }: AIControlCenterProps) {
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [aiStatus, setAiStatus] = useState(initialSettings.status);
  const supabase = createClient();

  // Poll for AI status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('ai_control_settings')
        .select('status')
        .eq('user_id', userId)
        .single();

      if (data) {
        setAiStatus(data.status);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userId, supabase]);

  const isRunning = aiStatus === 'running';

  // Show subscription required screen if no active subscription
  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-[#0B1437] transition-all duration-300">
        <main className="container mx-auto px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">AI Control Center</h1>
            <p className="text-gray-400">Automated calling system</p>
          </div>

          {/* Subscription Required */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#1A2647] rounded-xl p-16 border border-orange-500/30 text-center">
              <div className="inline-block mb-8">
                <div className="relative w-32 h-32 rounded-2xl bg-gray-800/50 border-2 border-gray-700 flex items-center justify-center">
                  <Activity className="w-16 h-16 text-gray-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-1 bg-orange-500 rotate-45 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <h2 className="text-3xl font-semibold text-white mb-3">Subscription Required</h2>
              <p className="text-gray-400 text-lg mb-8">
                Subscribe to <span className="text-white font-semibold">Sterling Dialer Basic Plan</span> to unlock the AI calling agent
              </p>

              {/* Features List */}
              <div className="bg-[#0B1437] rounded-lg p-6 border border-gray-800 mb-8 text-left max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-white mb-4">What's Included:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300 text-sm">AI-powered calling automation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300 text-sm">Up to 600 calls per day</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300 text-sm">Live call transfer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300 text-sm">Call recordings & activity logs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300 text-sm">Appointment management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300 text-sm">Revenue tracking & analytics</span>
                  </li>
                </ul>
              </div>

              {/* Subscribe Button */}
              <a
                href="/dashboard/settings/billing"
                className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg py-5 px-10 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
              >
                View Plans & Subscribe
              </a>
              <p className="text-gray-500 text-sm mt-4">Access billing to activate your subscription</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleEmergencyStop = async () => {
    if (!confirm('Emergency Stop\n\nThis will immediately halt the AI agent and may interrupt active calls.\n\nContinue?')) {
      return;
    }

    try {
      await fetch('/api/ai-control/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      setAiStatus('stopped');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      alert('Failed to stop AI');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437] transition-all duration-300">
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 transition-opacity duration-500">
          <h1 className="text-3xl font-semibold text-white mb-2">AI Control Center</h1>
          <p className="text-gray-400">Manage your automated calling system</p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* AI Status Card */}
          <div className={`bg-[#1A2647] rounded-xl p-20 border ${isRunning ? 'border-emerald-500/30' : 'border-gray-800'} text-center transition-all duration-500 ease-out`}>
            <div className="inline-block mb-8 transition-transform duration-500" style={{ transform: isRunning ? 'scale(0.9)' : 'scale(1)' }}>
              <div className="relative">
                {isRunning && (
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-2xl" />
                )}
                <div className={`relative w-32 h-32 rounded-2xl ${isRunning ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-emerald-500' : 'bg-gray-800/50 border-gray-700'} border-2 flex items-center justify-center transition-all duration-500`}>
                  <Activity className={`w-16 h-16 ${isRunning ? 'text-emerald-400' : 'text-gray-500'} transition-all duration-500 ${isRunning ? 'animate-pulse' : ''}`} />
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-6 transition-all duration-300">Agent Status</h2>
            
            <div className={`inline-flex items-center gap-3 px-6 py-3 ${isRunning ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-gray-800/50 border-gray-700'} border rounded-lg mb-8 transition-all duration-500`}>
              <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-gray-500'} transition-all duration-300`} style={isRunning ? { animation: 'breathe 2s ease-in-out infinite' } : {}}>
                <style jsx>{`
                  @keyframes breathe {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                  }
                `}</style>
              </div>
              <span className={`text-lg font-medium ${isRunning ? 'text-emerald-400' : 'text-gray-400'} transition-colors duration-300`}>
                {isRunning ? 'Active' : 'Standby'}
              </span>
            </div>
            
            <p className="text-gray-500 transition-opacity duration-300 mb-8">
              {isRunning ? 'Automated calling session in progress' : 'Ready to deploy AI agent'}
            </p>

            {/* Action Button */}
            <div className="transition-all duration-500">
              {!isRunning ? (
                <Button
                  onClick={() => setShowLaunchModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xl py-6 px-15 rounded-lg shadow-lg hover:shadow-blue-500/30 transform hover:scale-[1.02] transition-all duration-300 ease-out"
                >
                  Launch AI Agent
                </Button>
              ) : (
                <Button
                  onClick={handleEmergencyStop}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-xl py-6 px-15 rounded-lg shadow-lg hover:shadow-red-500/30 border-2 border-red-500 transition-all duration-300"
                >
                  Emergency Stop
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Launch Modal */}
      {showLaunchModal && (
        <LaunchAIModal
          userId={userId}
          initialLimit={initialSettings.daily_call_limit}
          initialTransfer={initialSettings.auto_transfer_calls}
          onClose={() => setShowLaunchModal(false)}
          onLaunched={() => {
            setShowLaunchModal(false);
            setAiStatus('running');
          }}
        />
      )}
    </div>
  );
}

