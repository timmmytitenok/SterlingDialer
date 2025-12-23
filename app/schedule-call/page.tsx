'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Video, CheckCircle, Sparkles, Phone, User, Mail, Loader2, PartyPopper } from 'lucide-react';
import { MobileFooter } from '@/components/mobile-footer';

// Generate next 5 days only
const generateDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= 5; i++) { // Start from tomorrow, 5 days total
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Time slots - Only 12 PM to 5 PM (your actual schedule)
const ALL_TIME_SLOTS = [
  { display: '12:00 PM', hour: 12, minute: 0 },
  { display: '12:30 PM', hour: 12, minute: 30 },
  { display: '1:00 PM', hour: 13, minute: 0 },
  { display: '1:30 PM', hour: 13, minute: 30 },
  { display: '2:00 PM', hour: 14, minute: 0 },
  { display: '2:30 PM', hour: 14, minute: 30 },
  { display: '3:00 PM', hour: 15, minute: 0 },
  { display: '3:30 PM', hour: 15, minute: 30 },
  { display: '4:00 PM', hour: 16, minute: 0 },
  { display: '4:30 PM', hour: 16, minute: 30 },
  { display: '5:00 PM', hour: 17, minute: 0 },
];

const getDayName = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const getMonthDay = (date: Date) => {
  return date.getDate();
};

const getMonthName = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Convert date + time slot to ISO string for Cal.com API
const getISODateTime = (date: Date, slot: { hour: number; minute: number }) => {
  const newDate = new Date(date);
  newDate.setHours(slot.hour, slot.minute, 0, 0);
  return newDate.toISOString();
};

// Format date for API query (YYYY-MM-DD)
const formatDateForAPI = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// Seeded random - same date/slot always shows same result
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Check if a slot time matches an available slot from Cal.com
const isSlotAvailable = (
  date: Date, 
  slot: { hour: number; minute: number }, 
  availableSlots: string[],
  dayIndex: number
) => {
  const slotDateTime = new Date(date);
  slotDateTime.setHours(slot.hour, slot.minute, 0, 0);
  
  // First check if Cal.com says it's available
  const calAvailable = availableSlots.some(availableSlot => {
    const availableDate = new Date(availableSlot);
    return (
      availableDate.getFullYear() === slotDateTime.getFullYear() &&
      availableDate.getMonth() === slotDateTime.getMonth() &&
      availableDate.getDate() === slotDateTime.getDate() &&
      availableDate.getHours() === slotDateTime.getHours() &&
      availableDate.getMinutes() === slotDateTime.getMinutes()
    );
  });
  
  // If Cal.com says unavailable, it's definitely unavailable
  if (!calAvailable) return false;
  
  // Apply fake "busy" blocking based on day index
  // Day 0-1 (first 2 days): 30% fake blocked
  // Day 2 (3rd day): 10% fake blocked
  // Day 3-4 (4th & 5th day): No fake blocking
  let fakeBlockPercentage = 0;
  if (dayIndex <= 1) {
    fakeBlockPercentage = 0.30;
  } else if (dayIndex === 2) {
    fakeBlockPercentage = 0.10;
  }
  
  // Use seeded random so same slot is always blocked/unblocked
  const dateSeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const slotSeed = dateSeed + slot.hour * 100 + slot.minute;
  const isFakeBlocked = seededRandom(slotSeed) < fakeBlockPercentage;
  
  return !isFakeBlocked;
};

// Skeleton component for calendar UI
const CalendarSkeleton = () => (
  <div className="animate-pulse">
    {/* Header skeleton */}
    <div className="bg-gradient-to-r from-purple-600/50 via-fuchsia-600/50 to-pink-600/50 p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl" />
        <div className="space-y-2">
          <div className="h-5 w-32 bg-white/20 rounded" />
          <div className="h-3 w-48 bg-white/10 rounded" />
        </div>
      </div>
    </div>
    
    <div className="p-5 space-y-5">
      {/* Month header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-white/10 rounded" />
        <div className="h-4 w-20 bg-white/5 rounded" />
      </div>
      
      {/* Date selector skeleton */}
      <div className="grid grid-cols-5 gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-2 rounded-xl bg-white/5 h-16" />
        ))}
      </div>
      
      {/* Time slots header skeleton */}
      <div className="h-4 w-40 bg-white/10 rounded" />
      
      {/* Time slots skeleton */}
      <div className="grid grid-cols-3 gap-2">
        {[...Array(11)].map((_, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-white/5 h-10" />
        ))}
      </div>
    </div>
  </div>
);

