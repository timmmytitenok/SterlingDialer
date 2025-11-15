'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  state?: string;
  status: string;
  times_dialed: number;
  last_dial_at?: string;
  last_call_outcome?: string;
  created_at: string;
};

type ConnectedSheet = {
  id: string;
  sheet_name: string;
  sheet_url: string;
  last_sync_at?: string;
} | null;

type Counts = {
  all: number;
  new: number;
  not_interested: number;
  no_answer: number;
  callback: number;
  booked: number;
  sold: number;
};

interface LeadsManagerProps {
  userId: string;
  connectedSheet: ConnectedSheet;
  initialCounts: Counts;
}

export function LeadsManager({ userId, connectedSheet: initialSheet, initialCounts }: LeadsManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [connectedSheet, setConnectedSheet] = useState<ConnectedSheet>(initialSheet);
  const [sheetUrl, setSheetUrl] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [syncing, setSyncing] = useState(false);

  const tabs = [
    { id: 'all', label: 'All Leads', count: counts.all, emoji: '📋' },
    { id: 'new', label: 'New', count: counts.new, emoji: '🆕' },
    { id: 'callback', label: 'Call Back', count: counts.callback, emoji: '📞' },
    { id: 'no_answer', label: 'No Answer', count: counts.no_answer, emoji: '📵' },
    { id: 'not_interested', label: 'Not Interested', count: counts.not_interested, emoji: '❌' },
    { id: 'booked', label: 'Booked', count: counts.booked, emoji: '✅' },
    { id: 'sold', label: 'Sold', count: counts.sold, emoji: '💰' },
  ];

  // Fetch leads based on active tab
  useEffect(() => {
    fetchLeads();
  }, [activeTab]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads/list?status=${activeTab}&limit=100`);
      const data = await response.json();
      
      if (data.leads) {
        setLeads(data.leads);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/google-sheets/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ ' + data.message);
        setConnectedSheet(data.sheet);
        setSheetUrl('');
        router.refresh();
      } else {
        setMessage('❌ ' + (data.error || 'Failed to connect sheet'));
      }
    } catch (error: any) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSheet = async () => {
    setSyncing(true);
    setMessage('');

    try {
      const response = await fetch('/api/google-sheets/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        await fetchLeads();
        router.refresh();
      } else {
        setMessage('❌ ' + (data.error || 'Failed to sync sheet'));
      }
    } catch (error: any) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      new: { label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      calling: { label: 'Calling...', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      no_answer: { label: 'No Answer', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      not_interested: { label: 'Not Interested', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      callback: { label: 'Call Back', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      booked: { label: 'Booked', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      sold: { label: 'Sold', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    };

    const badge = badges[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Google Sheet Connection Section */}
      <div className="bg-gradient-to-br from-green-950/50 to-emerald-950/50 rounded-lg p-6 border border-green-500/30">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span>
          Google Sheets Integration
        </h2>

        {connectedSheet ? (
          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Connected Sheet:</p>
                  <p className="text-white font-semibold">{connectedSheet.sheet_name}</p>
                  {connectedSheet.last_sync_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last synced: {new Date(connectedSheet.last_sync_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <a
                  href={connectedSheet.sheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 text-sm underline"
                >
                  Open Sheet ↗
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSyncSheet}
                disabled={syncing}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-semibold transition-all"
              >
                {syncing ? '🔄 Syncing...' : '🔄 Sync Leads'}
              </button>
              <button
                onClick={() => setConnectedSheet(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
              >
                Change Sheet
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectSheet} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Google Sheet URL
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-2 bg-black/30 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-400 mt-2">
                Make sure you've shared this sheet with <span className="text-green-400 font-semibold">SterlingDailer@gmail.com</span> as Editor
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-semibold transition-all"
            >
              {loading ? 'Connecting...' : 'Connect Sheet'}
            </button>
          </form>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.startsWith('✅') 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Leads Table Section */}
      {connectedSheet && (
        <div className="bg-gradient-to-br from-blue-950/50 to-indigo-950/50 rounded-lg p-6 border border-blue-500/30">
          <h2 className="text-xl font-bold text-white mb-4">Your Leads</h2>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-black/30 text-gray-400 hover:bg-black/50'
                }`}
              >
                {tab.emoji} {tab.label}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Leads Table */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              Loading leads...
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">
                {activeTab === 'all' 
                  ? 'No leads found. Sync your Google Sheet to import leads.'
                  : `No ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} leads.`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">Name</th>
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">Phone</th>
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">State</th>
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">Age</th>
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">Status</th>
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">Attempts</th>
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">Last Call</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-800 hover:bg-white/5">
                      <td className="py-3 px-4 text-white font-medium">{lead.name}</td>
                      <td className="py-3 px-4 text-gray-300">{lead.phone}</td>
                      <td className="py-3 px-4 text-gray-300">{lead.state || '-'}</td>
                      <td className="py-3 px-4 text-gray-300">{lead.age || '-'}</td>
                      <td className="py-3 px-4">{getStatusBadge(lead.status)}</td>
                      <td className="py-3 px-4 text-gray-300">{lead.times_dialed}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {lead.last_dial_at 
                          ? new Date(lead.last_dial_at).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

