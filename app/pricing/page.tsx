'use client';

import { useEffect, useRef, useState } from 'react';
import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { CheckCircle2, Zap, ArrowRight, Phone, Calendar, BarChart3, Clock, Shield, Sparkles, Gift, Rocket, Users, BadgeCheck, Lock, FileCheck, Star, HelpCircle, Headphones, DollarSign, Upload, FileText } from 'lucide-react';
import Link from 'next/link';

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (!hasStarted) return;
    
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  useEffect(() => {
    if (!startOnView || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView, hasStarted]);

  return { count, ref };
}

export default function PricingPage() {
  // Animated counters
  const callsCounter = useCountUp(2400000, 2500);
  const appointmentsCounter = useCountUp(47000, 2000);
  
  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background - Soft gradual glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-blue-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-purple-500/8 rounded-full top-[20%] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
        <div className="absolute w-[1000px] h-[1000px] bg-indigo-500/8 rounded-full bottom-[-300px] left-[20%] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <PublicNav />Re
      <MobilePublicNav />

      <main className="relative z-10 pt-28 sm:pt-28 lg:pt-32 pb-12 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="text-center mb-16 sm:mb-12 md:mb-16 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom duration-700">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 animate-pulse" />
              <span className="text-xs sm:text-sm text-blue-400 font-semibold">Simple, Transparent Pricing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 md:mb-6 text-center leading-tight px-2">
              <div className="flex justify-center">
                <BlurText
                  text="One Simple Plan."
                  delay={100}
                  className="text-white" 
                  animateBy="words"
                  direction="top"
                />
              </div>
              <div className="flex justify-center mt-1 sm:mt-2">
                <BlurText
                  text="Everything You Need."
                  delay={120}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"
                  animateBy="words"
                  direction="top"
                />
              </div>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-2 sm:mb-4 px-4">
              You already paid for those leads. Let's make sure you get your money's worth.
            </p>
          </div>

          {/* Main Pricing Card - Simple & High-Conversion */}
          <div className="scroll-reveal-scale max-w-4xl mx-auto mb-16 sm:mb-12 px-2 sm:px-4">
            <div className="group relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border-2 border-blue-500/40 shadow-2xl transition-all duration-500 hover:scale-105 hover:border-blue-500/70 hover:shadow-3xl hover:shadow-blue-500/60 overflow-hidden">
              
              {/* Animated Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
              
              {/* Rotating Border Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
              
              <div className="relative z-10">
                {/* Badge */}
                <div className="mb-3 sm:mb-4 flex justify-center animate-bounce-in">
                  <span className="rounded-full bg-purple-600/20 px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold text-purple-300 tracking-wide border border-purple-500/30">
                    ⭐ ONE SIMPLE PLAN ⭐
                  </span>
                </div>

                {/* Title - Mobile smaller */}
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center animate-slide-up">
                  Sterling Pro Access
                </h2>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white/70 text-center animate-slide-up-delay px-2">
                  Let AI call your leads and fill your calendar.
                </p>

                {/* Price - Mobile optimized */}
                <div className="mt-4 sm:mt-5 md:mt-6 text-center animate-fade-in">
                  <div className="text-6xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-1 sm:mb-2">
                    $379<span className="text-lg sm:text-lg md:text-2xl font-normal text-white/60"> / month</span>
                  </div>
                  <div className="mt-2 text-sm sm:text-base md:text-lg text-emerald-400 font-semibold">
                    + $0.35 per minute for calls
                  </div>
                </div>

                {/* Features with colored icons */}
                <div className="mt-8 sm:mt-6 md:mt-8 space-y-2.5 sm:space-y-3 md:space-y-4 text-sm sm:text-base px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
                    </div>
                    <span className="text-gray-300">Upload unlimited leads</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                    </div>
                    <span className="text-gray-300">AI dials 500+ calls daily</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
                    </div>
                    <span className="text-gray-300">Books appointments to your calendar</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                    </div>
                    <span className="text-gray-300">Full recordings & transcripts</span>
                  </div>
                </div>

                {/* CTA Button - Mobile optimized */}
                <Link
                  href="/signup"
                  className="relative mt-7 sm:mt-6 md:mt-8 w-full flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl transition-all duration-300 shadow-2xl hover:shadow-purple-500/80 group/btn overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-pulse" />
                    Start 7-Day Free Trial
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
                </Link>

                {/* Reassurance - Different text for mobile/desktop */}
                <p className="mt-2.5 sm:mt-3 md:mt-4 text-[10px] sm:text-xs text-center text-white/50">
                  {/* Mobile: Short version */}
                  <span className="sm:hidden">Secure payment via Stripe</span>
                  {/* Desktop: Full version */}
                  <span className="hidden sm:inline">Cancel anytime · No long-term contracts · Secure payment via Stripe</span>
                </p>

              </div>
            </div>
          </div>

          {/* Detailed Features Section - Below the Card */}
          <div className="scroll-reveal max-w-6xl mx-auto mt-20 sm:mt-30 md:mt-48 mb-32 sm:mb-36 md:mb-44 px-3 sm:px-4">
            <div className="text-center mb-6 sm:mb-8 md:mb-10">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/50 mb-1.5 sm:mb-2">
                WHAT'S INCLUDED
              </h3>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white px-4">
                <span className="sm:hidden">Everything You Need</span>
                <span className="hidden sm:inline">Everything You Need in Sterling Pro Access</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {/* AI Calling Engine */}
              <div className="bg-[#1A2647]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
                <p className="font-semibold text-white mb-2 sm:mb-3 text-base sm:text-lg">🚀 AI Calling Engine</p>
                <ul className="space-y-1.5 sm:space-y-2 text-white/70 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>500+ dials per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Upload unlimited leads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Live transfers to phone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Human-like AI voices</span>
                  </li>
                </ul>
              </div>

              {/* Smart Appointment Booking */}
              <div className="bg-[#1A2647]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                <p className="font-semibold text-white mb-2 sm:mb-3 text-base sm:text-lg">📅 Smart Appointment Booking</p>
                <ul className="space-y-1.5 sm:space-y-2 text-white/70 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Cal.ai integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Google Calendar sync</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Auto-confirmations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Real-time booking</span>
                  </li>
                </ul>
              </div>

              {/* Analytics & Intelligence */}
              <div className="bg-[#1A2647]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-indigo-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20">
                <p className="font-semibold text-white mb-2 sm:mb-3 text-base sm:text-lg">📊 Analytics & Intelligence</p>
                <ul className="space-y-1.5 sm:space-y-2 text-white/70 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Call recordings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Full transcripts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Performance metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Revenue tracking</span>
                  </li>
                </ul>
              </div>

              {/* Integrations */}
              <div className="bg-[#1A2647]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-green-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-green-500/20">
                <p className="font-semibold text-white mb-2 sm:mb-3 text-base sm:text-lg">🔗 Integrations</p>
                <ul className="space-y-1.5 sm:space-y-2 text-white/70 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Google Sheets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>CSV/Excel upload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>CRM data export</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>API access</span>
                  </li>
                </ul>
              </div>

              {/* Premium Support */}
              <div className="bg-[#1A2647]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-amber-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/20">
                <p className="font-semibold text-white mb-2 sm:mb-3 text-base sm:text-lg">⭐ Premium Support</p>
                <ul className="space-y-1.5 sm:space-y-2 text-white/70 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Priority agent setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Calls 9am-8pm daily</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Email support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Setup training</span>
                  </li>
                </ul>
              </div>

              {/* Mobile App - Coming Soon */}
              <div className="bg-[#1A2647]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-pink-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-pink-500/20">
                <p className="font-semibold text-white mb-2 sm:mb-3 text-base sm:text-lg">
                  📱 Mobile App <span className="text-white/50 text-xs sm:text-sm font-normal">(Coming Soon)</span>
                </p>
                <ul className="space-y-1.5 sm:space-y-2 text-white/70 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Launch AI from phone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Monitor live calls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>View appointments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>iOS & Android</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ROI Calculator */}
          <div className="scroll-reveal max-w-4xl mx-auto mb-32 sm:mb-36 md:mb-44 px-3 sm:px-4 md:px-0">
            <div className="text-center mb-6 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">The Numbers Don't Lie</h2>
              <p className="text-gray-400 text-sm sm:text-base">What $379/month actually gets you</p>
            </div>
            
            {/* Mobile: Horizontal scroll row, Desktop: 3-column grid */}
            <div className="hidden sm:grid grid-cols-3 gap-4 md:gap-6 mb-8">
              <div className="bg-[#1A2647]/60 rounded-xl p-4 sm:p-6 text-center border border-gray-800">
                <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">500+</div>
                <div className="text-white font-medium text-sm">Calls/Day</div>
              </div>
              <div className="bg-[#1A2647]/60 rounded-xl p-4 sm:p-6 text-center border border-gray-800">
                <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">3-5</div>
                <div className="text-white font-medium text-sm">Appts/Day</div>
              </div>
              <div className="bg-[#1A2647]/60 rounded-xl p-4 sm:p-6 text-center border border-gray-800">
                <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">$6K+</div>
                <div className="text-white font-medium text-sm">Monthly Revenue</div>
              </div>
            </div>

            {/* Mobile Only: Clean stacked layout */}
            <div className="sm:hidden space-y-3 mb-6">
              <div className="bg-[#1A2647]/60 rounded-xl p-5 border border-gray-800 flex items-center justify-between">
                <div className="text-white font-medium">Calls/Day</div>
                <div className="text-4xl font-bold text-blue-400">500+</div>
              </div>
              <div className="bg-[#1A2647]/60 rounded-xl p-5 border border-gray-800 flex items-center justify-between">
                <div className="text-white font-medium">Appts/Day</div>
                <div className="text-4xl font-bold text-purple-400">3-5+</div>
              </div>
              <div className="bg-[#1A2647]/60 rounded-xl p-5 border border-gray-800 flex items-center justify-between">
                <div className="text-white font-medium">Monthly Revenue</div>
                <div className="text-4xl font-bold text-green-400">$6K+</div>
              </div>
            </div>

            {/* Math equation - simplified for mobile */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-xl p-4 sm:p-6 border border-green-500/20">
              {/* Desktop: Full equation */}
              <div className="hidden sm:flex flex-row items-center justify-center gap-6 text-center">
                <span className="text-gray-300">60 appts</span>
                <span className="text-gray-500">×</span>
                <span className="text-gray-300">10% close rate</span>
                <span className="text-gray-500">×</span>
                <span className="text-gray-300">$1,000 commission</span>
                <span className="text-gray-500">=</span>
                <span className="text-green-400 font-bold text-2xl">$6,000/mo</span>
              </div>
              {/* Mobile: Simplified */}
              <div className="sm:hidden text-center">
                <p className="text-gray-400 text-sm mb-2">60 appts × 10% close × $1K</p>
                <p className="text-green-400 font-bold text-3xl">= $6,000/mo</p>
              </div>
            </div>
          </div>


          {/* Features Grid */}
          <div className="scroll-reveal max-w-6xl mx-auto mb-32 sm:mb-36 md:mb-44 px-3 sm:px-4">
            <h2 className="text-3xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-6 sm:mb-8 md:mb-12 px-4">
              Built for Insurance Professionals
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              <div className="group bg-[#1A2647] rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
                <Phone className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-blue-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Natural AI Voice</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Sounds human, handles objections like a human</p>
              </div>

              <div className="group bg-[#1A2647] rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-indigo-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20">
                <Calendar className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-indigo-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Auto Scheduling</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Books directly to your Google calendar.</p>
              </div>

              <div className="group bg-[#1A2647] rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                <BarChart3 className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-purple-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Deep Analytics</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Track every call, conversion, and dollar earned</p>
              </div>

              <div className="group bg-[#1A2647] rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-green-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-green-500/20">
                <Clock className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-green-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Always Working</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Calls 9am-8pm daily, never takes a break or vacation</p>
              </div>
            </div>
          </div>

          {/* Comparison Table - Hidden on Mobile */}
          <div className="scroll-reveal hidden sm:block max-w-4xl mx-auto mb-36 md:mb-44 px-3 sm:px-4">
            <div className="text-center mb-6 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">Hiring vs Sterling</h2>
              <p className="text-gray-400 text-sm sm:text-base">See why agents are switching to AI</p>
            </div>
            <div className="bg-[#1A2647]/50 rounded-xl sm:rounded-2xl border border-gray-800 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-[#0B1437] border-b border-gray-800">
                <div className="p-3 sm:p-4 lg:p-6"></div>
                <div className="p-3 sm:p-4 lg:p-6 text-center border-x border-gray-800">
                  <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Traditional</p>
                  <p className="text-white font-bold text-xs sm:text-sm lg:text-base">Hiring Callers</p>
                </div>
                <div className="p-3 sm:p-4 lg:p-6 text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <p className="text-blue-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">AI-Powered</p>
                  <p className="text-white font-bold text-xs sm:text-sm lg:text-base">Sterling</p>
                </div>
              </div>
              {/* Rows */}
              {[
                { label: 'Monthly Cost', old: '$1,600+/mo', new: '$379/mo' },
                { label: 'Calls Per Day', old: '100-200', new: '500+' },
                { label: 'Availability', old: '8 hrs/day', new: '24/7' },
                { label: 'Training Time', old: '2-4 weeks', new: 'None' },
                { label: 'Scale Up', old: 'Hire more people', new: 'Click a button' },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-3 ${i !== 4 ? 'border-b border-gray-800' : ''}`}>
                  <div className="p-3 sm:p-4 lg:p-5 flex items-center">
                    <span className="text-gray-300 text-[10px] sm:text-xs lg:text-sm">{row.label}</span>
                  </div>
                  <div className="p-3 sm:p-4 lg:p-5 text-center border-x border-gray-800 flex items-center justify-center">
                    <span className="text-gray-500 text-[10px] sm:text-xs lg:text-sm">{row.old}</span>
                  </div>
                  <div className="p-3 sm:p-4 lg:p-5 text-center bg-gradient-to-r from-blue-500/5 to-purple-500/5 flex items-center justify-center">
                    <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-white">
                      {row.new}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="scroll-reveal max-w-3xl mx-auto mb-32 sm:mb-36 md:mb-44 px-3 sm:px-4">
            <h2 className="text-3xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-6 sm:mb-8 md:mb-12 px-4">
              Frequently Asked Questions
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-white/10 hover:border-blue-500/30 transition-all">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">What's included with Sterling Pro Access?</h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-400">
                  Everything! For $379/month, you get unlimited AI calling agents, unlimited leads per day, live call transfers, Cal.ai appointment booking, Google Sheets integration, call recordings & transcripts, performance dashboard, priority support, and 24/7 AI operation. One simple plan with all features unlocked.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-white/10 hover:border-purple-500/30 transition-all">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">How does the 7-day free trial work?</h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-400">
                  Start with a 7-day free trial! You get full access to all features - unlimited AI agents, unlimited leads, and all premium features. You only pay for the minutes you use during calls. After 7 days, it's $379/month. Cancel anytime with no questions asked.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-white/10 hover:border-green-500/30 transition-all">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Can I cancel anytime?</h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-400">
                  Absolutely. No contracts, no commitments. Cancel anytime with one click from your billing portal. But here's the thing: most agents DOUBLE their appointments in the first month. Once you see results, you won't want to stop.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-white/10 hover:border-indigo-500/30 transition-all">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">How fast will I see results?</h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-400">
                  Most agents see booked appointments within the first 24 hours of launching. With unlimited calling capacity, you're making more calls in ONE day than most agents make in a month. More dials = more conversations = more appointments. It's simple math.
                </p>
              </div>
            </div>
          </div>

          {/* Schedule Call CTA */}
          <div className="scroll-reveal max-w-2xl mx-auto text-center mb-12 sm:mb-16 px-4">
            <div className="p-6 sm:p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20">
              <h3 className="text-2xl sm:text-4xl font-bold text-white mb-3">Still Have Questions?</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-6">
                Book a free 15-minute call and We'll show you exactly how Sterling Dialer can help grow your business today.
              </p>
              <Link
                href="/schedule-call"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all hover:scale-105 group"
              >
                <Phone className="w-5 h-5" />
                 Free Consultation Call
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      <style jsx global>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 15s ease infinite;
        }
        
        `}</style>

      <PublicFooter />
      <MobileFooter />

      </div>
  );
}

