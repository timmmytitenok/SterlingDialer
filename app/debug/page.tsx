'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugPage() {
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const supabase = createClient();
    
    // Get recent webhook logs
    const { data: logs } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Get recent calls
    const { data: calls } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get recent leads with their status
    const { data: leads } = await supabase
      .from('leads')
      .select('id, name, phone, status, times_dialed, last_dial_at, last_call_outcome, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    setWebhookLogs(logs || []);
    setRecentCalls(calls || []);
    setRecentLeads(leads || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Refresh every 3 seconds
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🔧 Debug Page</h1>
      
      <button 
        onClick={fetchData}
        className="mb-8 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
      >
        🔄 Refresh Now
      </button>

      {/* Recent Leads */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 text-green-400">📋 Recent Leads (by updated_at)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Times Dialed</th>
                <th className="p-3 text-left">Last Dial At</th>
                <th className="p-3 text-left">Last Outcome</th>
                <th className="p-3 text-left">Updated At</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead, i) => (
                <tr key={i} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="p-3">{lead.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      lead.status === 'no_answer' ? 'bg-orange-600' :
                      lead.status === 'new' ? 'bg-blue-600' :
                      'bg-gray-600'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-yellow-400">{lead.times_dialed || 0}</td>
                  <td className="p-3 text-xs">{lead.last_dial_at || 'NEVER'}</td>
                  <td className="p-3">{lead.last_call_outcome || '-'}</td>
                  <td className="p-3 text-xs">{new Date(lead.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Calls */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">📞 Recent Call Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3 text-left">Lead Name</th>
                <th className="p-3 text-left">Outcome</th>
                <th className="p-3 text-left">Was Double Dial</th>
                <th className="p-3 text-left">Duration</th>
                <th className="p-3 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((call, i) => (
                <tr key={i} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="p-3">{call.lead_name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      call.outcome === 'no_answer' ? 'bg-orange-600' :
                      call.outcome === 'appointment_booked' ? 'bg-green-600' :
                      'bg-gray-600'
                    }`}>
                      {call.outcome}
                    </span>
                  </td>
                  <td className="p-3">
                    {call.was_double_dial ? '✅ YES' : '❌ NO'}
                  </td>
                  <td className="p-3">{call.duration?.toFixed(2)} min</td>
                  <td className="p-3 text-xs">{new Date(call.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Webhook Logs */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">📨 Recent Webhook Logs</h2>
        <div className="space-y-4">
          {webhookLogs.map((log, i) => (
            <div key={i} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="font-bold">{log.webhook_type}</span>
                <span className="text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-sm mb-2">
                <span className="text-gray-400">Call ID:</span> {log.call_id}
              </div>
              <div className="text-sm mb-2">
                <span className="text-gray-400">Lead ID:</span> {log.lead_id}
              </div>
              <div className="text-sm mb-2">
                <span className="text-gray-400">Status:</span> {log.status}
              </div>
              {log.payload && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-400">View Payload</summary>
                  <pre className="mt-2 p-2 bg-gray-900 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

