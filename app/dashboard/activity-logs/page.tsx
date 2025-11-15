import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActivityLogsTable } from '@/components/activity-logs-table';

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
    redirect('/login');
  }

  // Get ALL answered calls (for table display)
  const { data: allAnsweredCalls, error } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .eq('disposition', 'answered')
    .order('created_at', { ascending: false });
  
  console.log(`📋 Call History: Found ${allAnsweredCalls?.length || 0} total answered calls`);
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
          <h1 className="text-3xl font-bold text-white mb-2">Call History</h1>
          <p className="text-gray-400">All answered calls with recordings and details</p>
        </div>

        {/* Activity Table with Filters & Pagination */}
        <ActivityLogsTable calls={allAnsweredCalls || []} />
      </main>
    </div>
  );
}

