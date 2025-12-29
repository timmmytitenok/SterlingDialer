'use client';

import { useEffect } from 'react';
import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { CheckCircle2, Zap, ArrowRight, Phone, Calendar, BarChart3, Clock, Shield, Sparkles, Gift, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
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
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <PublicNav />
      <MobilePublicNav />

      <main className="relative z-10 pt-28 sm:pt-28 lg:pt-32 pb-12 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom duration-700">
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
          <div className="scroll-reveal-scale max-w-4xl mx-auto mb-8 sm:mb-12 px-2 sm:px-4">
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
                  <div className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-1 sm:mb-2">
                    $379<span className="text-base sm:text-lg md:text-2xl font-normal text-white/60"> / month</span>
                  </div>
                  <div className="mt-2 text-sm sm:text-base md:text-lg text-emerald-400 font-semibold">
                    + $0.35 per minute for calls
                  </div>
                </div>

                {/* Simple Bullet List - More compact on mobile */}
                <ul className="mt-4 sm:mt-6 md:mt-8 space-y-1.5 sm:space-y-2 md:space-y-3 text-xs sm:text-sm text-white/80 px-2">
                  <li className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                    <span>Unlimited AI agents & unlimited leads</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                    <span>Live call transfers straight to your phone</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                    <span>Automatic appointment booking into your calendar</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                    <span>Recordings, transcripts & performance dashboard</span>
                  </li>
                </ul>

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

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-[10px] sm:text-xs text-green-400 font-semibold">No Contracts</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-[10px] sm:text-xs text-blue-400 font-semibold">Live in 24hrs</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="text-[10px] sm:text-xs text-purple-400 font-semibold">Cancel Anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Stats Banner */}
          <div className="scroll-reveal max-w-5xl mx-auto mb-12 sm:mb-16 px-3 sm:px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20 text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-400 mb-1">2.4M+</div>
                <div className="text-gray-400 text-xs sm:text-sm">Calls Made</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm rounded-xl p-4 border border-green-500/20 text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-400 mb-1">47K+</div>
                <div className="text-gray-400 text-xs sm:text-sm">Appointments</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-400 mb-1">500+</div>
                <div className="text-gray-400 text-xs sm:text-sm">Happy Agents</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20 text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-400 mb-1">24hrs</div>
                <div className="text-gray-400 text-xs sm:text-sm">Setup Time</div>
              </div>
            </div>
          </div>

          {/* Detailed Features Section - Below the Card */}
          <div className="scroll-reveal max-w-6xl mx-auto mb-12 sm:mb-16 md:mb-20 px-3 sm:px-4">
            <div className="text-center mb-6 sm:mb-8 md:mb-10">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/50 mb-1.5 sm:mb-2">
                WHAT'S INCLUDED
              </h3>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white px-4">
                Everything You Need in Sterling Pro Access
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {/* AI Calling Engine */}
              <div className="bg-[#1A2647]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
                <p className="font-semibold text-white mb-2 sm:mb-3 text-base sm:text-lg">🚀 AI Calling Engine</p>
                <ul className="space-y-1.5 sm:space-y-2 text-white/70 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Unlimited AI agents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>No daily lead limits</span>
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
                    <span>Calls 9am-6pm daily</span>
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
          <div className="scroll-reveal max-w-4xl mx-auto mb-12 sm:mb-16 md:mb-20 px-3 sm:px-4 md:px-0">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 lg:p-10 border border-green-500/20">
              <div className="text-center mb-5 sm:mb-6 md:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 sm:mb-2">See Your ROI</h2>
                <p className="text-xs sm:text-sm md:text-base text-gray-400 px-2">Conservative estimates with Sterling Dialer Pro ($379/month)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-green-400 mb-1.5 sm:mb-2">3+</div>
                  <div className="text-white font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base">Appointments/Day</div>
                  <div className="text-gray-400 text-xs sm:text-sm">Unlimited calling</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-green-400 mb-1.5 sm:mb-2">60+</div>
                  <div className="text-white font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base">Appointments/Month</div>
                  <div className="text-gray-400 text-xs sm:text-sm">20 business days</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-green-400 mb-1.5 sm:mb-2">12x</div>
                  <div className="text-white font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base">Return on Investment</div>
                  <div className="text-gray-400 text-xs sm:text-sm">First month</div>
                </div>
              </div>

              <div className="mt-5 sm:mt-5 md:mt-6 lg:mt-8 p-3.5 sm:p-4 md:p-5 lg:p-6 bg-green-500/10 rounded-xl sm:rounded-xl border border-green-500/20">
                <div className="sm:flex sm:items-start sm:gap-2.5 md:gap-3">
                  <div className="hidden sm:flex w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-500/20 items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold mb-2 sm:mb-2.5 md:mb-3 text-[15px] sm:text-base md:text-lg">The Math:</div>
                    <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5">
                      <p className="text-gray-300 text-[12px] sm:text-xs md:text-sm">
                        3 appts/day × 20 days = <span className="text-white font-semibold">60 appt.</span>
                      </p>
                      <p className="text-gray-300 text-[12px] sm:text-xs md:text-sm">
                        Close 1 in 10 appointments = <span className="text-white font-semibold">6 policies</span>
                      </p>
                      <p className="text-gray-300 text-[12px] sm:text-xs md:text-sm">
                        6 policies × $1,000 commission = <span className="text-green-400 font-bold text-base sm:text-base md:text-lg lg:text-xl">$6,000</span>
                      </p>
                      <p className="text-green-400 font-semibold text-[12px] sm:text-xs md:text-sm mt-2 sm:mt-2.5 md:mt-3 lg:mt-4">
                        That's lost money sitting in your CRM!!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Features Grid */}
          <div className="scroll-reveal max-w-6xl mx-auto mb-12 sm:mb-16 md:mb-20 px-3 sm:px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-6 sm:mb-8 md:mb-12 px-4">
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
                <p className="text-gray-400 text-xs sm:text-sm">Calls 9am-6pm daily, never takes a break or vacation</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="scroll-reveal max-w-3xl mx-auto mb-12 sm:mb-16 md:mb-20 px-3 sm:px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-6 sm:mb-8 md:mb-12 px-4">
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

          {/* Old Leads Section - Moved to Bottom */}
          <div className="scroll-reveal-scale max-w-5xl mx-auto mb-12 sm:mb-16 md:mb-20 px-3 sm:px-4 md:px-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-xl sm:rounded-2xl p-6 sm:p-6 md:p-8 lg:p-12 border border-blue-500/30">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 animate-pulse" />
              <div className="relative text-center">
                <h2 className="text-[22px] sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-4 md:mb-5 lg:mb-6 leading-tight">
                  Have thousands of old leads collecting dust?
                </h2>
                <p className="text-[13.5px] sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-300 mb-4 sm:mb-4 md:mb-6 lg:mb-8 leading-relaxed">
                  Let Sterling Dialer revive them into booked appointments, automatically. 
                  Those leads from 6 months, 1 year, even 2 years ago? We'll call them ALL!
                </p>
                <p className="text-[12.5px] sm:text-sm md:text-base lg:text-lg text-gray-400 mb-5 sm:mb-5 md:mb-8 lg:mb-10 leading-relaxed">
                  You already paid for those leads. Sterling Dialer just makes sure you get your money's worth.
                </p>
                <div className="inline-flex items-center gap-2 sm:gap-2 px-4 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 bg-green-600/20 border border-green-500/40 rounded-xl sm:rounded-xl">
                  <CheckCircle2 className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400" />
                  <span className="text-green-400 font-bold text-sm sm:text-sm md:text-base">Sterling Dialer pays for itself!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Call CTA */}
          <div className="scroll-reveal max-w-2xl mx-auto text-center mb-12 sm:mb-16 px-4">
            <div className="p-6 sm:p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20">
              <h3 className="text-2xl sm:text-4xl font-bold text-white mb-3">Still Have Questions?</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-6">
                Book a free 15-minute call and I'll show you exactly how Sterling Dialer can help grow your business today.
              </p>
              <Link
                href="/schedule-call"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all hover:scale-105 group"
              >
                <Phone className="w-5 h-5" />
                Schedule Free Consultation
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

