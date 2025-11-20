import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function APITestPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  // Fetch all calls with full details
  const { data: allCalls, error } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const timestamp = new Date().toISOString();

  // Group by outcome
  const byOutcome = allCalls?.reduce((acc: any, call) => {
    const outcome = call.outcome || 'no_outcome';
    acc[outcome] = (acc[outcome] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0B1437] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">🔍 Database Debug View</h1>
        <p className="text-gray-400 mb-8">Current time: {timestamp}</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400 font-bold">❌ Error:</p>
            <pre className="text-sm mt-2">{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}

        <div className="bg-[#1A2647] rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-xl font-bold mb-4">📊 Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Total Calls</p>
              <p className="text-3xl font-bold">{allCalls?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-400">User ID</p>
              <p className="text-sm font-mono break-all">{user.id}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1A2647] rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-xl font-bold mb-4">🎯 By Outcome</h2>
          <div className="space-y-2">
            {Object.entries(byOutcome || {}).map(([outcome, count]) => (
              <div key={outcome} className="flex justify-between p-2 bg-[#0B1437] rounded">
                <span className="font-mono">{outcome}</span>
                <span className="font-bold">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1A2647] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">📋 Recent Calls (Last 20)</h2>
          <div className="space-y-3">
            {allCalls && allCalls.length > 0 ? (
              allCalls.map((call) => (
                <div key={call.id} className="bg-[#0B1437] rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold">{call.contact_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">{call.contact_phone || 'No phone'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        call.outcome === 'appointment_booked' ? 'bg-green-500/20 text-green-400' :
                        call.outcome === 'not_interested' ? 'bg-red-500/20 text-red-400' :
                        call.outcome === 'callback_later' ? 'bg-orange-500/20 text-orange-400' :
                        call.outcome === 'live_transfer' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {call.outcome || 'no outcome'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Disposition: <span className="text-gray-300">{call.disposition}</span></p>
                    <p>Connected: <span className="text-gray-300">{call.connected ? 'Yes' : 'No'}</span></p>
                    <p>Duration: <span className="text-gray-300">{call.duration_seconds || 0}s</span></p>
                    <p>Created: <span className="text-gray-300">{new Date(call.created_at).toLocaleString()}</span></p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No calls found</p>
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
          <p className="text-yellow-400 font-bold mb-2">🔄 Refresh Test</p>
          <p className="text-sm text-gray-300">
            Refresh this page (Cmd+R) and check if the timestamp changes. If it doesn't, the page is cached.
          </p>
          <p className="text-sm text-gray-300 mt-2">
            Hard refresh (Cmd+Shift+R) should always show fresh data.
          </p>
        </div>
      </div>
    </div>
  );
}

