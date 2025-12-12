'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { Phone, Zap, TrendingUp, Calendar, Clock, BarChart3, CheckCircle2, ArrowRight, Sparkles, Rocket, Gift, Smartphone, Apple } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-in-section').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl top-0 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl top-1/3 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[700px] h-[700px] bg-pink-500/10 rounded-full blur-3xl bottom-0 left-1/4 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <PublicNav />
      <MobilePublicNav />

      <main className="relative z- pt-4 lg:pt-0">
        {/* Hero Section */}
        <section ref={heroRef} className="container mx-auto px-6 pt-28 pb-20 min-h-screen flex items-center">
          <div className="max-w-6xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-semibold">AI-Powered Insurance Sales</span>
            </div>

            {/* Main Headline with Blur Animation */}
            <h1 className="font-bold mb-8 leading-tight text-center">
              {/* Mobile: Stacked line by line with custom sizes */}
              <div className="block lg:hidden">
                <div className="flex justify-center mb-1 text-4xl">
                  <BlurText
                    text="Revive Old Leads"
                    delay={100}
                    className="text-white"
                    animateBy="words"
                    direction="top"
                  />
                </div>
                <div className="flex justify-center mb-1 text-5xl">
                  <BlurText
                    text="Book More Appointments"
                    delay={120}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"
                    animateBy="words"
                    direction="top"
                  />
                </div>
              </div>
              
              {/* Desktop: Two lines */}
              <div className="hidden lg:block text-8xl">
                <div className="flex justify-center">
                  <BlurText
                    text="Revive Old Leads."
                    delay={100}
                    className="text-white"
                    animateBy="words"
                    direction="top"
                  />
                </div>
                <div className="flex justify-center mt-2">
                  <BlurText
                    text="Book More Appointments."
                    delay={120}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"
                    animateBy="words"
                    direction="top"
                  />
                </div>
              </div>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 lg:mb-20 max-w-3xl mx-auto leading-relaxed text-center animate-slide-up px-4" style={{ animationDelay: '0.1s' }}>
              Have thousands of old life insurance leads collecting dust? Let Sterling AI revive them into booked appointments.
            </p>

            {/* Free Trial Badge */}
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600/20 border-2 border-green-500/50 rounded-full mb-6 lg:mb-20 hover:scale-105 transition-transform cursor-pointer animate-slide-up mx-auto" style={{ animationDelay: '0.2s' }}>
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 animate-pulse flex-shrink-0" />
              {/* Mobile: Shorter text */}
              <span className="text-xs sm:hidden text-white font-bold text-center whitespace-nowrap">
                30-Day Free Trial — Pay Per Minute
              </span>
              {/* Desktop: Full text */}
              <span className="hidden sm:block text-base text-white font-bold text-center">
                30-Day Free Trial — Pay Only for Minutes <span className="font-extrabold">You</span> Use
              </span>
            </div>

            {/* Mobile App Badge - COMING SOON (MOBILE ONLY) */}
            <div className="lg:hidden inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-full mb-12 lg:mb-20 hover:scale-105 transition-transform cursor-pointer animate-slide-up mx-auto" style={{ animationDelay: '0.25s' }}>
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 animate-pulse flex-shrink-0" />
              <span className="text-xs sm:text-sm text-white font-bold text-center">
                <span className="text-purple-400">iOS & Android App</span> Coming Soon! 📱
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 lg:mb-16 animate-slide-up px-4 w-full max-w-2xl mx-auto" style={{ animationDelay: '0.3s' }}>
              <Link
                href="/signup"
                className="group relative w-full sm:w-auto px-8 py-4 lg:px-10 lg:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-lg lg:text-xl rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 text-center"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Rocket className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-y-[-4px] transition-transform" />
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-4 lg:px-10 lg:py-5 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white font-bold text-lg lg:text-xl rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 hover:scale-105 text-center"
              >
                View Pricing
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 max-w-4xl mx-auto animate-slide-up px-4" style={{ animationDelay: '0.3s' }}>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/10 text-center">
                <div className="text-4xl lg:text-5xl font-bold text-blue-400 mb-1 lg:mb-2">720+</div>
                <div className="text-gray-400 text-sm lg:text-base">Leads Per Day</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/10 text-center">
                <div className="text-4xl lg:text-5xl font-bold text-indigo-400 mb-1 lg:mb-2">50+</div>
                <div className="text-gray-400 text-sm lg:text-base">Appointments Per Month</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/10 text-center">
                <div className="text-4xl lg:text-5xl font-bold text-purple-400 mb-1 lg:mb-2">24/7</div>
                <div className="text-gray-400 text-sm lg:text-base">AI Availability</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20 fade-in-section opacity-0">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Why Sterling?
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-400">
                The smartest way to scale your insurance sales
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Feature 1 - Automated Calling */}
              <div className="group bg-gradient-to-br from-emerald-500/10 to-green-600/5 rounded-2xl p-6 lg:p-8 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 lg:w-7 lg:h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Automated Calling</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  AI agent dials leads automatically, handles objections, and qualifies prospects without human intervention.
                </p>
              </div>

              {/* Feature 1.5 - Massive Volume */}
              <div className="group bg-gradient-to-br from-yellow-500/10 to-amber-600/5 rounded-2xl p-6 lg:p-8 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 lg:w-7 lg:h-7 text-yellow-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Massive Daily Volume</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  Dial 1000 leads per DAY plus! In one day, you'll make more calls than most agents make in a month.
                </p>
              </div>

              {/* Feature 2 - Smart Scheduling */}
              <div className="group bg-gradient-to-br from-blue-500/10 to-cyan-600/5 rounded-2xl p-6 lg:p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 lg:w-7 lg:h-7 text-blue-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Smart Scheduling</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  Books appointments directly to your calendar syncing with your Google Calendar and more.
                </p>
              </div>

              {/* Feature 3 - Live Transfer */}
              <div className="group bg-gradient-to-br from-red-500/10 to-rose-600/5 rounded-2xl p-6 lg:p-8 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-red-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 lg:w-7 lg:h-7 text-red-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Live Transfer</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  When prospects are interested, AI automatically transfers the call directly to your phone in real-time.
                </p>
              </div>

              {/* Feature 5 - Revenue Tracking (HIDDEN ON DESKTOP, shows on mobile only) */}
              <div className="lg:hidden group bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-6 lg:p-8 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-green-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-green-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Revenue Tracking</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  Track every dollar earned. See ROI in real-time with beautiful analytics and insights.
                </p>
              </div>

              {/* Feature 6 - Deep Analytics (SHOWS ON DESKTOP & MOBILE) */}
              <div className="group bg-gradient-to-br from-indigo-500/10 to-blue-600/5 rounded-2xl p-6 lg:p-8 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 lg:w-7 lg:h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Deep Analytics</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  Listen to call recordings, review lead interest levels, and track performance so you know exactly what's working.
                </p>
              </div>

              {/* Feature 7 - Mobile App */}
              <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-2xl p-6 lg:p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 relative">
                {/* Coming Soon Badge */}
                <div className="absolute top-3 right-3 px-2 py-1 bg-purple-600/80 text-white text-[10px] font-bold rounded-full backdrop-blur-sm">
                  COMING SOON
                </div>
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 lg:w-7 lg:h-7 text-purple-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Mobile App</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  Manage your AI, check appointments, and track sales on the go. iOS & Android app launching soon!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-6 py-20 fade-in-section opacity-0">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                3 Clicks. Unlimited Appointments.
              </h2>
              <p className="text-1xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
                Seriously. It's that simple.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="group relative pt-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-blue-500/30 hover:border-blue-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -top-3 left-6 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-blue-500/50 border-2 border-[#0B1437] leading-none pt-1">
                    1
                  </div>
                  <div className="relative pt-6">
                    <h3 className="text-2xl font-bold text-white mb-4">Upload Your Old Leads</h3>
                    <p className="text-gray-300 leading-relaxed mb-3">
                      You know, the one with over 2,000 leads you never called!
                    </p>
                    <p className="text-gray-600 text-sm">
                      CSV, Excel, copy/paste. Takes 60 sec.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative pt-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-indigo-500/30 hover:border-indigo-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -top-3 left-6 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-indigo-500/50 border-2 border-[#0B1437] leading-none pt-1">
                    2
                  </div>
                  <div className="relative pt-6">
                    <h3 className="text-2xl font-bold text-white mb-4">Click "Launch AI"</h3>
                    <p className="text-gray-300 leading-relaxed mb-3">
                      One button. That's it. Sterling AI starts calling your leads immediately.
                    </p>
                    <p className="text-gray-600 text-sm">
                      No setup. No configuration. Just launch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative pt-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-purple-500/30 hover:border-purple-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -top-3 left-6 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-purple-500/50 border-2 border-[#0B1437] leading-none pt-1">
                    3
                  </div>
                  <div className="relative pt-6">
                    <h3 className="text-xl md:text-xl font-bold text-white mb-4">Wake Up to Appointments!</h3>
                    <p className="text-gray-300 leading-relaxed mb-3">
                      AI calls while you sleep. Appointments book automatically to your calendar.
                    </p>
                    <p className="text-gray-600 text-sm">
                      You focus on closing. We handle the rest.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="container mx-auto px-6 py-20 fade-in-section opacity-0">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Trusted by Insurance Professionals
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "Sterling AI tripled my appointments in the first month. I'm booking 3-5 meetings per day now."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    JD
                  </div>
                  <div>
                    <div className="text-white font-semibold">John Davis</div>
                    <div className="text-gray-400 text-sm">Life Insurance Agent</div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "Best investment I've made in my business. The AI handles objections better than all of my previous SDRs."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    SM
                  </div>
                  <div>
                    <div className="text-white font-semibold">Sarah Martinez</div>
                    <div className="text-gray-400 text-sm">Agency Owner</div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "Game changer. I went from 100 dials a day to 600. My revenue has increased by 300% in 2 months."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                    MJ
                  </div>
                  <div>
                    <div className="text-white font-semibold">Michael Johnson</div>
                    <div className="text-gray-400 text-sm">Independent Agent</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Apps Teaser Section */}
        <section className="container mx-auto px-6 py-20 fade-in-section opacity-0">
          <div className="max-w-6xl mx-auto">
            <div className="relative bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-3xl p-6 md:p-12 border-2 border-purple-500/30 overflow-hidden group hover:border-purple-500/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  {/* Coming Soon Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/30 border border-purple-500/50 rounded-full mb-4 animate-pulse">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-300 font-bold">COMING SOON</span>
                  </div>
                  
                  <h2 className="text-4xl sm:text-3xl md:text-6xl font-bold text-white mb-6 leading-tight">
                    Sterling AI is Going Mobile 📱
                  </h2>
                  <p className="text-base sm:text-lg md:text-1xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    Manage your AI dialer, track appointments, and monitor sales
                  </p>
                </div>

                {/* App Store Badges (Grayed out) */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  {/* iOS App Store */}
                  <div className="relative group/badge w-full sm:w-auto">
                    <div className="opacity-40 grayscale hover:opacity-60 transition-all duration-300">
                      <div className="flex items-center gap-3 px-6 py-3 bg-black/30 rounded-xl border border-white/20 justify-center">
                        <Apple className="w-8 h-8 text-white flex-shrink-0" />
                        <div className="text-left">
                          <div className="text-[10px] text-gray-400">Download on the</div>
                          <div className="text-lg font-semibold text-white">App Store</div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-xs text-purple-400 font-bold bg-[#0B1437]/80 px-3 py-1 rounded-full backdrop-blur-sm">Coming Soon!</span>
                    </div>
                  </div>

                  {/* Google Play */}
                  <div className="relative group/badge w-full sm:w-auto">
                    <div className="opacity-40 grayscale hover:opacity-60 transition-all duration-300">
                      <div className="flex items-center gap-3 px-6 py-3 bg-black/30 rounded-xl border border-white/20 justify-center">
                        <Smartphone className="w-8 h-8 text-white flex-shrink-0" />
                        <div className="text-left">
                          <div className="text-[10px] text-gray-400">GET IT ON</div>
                          <div className="text-lg font-semibold text-white">Google Play</div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-xs text-purple-400 font-bold bg-[#0B1437]/80 px-3 py-1 rounded-full backdrop-blur-sm">Coming Soon!</span>
                    </div>
                  </div>
                </div>

                <p className="text-center text-gray-400 text-xs sm:text-sm">
                  Coming very soon...
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-6 py-20 fade-in-section opacity-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl p-6 md:p-12 lg:p-16 border-2 border-blue-500/30 overflow-hidden group hover:border-blue-500/50 transition-all">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
              
              <div className="relative z-10 text-center">
                {/* Mobile: Shorter headline */}
                <h2 className="sm:hidden text-4xl font-bold text-white mb-4 leading-tight px-4">
                  Work Your Old Leads First
                </h2>
                {/* Desktop: Full headline */}
                <h2 className="hidden sm:block text-3xl md:text-6xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
                  Still chasing new leads when you haven't worked the old ones?
                </h2>
                
                {/* Mobile: Shorter description */}
                <p className="sm:hidden text-1xl text-gray-300 mb-9 max-w-xs mx-auto leading-relaxed px-4">
             
                </p>
                {/* Desktop: Full description */}
                <p className="hidden sm:block text-lg md:text-2xl text-gray-300 mb-5 md:mb-10 max-w-2xl mx-auto leading-relaxed">
                  Sterling AI does it all for you — automatically calling, and booking your calendar full of appointments.
                </p>
                
                {/* Mobile: Compact pricing */}
                <p className="sm:hidden text-xs text-gray-400 mb-6 px-4">
                  <span className="text-green-400 font-bold block mb-1">$499/month. Unlimited everything.</span>
                  <span>One policy pays for it all.</span>
                </p>
                {/* Desktop: Full pricing */}
                <p className="hidden sm:block text-base md:text-1xl text-gray-400 mb-8 md:mb-8">
                  <span className="text-green-400 font-bold">$499/month. Unlimited leads. Unlimited appointments.</span> What's one policy worth to you?
                </p>
                <Link
                  href="/signup"
                  className="group/cta inline-flex items-center justify-center gap-2 md:gap-3 px-8 py-4 md:px-12 md:py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg md:text-xl rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 w-full sm:w-auto"
                >
                  <Rocket className="w-5 h-5 md:w-7 md:h-7 group-hover/cta:translate-y-[-4px] transition-transform" />
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 md:w-7 md:h-7 group-hover/cta:translate-x-2 transition-transform" />
                </Link>
                {/* Mobile: Shorter version */}
                <p className="sm:hidden text-xs text-gray-400 mt-4">
                  <Zap className="w-3 h-3 inline mr-1 text-green-400 animate-pulse" />
                  30-Day Trial — Pay Per Minute
                </p>
                {/* Desktop: Full version */}
                <p className="hidden sm:block text-xs sm:text-sm text-gray-400 mt-4 md:mt-6">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 text-green-400 animate-pulse" />
                  30-Day Free Trial — Pay Only for Minutes <span className="font-bold">You</span> Use
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="hidden lg:block container mx-auto px-6 py-12 border-t border-white/10">
          <div className="max-w-6xl mx-auto text-center text-gray-400">
            <p>&copy; 2025 Sterling AI. All rights reserved.</p>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 15s ease infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        .fade-in-section {
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        
        .fade-in-section.animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        
        .fade-in-section:not(.animate-in) {
          transform: translateY(30px);
        }
      `}</style>

      {/* Footer */}
      <footer className="hidden lg:block relative z-10 border-t border-gray-800 bg-[#0A1129]/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-5 gap-6 lg:gap-8 xl:gap-12 mb-8">
            {/* Company */}
            <div>
              <h3 className="text-white font-bold mb-4">Sterling AI</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Revive your old leads into booked appointments.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2">
                <Link href="/pricing" className="block text-gray-400 hover:text-white transition-colors text-sm">
                  Pricing
                </Link>
                <Link href="/demo" className="block text-gray-400 hover:text-white transition-colors text-sm">
                  Demo
                </Link>
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
                <Link href="/faq" className="block text-gray-400 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-gray-400 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="block text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
                <Link href="/refund-policy" className="block text-gray-400 hover:text-white transition-colors text-sm">
                  Refund & Cancellation
                </Link>
              </div>
            </div>

            {/* Mobile App - FAR RIGHT */}
            <div>
              <h4 className="text-white font-semibold mb-4">Mobile App</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>iOS App (Coming Soon)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>Android App (Coming Soon)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 Sterling AI. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Start your <span className="text-gray-300 font-bold">30 day</span> free trial today
            </p>
          </div>
        </div>
      </footer>

      <MobileFooter />
    </div>
  );
}
