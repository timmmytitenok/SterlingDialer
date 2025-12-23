'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Video, CheckCircle, Sparkles, Phone, User, Mail, Loader2, PartyPopper, UserCircle, Star } from 'lucide-react';
import { getSalesperson, DEFAULT_TIME_SLOTS, SalespersonConfig } from '@/lib/salesperson-config';
import { PublicFooter } from '@/components/public-footer';
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
    <div className="bg-gradient-to-r from-blue-600/50 via-cyan-600/50 to-teal-600/50 p-5">
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
  const [step, setStep] = useState<'calendar' | 'form' | 'success'>('calendar');
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const dates = generateDates();
  const timeSlots = config?.timeSlots || DEFAULT_TIME_SLOTS;

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
    
    // Simulate loading
    setTimeout(() => {
      setInitialLoading(false);
    }, 800);
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
    
    try {
      // Check if Cal.com is configured
      if (!config.isActive || !config.calEventTypeId) {
        // Skeleton mode - simulate success
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStep('success');
        return;
      }
      
      // TODO: Implement actual Cal.com booking when configured
      // const response = await fetch(`/api/schedule-call/${salespersonSlug}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, email, phone, startTime }),
      // });
      
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('success');
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
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

  // Success State
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-green-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px]" />
        </div>
        
        {/* Solid background at bottom for Safari safe area */}
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#0B1437] pointer-events-none" />
        
        <div className="relative z-10 text-center px-4 max-w-lg mx-auto">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full animate-bounce">
            <PartyPopper className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-black text-white mb-4">
            You're All Set! 🎉
          </h1>
          
          <p className="text-lg text-gray-400 mb-2">
            Your call with <span className="text-white font-semibold">{config?.name}</span> is booked for:
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
      {/* Background Effects - Moved up to avoid Safari toolbar bleed */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[80px]" />
      </div>
      
      {/* Solid background at bottom for Safari safe area */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#0B1437] pointer-events-none" />

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
          <div className="space-y-4 text-center mb-10">
            {/* Salesperson Avatar */}
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-4 ring-blue-500/30">
                  {config?.image ? (
                    <img src={config.image} alt={config.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserCircle className="w-12 h-12 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-[#0B1437]">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <Star className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">{config?.title}</span>
            </div>
            
            <h1 className="text-3xl font-black text-white leading-tight">
              Schedule a Call with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                {config?.name}
              </span>
            </h1>
            
            <p className="text-base text-gray-400 leading-relaxed px-2">
              {config?.description}
            </p>
          </div>

          {/* 2. Calendar (Mobile) */}
          <div className="mb-10">
            <div 
              className="bg-[#111a3a]/90 backdrop-blur-xl rounded-3xl border border-blue-500/20 overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(59, 130, 246, 0.15), 0 0 100px rgba(6, 182, 212, 0.1)'
              }}
            >
              {initialLoading ? (
                <CalendarSkeleton />
              ) : (
              <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600/90 via-cyan-600/90 to-teal-600/90 p-5">
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
                              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white scale-105'
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
                          const available = isSlotAvailable(selectedDate, slot, dayIndex);
                          
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
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                  : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-blue-500/30'
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
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2"
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
                  
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">What to Expect:</h3>
            <div className="space-y-3">
              {[
                { icon: Video, text: 'Quick video call via Zoom or Google Meet' },
                { icon: Clock, text: '15 minutes - no fluff, straight to the point' },
                { icon: Sparkles, text: `${config?.name} will answer all your questions` },
                { icon: CheckCircle, text: 'No pressure, no obligation' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-blue-400" />
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
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-4 ring-blue-500/30">
                    {config?.image ? (
                      <img src={config.image} alt={config.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <UserCircle className="w-14 h-14 text-white" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-[#0B1437]">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{config?.name}</h2>
                  <p className="text-blue-400">{config?.title}</p>
                </div>
              </div>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
                <Star className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Free Consultation</span>
              </div>
              
              <h1 className="text-5xl font-black text-white leading-tight">
                Schedule Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                  Call
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 leading-relaxed">
                {config?.description}
              </p>
            </div>
            
            {/* What to Expect */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">What to Expect:</h3>
              <div className="space-y-3">
                {[
                  { icon: Video, text: 'Quick video call via Zoom or Google Meet' },
                  { icon: Clock, text: '15 minutes - no fluff, straight to the point' },
                  { icon: Sparkles, text: `${config?.name} will answer all your questions` },
                  { icon: CheckCircle, text: 'No pressure, no obligation' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-400">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Calendar */}
          <div className="sticky top-8 mt-16 ml-8">
            <div 
              className="bg-[#111a3a]/90 backdrop-blur-xl rounded-3xl border border-blue-500/20 overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(59, 130, 246, 0.15), 0 0 100px rgba(6, 182, 212, 0.1)'
              }}
            >
              {initialLoading ? (
                <CalendarSkeleton />
              ) : (
              <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600/90 via-cyan-600/90 to-teal-600/90 p-5">
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
                              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white scale-105'
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
                          const available = isSlotAvailable(selectedDate, slot, dayIndex);
                          
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
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                  : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-blue-500/30'
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
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2"
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
                  
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
      
      <PublicFooter />
      <MobileFooter />
    </div>
  );
}

