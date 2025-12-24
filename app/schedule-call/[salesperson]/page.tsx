'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Video, CheckCircle, Sparkles, Phone, User, Mail, Loader2, PartyPopper, UserCircle, Star } from 'lucide-react';
import { getSalesperson, DEFAULT_TIME_SLOTS, SalespersonConfig } from '@/lib/salesperson-config';
import { MobileFooter } from '@/components/mobile-footer';

// Generate next 5 days
const generateDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const getDayName = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const getMonthDay = (date: Date) => {
  return date.getDate();
};

const getMonthName = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Seeded random for consistent "busy" slots
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Simulate availability (skeleton mode - shows some as "booked")
const isSlotAvailable = (date: Date, slot: { hour: number; minute: number }, dayIndex: number) => {
  // Apply fake "busy" blocking to make it look realistic
  let fakeBlockPercentage = 0;
  if (dayIndex <= 1) {
    fakeBlockPercentage = 0.30;
  } else if (dayIndex === 2) {
    fakeBlockPercentage = 0.10;
  }
  
  const dateSeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const slotSeed = dateSeed + slot.hour * 100 + slot.minute;
  const isFakeBlocked = seededRandom(slotSeed) < fakeBlockPercentage;
  
  return !isFakeBlocked;
};

// Skeleton loading component
const CalendarSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gradient-to-r from-purple-600/50 via-cyan-600/50 to-teal-600/50 p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl" />
        <div className="space-y-2">
          <div className="h-5 w-32 bg-white/20 rounded" />
          <div className="h-3 w-48 bg-white/10 rounded" />
        </div>
      </div>
    </div>
    
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-white/10 rounded" />
        <div className="h-4 w-20 bg-white/5 rounded" />
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-2 rounded-xl bg-white/5 h-16" />
        ))}
      </div>
      
      <div className="h-4 w-40 bg-white/10 rounded" />
      
      <div className="grid grid-cols-3 gap-2">
        {[...Array(11)].map((_, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-white/5 h-10" />
        ))}
      </div>
    </div>
  </div>
);

