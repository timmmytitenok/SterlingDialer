'use client';

import { useState } from 'react';
import { AppointmentModal } from './appointment-modal';
import { usePrivacy } from '@/contexts/privacy-context';

interface AppointmentCalendarProps {
  appointments: any[];
  userId: string;
  startHour?: number;
  endHour?: number;
}

export function AppointmentCalendar({ 
  appointments, 
  userId, 
  startHour = 8, 
  endHour = 20 
}: AppointmentCalendarProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { blurSensitive } = usePrivacy();

  // Generate 5 days starting from today
  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push(date);
  }

  // Find the actual min/max hours from appointments to ensure they're visible
  let actualMinHour = startHour;
  let actualMaxHour = endHour;
  
  appointments.forEach(apt => {
    if (apt.scheduled_at) {
      const aptDate = new Date(apt.scheduled_at);
      const aptHour = aptDate.getHours();
      if (aptHour < actualMinHour) actualMinHour = aptHour;
      if (aptHour > actualMaxHour) actualMaxHour = aptHour;
    }
  });
  
  // Use the expanded range that includes all appointment hours
  const effectiveStartHour = Math.min(startHour, actualMinHour);
  const effectiveEndHour = Math.max(endHour, actualMaxHour);

  // Hours based on user settings (include the end hour)
  const hourCount = effectiveEndHour - effectiveStartHour + 1;
  const hours = Array.from({ length: hourCount }, (_, i) => i + effectiveStartHour);

  // Helper: Extract customer name only (remove Cal.ai event title prefix)
  const extractCustomerName = (fullName: string | null) => {
    if (!fullName) return 'Appointment';
    
    // Common patterns to remove:
    // "Event Name - Customer Name" or "Event Name – Customer Name"
    // Just return the part after the dash/hyphen
    const dashPattern = /[-–—]\s*(.+)$/;
    const match = fullName.match(dashPattern);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If no dash found, return the whole name
    return fullName.trim();
  };

  // Helper: Format phone number nicely
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    // Return original if format unclear
    return phone;
  };

  const getAppointmentsForSlot = (day: Date, hour: number) => {
    return appointments.filter(apt => {
      // Parse the appointment time and convert to local timezone
      const aptDate = new Date(apt.scheduled_at);
      
      // Create a date at midnight for comparison (in local timezone)
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      
      return (
        aptDate.getDate() === dayStart.getDate() &&
        aptDate.getMonth() === dayStart.getMonth() &&
        aptDate.getFullYear() === dayStart.getFullYear() &&
        aptDate.getHours() === hour
      );
    });
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-[#1A2647] rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-white mb-3">Calendar View</h3>
          
          {/* Helpful Hint */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-blue-400 font-medium">💡 Tap an appointment to update the status</span>
          </div>
        </div>

        <div className="w-full">
          <div>
            {/* Days Header */}
            <div className="grid grid-cols-6 border-b border-gray-800">
              <div className="p-4 bg-[#0B1437] border-r border-gray-800">
                <span className="text-sm font-medium text-gray-400">Time</span>
              </div>
              {days.map((day, idx) => (
                <div key={idx} className="p-4 bg-[#0B1437] border-r border-gray-800 last:border-r-0">
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div>
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-6 border-b border-gray-800">
                  {/* Hour Label */}
                  <div className="p-3 border-r border-gray-800 bg-[#0B1437]/30">
                    <span className="text-sm text-gray-400">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </span>
                  </div>

                  {/* Day Columns */}
                  {days.map((day, dayIdx) => {
                    const slotAppointments = getAppointmentsForSlot(day, hour);
                    return (
                      <div key={dayIdx} className="p-2 border-r border-gray-800 last:border-r-0 min-h-[70px]">
                        {slotAppointments.map((apt) => (
                          <button
                            key={apt.id}
                            onClick={() => handleAppointmentClick(apt)}
                            className={`w-full p-2 rounded-lg text-left text-xs transition-all hover:scale-105 ${
                              apt.is_sold || apt.status === 'sold'
                                ? 'bg-yellow-900/40 border-2 border-yellow-500/70 text-yellow-300 shadow-lg shadow-yellow-500/20'
                                : apt.status === 'no_show' || apt.is_no_show
                                ? 'bg-red-900/40 border border-red-500/50 text-red-300'
                                : apt.status === 'completed'
                                ? 'bg-green-900/40 border border-green-500/50 text-green-300'
                                : 'bg-blue-900/40 border border-blue-500/50 text-blue-300 hover:bg-blue-900/60'
                            }`}
                          >
                            <div className="font-medium truncate flex items-center gap-1">
                              {apt.is_sold && <span>💰</span>}
                              {extractCustomerName(apt.prospect_name)}
                            </div>
                            <div className="text-[10px] opacity-75 truncate">
                              {new Date(apt.scheduled_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-gray-800 bg-[#0B1437] flex gap-6 justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-900/40 border border-blue-500/50" />
            <span className="text-xs text-gray-400">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-900/40 border border-green-500/50" />
            <span className="text-xs text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-900/40 border-2 border-yellow-500/70" />
            <span className="text-xs text-gray-400">💰 Sold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-900/40 border border-red-500/50" />
            <span className="text-xs text-gray-400">No-Show</span>
          </div>
        </div>

        {/* All Upcoming Appointments List (fallback view) */}
        {appointments.filter(apt => 
          (apt.status === 'scheduled' || apt.status === 'rescheduled') && 
          new Date(apt.scheduled_at) >= new Date()
        ).length > 0 && (
          <div className="p-4 border-t border-gray-800 bg-[#0B1437]/50">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">📋 All Upcoming Appointments</h4>
            <div className="space-y-2">
              {appointments
                .filter(apt => 
                  (apt.status === 'scheduled' || apt.status === 'rescheduled') && 
                  new Date(apt.scheduled_at) >= new Date(new Date().setHours(0,0,0,0))
                )
                .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                .map(apt => (
                  <button
                    key={`list-${apt.id}`}
                    onClick={() => handleAppointmentClick(apt)}
                    className="w-full p-3 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 rounded-lg text-left transition-all flex justify-between items-center"
                  >
                    <div>
                      <span className="text-white font-medium">
                        {extractCustomerName(apt.prospect_name)}
                      </span>
                      {apt.prospect_phone && (
                        <span 
                          className={`text-gray-400 text-sm ml-2 ${blurSensitive ? 'blur-sm select-none' : ''}`}
                          style={blurSensitive ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
                        >
                          {formatPhoneNumber(apt.prospect_phone)}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-blue-400 text-sm font-medium">
                        {new Date(apt.scheduled_at).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(apt.scheduled_at).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                    </div>
                  </button>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* Appointment Modal */}
      {isModalOpen && selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          userId={userId}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </>
  );
}