export default function ScheduleCallPage() {
  const [mounted, setMounted] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ display: string; hour: number; minute: number } | null>(null);
  const [step, setStep] = useState<'calendar' | 'form' | 'success'>('calendar');
  const [isBooking, setIsBooking] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const dates = generateDates();

  useEffect(() => {
    setMounted(true);
    // Default to first available date
    setSelectedDate(dates[0]);
    
    // Scroll reveal observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchAvailability = async () => {
      setIsLoadingSlots(true);
      setSelectedSlot(null);
      
      try {
        // Get availability for the selected date (full day)
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        
        console.log('Fetching availability for:', startDate.toISOString(), 'to', endDate.toISOString());
        
        const response = await fetch(
          `/api/schedule-call/availability?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        
        const data = await response.json();
        console.log('Availability API response:', data);
        
        if (data.success && data.slots) {
          // Slots should already be parsed as an array of ISO strings from our API
          let slots: string[] = [];
          
          if (Array.isArray(data.slots)) {
            slots = data.slots;
          } else if (typeof data.slots === 'object') {
            // Fallback: If it's still an object with date keys
            Object.values(data.slots).forEach((dateSlots: any) => {
              if (Array.isArray(dateSlots)) {
                dateSlots.forEach((slot: any) => {
                  if (typeof slot === 'string') {
                    slots.push(slot);
                  } else if (slot.time) {
                    slots.push(slot.time);
                  }
                });
              }
            });
          }
          
          console.log('Parsed slots:', slots);
          setAvailableSlots(slots);
        } else {
          console.log('No slots found or API error:', data);
          setAvailableSlots([]);
        }
      } catch (err) {
        console.error('Failed to fetch availability:', err);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
        setInitialLoading(false);
      }
    };
    
    fetchAvailability();
  }, [selectedDate]);

  const handleContinueToForm = () => {
    if (selectedDate && selectedSlot) {
      setStep('form');
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot || !name || !email) return;
    
    setIsBooking(true);
    setError(null);
    
    try {
      const startTime = getISODateTime(selectedDate, selectedSlot);
      
      const response = await fetch('/api/schedule-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          startTime,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }
      
      // Success!
      setStep('success');
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (!mounted) return null;

  // Success State
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-green-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px]" />
        </div>
        
        {/* Solid background at bottom for Safari safe area */}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0B1437] to-transparent pointer-events-none z-[1]" />
        
        <div className="relative z-10 text-center px-4 max-w-lg mx-auto">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full animate-bounce">
            <PartyPopper className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-black text-white mb-4">
            You're All Set! 🎉
          </h1>
          
          <p className="text-lg text-gray-400 mb-2">
            Your consultation is booked for:
          </p>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 mb-6">
            <p className="text-xl font-bold text-white">
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              {selectedSlot?.display}
            </p>
          </div>
          
          <p className="text-gray-400 mb-8">
            Check your email ({email}) for confirmation and meeting details.
          </p>
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1437] relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[80px]" />
      </div>
      
      {/* Solid background at bottom for Safari safe area */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0B1437] to-transparent pointer-events-none z-[1]" />

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-24">
        
        {/* MOBILE LAYOUT */}
        <div className="flex flex-col lg:hidden">
          {/* 1. Header */}
          <div className="space-y-4 text-center mb-10">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full"
              style={{ 
                animation: 'unblur 0.8s ease-out forwards',
                animationDelay: '100ms',
                opacity: 0,
                filter: 'blur(10px)'
              }}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Free Consultation</span>
            </div>
            
            <h1 
              className="text-3xl font-black text-white leading-tight"
              style={{ 
                animation: 'unblur 0.8s ease-out forwards',
                animationDelay: '200ms',
                opacity: 0,
                filter: 'blur(10px)'
              }}
            >
              <span className="block">Let's Talk About</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                Growing Your Business
              </span>
            </h1>
            
            <p 
              className="text-base text-gray-400 leading-relaxed px-2"
              style={{ 
                animation: 'unblur 0.8s ease-out forwards',
                animationDelay: '350ms',
                opacity: 0,
                filter: 'blur(10px)'
              }}
            >
              Not sure if Sterling AI is right for you? Book a free 15-minute call and I'll personally show you how our AI dialer can help you book more appointments and close more deals.
            </p>
          </div>

          {/* 2. Calendar (Mobile) */}
          <div 
            className="mb-10"
            style={{ 
              animation: 'unblur 0.8s ease-out forwards',
              animationDelay: '500ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
          >
            <div 
              className="bg-[#111a3a]/90 backdrop-blur-xl rounded-3xl border border-purple-500/20 overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(147, 51, 234, 0.15), 0 0 100px rgba(59, 130, 246, 0.1)'
              }}
            >
              {initialLoading ? (
                <CalendarSkeleton />
              ) : (
              <>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600/90 via-fuchsia-600/90 to-pink-600/90 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    {step === 'calendar' ? (
                      <Calendar className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {step === 'calendar' ? 'Schedule Your Call' : 'Your Details'}
                    </h2>
                    <p className="text-sm text-white/70">
                      {step === 'calendar' ? 'Pick a date & time that works for you' : 'Almost there! Just need your info'}
                    </p>
                  </div>
                </div>
              </div>

              {step === 'calendar' ? (
                <div className="p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">
                      {selectedDate ? getMonthName(selectedDate) : getMonthName(new Date())}
                    </h3>
                    <span className="text-xs text-gray-500">Next 5 days</span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {dates.map((date, i) => {
                      const isSelected = selectedDate?.toDateString() === date.toDateString();
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                          }}
                          className={`p-2 rounded-xl text-center transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white scale-105'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                          } ${isToday && !isSelected ? 'ring-1 ring-purple-500/50' : ''}`}
                        >
                          <div className="text-[10px] uppercase tracking-wider opacity-70">
                            {getDayName(date)}
                          </div>
                          <div className="text-lg font-bold">
                            {getMonthDay(date)}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Available Times (12 PM - 5 PM EST)
                      </h4>
                      
                      {isLoadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                          <span className="ml-2 text-gray-400">Checking availability...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
                          {ALL_TIME_SLOTS.map((slot) => {
                            const isSelected = selectedSlot?.display === slot.display;
                            const dayIndex = dates.findIndex(d => d.toDateString() === selectedDate.toDateString());
                            const available = isSlotAvailable(selectedDate, slot, availableSlots, dayIndex);
                            
                            if (!available) {
                              return (
                                <div
                                  key={slot.display}
                                  className="p-2.5 rounded-lg text-sm font-medium bg-white/[0.02] text-gray-600 border border-white/5 cursor-not-allowed line-through"
                                  title="This time is already booked"
                                >
                                  {slot.display}
                                </div>
                              );
                            }
                            
                            return (
                              <button
                                key={slot.display}
                                onClick={() => setSelectedSlot(slot)}
                                className={`p-2.5 rounded-lg text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-purple-500/30'
                                }`}
                              >
                                {slot.display}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {!isLoadingSlots && availableSlots.length === 0 && (
                        <p className="text-center text-sm text-amber-400 py-2">
                          No available times on this date. Please try another day.
                        </p>
                      )}
                    </div>
                  )}

                  {selectedDate && selectedSlot && (
                    <div className="space-y-4 pt-3 border-t border-white/10 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Selected:</span>
                        <span className="text-white font-medium">
                          {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedSlot.display}
                        </span>
                      </div>
                      
                      <button
                        onClick={handleContinueToForm}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30 flex items-center justify-center gap-2"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {selectedDate && !selectedSlot && !isLoadingSlots && availableSlots.length > 0 && (
                    <p className="text-center text-sm text-gray-500 py-2">
                      Select a time slot above
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  <button
                    onClick={() => setStep('calendar')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change date/time
                  </button>
                  
                  <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-center">
                    <p className="text-sm text-gray-400">Booking for:</p>
                    <p className="text-white font-semibold">
                      {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedSlot?.display}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  
                  <button
                    onClick={handleBooking}
                    disabled={isBooking || !name || !email}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirm Booking
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-center text-gray-500">
                    You'll receive a confirmation email with meeting details
                  </p>
                </div>
              )}
              </>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No credit card required • 100% free consultation</span>
            </div>
          </div>

          {/* 3. What to Expect (Mobile) */}
          <div 
            className="space-y-4"
            style={{ 
              animation: 'unblur 0.8s ease-out forwards',
              animationDelay: '700ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
          >
            <h3 className="text-lg font-bold text-white">What to Expect:</h3>
            <div className="space-y-3">
              {[
                { icon: Video, text: 'Quick video call via Zoom or Google Meet' },
                { icon: Clock, text: '15 minutes - no fluff, straight to the point' },
                { icon: CheckCircle, text: 'Live demo of the AI dialer in action' },
                { icon: Phone, text: 'Q&A - ask me anything about the platform' },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                    <item.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-gray-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full"
                style={{ 
                  animation: 'unblur-left 0.8s ease-out forwards',
                  animationDelay: '100ms',
                  opacity: 0,
                  filter: 'blur(10px)'
                }}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Free Consultation</span>
              </div>
              
              <h1 
                className="text-5xl font-black text-white leading-tight"
                style={{ 
                  animation: 'unblur-left 0.8s ease-out forwards',
                  animationDelay: '250ms',
                  opacity: 0,
                  filter: 'blur(10px)'
                }}
              >
                Let's Talk About{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                  Growing Your Business
                </span>
              </h1>
              
              <p 
                className="text-lg text-gray-400 leading-relaxed"
                style={{ 
                  animation: 'unblur-left 0.8s ease-out forwards',
                  animationDelay: '400ms',
                  opacity: 0,
                  filter: 'blur(10px)'
                }}
              >
                Not sure if Sterling AI is right for you? Book a free 15-minute call and I'll personally show you how our AI dialer can help you book more appointments and close more deals.
              </p>
            </div>

            <div 
              className="space-y-4"
              style={{ 
                animation: 'unblur-left 0.8s ease-out forwards',
                animationDelay: '550ms',
                opacity: 0,
                filter: 'blur(10px)'
              }}
            >
              <h3 className="text-lg font-bold text-white">What to Expect:</h3>
              <div className="space-y-3">
                {[
                  { icon: Video, text: 'Quick video call via Zoom or Google Meet' },
                  { icon: Clock, text: '15 minutes - no fluff, straight to the point' },
                  { icon: CheckCircle, text: 'Live demo of the AI dialer in action' },
                  { icon: Phone, text: 'Q&A - ask me anything about the platform' },
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                      <item.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Calendar or Form */}
          <div 
            className="sticky top-8 mt-16 ml-8"
            style={{ 
              animation: 'unblur-right 0.9s ease-out forwards',
              animationDelay: '400ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
          >
            <div 
              className="bg-[#111a3a]/90 backdrop-blur-xl rounded-3xl border border-purple-500/20 overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(147, 51, 234, 0.15), 0 0 100px rgba(59, 130, 246, 0.1)'
              }}
            >
              {initialLoading ? (
                <CalendarSkeleton />
              ) : (
              <>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600/90 via-fuchsia-600/90 to-pink-600/90 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    {step === 'calendar' ? (
                      <Calendar className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {step === 'calendar' ? 'Schedule Your Call' : 'Your Details'}
                    </h2>
                    <p className="text-sm text-white/70">
                      {step === 'calendar' ? 'Pick a date & time that works for you' : 'Almost there! Just need your info'}
                    </p>
                  </div>
                </div>
              </div>

              {step === 'calendar' ? (
                <div className="p-5 space-y-5">
                  {/* Month Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">
                      {selectedDate ? getMonthName(selectedDate) : getMonthName(new Date())}
                    </h3>
                    <span className="text-xs text-gray-500">Next 5 days</span>
                  </div>

                  {/* Date Selector */}
                  <div className="grid grid-cols-5 gap-2">
                    {dates.map((date, i) => {
                      const isSelected = selectedDate?.toDateString() === date.toDateString();
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                          }}
                          className={`p-2 rounded-xl text-center transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white scale-105'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                          } ${isToday && !isSelected ? 'ring-1 ring-purple-500/50' : ''}`}
                        >
                          <div className="text-[10px] uppercase tracking-wider opacity-70">
                            {getDayName(date)}
                          </div>
                          <div className="text-lg font-bold">
                            {getMonthDay(date)}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Available Times (12 PM - 5 PM EST)
                      </h4>
                      
                      {isLoadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                          <span className="ml-2 text-gray-400">Checking availability...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
                          {ALL_TIME_SLOTS.map((slot) => {
                            const isSelected = selectedSlot?.display === slot.display;
                            const dayIndex = dates.findIndex(d => d.toDateString() === selectedDate.toDateString());
                            const available = isSlotAvailable(selectedDate, slot, availableSlots, dayIndex);
                            
                            if (!available) {
                              // Show as booked/unavailable
                              return (
                                <div
                                  key={slot.display}
                                  className="p-2.5 rounded-lg text-sm font-medium bg-white/[0.02] text-gray-600 border border-white/5 cursor-not-allowed line-through"
                                  title="This time is already booked"
                                >
                                  {slot.display}
                                </div>
                              );
                            }
                            
                            return (
                              <button
                                key={slot.display}
                                onClick={() => setSelectedSlot(slot)}
                                className={`p-2.5 rounded-lg text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-purple-500/30'
                                }`}
                              >
                                {slot.display}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* No slots available message */}
                      {!isLoadingSlots && availableSlots.length === 0 && (
                        <p className="text-center text-sm text-amber-400 py-2">
                          No available times on this date. Please try another day.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Selected Summary & Continue Button */}
                  {selectedDate && selectedSlot && (
                    <div className="space-y-4 pt-3 border-t border-white/10 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Selected:</span>
                        <span className="text-white font-medium">
                          {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedSlot.display}
                        </span>
                      </div>
                      
                      <button
                        onClick={handleContinueToForm}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30 flex items-center justify-center gap-2"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* No time selected prompt */}
                  {selectedDate && !selectedSlot && !isLoadingSlots && availableSlots.length > 0 && (
                    <p className="text-center text-sm text-gray-500 py-2">
                      Select a time slot above
                    </p>
                  )}
                </div>
              ) : (
                // Form Step
                <div className="p-5 space-y-5">
                  {/* Back to Calendar */}
                  <button
                    onClick={() => setStep('calendar')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change date/time
                  </button>
                  
                  {/* Selected Time Reminder */}
                  <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-center">
                    <p className="text-sm text-gray-400">Booking for:</p>
                    <p className="text-white font-semibold">
                      {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedSlot?.display}
                    </p>
                  </div>
                  
                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                      />
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  
                  {/* Book Button */}
                  <button
                    onClick={handleBooking}
                    disabled={isBooking || !name || !email}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirm Booking
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-center text-gray-500">
                    You'll receive a confirmation email with meeting details
                  </p>
                </div>
              )}
              </>
              )}
            </div>

            {/* Trust Badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No credit card required • 100% free consultation</span>
            </div>
          </div>
        </div>

      </div>
      
      {/* Mobile Footer Only */}
      <MobileFooter />
    </div>
  );
}
