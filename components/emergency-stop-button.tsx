'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { AlertCircle, StopCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmergencyStopButtonProps {
  userId: string;
}

export function EmergencyStopButton({ userId }: EmergencyStopButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEmergencyStop = async () => {
    if (!confirm('🚨 EMERGENCY STOP\n\nThis will immediately stop the AI agent.\n\nAre you sure?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/ai-control/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setMessage('✅ AI stopped successfully!');
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        const data = await response.json();
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-950/20 border-2 border-red-500/30 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <h3 className="text-xl font-bold text-white">Emergency AI Stop</h3>
      </div>
      
      <p className="text-gray-300 text-sm mb-4">
        Use this button to manually stop the AI agent if needed during testing. 
        <span className="text-red-400 font-semibold"> This is for admin/testing only.</span>
      </p>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          message.includes('Error') || message.includes('Failed')
            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
            : 'bg-green-500/20 text-green-300 border border-green-500/30'
        }`}>
          {message}
        </div>
      )}

      <Button
        onClick={handleEmergencyStop}
        disabled={loading}
        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/40"
      >
        <StopCircle className="w-5 h-5 mr-2" />
        {loading ? 'Stopping...' : '🚨 Emergency Stop AI'}
      </Button>
    </div>
  );
}

