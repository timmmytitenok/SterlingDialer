import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActivityLogsTable } from '@/components/activity-logs-table';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default async function ActivityLogsPage() {
  console.log(`🔄 Activity Logs loading at: ${new Date().toISOString()}`);
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
  
  // Get last 7 days of answered calls for stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: last7DaysAnsweredCalls, count: last7DaysCount } = await supabase
    .from('calls')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('disposition', 'answered')
    .gte('created_at', sevenDaysAgo.toISOString());
  
  console.log(`📋 Activity Logs: Found ${allAnsweredCalls?.length || 0} total answered calls, ${last7DaysCount || 0} in last 7 days`);
  if (error) console.error('❌ Error fetching activity logs:', error);
  
  // Calculate stats from last 7 days only
  const totalAnsweredLast7Days = last7DaysCount || 0;
  const bookedLast7Days = last7DaysAnsweredCalls?.filter(c => c.outcome === 'appointment_booked').length || 0;
  const callbacksLast7Days = last7DaysAnsweredCalls?.filter(c => c.outcome === 'callback_later').length || 0;
  const notInterestedLast7Days = last7DaysAnsweredCalls?.filter(c => c.outcome === 'not_interested').length || 0;

  return (
    <div className="min-h-screen bg-[#0B1437]">
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Activity Logs</h1>
          <p className="text-gray-400">All answered calls with recordings and details</p>
        </div>

        {/* Summary Stats - Last 7 Days */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Answered Calls */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">📞</span>
            </div>
            <p className="text-gray-300 text-sm mb-1 font-medium">TOTAL ANSWERED</p>
            <p className="text-4xl font-bold text-blue-400">{totalAnsweredLast7Days}</p>
            <p className="text-xs text-blue-400/60 mt-1">Last 7 days</p>
          </div>

          {/* Booked Appointments */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-6 border border-green-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-gray-300 text-sm mb-1 font-medium">BOOKED</p>
            <p className="text-4xl font-bold text-green-400">{bookedLast7Days}</p>
            <p className="text-xs text-green-400/60 mt-1">Appointments scheduled</p>
          </div>

          {/* Callbacks */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-6 border border-orange-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">📞</span>
            </div>
            <p className="text-gray-300 text-sm mb-1 font-medium">CALLBACK</p>
            <p className="text-4xl font-bold text-orange-400">{callbacksLast7Days}</p>
            <p className="text-xs text-orange-400/60 mt-1">Follow up later</p>
          </div>

          {/* Not Interested */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-6 border border-red-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">❌</span>
            </div>
            <p className="text-gray-300 text-sm mb-1 font-medium">NOT INTERESTED</p>
            <p className="text-4xl font-bold text-red-400">{notInterestedLast7Days}</p>
            <p className="text-xs text-red-400/60 mt-1">Declined offers</p>
          </div>
        </div>

        {/* Activity Table with Filters & Pagination */}
        <ActivityLogsTable calls={allAnsweredCalls || []} />
      </main>
    </div>
  );
}

