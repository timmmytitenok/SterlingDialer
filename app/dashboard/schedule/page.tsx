'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Lock, Unlock, Loader2, Check, X, 
  AlertTriangle, Sparkles, Clock, Bot, CalendarDays, Settings2, Zap,
  Sun, Moon, Coffee, Sunset, CalendarCheck
} from 'lucide-react';

// Day names for the week selector
const DAYS_OF_WEEK = [
  { id: 0, short: 'Sun', full: 'Sunday' },
  { id: 1, short: 'Mon', full: 'Monday' },
  { id: 2, short: 'Tue', full: 'Tuesday' },
  { id: 3, short: 'Wed', full: 'Wednesday' },
  { id: 4, short: 'Thu', full: 'Thursday' },
  { id: 5, short: 'Fri', full: 'Friday' },
  { id: 6, short: 'Sat', full: 'Saturday' },
];

// Buffer options
const BUFFER_OPTIONS = [
  { value: 0, label: 'Same day', description: 'Can book for later today' },
  { value: 1, label: 'Next day', description: 'Earliest is tomorrow' },
  { value: 2, label: '2 days out', description: 'Book 2+ days in advance' },
  { value: 3, label: '3 days out', description: 'Book 3+ days in advance' },
  { value: 7, label: '1 week out', description: 'Book 7+ days in advance' },
];

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface ScheduleSettings {
  // Per-day booking schedule
  booking_schedule: { [key: number]: DaySchedule };
  // Legacy fields (kept for compatibility)
  booking_days: number[];
  booking_start_time: string;
  booking_end_time: string;
  // Minimum days before appointment
  min_booking_days: number;
  // Auto-dialer settings
  auto_dialer_enabled: boolean;
  dialer_days: number[];
  dialer_start_time: string;
  dialer_daily_budget: number;
  // Specific blocked dates for appointments (normally on but block these)
  blocked_dates: string[];
  // Specific extra dates for appointments (normally off but allow these)
  booking_extra_dates: string[];
  // Specific dates to skip AI dialer (normally active but skip these)
  dialer_skip_dates: string[];
  // Specific dates to activate AI dialer (normally off but activate these)
  dialer_extra_dates: string[];
}

const DEFAULT_SCHEDULE: { [key: number]: DaySchedule } = {
  0: { enabled: false, start: '09:00', end: '17:00' }, // Sun
  1: { enabled: true, start: '09:00', end: '17:00' },  // Mon
  2: { enabled: true, start: '09:00', end: '17:00' },  // Tue
  3: { enabled: true, start: '09:00', end: '17:00' },  // Wed
  4: { enabled: true, start: '09:00', end: '17:00' },  // Thu
  5: { enabled: true, start: '09:00', end: '17:00' },  // Fri
  6: { enabled: false, start: '09:00', end: '17:00' }, // Sat
};

const DEFAULT_SETTINGS: ScheduleSettings = {
  booking_schedule: DEFAULT_SCHEDULE,
  booking_days: [1, 2, 3, 4, 5], // Mon-Fri (legacy)
  booking_start_time: '09:00',
  booking_end_time: '17:00',
  min_booking_days: 1,
  auto_dialer_enabled: false,
  dialer_days: [1, 2, 3, 4, 5], // Mon-Fri
  dialer_start_time: '09:00',
  dialer_daily_budget: 25,
  blocked_dates: [],
  booking_extra_dates: [],
  dialer_skip_dates: [],
  dialer_extra_dates: [],
};

