import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppointmentCalendar } from '@/components/appointment-calendar';
import { AppointmentStats } from '@/components/appointment-stats';
import { AddAppointmentButton } from '@/components/add-appointment-button';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get all appointments
  const { data: allAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true });

  // Active appointments (scheduled, not cancelled)
  const activeAppointments = allAppointments?.filter(
    apt => apt.status === 'scheduled' || apt.status === 'rescheduled'
  ) || [];

  // Today's appointments
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const todayAppointments = allAppointments?.filter(apt => {
    const aptDate = new Date(apt.scheduled_at);
    return aptDate >= startOfToday && aptDate < endOfToday;
  }) || [];

  // Calculate stats
  const startOf7Days = new Date();
  startOf7Days.setDate(startOf7Days.getDate() - 7);
  const startOf30Days = new Date();
  startOf30Days.setDate(startOf30Days.getDate() - 30);

  const last7DaysAppointments = allAppointments?.filter(apt => {
    const aptDate = new Date(apt.created_at);
    return aptDate >= startOf7Days;
  }) || [];

  const last30DaysAppointments = allAppointments?.filter(apt => {
    const aptDate = new Date(apt.created_at);
    return aptDate >= startOf30Days;
  }) || [];

  // Get calendar settings for display hours
  const { data: calendarSettings } = await supabase
    .from('calendar_settings')
    .select('start_hour, end_hour')
    .eq('user_id', user.id)
    .single();

  // Default to 8 AM - 8 PM if no settings
  const startHour = calendarSettings?.start_hour ?? 8;
  const endHour = calendarSettings?.end_hour ?? 20;

  return (
    <div className="min-h-screen bg-[#0B1437]">
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Appointments</h1>
            <p className="text-gray-400">Manage and view your scheduled appointments</p>
          </div>
          <AddAppointmentButton userId={user.id} />
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
            <p className="text-sm text-green-400/60">Appointments for today</p>
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
          appointments={allAppointments || []} 
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

