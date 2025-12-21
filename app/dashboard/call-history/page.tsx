import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActivityLogsTable } from '@/components/activity-logs-table';
import { History } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default async function ActivityLogsPage() {
  console.log(`🔄 Call History loading at: ${new Date().toISOString()}`);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  // Get answered calls WITH RECORDINGS ONLY (no point showing calls without audio)
  // ALSO FILTER OUT SHORT CALLS (<10 seconds / 0.167 minutes) - these are not real conversations
  const { data: allAnsweredCalls, error } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .eq('disposition', 'answered')
    .not('recording_url', 'is', null)  // Only calls with recordings
    .neq('recording_url', '')          // Exclude empty strings too
    .gte('duration', 0.167)            // Only calls >= 10 seconds (duration is in minutes)
    .order('created_at', { ascending: false });
  
  console.log(`📋 Call History: Found ${allAnsweredCalls?.length || 0} calls with recordings (>10s)`);
  if (error) console.error('❌ Error fetching call history:', error);

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <main className="container mx-auto px-4 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
              <History className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Call History
              </h1>
              <p className="text-gray-400 mt-1">Answered calls with recordings</p>
            </div>
          </div>
        </div>

        {/* Activity Table with Filters & Pagination */}
        <ActivityLogsTable calls={allAnsweredCalls || []} />
      </main>
    </div>
  );
}

