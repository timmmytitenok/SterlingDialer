'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { Phone, Zap, TrendingUp, Calendar, Clock, BarChart3, CheckCircle2, ArrowRight, Sparkles, Rocket, Gift, Smartphone, Apple, Play, Pause, Shield, FileCheck, Headphones, Users, Lock, MessageCircle, BadgeCheck, Star, HelpCircle, X, DollarSign, Mail, Award } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';


// Ease-out cubic function for smooth deceleration
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Animated counter hook with easing
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
      const linearProgress = Math.min((timestamp - startTime) / duration, 1);
      // Apply easing - slows down as it approaches the end
      const easedProgress = easeOutCubic(linearProgress);
      setCount(Math.floor(easedProgress * end));
      
      if (linearProgress < 1) {
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

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  // Animated counters for stats
  const callsCounter = useCountUp(400000, 2500);
  const appointmentsCounter = useCountUp(3100, 2000);
  const agentsCounter = useCountUp(250, 1500);

  // Today's appointments counter (random number between 180-320, set on client only)
  const [todayAppointments, setTodayAppointments] = useState(247);
  
  useEffect(() => {
    setTodayAppointments(Math.floor(Math.random() * 140) + 180);
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  useEffect(() => {
    // Scroll reveal animation observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element is fully in view
      }
    );

    // Observe all scroll-reveal elements
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
        <div className="absolute w-[1000px] h-[1000px] bg-pink-500/8 rounded-full bottom-[-300px] left-[20%] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

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
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 lg:mb-15 max-w-3xl mx-auto leading-relaxed text-center animate-slide-up px-4" style={{ animationDelay: '0.1s' }}>
              Have thousands of old life insurance leads collecting dust? Let Sterling Dialer revive them into booked appointments!
            </p>

            {/* Free Trial Badge */}
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600/20 border-2 border-green-500/50 rounded-full mb-6 lg:mb-15 hover:scale-105 transition-transform cursor-pointer animate-slide-up mx-auto" style={{ animationDelay: '0.2s' }}>
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 animate-pulse flex-shrink-0" />
              {/* Mobile: Shorter text */}
              <span className="text-xs sm:hidden text-white font-bold text-center whitespace-nowrap">
                7-Day Free Trial — Pay Per Minute
              </span>
              {/* Desktop: Full text */}
              <span className="hidden sm:block text-base text-white font-bold text-center">
                7-Day Free Trial — Pay Only for Minutes <span className="font-extrabold">You</span> Use
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 lg:mb-42 animate-slide-up px-4 w-full max-w-2xl mx-auto" style={{ animationDelay: '0.3s' }}>
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

            {/* Live Stats Counter with Animation */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 max-w-5xl mx-auto animate-slide-up px-4" style={{ animationDelay: '0.45s' }}>
              <div ref={callsCounter.ref} className="scroll-reveal bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-blue-500/20 text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-400 mb-1 lg:mb-2">
                  {Math.floor(callsCounter.count / 1000)}K+
                </div>
                <div className="text-gray-400 text-xs sm:text-sm lg:text-base">Calls Made</div>
              </div>
              <div ref={appointmentsCounter.ref} className="scroll-reveal delay-1 bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-green-500/20 text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-400 mb-1 lg:mb-2">
                  {(appointmentsCounter.count / 1000).toFixed(1)}K+
                </div>
                <div className="text-gray-400 text-xs sm:text-sm lg:text-base">Appointments</div>
              </div>
              <div ref={agentsCounter.ref} className="scroll-reveal delay-2 bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-purple-500/20 text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-400 mb-1 lg:mb-2">{agentsCounter.count}+</div>
                <div className="text-gray-400 text-xs sm:text-sm lg:text-base">Agents</div>
              </div>
              <div className="scroll-reveal delay-3 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-amber-500/20 text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-400 mb-1 lg:mb-2">24/7</div>
                <div className="text-gray-400 text-xs sm:text-sm lg:text-base">AI Active</div>
              </div>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center items-center gap-2 mt-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-white font-semibold">4.7/5</span>
              <span className="text-gray-400 text-sm">from 89 reviews</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20 scroll-reveal">
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
              <div className="scroll-reveal group bg-gradient-to-br from-emerald-500/10 to-green-600/5 rounded-2xl p-6 lg:p-8 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 lg:w-7 lg:h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Automated Calling</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  AI agent dials leads automatically, handles objections, and qualifies prospects without human intervention.
                </p>
              </div>

              {/* Feature 1.5 - Massive Volume */}
              <div className="scroll-reveal delay-1 group bg-gradient-to-br from-yellow-500/10 to-amber-600/5 rounded-2xl p-6 lg:p-8 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 lg:w-7 lg:h-7 text-yellow-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Massive Daily Volume</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  Dial 1000 leads per DAY plus! In one day, you'll make more calls than most agents make in a month.
                </p>
              </div>

              {/* Feature 2 - Smart Scheduling */}
              <div className="scroll-reveal delay-2 group bg-gradient-to-br from-blue-500/10 to-cyan-600/5 rounded-2xl p-6 lg:p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 lg:w-7 lg:h-7 text-blue-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Smart Scheduling</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  Books appointments directly to your calendar syncing with your Google Calendar and more.
                </p>
              </div>

              {/* Feature 3 - Live Transfer */}
              <div className="scroll-reveal delay-3 group bg-gradient-to-br from-red-500/10 to-rose-600/5 rounded-2xl p-6 lg:p-8 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-red-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 lg:w-7 lg:h-7 text-red-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Live Transfer</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  When prospects are interested, AI automatically transfers the call directly to your phone in real-time.
                </p>
              </div>

              {/* Feature 5 - Revenue Tracking (HIDDEN ON DESKTOP, shows on mobile only) */}
              <div className="scroll-reveal delay-4 lg:hidden group bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-6 lg:p-8 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-green-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-green-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Revenue Tracking</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  Track every dollar earned. See ROI in real-time with beautiful analytics and insights.
                </p>
              </div>

              {/* Feature 6 - Deep Analytics (SHOWS ON DESKTOP & MOBILE) */}
              <div className="scroll-reveal delay-4 group bg-gradient-to-br from-indigo-500/10 to-blue-600/5 rounded-2xl p-6 lg:p-8 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 lg:w-7 lg:h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4">Deep Analytics</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  Listen to call recordings, review lead interest levels, and track performance so you know exactly what's working.
                </p>
              </div>

              {/* Feature 7 - Mobile App */}
              <div className="scroll-reveal delay-5 group bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-2xl p-6 lg:p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 relative">
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

        {/* Risk Reversal Callout Box */}
        <section className="container mx-auto px-6 py-16 lg:py-22 scroll-reveal">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border-2 border-green-500/30 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_70%)]" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full mb-4">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-bold text-sm">100% RISK-FREE GUARANTEE</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Book 5+ Appointments in Your First Week
                </h3>
                <p className="text-gray-300 text-lg mb-4">
                  Or we'll <span className="text-green-400 font-semibold">extend your trial</span> until you do.
                </p>
                <p className="text-gray-500 text-sm">
                  No questions asked. No fine print. We're that confident.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="container mx-auto px-6 py-24 scroll-reveal">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Hiring vs Sterling</h2>
              <p className="text-gray-400">See why agents are switching to AI</p>
            </div>
            <div className="bg-[#1A2647]/50 rounded-2xl border border-gray-800 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-[#0B1437] border-b border-gray-800">
                <div className="p-4 sm:p-6"></div>
                <div className="p-4 sm:p-6 text-center border-x border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Traditional</p>
                  <p className="text-white font-bold">Hiring Callers</p>
                </div>
                <div className="p-4 sm:p-6 text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <p className="text-blue-400 text-sm mb-1">AI-Powered</p>
                  <p className="text-white font-bold">Sterling Dialer</p>
                </div>
              </div>
              {/* Rows */}
              {[
                { label: 'Monthly Cost', old: '$1,600+/mo', new: '$379/mo', highlight: true },
                { label: 'Calls Per Day', old: '100-200', new: '500+', highlight: true },
                { label: 'Availability', old: '8 hrs/day', new: '24/7', highlight: true },
                { label: 'Training Time', old: '2-4 weeks', new: 'None', highlight: false },
                { label: 'Scale Up', old: 'Hire more people', new: 'Click of a button', highlight: true },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-3 ${i !== 6 ? 'border-b border-gray-800' : ''}`}>
                  <div className="p-4 sm:p-5 flex items-center">
                    <span className="text-gray-300 text-sm sm:text-base">{row.label}</span>
                  </div>
                  <div className="p-4 sm:p-5 text-center border-x border-gray-800 flex items-center justify-center">
                    <span className="text-gray-500 text-sm sm:text-base">{row.old}</span>
                  </div>
                  <div className="p-4 sm:p-5 text-center bg-gradient-to-r from-blue-500/5 to-purple-500/5 flex items-center justify-center">
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {row.new}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-6 py-20 scroll-reveal">
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
              <div className="scroll-reveal-left group relative pt-6">
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
              <div className="scroll-reveal delay-2 group relative pt-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-indigo-500/30 hover:border-indigo-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -top-3 left-6 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-indigo-500/50 border-2 border-[#0B1437] leading-none pt-1">
                    2
                  </div>
                  <div className="relative pt-6">
                    <h3 className="text-2xl font-bold text-white mb-4">Click "Launch AI"</h3>
                    <p className="text-gray-300 leading-relaxed mb-3">
                      One button. That's it. Sterling Dialer starts calling your leads immediately.
                    </p>
                    <p className="text-gray-600 text-sm">
                      No setup. No configuration. Just launch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="scroll-reveal-right group relative pt-6">
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
        <section className="container mx-auto px-6 py-20 scroll-reveal">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Trusted by Insurance Professionals
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="scroll-reveal bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "Sterling Dialer tripled my appointments in the first month. I'm booking 3-5 meetings per day now."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    WB
                  </div>
                  <div>
                    <div className="text-white font-semibold">Wardy B.</div>
                    <div className="text-gray-400 text-sm">Life Insurance Agent</div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="scroll-reveal delay-1 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
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
                    AM
                  </div>
                  <div>
                    <div className="text-white font-semibold">Alex M.</div>
                    <div className="text-gray-400 text-sm">Agency Owner</div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="scroll-reveal delay-2 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
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
                    JL
                  </div>
                  <div>
                    <div className="text-white font-semibold">Jordan L.</div>
                    <div className="text-gray-400 text-sm">Independent Agent</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Apps Teaser Section */}
        <section className="container mx-auto px-6 py-20 scroll-reveal">
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
                    Sterling Dialer is Going Mobile 📱
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
        <section className="container mx-auto px-6 py-20 scroll-reveal-scale">
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
                  Sterling Dialer does it all for you — automatically calling, and booking your calendar full of appointments.
                </p>
                
                {/* Mobile: Compact pricing */}
                <p className="sm:hidden text-xs text-gray-400 mb-6 px-4">
                  <span className="text-green-400 font-bold block mb-1">$379/month. Unlimited everything.</span>
                  <span>One policy pays for it all.</span>
                </p>
                {/* Desktop: Full pricing */}
                <p className="hidden sm:block text-base md:text-1xl text-gray-400 mb-8 md:mb-8">
                  <span className="text-green-400 font-bold">$379/month. Unlimited leads. Unlimited appointments.</span> What's one policy worth to you?
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
                  7-Day Trial — Pay Per Minute
                </p>
                {/* Desktop: Full version */}
                <p className="hidden sm:block text-xs sm:text-sm text-gray-400 mt-4 md:mt-6">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 text-green-400 animate-pulse" />
                  7-Day Free Trial — Pay Only for Minutes <span className="font-bold">You</span> Use
                </p>
                
                {/* Schedule Call CTA */}
                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/10">
                  <p className="text-gray-400 text-sm mb-3">Not sure if Sterling Dialer is right for you?</p>
                  <Link
                    href="/schedule-call"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors group"
                  >
                    <Phone className="w-4 h-4" />
                    Schedule a Free Consultation
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Footer - Desktop Only */}
        <footer className="hidden lg:block relative z-10 border-t border-gray-800/50">
          {/* Main Footer */}
          <div className="bg-[#0A1129]/80 backdrop-blur-sm">
            <div className="container mx-auto px-8 py-16">
              <div className="grid grid-cols-6 gap-12">
                {/* Brand Column */}
                <div className="col-span-2">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">SD</span>
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">Sterling Dialer</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-[280px]">
                    AI-powered appointment setting for life insurance agents. Turn old leads into booked appointments today.
                  </p>
                  <Link 
                    href="/signup" 
                    className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors group"
                  >
                    Start your free trial
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Product */}
                <div>
                  <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
                  <div className="space-y-2.5">
                    <Link href="/pricing" className="block text-gray-500 hover:text-white transition-colors text-sm">
                      Pricing
                    </Link>
                    <Link href="/demo" className="block text-gray-500 hover:text-white transition-colors text-sm">
                      Demo
                    </Link>
                    <Link href="/case-studies" className="block text-gray-500 hover:text-white transition-colors text-sm">
                      Case Studies
                    </Link>
                    <Link href="/faq" className="block text-gray-500 hover:text-white transition-colors text-sm">
                      FAQ
                    </Link>
                  </div>
                </div>

                {/* Company */}
                <div>
                  <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
                  <div className="space-y-2.5">
                    <Link href="/contact" className="block text-gray-500 hover:text-white transition-colors text-sm">
                      Contact
                    </Link>
                    <a href="mailto:support@sterlingdialer.com" className="block text-gray-500 hover:text-white transition-colors text-sm">
                      Support
                    </a>
                  </div>
                </div>

                {/* Legal */}
                <div>
                  <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
                  <div className="space-y-2.5">
                    <Link href="/terms" className="block text-gray-500 hover:text-white transition-colors text-sm">
                      Terms
                    </Link>
                    <Link href="/privacy" className="block text-gray-500 hover:text-white transition-colors text-sm">
                      Privacy
                    </Link>
                    <Link href="/refund-policy" className="block text-gray-500 hover:text-white transition-colors text-sm">
                      Refunds
                    </Link>
                  </div>
                </div>

                {/* Connect */}
                <div>
                  <h4 className="text-white font-semibold mb-4 text-sm">Connect</h4>
                  <div className="space-y-2.5">
                    <a href="mailto:support@sterlingdialer.com" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
                      <Mail className="w-4 h-4" />
                      Email Us
                    </a>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Smartphone className="w-4 h-4" />
                      <span>Mobile App Soon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="bg-[#0A1129]/90 border-t border-gray-800/50">
            <div className="container mx-auto px-8 py-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-8">
                  <p className="text-gray-600 text-sm">
                    © 2024 Sterling Dialer
                  </p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                      <Shield className="w-3.5 h-3.5 text-green-500/70" />
                      <span>TCPA Compliant</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                      <Lock className="w-3.5 h-3.5 text-blue-500/70" />
                      <span>SSL Secured</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-gray-500 text-sm">
                  Start your <span className="text-white font-semibold">7 day</span> free trial today
                </div>
              </div>
            </div>
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

      <MobileFooter />

      </div>
  );
}
