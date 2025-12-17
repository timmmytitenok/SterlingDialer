import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppointmentCalendar } from '@/components/appointment-calendar';
import { AppointmentStats } from '@/components/appointment-stats';
import { AddAppointmentButton } from '@/components/add-appointment-button';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  // Get all appointments
  const { data: allAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true });

  // Auto-mark past appointments as no-show (older than 5 days ago)
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  fiveDaysAgo.setHours(0, 0, 0, 0);

  // Find appointments that are past the calendar view and still "scheduled"
  const pastAppointments = allAppointments?.filter(apt => {
    const aptDate = new Date(apt.scheduled_at);
    return aptDate < fiveDaysAgo && (apt.status === 'scheduled' || apt.status === 'rescheduled');
  }) || [];

  // Auto-mark them as no-show
  if (pastAppointments.length > 0) {
    console.log(`🔄 Auto-marking ${pastAppointments.length} past appointments as no-show`);
    
    for (const apt of pastAppointments) {
      await supabase
        .from('appointments')
        .update({ 
          status: 'no_show',
          updated_at: new Date().toISOString()
        })
        .eq('id', apt.id);
    }
  }

  // Re-fetch appointments after auto-marking
  const { data: updatedAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true });

  // Active appointments - count ALL scheduled/rescheduled appointments (no date range filter)
  // This ensures the count matches what users expect to see
  const activeAppointments = updatedAppointments?.filter(apt => {
    const isActive = (apt.status === 'scheduled' || apt.status === 'rescheduled');
    // Only filter out appointments that are in the past (before today)
    const aptDate = new Date(apt.scheduled_at);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const isNotPast = aptDate >= todayStart;
    return isActive && isNotPast;
  }) || [];

  // Today's appointments
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const todayAppointments = updatedAppointments?.filter(apt => {
    const aptDate = new Date(apt.scheduled_at);
    return aptDate >= startOfToday && aptDate < endOfToday;
  }) || [];

  // Calculate stats
  const startOf7Days = new Date();
  startOf7Days.setDate(startOf7Days.getDate() - 7);
  const startOf30Days = new Date();
  startOf30Days.setDate(startOf30Days.getDate() - 30);

  const last7DaysAppointments = updatedAppointments?.filter(apt => {
    const aptDate = new Date(apt.created_at);
    return aptDate >= startOf7Days;
  }) || [];

  const last30DaysAppointments = updatedAppointments?.filter(apt => {
    const aptDate = new Date(apt.created_at);
    return aptDate >= startOf30Days;
  }) || [];

  // Get calendar settings for display hours
  const { data: calendarSettings } = await supabase
    .from('calendar_settings')
    .select('start_hour, end_hour')
    .eq('user_id', user.id)
    .single();

  // Default to 9 AM - 8 PM if no settings
  const startHour = calendarSettings?.start_hour ?? 9;
  const endHour = calendarSettings?.end_hour ?? 20;

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
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <Calendar className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                Appointments
              </h1>
              <p className="text-gray-400 mt-1">Manage and view your scheduled appointments</p>
            </div>
          </div>
          {/* Hidden for now - can be re-enabled later */}
          <div className="hidden">
            <AddAppointmentButton userId={user.id} existingAppointments={updatedAppointments || []} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Today's Appointments - LEFT */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-6 border border-green-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-300 text-sm font-medium mb-2">Today's Appointments</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-400">{todayAppointments.length}</span>
                  <span className="text-green-400/60 text-sm">scheduled</span>
                </div>
              </div>
              <div className="text-5xl">🗓️</div>
            </div>
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-green-400/80">No appointments today — your AI is still dialing and booking!</p>
            ) : (
              <p className="text-sm text-green-400/60">Appointments for today</p>
            )}
          </div>

          {/* Active Appointments - RIGHT */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-300 text-sm font-medium mb-2">Active Appointments</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-400">{activeAppointments.length}</span>
                  <span className="text-blue-400/60 text-sm">total</span>
                </div>
              </div>
              <div className="text-5xl">📅</div>
            </div>
            <p className="text-sm text-blue-400/60">Currently scheduled appointments</p>
          </div>
        </div>

        {/* Calendar View */}
        <AppointmentCalendar 
          appointments={updatedAppointments || []} 
          userId={user.id}
          startHour={startHour}
          endHour={endHour}
        />

        {/* Appointment Stats */}
        <div className="mt-8">
          <AppointmentStats
            last7Days={last7DaysAppointments}
            last30Days={last30DaysAppointments}
          />
        </div>
      </main>
    </div>
  );
}

