'use client';

import { useState } from 'react';
import { Settings, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MaintenanceModeToggleProps {
  userId: string;
  currentStatus: string;
  setupRequestedAt?: string | null;
  setupCompletedAt?: string | null;
}

export function MaintenanceModeToggle({ 
  userId, 
  currentStatus,
  setupRequestedAt,
  setupCompletedAt
}: MaintenanceModeToggleProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleStatusChange = async (newStatus: 'ready' | 'pending_setup' | 'maintenance') => {
    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/update-setup-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          status: newStatus 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(newStatus);
        setMessage(`✅ Status updated to: ${newStatus}`);
        
        // Refresh the page to update all data
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

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'ready':
        return 'from-green-600 to-emerald-600';
      case 'pending_setup':
        return 'from-orange-600 to-amber-600';
      case 'maintenance':
        return 'from-blue-600 to-indigo-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'ready':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'pending_setup':
        return <Clock className="w-5 h-5" />;
      case 'maintenance':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-[#1A2647] rounded-xl p-8 border border-gray-800">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">AI Setup Status Control</h2>
        </div>
        <p className="text-gray-400">Control AI Control Center access for testing</p>
        <div className="mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full inline-block border border-blue-500/30">
          🔧 Test maintenance mode UI without actual subscription changes
        </div>
      </div>

      {/* Current Status Display */}
      <div className="mb-6 bg-[#0B1437] rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm font-medium">Current Status:</span>
          <div className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getStatusColor(status)} rounded-lg text-white font-semibold`}>
            {getStatusIcon(status)}
            <span className="uppercase">{status.replace('_', ' ')}</span>
          </div>
        </div>

        {setupRequestedAt && (
          <div className="text-sm text-gray-400 mb-2">
            <span className="font-medium">Setup Requested:</span> {new Date(setupRequestedAt).toLocaleString()}
          </div>
        )}

        {setupCompletedAt && (
          <div className="text-sm text-gray-400">
            <span className="font-medium">Setup Completed:</span> {new Date(setupCompletedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Status Toggle Buttons */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => handleStatusChange('ready')}
          disabled={loading || status === 'ready'}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            status === 'ready'
              ? 'bg-green-900/40 border-green-500 text-green-300'
              : 'bg-[#0B1437] border-gray-700 text-gray-400 hover:border-green-500/50 hover:text-green-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
        >
          <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
          <p className="font-semibold text-sm">Ready</p>
          <p className="text-xs opacity-75 mt-1">AI can launch</p>
        </button>

        <button
          onClick={() => handleStatusChange('pending_setup')}
          disabled={loading || status === 'pending_setup'}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            status === 'pending_setup'
              ? 'bg-orange-900/40 border-orange-500 text-orange-300'
              : 'bg-[#0B1437] border-gray-700 text-gray-400 hover:border-orange-500/50 hover:text-orange-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
        >
          <Clock className="w-6 h-6 mx-auto mb-2" />
          <p className="font-semibold text-sm">Pending Setup</p>
          <p className="text-xs opacity-75 mt-1">New subscriber</p>
        </button>

        <button
          onClick={() => handleStatusChange('maintenance')}
          disabled={loading || status === 'maintenance'}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            status === 'maintenance'
              ? 'bg-blue-900/40 border-blue-500 text-blue-300'
              : 'bg-[#0B1437] border-gray-700 text-gray-400 hover:border-blue-500/50 hover:text-blue-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
        >
          <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
          <p className="font-semibold text-sm">Maintenance</p>
          <p className="text-xs opacity-75 mt-1">Upgrading</p>
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.includes('✅') 
            ? 'bg-green-900/20 border-green-500/50 text-green-300'
            : 'bg-red-900/20 border-red-500/50 text-red-300'
        }`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          💡 <strong>How to test:</strong> Click a status button above, then navigate to "AI Control Center" to see the corresponding screen.
        </p>
      </div>
    </div>
  );
}