export default function SchedulingPage() {
  const [settings, setSettings] = useState<ScheduleSettings>(DEFAULT_SETTINGS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialerCalendarDate, setDialerCalendarDate] = useState(new Date()); // Separate date for dialer calendar
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'block' | 'unblock' | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>('');

  // Get user's timezone abbreviation on mount
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Get timezone abbreviation (e.g., EST, PST, CST)
    const tzAbbr = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() || tz;
    setUserTimezone(tzAbbr);
  }, []);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatDate = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const parseDate = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const isBlocked = (dateStr: string): boolean => {
    return settings.blocked_dates.includes(dateStr);
  };

  const isPast = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = parseDate(dateStr);
    return date < today;
  };

  const isToday = (dateStr: string): boolean => {
    const today = new Date();
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    return dateStr === todayStr;
  };

  // Check if day of week is blocked (recurring)
  const isDayOfWeekBlocked = (dayOfWeek: number): boolean => {
    return !settings.booking_days.includes(dayOfWeek);
  };

  // Fetch all schedule settings
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('📡 Fetching schedule settings...');
      const response = await fetch('/api/schedule-settings');
      const data = await response.json();
      console.log('📥 Received settings:', data);
      
      if (data.success) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data.settings,
        });
        console.log('✅ Settings loaded successfully');
      } else {
        console.error('❌ Failed to load settings:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save settings
  const saveSettings = async (newSettings: Partial<ScheduleSettings>, showMessage = true) => {
    setIsSaving(true);
    console.log('💾 Saving settings:', newSettings);
    
    try {
      const response = await fetch('/api/schedule-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      
      const data = await response.json();
      console.log('📥 Save response:', data);
      
      if (!response.ok) {
        console.error('❌ Save failed:', data.error, data.details, data.code, data.hint);
        alert(`Save failed: ${data.details || data.error}\n\nHint: ${data.hint || 'Run the SQL migration in Supabase'}`);
        setSaveMessage('❌ Failed');
      } else if (data.success && showMessage) {
        setSaveMessage('✓ Saved');
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      setSaveMessage('❌ Error');
    } finally {
      // Add slight delay so "Saving..." feels more real
      setTimeout(() => setIsSaving(false), 600);
    }
  };

  // Toggle booking day
  const toggleBookingDay = (dayId: number) => {
    const newDays = settings.booking_days.includes(dayId)
      ? settings.booking_days.filter(d => d !== dayId)
      : [...settings.booking_days, dayId].sort();
    
    setSettings(prev => ({ ...prev, booking_days: newDays }));
    saveSettings({ booking_days: newDays });
  };

  // Toggle dialer day - also clean up calendar overrides that no longer make sense
  const toggleDialerDay = (dayId: number) => {
    const isCurrentlyActive = settings.dialer_days.includes(dayId);
    const newDays = isCurrentlyActive
      ? settings.dialer_days.filter(d => d !== dayId)
      : [...settings.dialer_days, dayId].sort();
    
    // Helper to check if a date string falls on the toggled day
    const isOnThisDay = (dateStr: string) => {
      const date = new Date(dateStr + 'T12:00:00');
      return date.getDay() === dayId;
    };
    
    let newSkipDates = settings.dialer_skip_dates;
    let newExtraDates = settings.dialer_extra_dates;
    
    if (isCurrentlyActive) {
      // Removing day from weekly schedule - remove any skipped dates on this day
      // (can't skip a day that's not normally active)
      newSkipDates = settings.dialer_skip_dates.filter(d => !isOnThisDay(d));
    } else {
      // Adding day to weekly schedule - remove any extra dates on this day
      // (can't have an "extra" day that's now a regular day)
      newExtraDates = settings.dialer_extra_dates.filter(d => !isOnThisDay(d));
    }
    
    setSettings(prev => ({ 
      ...prev, 
      dialer_days: newDays,
      dialer_skip_dates: newSkipDates,
      dialer_extra_dates: newExtraDates
    }));
    saveSettings({ 
      dialer_days: newDays,
      dialer_skip_dates: newSkipDates,
      dialer_extra_dates: newExtraDates
    });
  };

  // Set buffer days
  const setBufferDays = (days: number) => {
    setSettings(prev => ({ ...prev, min_booking_days: days }));
    saveSettings({ min_booking_days: days });
  };

  // Toggle auto-dialer
  const toggleAutoDialer = () => {
    const newValue = !settings.auto_dialer_enabled;
    setSettings(prev => ({ ...prev, auto_dialer_enabled: newValue }));
    saveSettings({ auto_dialer_enabled: newValue });
  };

  // Update dialer start time
  const updateDialerTime = (time: string) => {
    setSettings(prev => ({ ...prev, dialer_start_time: time }));
    saveSettings({ dialer_start_time: time });
  };

  // Update daily budget
  const updateDailyBudget = (budget: number) => {
    setSettings(prev => ({ ...prev, dialer_daily_budget: budget }));
    saveSettings({ dialer_daily_budget: budget });
  };

  // Toggle a specific blocked date (for appointments)
  const toggleDate = async (dateStr: string) => {
    if (isPast(dateStr)) return;
    
    const wasBlocked = isBlocked(dateStr);
    const newBlockedDates = wasBlocked
      ? settings.blocked_dates.filter(d => d !== dateStr)
      : [...settings.blocked_dates, dateStr].sort();
    
    setSettings(prev => ({ ...prev, blocked_dates: newBlockedDates }));
    saveSettings({ blocked_dates: newBlockedDates }, false);
  };

  // Check if a date is in skip list (deactivated from normally active)
  const isDialerSkipped = (dateStr: string): boolean => {
    return settings.dialer_skip_dates.includes(dateStr);
  };

  // Check if a date is in extra list (activated from normally off)
  const isDialerExtra = (dateStr: string): boolean => {
    return settings.dialer_extra_dates.includes(dateStr);
  };

  // Check if day of week is normally active for dialer
  const isDialerDayActive = (dayOfWeek: number): boolean => {
    return settings.dialer_days.includes(dayOfWeek);
  };

  // Determine if a specific date is ACTIVE for dialer (considering overrides)
  const isDateDialerActive = (dateStr: string): boolean => {
    const date = parseDate(dateStr);
    const dayOfWeek = date.getDay();
    const weeklyActive = isDialerDayActive(dayOfWeek);
    
    // Check overrides
    if (isDialerExtra(dateStr)) return true;  // Extra date = always active
    if (isDialerSkipped(dateStr)) return false; // Skip date = always inactive
    
    // Fall back to weekly schedule
    return weeklyActive;
  };

  // Toggle a specific date for dialer
  const toggleDialerDate = async (dateStr: string) => {
    if (isPast(dateStr)) return;
    
    const currentlyActive = isDateDialerActive(dateStr);
    const date = parseDate(dateStr);
    const dayOfWeek = date.getDay();
    const weeklyActive = isDialerDayActive(dayOfWeek);
    
    let newSkipDates = [...settings.dialer_skip_dates];
    let newExtraDates = [...settings.dialer_extra_dates];
    
    if (currentlyActive) {
      // Currently active → make inactive
      // Remove from extra dates if present
      newExtraDates = newExtraDates.filter(d => d !== dateStr);
      // If it's a weekly active day, add to skip dates
      if (weeklyActive) {
        if (!newSkipDates.includes(dateStr)) {
          newSkipDates.push(dateStr);
        }
      }
    } else {
      // Currently inactive → make active
      // Remove from skip dates if present
      newSkipDates = newSkipDates.filter(d => d !== dateStr);
      // If it's NOT a weekly active day, add to extra dates
      if (!weeklyActive) {
        if (!newExtraDates.includes(dateStr)) {
          newExtraDates.push(dateStr);
        }
      }
    }
    
    newSkipDates.sort();
    newExtraDates.sort();
    
    setSettings(prev => ({ 
      ...prev, 
      dialer_skip_dates: newSkipDates,
      dialer_extra_dates: newExtraDates 
    }));
    saveSettings({ dialer_skip_dates: newSkipDates, dialer_extra_dates: newExtraDates });
  };

  // Handle drag
  const handleMouseDown = (dateStr: string) => {
    if (isPast(dateStr)) return;
    setIsDragging(true);
    setDragMode(isBlocked(dateStr) ? 'unblock' : 'block');
    toggleDate(dateStr);
  };

  const handleMouseEnter = (dateStr: string) => {
    if (!isDragging || isPast(dateStr)) return;
    const shouldBlock = dragMode === 'block';
    const currentlyBlocked = isBlocked(dateStr);
    if (shouldBlock && !currentlyBlocked) toggleDate(dateStr);
    else if (!shouldBlock && currentlyBlocked) toggleDate(dateStr);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      saveSettings({ blocked_dates: settings.blocked_dates });
    }
    setIsDragging(false);
    setDragMode(null);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, settings.blocked_dates]);

  // Navigation - restricted to current month through 2 months ahead
  const now = new Date();
  const minMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const maxMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  
  const canGoBack = currentDate > minMonth;
  const canGoForward = currentDate < maxMonth;
  
  const goToPreviousMonth = () => {
    if (canGoBack) setCurrentDate(new Date(year, month - 1, 1));
  };
  const goToNextMonth = () => {
    if (canGoForward) setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToToday = () => setCurrentDate(new Date());

  // Stats
  const upcomingBlockedCount = settings.blocked_dates.filter(d => !isPast(d)).length;
  const blockedDaysCount = 7 - settings.booking_days.length;

  // Check if date is an extra booking day (normally off but manually enabled)
  const isBookingExtra = (dateStr: string) => settings.booking_extra_dates?.includes(dateStr) || false;
  
  // Check if a day of week is enabled in booking schedule
  const isDayOfWeekEnabled = (dayOfWeek: number) => {
    const schedule = settings.booking_schedule?.[dayOfWeek];
    return schedule?.enabled || false;
  };

  // Toggle booking date (similar to dialer logic)
  const toggleBookingDate = (dateStr: string) => {
    if (isPast(dateStr)) return;
    
    const date = parseDate(dateStr);
    const dayOfWeek = date.getDay();
    const isWeeklyEnabled = isDayOfWeekEnabled(dayOfWeek);
    const isBlocked_ = isBlocked(dateStr);
    const isExtra = isBookingExtra(dateStr);
    
    if (isWeeklyEnabled) {
      // Day is normally active
      if (isBlocked_) {
        // Currently blocked -> unblock (remove from blocked_dates)
        const newBlocked = settings.blocked_dates.filter(d => d !== dateStr);
        setSettings(prev => ({ ...prev, blocked_dates: newBlocked }));
        saveSettings({ blocked_dates: newBlocked });
      } else {
        // Currently active -> block (add to blocked_dates)
        const newBlocked = [...settings.blocked_dates, dateStr];
        setSettings(prev => ({ ...prev, blocked_dates: newBlocked }));
        saveSettings({ blocked_dates: newBlocked });
      }
    } else {
      // Day is normally off
      if (isExtra) {
        // Currently extra -> remove (make it off again)
        const newExtra = (settings.booking_extra_dates || []).filter(d => d !== dateStr);
        setSettings(prev => ({ ...prev, booking_extra_dates: newExtra }));
        saveSettings({ booking_extra_dates: newExtra });
      } else {
        // Currently off -> make it extra (add to booking_extra_dates)
        const newExtra = [...(settings.booking_extra_dates || []), dateStr];
        setSettings(prev => ({ ...prev, booking_extra_dates: newExtra }));
        saveSettings({ booking_extra_dates: newExtra });
      }
    }
  };

  // Generate calendar
  const generateCalendarDays = () => {
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 md:h-16" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const date = parseDate(dateStr);
      const dayOfWeek = date.getDay();
      const isWeeklyEnabled = isDayOfWeekEnabled(dayOfWeek);
      const blocked = isBlocked(dateStr);
      const extra = isBookingExtra(dateStr);
      const past = isPast(dateStr);
      const today = isToday(dateStr);
      const hovered = hoveredDate === dateStr;
      
      // Determine state: green (weekly active), blue (extra), red (blocked), gray (weekly off)
      let bgClass = '';
      let textClass = '';
      let icon = null;
      
      if (past) {
        bgClass = 'bg-gray-800/20';
        textClass = 'text-gray-600 cursor-not-allowed';
      } else if (blocked) {
        // Red - blocked (normally on but blocked)
        bgClass = 'bg-gradient-to-br from-red-500/30 to-red-600/20 border-2 border-red-500/50';
        textClass = 'text-red-300';
        icon = <X className="w-3 h-3 text-red-400 absolute top-1 right-1" />;
      } else if (extra) {
        // Blue - extra day (normally off but enabled)
        bgClass = 'bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-500/50';
        textClass = 'text-blue-300';
        icon = <Check className="w-3 h-3 text-blue-400 absolute top-1 right-1" />;
      } else if (isWeeklyEnabled) {
        // Green - weekly active
        bgClass = 'bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30';
        textClass = 'text-green-300';
      } else {
        // Gray - weekly off
        bgClass = 'bg-gray-800/30 border border-gray-700/30';
        textClass = 'text-gray-500';
      }
      
      days.push(
        <div
          key={day}
          onClick={() => toggleBookingDate(dateStr)}
          className={`
            relative h-14 md:h-16 rounded-xl cursor-pointer transition-all duration-200 select-none
            flex flex-col items-center justify-center text-sm
            ${bgClass} ${textClass}
            ${today ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0B1437]' : ''}
            ${hovered && !past ? 'scale-105 z-10 shadow-lg' : ''}
            ${!past ? 'hover:scale-105' : ''}
          `}
          onMouseEnter={() => setHoveredDate(dateStr)}
          onMouseLeave={() => setHoveredDate(null)}
        >
          <span className={`font-medium ${today ? 'text-blue-400' : ''}`}>{day}</span>
          {icon}
        </div>
      );
    }
    
    return days;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
          <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" />
        </div>
        
        <main className="container mx-auto px-4 lg:px-8 py-8 relative z-10 max-w-6xl">
          {/* Header Skeleton */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-800/50 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-96 bg-gray-800/30 rounded animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-gray-800/50 rounded-xl animate-pulse" />
          </div>
          
          {/* AI Dialer Section Skeleton */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-800/50 animate-pulse" />
              <div>
                <div className="h-6 w-48 bg-gray-800/50 rounded animate-pulse mb-2" />
                <div className="h-4 w-72 bg-gray-800/30 rounded animate-pulse" />
              </div>
            </div>
            
            {/* Two cards skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 rounded-2xl border border-gray-700/30 p-6 h-96 animate-pulse">
                <div className="h-6 w-40 bg-gray-800/50 rounded mb-4" />
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-800/30 rounded-lg" />
                  ))}
                </div>
                <div className="h-24 bg-gray-800/30 rounded-xl" />
              </div>
              <div className="bg-gray-900/50 rounded-2xl border border-gray-700/30 p-6 h-96 animate-pulse">
                <div className="h-6 w-40 bg-gray-800/50 rounded mb-4" />
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(35)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-800/30 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Appointment Section Skeleton */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-800/50 animate-pulse" />
              <div>
                <div className="h-6 w-48 bg-gray-800/50 rounded animate-pulse mb-2" />
                <div className="h-4 w-72 bg-gray-800/30 rounded animate-pulse" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 rounded-2xl border border-gray-700/30 p-6 h-80 animate-pulse">
                <div className="space-y-3">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-800/30 rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-2xl border border-gray-700/30 p-6 h-80 animate-pulse">
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(35)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-800/30 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* How To Skeleton */}
          <div className="bg-gray-900/30 rounded-2xl border border-gray-700/30 p-6 h-48 animate-pulse">
            <div className="h-6 w-56 bg-gray-800/50 rounded mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-800/30 rounded" style={{ width: `${80 - i * 10}%` }} />
                ))}
              </div>
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-800/30 rounded" style={{ width: `${80 - i * 10}%` }} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Slider Styles */}
      <style jsx>{`
        input[type="range"].slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          cursor: pointer;
          border: 3px solid #0B1437;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5), 0 2px 4px rgba(0,0,0,0.3);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          margin-top: -1px;
        }
        input[type="range"].slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.7), 0 4px 8px rgba(0,0,0,0.4);
        }
        input[type="range"].slider-thumb::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          cursor: pointer;
          border: 3px solid #0B1437;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5), 0 2px 4px rgba(0,0,0,0.3);
        }
        input[type="range"].slider-thumb {
          height: 12px;
        }
        @keyframes budgetPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        .budget-pop {
          animation: budgetPop 0.15s ease-out;
        }
      `}</style>
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[400px] h-[400px] bg-green-500/5 rounded-full blur-3xl top-1/3 right-1/4 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <main className="container mx-auto px-4 lg:px-8 py-8 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Settings2 className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Scheduling & Availability
              </h1>
              <p className="text-gray-400 mt-1">Control when your AI books appointments and makes calls</p>
            </div>
          </div>
          
          {/* Save indicator - always visible */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
            isSaving 
              ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400' 
              : 'bg-green-500/20 border border-green-500/30 text-green-400'
          }`}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Saved</span>
              </>
            )}
          </div>
        </div>

        {/* Section 1: AI Dialer Automation (TOP - Full Width) */}
        <div className="mb-8 space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">AI Dialer Automation</h2>
                <p className="text-sm text-gray-400">Configure when your AI agent automatically calls</p>
              </div>
            </div>
            
            {/* Master Toggle */}
            <div className="flex items-center gap-3">
              <span className={`text-sm ${settings.auto_dialer_enabled ? 'text-blue-400' : 'text-gray-500'}`}>
                {settings.auto_dialer_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={toggleAutoDialer}
                className={`
                  relative w-16 h-8 rounded-full transition-all duration-300
                  ${settings.auto_dialer_enabled 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-700'
                  }
                `}
              >
                <div className={`
                  absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300
                  ${settings.auto_dialer_enabled ? 'left-9' : 'left-1'}
                `} />
              </button>
            </div>
          </div>

          {/* Two Cards Side by Side */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-300 ${settings.auto_dialer_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            
            {/* Left Card: Weekly Schedule */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-6 shadow-xl flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Weekly Auto Schedule</h3>
                  <p className="text-xs text-gray-500">Your default recurring AI schedule</p>
                </div>
              </div>
              
              {/* Active Days */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Active Days</label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map(day => {
                    const isActive = settings.dialer_days.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        onClick={() => toggleDialerDay(day.id)}
                        className={`
                          py-3 rounded-lg font-medium text-sm transition-all duration-200
                          ${isActive 
                            ? 'bg-gradient-to-br from-blue-500/30 to-indigo-600/20 border border-blue-500/50 text-blue-300' 
                            : 'bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:border-gray-600'
                          }
                        `}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Daily Budget */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm text-gray-400">Daily Budget</label>
                  <div 
                    key={Math.min(settings.dialer_daily_budget, 50)}
                    className="budget-pop flex items-baseline gap-1"
                  >
                    <span className="text-2xl font-bold text-green-400">${Math.min(settings.dialer_daily_budget, 50)}</span>
                    <span className="text-xs text-gray-500">/day</span>
                  </div>
                </div>
                
                {/* Slider */}
                <div className="relative mb-4">
                  {/* Track background with glow */}
                  <div className="absolute inset-0 h-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-800/80 border border-gray-700/50" />
                  
                  {/* Filled track */}
                  <div 
                    className="absolute h-3 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ 
                      width: `${((Math.min(settings.dialer_daily_budget, 50) - 10) / 40) * 100}%`,
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
                    }}
                  />
                  
                  {/* Actual input */}
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={Math.min(settings.dialer_daily_budget, 50)}
                    onChange={(e) => updateDailyBudget(Number(e.target.value))}
                    className="relative w-full h-3 appearance-none bg-transparent cursor-pointer slider-thumb z-10"
                  />
                </div>
                
                {/* Labels */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$10</span>
                  <span>$20</span>
                  <span>$30</span>
                  <span>$40</span>
                  <span className="text-green-400">$50</span>
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-shrink-0 mt-auto pt-4">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-xl border border-green-500/20 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">${Math.min(settings.dialer_daily_budget, 50)}/day</p>
                        <p className="text-xs text-gray-500">9 AM {userTimezone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">≈ {Math.max(1, Math.round(Math.min(settings.dialer_daily_budget, 50) / 8))} appts</p>
                      <p className="text-xs text-gray-500">{settings.dialer_days.length} days/week</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Calendar Overrides */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Calendar Overrides</h3>
                  <p className="text-xs text-gray-500">Override your weekly schedule for specific dates</p>
                </div>
              </div>
              
              {/* Mini Calendar Navigation - restricted to current month through 2 months ahead */}
              {(() => {
                const now = new Date();
                const minDate = new Date(now.getFullYear(), now.getMonth(), 1);
                const maxDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
                const canGoBack = dialerCalendarDate > minDate;
                const canGoForward = dialerCalendarDate < maxDate;
                
                return (
                  <div className="flex items-center justify-between mb-3">
                    <button 
                      onClick={() => canGoBack && setDialerCalendarDate(new Date(dialerCalendarDate.getFullYear(), dialerCalendarDate.getMonth() - 1, 1))} 
                      disabled={!canGoBack}
                      className={`p-2 rounded-lg transition-colors ${canGoBack ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-gray-800/20 cursor-not-allowed'}`}
                    >
                      <ChevronLeft className={`w-4 h-4 ${canGoBack ? 'text-gray-400' : 'text-gray-600'}`} />
                    </button>
                    <div className="text-center">
                      <span className="font-medium text-white text-sm">
                        {monthNames[dialerCalendarDate.getMonth()]} {dialerCalendarDate.getFullYear()}
                      </span>
                    </div>
                    <button 
                      onClick={() => canGoForward && setDialerCalendarDate(new Date(dialerCalendarDate.getFullYear(), dialerCalendarDate.getMonth() + 1, 1))} 
                      disabled={!canGoForward}
                      className={`p-2 rounded-lg transition-colors ${canGoForward ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-gray-800/20 cursor-not-allowed'}`}
                    >
                      <ChevronRight className={`w-4 h-4 ${canGoForward ? 'text-gray-400' : 'text-gray-600'}`} />
                    </button>
                  </div>
                );
              })()}
              
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="h-5 flex items-center justify-center text-xs text-gray-500">
                    {d}
                  </div>
                ))}
              </div>
              
              {/* Dialer Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const dialerYear = dialerCalendarDate.getFullYear();
                  const dialerMonth = dialerCalendarDate.getMonth();
                  const dialerFirstDay = new Date(dialerYear, dialerMonth, 1);
                  const dialerDaysInMonth = new Date(dialerYear, dialerMonth + 1, 0).getDate();
                  const dialerStartingDay = dialerFirstDay.getDay();
                  
                  const days = [];
                  
                  // Empty cells
                  for (let i = 0; i < dialerStartingDay; i++) {
                    days.push(<div key={`dialer-empty-${i}`} className="h-10" />);
                  }
                  
                  // Days
                  for (let day = 1; day <= dialerDaysInMonth; day++) {
                    const dateStr = formatDate(dialerYear, dialerMonth, day);
                    const date = parseDate(dateStr);
                    const dayOfWeek = date.getDay();
                    const past = isPast(dateStr);
                    const today = isToday(dateStr);
                    const isActive = isDateDialerActive(dateStr);
                    const isExtra = isDialerExtra(dateStr); // Manually activated (normally off day)
                    const isSkipped = isDialerSkipped(dateStr); // Manually skipped (normally on day)
                    const isWeeklyOn = isDialerDayActive(dayOfWeek); // Would normally be active
                    
                    // Determine the visual state
                    // Green = normally active (following weekly schedule)
                    // Blue = extra day (activated a normally-off day)
                    // Orange = skipped (deactivated a normally-on day)
                    // Gray = normally off (following weekly schedule)
                    
                    let colorClass = '';
                    let icon = null;
                    
                    if (past) {
                      colorClass = 'bg-gray-800/20 text-gray-600 cursor-not-allowed';
                    } else if (isSkipped) {
                      // Skipped: normally ON but manually turned OFF (ORANGE)
                      colorClass = 'bg-gradient-to-br from-orange-500/30 to-red-500/20 border border-orange-500/50 text-orange-300 hover:border-orange-400/70';
                      icon = <X className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-orange-400" />;
                    } else if (isExtra) {
                      // Extra: normally OFF but manually turned ON (BLUE)
                      colorClass = 'bg-gradient-to-br from-blue-500/30 to-indigo-500/20 border border-blue-500/50 text-blue-300 hover:border-blue-400/70';
                      icon = <Check className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-blue-400" />;
                    } else if (isWeeklyOn) {
                      // Weekly ON (GREEN)
                      colorClass = 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 text-green-300 hover:border-green-400/50';
                    } else {
                      // Weekly OFF (GRAY)
                      colorClass = 'bg-gray-800/30 border border-gray-700/30 text-gray-500 hover:bg-gray-700/40 hover:border-gray-600/50';
                    }
                    
                    days.push(
                      <button
                        key={`dialer-day-${day}`}
                        onClick={() => !past && toggleDialerDate(dateStr)}
                        disabled={past}
                        className={`
                          relative h-10 rounded-lg text-sm font-medium transition-all duration-200
                          flex items-center justify-center
                          ${colorClass}
                          ${today ? 'ring-1 ring-blue-500' : ''}
                        `}
                      >
                        {day}
                        {icon}
                      </button>
                    );
                  }
                  
                  return days;
                })()}
              </div>
              
              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/50" />
                  <span>Added</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-500/30 border border-orange-500/50" />
                  <span>Skipped</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-gray-800/30 border border-gray-700/30" />
                  <span>Off</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Appointment Booking Section */}
        <div className="mb-8 space-y-4">
          {/* Section Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <CalendarCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Appointment Booking</h2>
              <p className="text-gray-400 mt-1">Configure when clients can book appointments with you</p>
            </div>
          </div>
        </div>

        {/* Appointment Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Panel: Weekly Availability */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Weekly Availability</h2>
                <p className="text-sm text-gray-400">Your normal booking days and hours</p>
              </div>
            </div>
            
            {/* Per-day schedule rows */}
            <div className="space-y-2">
              {DAYS_OF_WEEK.map(day => {
                const schedule = settings.booking_schedule?.[day.id] || { enabled: false, start: '09:00', end: '17:00' };
                const isEnabled = schedule.enabled;
                
                return (
                  <div 
                    key={day.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      isEnabled 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-gray-800/30 border border-gray-700/30'
                    }`}
                  >
                    {/* Day toggle */}
                    <button
                      onClick={() => {
                        const newSchedule = {
                          ...settings.booking_schedule,
                          [day.id]: { ...schedule, enabled: !isEnabled }
                        };
                        
                        // Helper to check if a date string falls on this day
                        const isOnThisDay = (dateStr: string) => {
                          const date = new Date(dateStr + 'T12:00:00');
                          return date.getDay() === day.id;
                        };
                        
                        let newBlockedDates = settings.blocked_dates;
                        let newExtraDates = settings.booking_extra_dates || [];
                        
                        if (isEnabled) {
                          // Disabling this day - remove any blocked dates on this day
                          // (can't block a day that's not normally active)
                          newBlockedDates = settings.blocked_dates.filter(d => !isOnThisDay(d));
                        } else {
                          // Enabling this day - remove any extra dates on this day
                          // (can't have an "extra" day that's now a regular day)
                          newExtraDates = newExtraDates.filter(d => !isOnThisDay(d));
                        }
                        
                        setSettings(prev => ({ 
                          ...prev, 
                          booking_schedule: newSchedule,
                          blocked_dates: newBlockedDates,
                          booking_extra_dates: newExtraDates
                        }));
                        saveSettings({ 
                          booking_schedule: newSchedule,
                          blocked_dates: newBlockedDates,
                          booking_extra_dates: newExtraDates
                        });
                      }}
                      className={`w-20 py-2 rounded-lg font-medium text-sm transition-all ${
                        isEnabled 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
                          : 'bg-gray-700/30 text-gray-500 border border-gray-600/30'
                      }`}
                    >
                      {day.full.slice(0, 3)}
                    </button>
                    
                    {/* Time selectors */}
                    {isEnabled ? (
                      <div className="flex-1 flex items-center gap-2">
                        <select
                          value={schedule.start}
                          onChange={(e) => {
                            const newSchedule = {
                              ...settings.booking_schedule,
                              [day.id]: { ...schedule, start: e.target.value }
                            };
                            setSettings(prev => ({ ...prev, booking_schedule: newSchedule }));
                            saveSettings({ booking_schedule: newSchedule });
                          }}
                          className="flex-1 pl-3 pr-8 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:border-green-500/50 focus:outline-none cursor-pointer"
                        >
                          {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'].map(time => (
                            <option key={time} value={time}>
                              {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </option>
                          ))}
                        </select>
                        <span className="text-gray-500 text-sm">to</span>
                        <select
                          value={schedule.end}
                          onChange={(e) => {
                            const newSchedule = {
                              ...settings.booking_schedule,
                              [day.id]: { ...schedule, end: e.target.value }
                            };
                            setSettings(prev => ({ ...prev, booking_schedule: newSchedule }));
                            saveSettings({ booking_schedule: newSchedule });
                          }}
                          className="flex-1 pl-3 pr-8 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:border-green-500/50 focus:outline-none cursor-pointer"
                        >
                          {['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(time => (
                            <option key={time} value={time}>
                              {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex-1 text-gray-500 text-xs italic">
                        Unavailable
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Summary */}
            <div className="mt-4 pt-3 border-t border-gray-700/30 text-xs text-gray-500">
              {Object.values(settings.booking_schedule || {}).filter(s => s.enabled).length} days available for booking
            </div>
          </div>

          {/* Right Panel: Date Overrides */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-xl flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Date Overrides</h2>
                <p className="text-sm text-gray-400">Block or allow specific dates that override your weekly schedule</p>
              </div>
            </div>
            
            {/* Mini Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={goToPreviousMonth} 
                disabled={!canGoBack}
                className={`p-2 rounded-lg transition-colors ${canGoBack ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-gray-800/20 cursor-not-allowed'}`}
              >
                <ChevronLeft className={`w-4 h-4 ${canGoBack ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              <div className="text-center">
                <span className="font-medium text-white">{monthNames[month]} {year}</span>
              </div>
              <button 
                onClick={goToNextMonth} 
                disabled={!canGoForward}
                className={`p-2 rounded-lg transition-colors ${canGoForward ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-gray-800/20 cursor-not-allowed'}`}
              >
                <ChevronRight className={`w-4 h-4 ${canGoForward ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
            
            {/* Calendar Container - Centered */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="h-8 flex items-center justify-center text-xs text-gray-500 font-medium">
                    {d}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays()}
              </div>
            </div>
            
            {/* Legend - At Bottom */}
            <div className="mt-auto pt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
                <span className="text-green-400">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500/30 border border-blue-500/50" />
                <span className="text-blue-400">Extra day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
                <span className="text-red-400">Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-800/30 border border-gray-700/30" />
                <span className="text-gray-500">Weekly off</span>
              </div>
            </div>
          </div>
        </div>

        {/* How To Guide */}
        <div className="mt-8 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-blue-500/20 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">How This Page Works</h3>
              <p className="text-sm text-gray-400">Quick guide to configuring your AI scheduling</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* AI Dialer Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Dialer Automation
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span><strong className="text-white">Toggle ON/OFF</strong> to enable automatic outbound calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span><strong className="text-white">Weekly Schedule</strong> sets which days the AI will make calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span><strong className="text-white">Daily Budget</strong> controls how much you spend per day on calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span><strong className="text-white">Calendar Overrides</strong> let you skip or add specific days</span>
                </li>
              </ul>
            </div>
            
            {/* Appointment Booking Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-green-400 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                Appointment Booking
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span><strong className="text-white">Weekly Availability</strong> sets your default booking days and hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span><strong className="text-white">Each day</strong> can have different start/end times</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span><strong className="text-white">Date Overrides</strong> block (red) or allow (blue) specific dates</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Color Legend */}
          <div className="mt-6 pt-4 border-t border-gray-700/30">
            <h4 className="text-sm font-medium text-white mb-3">Calendar Color Guide</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
                <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
                <span className="text-gray-300">Available</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
                <div className="w-4 h-4 rounded bg-blue-500/30 border border-blue-500/50" />
                <span className="text-gray-300">Extra day added</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
                <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
                <span className="text-gray-300">Blocked</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
                <div className="w-4 h-4 rounded bg-gray-800/50 border border-gray-700/50" />
                <span className="text-gray-300">Weekly off</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