export default function SalespersonSchedulePage() {
  const params = useParams();
  const salespersonSlug = params.salesperson as string;
  
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<SalespersonConfig | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ display: string; hour: number; minute: number } | null>(null);
  const [step, setStep] = useState<'calendar' | 'form' | 'booking' | 'success'>('calendar');
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const dates = generateDates();
  const timeSlots = config?.timeSlots || DEFAULT_TIME_SLOTS;

  // Fetch real availability from Cal.com
  const fetchAvailability = async (salesperson: SalespersonConfig) => {
    // Only check if salesperson is active and has event type ID
    // The API key is checked server-side (not available on client)
    if (!salesperson.isActive || !salesperson.calEventTypeId) {
      console.log('⚠️ Cal.com not configured (no event type ID), using simulated availability');
      return;
    }
    
    setLoadingAvailability(true);
    try {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 5);
      endDate.setHours(23, 59, 59, 999);
      
      console.log(`📡 Fetching availability for ${salesperson.name}...`);
      
      const response = await fetch(
        `/api/schedule-call/${salesperson.slug}/availability?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      const data = await response.json();
      console.log('📋 Availability response:', data);
      
      if (data.success && data.slots) {
        console.log(`✅ Loaded ${data.slots.length} available slots for ${salesperson.name}`);
        setAvailableSlots(data.slots);
      } else {
        console.log('⚠️ Failed to load availability:', data.error);
      }
    } catch (err) {
      console.error('❌ Error fetching availability:', err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Check if a slot is available (uses real Cal.com data if available)
  const checkSlotAvailable = (date: Date, slot: { hour: number; minute: number }, dayIndex: number): boolean => {
    // If we have real availability data, use it
    if (availableSlots.length > 0) {
      const slotDate = new Date(date);
      slotDate.setHours(slot.hour, slot.minute, 0, 0);
      
      // Check if this slot exists in available slots from Cal.com
      const isReallyAvailable = availableSlots.some(availableSlot => {
        const availableDate = new Date(availableSlot);
        return availableDate.getHours() === slot.hour && 
               availableDate.getMinutes() === slot.minute &&
               availableDate.toDateString() === date.toDateString();
      });
      
      // If not available in Cal.com, definitely not available
      if (!isReallyAvailable) return false;
      
      // Apply fake "busy" blocking on first 2 days (10%) to look busy
      if (dayIndex <= 1) {
        const dateSeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
        const slotSeed = dateSeed + slot.hour * 100 + slot.minute;
        const isFakeBlocked = seededRandom(slotSeed) < 0.10; // 10% fake blocking
        if (isFakeBlocked) return false;
      }
      
      return true;
    }
    
    // Fallback to simulated availability (for unconfigured salespeople)
    return isSlotAvailable(date, slot, dayIndex);
  };

  useEffect(() => {
    const salesperson = getSalesperson(salespersonSlug);
    if (!salesperson) {
      // Will show 404
      setMounted(true);
      return;
    }
    setConfig(salesperson);
    setSelectedDate(dates[0]);
    setMounted(true);
    
    // Fetch real availability from Cal.com
    fetchAvailability(salesperson).then(() => {
      setInitialLoading(false);
    });
    
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
  }, [salespersonSlug]);

  const handleContinueToForm = () => {
    if (selectedDate && selectedSlot) {
      setStep('form');
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot || !name || !email || !config) return;
    
    setIsBooking(true);
    setError(null);
    setStep('booking'); // Show loading screen
    
    try {
      // Check if Cal.com is configured (API key is checked server-side)
      if (!config.isActive || !config.calEventTypeId) {
        // Skeleton mode - simulate success (Cal.com not configured)
        console.log('⚠️ Cal.com not configured for this salesperson, simulating success');
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStep('success');
        return;
      }
      
      // Build the start time in ISO format
      const bookingDate = new Date(selectedDate);
      bookingDate.setHours(selectedSlot.hour, selectedSlot.minute, 0, 0);
      const startTime = bookingDate.toISOString();
      
      console.log(`📅 Booking call with ${config.name} at ${startTime}`);
      
      // Call the salesperson-specific booking API
      const response = await fetch(`/api/schedule-call/${salespersonSlug}`, {
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
      
      console.log('✅ Booking confirmed:', data);
      setStep('success');
      
    } catch (err: any) {
      console.error('❌ Booking error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('form'); // Go back to form on error
    } finally {
      setIsBooking(false);
    }
  };

  if (!mounted) return null;
  
  // Show 404 if salesperson not found
  if (mounted && !config) {
    return (
      <div className="min-h-screen bg-[#0B1437] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-gray-400 mb-8">This scheduling page doesn't exist.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Booking Loading State
  if (step === 'booking') {
    return (
      <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-1/4 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-lg mx-auto">
          {/* Animated Loading Circle */}
          <div className="mb-8 relative">
            <div className="w-24 h-24 mx-auto relative">
              {/* Outer spinning ring */}
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin"
                style={{ animationDuration: '1s' }}
              />
              {/* Inner pulsing circle */}
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse flex items-center justify-center">
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
          
          <h2 
            className="text-2xl font-bold text-white mb-3"
            style={{
              animation: 'unblur 0.5s ease-out forwards',
            }}
          >
            Securing Your Spot...
          </h2>
          
          <p 
            className="text-gray-400 mb-6"
            style={{
              animation: 'unblur 0.5s ease-out forwards',
              animationDelay: '200ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
          >
            Just a moment while we book your call with {config?.name}
          </p>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-green-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-1/4 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[100px]" />
        </div>
        
        {/* Solid background at bottom for Safari safe area */}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0B1437] to-transparent pointer-events-none z-[1]" />
        
        <div className="relative z-10 text-center px-4 max-w-lg mx-auto">
          {/* Animated checkmark */}
          <div 
            className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full"
            style={{
              animation: 'unblur-scale 0.6s ease-out forwards',
            }}
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 
            className="text-4xl font-black text-white mb-4"
            style={{
              animation: 'unblur 0.6s ease-out forwards',
              animationDelay: '200ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
          >
            You're All Set! 🎉
          </h1>
          
          <p 
            className="text-lg text-gray-400 mb-2"
            style={{
              animation: 'unblur 0.6s ease-out forwards',
              animationDelay: '350ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
          >
            Your call with <span className="text-white font-semibold">{config?.name}</span> is booked for:
          </p>
          
          <div 
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 mb-6"
            style={{
              animation: 'unblur-scale 0.6s ease-out forwards',
              animationDelay: '500ms',
              opacity: 0,
              filter: 'blur(10px)',
              transform: 'scale(0.9)'
            }}
          >
            <p className="text-xl font-bold text-white">
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              {selectedSlot?.display}
            </p>
          </div>
          
          <p 
            className="text-gray-400 mb-8"
            style={{
              animation: 'unblur 0.6s ease-out forwards',
              animationDelay: '650ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
          >
            Check your email ({email}) for confirmation and meeting details.
          </p>
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all"
            style={{
              animation: 'unblur 0.6s ease-out forwards',
              animationDelay: '800ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
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
        <div className="absolute bottom-[10%] right-1/4 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[100px]" />
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
          Back to Sterling AI
        </Link>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-24">
        
        {/* MOBILE LAYOUT */}
        <div className="flex flex-col lg:hidden">
          {/* 1. Header with Salesperson Info */}
          <div className="text-center mb-10">
            {/* Salesperson Avatar */}
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-4"
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
            
            {/* Main Title */}
            <h1 
              className="text-4xl font-black text-white leading-tight mb-2"
              style={{ 
                animation: 'unblur 0.8s ease-out forwards',
                animationDelay: '200ms',
                opacity: 0,
                filter: 'blur(10px)'
              }}
            >
              Schedule a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                Call
              </span>
            </h1>
            
            {/* Description */}
            <p 
              className="text-base text-gray-400 leading-relaxed mb-8"
              style={{ 
                animation: 'unblur 0.8s ease-out forwards',
                animationDelay: '300ms',
                opacity: 0,
                filter: 'blur(10px)'
              }}
            >
              Book a free 15-minute call with {config?.name}.
            </p>
            
            {/* Salesperson Card - Right above booking UI */}
            <div 
              className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10"
              style={{ 
                animation: 'unblur 0.8s ease-out forwards',
                animationDelay: '400ms',
                opacity: 0,
                filter: 'blur(10px)'
              }}
            >
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 shadow-lg shadow-purple-500/30">
                  <div className="w-full h-full rounded-full bg-[#0B1437] p-[2px]">
                    {config?.image ? (
                      <img src={config.image} alt={config.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <UserCircle className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-[#0B1437]">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Your consultant</p>
                <h3 className="text-xl font-bold text-white leading-tight">{config?.name}</h3>
                <p className="text-xs text-purple-400">{config?.title}</p>
              </div>
            </div>
          </div>

          {/* 2. Calendar (Mobile) */}
          <div 
            className="mb-10"
            style={{ 
              animation: 'unblur 0.8s ease-out forwards',
              animationDelay: '550ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
          >
            <div 
              className="bg-[#111a3a]/90 backdrop-blur-xl rounded-3xl border border-purple-500/20 overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(59, 130, 246, 0.15), 0 0 100px rgba(6, 182, 212, 0.1)'
              }}
            >
              {initialLoading ? (
                <CalendarSkeleton />
              ) : (
              <>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600/90 via-cyan-600/90 to-teal-600/90 p-5">
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
                      {step === 'calendar' ? 'Pick a Time' : 'Your Details'}
                    </h2>
                    <p className="text-sm text-white/70">
                      {step === 'calendar' ? `Booking with ${config?.name}` : 'Almost there!'}
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
                          }`}
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
                        Available Times
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
                        {timeSlots.map((slot) => {
                          const isSelected = selectedSlot?.display === slot.display;
                          const dayIndex = dates.findIndex(d => d.toDateString() === selectedDate.toDateString());
                          const available = checkSlotAvailable(selectedDate, slot, dayIndex);
                          
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

                  {selectedDate && !selectedSlot && (
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
                    <p className="text-sm text-gray-400">Booking with {config?.name}:</p>
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
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
                </div>
              )}
              </>
              )}
            </div>
          </div>

          {/* 3. What to Expect */}
          <div 
            className="space-y-4"
            style={{ 
              animation: 'unblur 0.8s ease-out forwards',
              animationDelay: '750ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
          >
            <h3 className="text-lg font-bold text-white">What to Expect:</h3>
            <div className="space-y-3">
              {[
                { icon: Video, text: 'Quick video call via Zoom or Google Meet' },
                { icon: Clock, text: '15 minutes - no fluff, straight to the point' },
                { icon: Sparkles, text: `${config?.name} will answer all your questions` },
                { icon: CheckCircle, text: 'No pressure, no obligation' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Info */}
          <div className="space-y-8">
            {/* Header with Salesperson */}
            <div className="space-y-6">
              {/* Salesperson Avatar */}
              <div 
                className="flex items-center gap-4"
                style={{ 
                  animation: 'unblur-scale 0.8s ease-out forwards',
                  animationDelay: '100ms',
                  opacity: 0,
                  filter: 'blur(10px)'
                }}
              >
                <div className="relative">
                  <div className="w-28 h-28 rounded-full p-[4px] bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 shadow-xl shadow-purple-500/40">
                    <div className="w-full h-full rounded-full bg-[#0B1437] p-[3px]">
                      {config?.image ? (
                        <img src={config.image} alt={config.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <UserCircle className="w-14 h-14 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center ring-3 ring-[#0B1437]">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{config?.name}</h2>
                  <p className="text-purple-400">{config?.title}</p>
                </div>
              </div>
              
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full"
                style={{ 
                  animation: 'unblur-left 0.8s ease-out forwards',
                  animationDelay: '200ms',
                  opacity: 0,
                  filter: 'blur(10px)'
                }}
              >
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Free Consultation</span>
              </div>
              
              <h1 
                className="text-5xl font-black text-white leading-tight"
                style={{ 
                  animation: 'unblur-left 0.8s ease-out forwards',
                  animationDelay: '350ms',
                  opacity: 0,
                  filter: 'blur(10px)'
                }}
              >
                Schedule Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-teal-400">
                  Call
                </span>
              </h1>
              
              <p 
                className="text-xl text-gray-400 leading-relaxed"
                style={{ 
                  animation: 'unblur-left 0.8s ease-out forwards',
                  animationDelay: '500ms',
                  opacity: 0,
                  filter: 'blur(10px)'
                }}
              >
                {config?.description}
              </p>
            </div>
            
            {/* What to Expect */}
            <div 
              className="space-y-4"
              style={{ 
                animation: 'unblur-left 0.8s ease-out forwards',
                animationDelay: '650ms',
                opacity: 0,
                filter: 'blur(10px)'
              }}
            >
              <h3 className="text-lg font-bold text-white">What to Expect:</h3>
              <div className="space-y-3">
                {[
                  { icon: Video, text: 'Quick video call via Zoom or Google Meet' },
                  { icon: Clock, text: '15 minutes - no fluff, straight to the point' },
                  { icon: Sparkles, text: `${config?.name} will answer all your questions` },
                  { icon: CheckCircle, text: 'No pressure, no obligation' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-400">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Calendar */}
          <div 
            className="sticky top-8 mt-16 ml-8"
            style={{ 
              animation: 'unblur-right 0.9s ease-out forwards',
              animationDelay: '450ms',
              opacity: 0,
              filter: 'blur(10px)'
            }}
          >
            <div 
              className="bg-[#111a3a]/90 backdrop-blur-xl rounded-3xl border border-purple-500/20 overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(59, 130, 246, 0.15), 0 0 100px rgba(6, 182, 212, 0.1)'
              }}
            >
              {initialLoading ? (
                <CalendarSkeleton />
              ) : (
              <>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600/90 via-cyan-600/90 to-teal-600/90 p-5">
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
                      {step === 'calendar' ? 'Pick a Time' : 'Your Details'}
                    </h2>
                    <p className="text-sm text-white/70">
                      {step === 'calendar' ? `Booking with ${config?.name}` : 'Almost there!'}
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
                          }`}
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
                        Available Times
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
                        {timeSlots.map((slot) => {
                          const isSelected = selectedSlot?.display === slot.display;
                          const dayIndex = dates.findIndex(d => d.toDateString() === selectedDate.toDateString());
                          const available = checkSlotAvailable(selectedDate, slot, dayIndex);
                          
                          if (!available) {
                            return (
                              <div
                                key={slot.display}
                                className="p-2.5 rounded-lg text-sm font-medium bg-white/[0.02] text-gray-600 border border-white/5 cursor-not-allowed line-through"
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

                  {selectedDate && !selectedSlot && (
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
                    <p className="text-sm text-gray-400">Booking with {config?.name}:</p>
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
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
                </div>
              )}
              </>
              )}
            </div>
            
            {/* Not configured notice */}
            {!config?.isActive && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-xs text-amber-400 text-center">
                  ⚠️ Demo Mode: Cal.com not yet configured for {config?.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Footer Only */}
      <MobileFooter />
    </div>
  );
}

