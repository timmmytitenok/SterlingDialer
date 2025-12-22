'use client';

import { useState, useRef, useEffect } from 'react';
import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { Upload, Rocket, Calendar, Play, Pause, DollarSign, Phone, CheckCircle, ArrowRight, Headphones, Clock, Target, TrendingUp, CalendarCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  // Audio player state - now just 2 players
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [progress, setProgress] = useState<{[key: number]: number}>({1: 0, 2: 0});
  const [currentTime, setCurrentTime] = useState<{[key: number]: number}>({1: 0, 2: 0});
  const [duration, setDuration] = useState<{[key: number]: number}>({1: 0, 2: 0});
  const [playbackSpeed, setPlaybackSpeed] = useState<{[key: number]: number}>({1: 1, 2: 1});
  
  const audioRefs = {
    1: useRef<HTMLAudioElement>(null),
    2: useRef<HTMLAudioElement>(null),
  };

  const speedOptions = [1, 1.25, 1.5, 2];

  const togglePlay = (playerNum: number) => {
    // Stop the OTHER player (only 2 now)
    const otherPlayer = playerNum === 1 ? 2 : 1;
    const otherRef = audioRefs[otherPlayer as keyof typeof audioRefs];
    if (otherRef.current) {
      otherRef.current.pause();
      otherRef.current.currentTime = 0;
      setProgress(prev => ({...prev, [otherPlayer]: 0}));
      setCurrentTime(prev => ({...prev, [otherPlayer]: 0}));
    }
    if (activePlayer === otherPlayer) {
      setActivePlayer(null);
    }
    
    const audioRef = audioRefs[playerNum as keyof typeof audioRefs];
    if (audioRef.current) {
      if (activePlayer === playerNum) {
        audioRef.current.pause();
        setActivePlayer(null);
      } else {
        audioRef.current.volume = 1.0;
        audioRef.current.playbackRate = playbackSpeed[playerNum];
        audioRef.current.play();
        setActivePlayer(playerNum);
      }
    }
  };

  const changeSpeed = (playerNum: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger play/pause
    const currentSpeedIndex = speedOptions.indexOf(playbackSpeed[playerNum]);
    const nextSpeedIndex = (currentSpeedIndex + 1) % speedOptions.length;
    const newSpeed = speedOptions[nextSpeedIndex];
    
    setPlaybackSpeed(prev => ({...prev, [playerNum]: newSpeed}));
    
    const audioRef = audioRefs[playerNum as keyof typeof audioRefs];
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleTimeUpdate = (playerNum: number) => {
    const audioRef = audioRefs[playerNum as keyof typeof audioRefs];
    if (audioRef.current) {
      const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(prev => ({...prev, [playerNum]: prog}));
      setCurrentTime(prev => ({...prev, [playerNum]: audioRef.current!.currentTime}));
    }
  };

  const handleLoadedMetadata = (playerNum: number) => {
    const audioRef = audioRefs[playerNum as keyof typeof audioRefs];
    if (audioRef.current) {
      setDuration(prev => ({...prev, [playerNum]: audioRef.current!.duration}));
    }
  };

  const handleEnded = (playerNum: number) => {
    setActivePlayer(null);
    setProgress(prev => ({...prev, [playerNum]: 0}));
    setCurrentTime(prev => ({...prev, [playerNum]: 0}));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Two appointment booking recordings
  const recordings = [
    { 
      id: 1, 
      title: 'Live Appointment Booking', 
      subtitle: 'Final Expense Lead', 
      desc: 'AI qualifies lead and books appointment directly to calendar', 
      src: '/recordings/appointment-booked.MP3',
      gradient: 'from-blue-600 to-cyan-500',
      bgGlow: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      hoverBorder: 'hover:border-blue-400',
      hoverGlow: 'hover:shadow-blue-500/30',
      iconBg: 'bg-blue-500',
      progressBar: 'from-blue-500 to-cyan-400'
    },
    { 
      id: 2, 
      title: 'Live Appointment Booking', 
      subtitle: 'Final Expense Lead', 
      desc: 'AI handles objections and schedules appointment', 
      src: '/recordings/busy-at-work.MP3',
      gradient: 'from-purple-600 to-pink-500',
      bgGlow: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      hoverBorder: 'hover:border-purple-400',
      hoverGlow: 'hover:shadow-purple-500/30',
      iconBg: 'bg-purple-500',
      progressBar: 'from-purple-500 to-pink-400'
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      <PublicNav />
      <MobilePublicNav />
      
      {/* Animated Background - Soft gradual glow (matches landing page exactly) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-blue-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-purple-500/8 rounded-full top-[20%] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
        <div className="absolute w-[1000px] h-[1000px] bg-pink-500/8 rounded-full bottom-[-300px] left-[20%] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern - Same as Landing Page */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      {/* Smooth color transitions between sections - no sharp edges */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-full h-[600px] top-[20%] bg-gradient-to-b from-transparent via-blue-500/3 to-transparent" />
        <div className="absolute w-full h-[600px] top-[50%] bg-gradient-to-b from-transparent via-purple-500/3 to-transparent" />
      </div>

      <div className="relative z-10">
        {/* HERO SECTION - Mobile Optimized */}
        <section className="pt-28 pb-6 sm:pt-32 sm:pb-12 px-4 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="max-w-4xl mx-auto text-center">
            {/* Pill Badge - Smaller on mobile */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-5 sm:mb-8 animate-in fade-in zoom-in duration-500">
              <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-xs sm:text-sm text-blue-400 font-semibold">See Sterling AI In Action</span>
            </div>
            
            {/* Desktop Title */}
            <h1 className="hidden lg:block text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <div className="flex justify-center">
                <BlurText text="Turn Old Leads Into" delay={100} className="text-white" animateBy="words" direction="top" />
              </div>
              <div className="flex justify-center mt-2">
                <BlurText text="Booked Appointments" delay={120} className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent" animateBy="words" direction="top" />
              </div>
            </h1>
            
            {/* Mobile Title - Optimized sizing */}
            <h1 className="lg:hidden text-[30px] sm:text-4xl font-bold mb-4 sm:mb-6 leading-tight px-2">
              <BlurText text="Turn Old Leads Into" delay={80} className="text-white block" animateBy="words" direction="top" />
              <BlurText text="Booked Appointments" delay={100} className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent block mt-1" animateBy="words" direction="top" />
            </h1>
            
            {/* Subtitle - Better mobile sizing */}
            <p className="text-1sm sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed px-2 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '200ms' }}>
              Have old life insurance leads collecting dust? Let Sterling AI revive them into booked appointments — automatically.
            </p>
          </div>
        </section>

        {/* LISTEN TO STERLING AI SECTION - Glowy Two Cards */}
        <section className="py-10 sm:py-24 px-3 sm:px-4 relative">
          
          <div className="max-w-6xl mx-auto relative z-10">
            {/* Section Header - BIGGER Title */}
            <div className="text-center mb-10 sm:mb-16 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-full mb-4 sm:mb-8 shadow-lg shadow-blue-500/20">
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Real AI Conversations</span>
                  </div>
              
              {/* Desktop Big Title */}
              <h2 className="hidden sm:block text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                <span className="text-white">Hear </span>
                <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Sterling AI</span>
                <span className="text-white"> In Action</span>
              </h2>
              
              {/* Mobile Big Title */}
              <h2 className="sm:hidden text-3xl font-bold mb-3 leading-tight">
                <span className="text-white">Hear </span>
                <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Sterling AI</span>
                <span className="text-white"> In Action</span>
              </h2>
              
              <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto">Listen to real appointment bookings — made by AI</p>
                  </div>

            {/* Two Big Glowy Cards - Side by Side */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {recordings.map((rec, index) => {
                const isPlaying = activePlayer === rec.id;
                const isFirst = rec.id === 1;
                
                return (
                  <div
                    key={rec.id}
                    className={`group relative rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom
                      ${isPlaying 
                        ? 'scale-[1.02]' 
                        : 'hover:scale-[1.04]'
                      }`}
                    style={{ animationDelay: `${index * 150}ms`, animationDuration: '600ms' }}
                  >
                    {/* Animated Gradient Border */}
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${isFirst ? 'from-blue-500 via-cyan-500 to-blue-600' : 'from-purple-500 via-pink-500 to-purple-600'} p-[2px] ${isPlaying ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'} transition-opacity duration-300`}>
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent to-transparent animate-spin-slow" style={{ background: `conic-gradient(from 0deg, ${isFirst ? '#3b82f6, #06b6d4, #3b82f6' : '#a855f7, #ec4899, #a855f7'})`, animationDuration: '4s' }} />
                    </div>
                    
                    {/* Inner Card */}
                    <div className={`relative bg-[#0B1437] m-[2px] rounded-3xl overflow-hidden transition-all duration-300`}>
                      {/* Glowing Orbs Inside Card - Soft gradual fade */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className={`absolute w-[400px] h-[400px] ${isFirst ? 'bg-blue-500/20' : 'bg-purple-500/20'} rounded-full -top-40 -right-40 ${isPlaying ? 'animate-pulse' : 'group-hover:animate-pulse'}`} style={{ filter: 'blur(80px)' }} />
                        <div className={`absolute w-[300px] h-[300px] ${isFirst ? 'bg-cyan-500/15' : 'bg-pink-500/15'} rounded-full -bottom-20 -left-20 ${isPlaying ? 'animate-pulse' : 'group-hover:animate-pulse'}`} style={{ filter: 'blur(80px)', animationDelay: '0.5s' }} />
                    </div>
                      
                      {/* Card Content */}
                      <div className="relative z-10 p-6 sm:p-8">
                        {/* Header with Icon */}
                        <div className="flex items-start gap-4 mb-6">
                          <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${isFirst ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500'} flex items-center justify-center shadow-2xl ${isFirst ? 'shadow-blue-500/50' : 'shadow-purple-500/50'} group-hover:scale-110 transition-transform duration-300`}>
                            <CalendarCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                            {/* Glow ring */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${isFirst ? 'from-blue-400 to-cyan-400' : 'from-purple-400 to-pink-400'} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`} />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-1 bg-gradient-to-r ${isFirst ? 'from-blue-400 to-cyan-400' : 'from-purple-400 to-pink-400'} bg-clip-text text-transparent`}>
                              {rec.subtitle}
                            </p>
                            <h3 className="text-2xl sm:text-3xl font-bold text-white">{rec.title}</h3>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-base sm:text-lg text-gray-300 mb-8 leading-relaxed">
                          {rec.desc}
                        </p>
                        
                        {/* Play Button - Big & Glowy */}
                        <div 
                          onClick={() => togglePlay(rec.id)}
                          className={`relative w-full py-5 sm:py-6 rounded-2xl flex items-center justify-center gap-4 transition-all duration-300 overflow-hidden
                            ${isPlaying 
                              ? `bg-gradient-to-r ${isFirst ? 'from-blue-600 to-cyan-500' : 'from-purple-600 to-pink-500'} shadow-2xl ${isFirst ? 'shadow-blue-500/50' : 'shadow-purple-500/50'}` 
                              : `bg-white/5 border-2 ${isFirst ? 'border-blue-500/30 hover:border-blue-400/60' : 'border-purple-500/30 hover:border-purple-400/60'} hover:bg-white/10`
                            }`}
                        >
                          {/* Button glow effect */}
                          {!isPlaying && (
                            <div className={`absolute inset-0 bg-gradient-to-r ${isFirst ? 'from-blue-500/0 via-blue-500/10 to-blue-500/0' : 'from-purple-500/0 via-purple-500/10 to-purple-500/0'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                          )}
                          
                          <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                            isPlaying 
                              ? 'bg-white/20 shadow-white/20' 
                              : `bg-gradient-to-r ${isFirst ? 'from-blue-500 to-cyan-500 shadow-blue-500/50' : 'from-purple-500 to-pink-500 shadow-purple-500/50'}`
                          }`}>
                            {isPlaying ? (
                              <Pause className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            ) : (
                              <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-1" />
                            )}
                          </div>
                          <span className="relative text-white font-bold text-lg sm:text-xl">
                            {isPlaying ? 'Now Playing...' : 'Play Recording'}
                          </span>
                        </div>
                        
                        {/* Progress Section */}
                        <div className="mt-6 space-y-4">
                          {/* Progress Bar - Glowy */}
                          <div className="relative h-3 bg-gray-800/80 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${isFirst ? 'from-blue-500 to-cyan-400' : 'from-purple-500 to-pink-400'} rounded-full transition-all duration-150`}
                              style={{ width: `${progress[rec.id]}%` }}
                            />
                            {/* Glow on progress */}
                            <div 
                              className={`absolute top-0 h-full bg-gradient-to-r ${isFirst ? 'from-blue-400 to-cyan-300' : 'from-purple-400 to-pink-300'} rounded-full blur-sm opacity-50`}
                            style={{ width: `${progress[rec.id]}%` }}
                          />
                          </div>
                          
                          {/* Time & Speed Controls */}
                          <div className="flex items-center justify-between">
                            {/* Time Display */}
                            <div className="flex items-center gap-2 text-sm sm:text-base text-gray-400 font-medium">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(currentTime[rec.id] || 0)}</span>
                              <span className="text-gray-600">/</span>
                              <span>{formatTime(duration[rec.id] || 0)}</span>
                            </div>
                            
                            {/* Speed Control Button - Glowy */}
                            <button
                              onClick={(e) => changeSpeed(rec.id, e)}
                              className={`relative px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition-all duration-200 
                                bg-gradient-to-r ${isFirst ? 'from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400' : 'from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400'} text-white active:scale-95 shadow-lg ${isFirst ? 'shadow-blue-500/30' : 'shadow-purple-500/30'}`}
                            >
                              {playbackSpeed[rec.id]}x
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                  <audio 
                      ref={audioRefs[rec.id as keyof typeof audioRefs]}
                      src={rec.src}
                      onTimeUpdate={() => handleTimeUpdate(rec.id)}
                      onLoadedMetadata={() => handleLoadedMetadata(rec.id)}
                      onEnded={() => handleEnded(rec.id)}
                    className="hidden"
                  />
                </div>
                );
              })}
                </div>
              </div>
        </section>

        {/* HOW IT WORKS SECTION - Vibrant & Glowy */}
        <section className="py-12 sm:py-28 px-3 sm:px-4 relative overflow-hidden">
          
          <div className="max-w-6xl mx-auto relative z-10">
            {/* Section Header - Bigger & Gradient */}
            <div className="text-center mb-12 sm:mb-20 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 border border-white/10 rounded-full mb-4 sm:mb-6">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-white">Simple 3-Step Process</span>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4">
                How It <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-base sm:text-xl text-gray-400">Three simple steps. That's it.</p>
            </div>

            {/* Steps - With Connecting Lines */}
            <div className="relative">
              {/* Connecting Line - Desktop Only */}
              <div className="hidden md:block absolute top-[4.5rem] left-[16%] right-[16%] h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full opacity-30" />
              <div className="hidden md:block absolute top-[4.5rem] left-[16%] right-[16%] h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full blur-md opacity-50" />
              
              <div className="grid md:grid-cols-3 gap-6 sm:gap-10">
              {/* Step 1 */}
                <div className="group relative animate-in fade-in slide-in-from-bottom" style={{ animationDelay: '100ms', animationDuration: '600ms' }}>
                  {/* Gradient Glow Behind Card - Soft */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/40 to-cyan-500/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ filter: 'blur(40px)' }} />
                  
                  <div className="relative bg-[#0B1437] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-blue-500/30 group-hover:border-blue-400/60 transition-all duration-300 group-hover:scale-[1.02]">
                    {/* Floating Step Number */}
                    <div className="absolute -top-4 -right-2 sm:-top-5 sm:-right-3 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                      1
                    </div>
                    
                    {/* Glowing Icon */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6">
                      <div className="absolute -inset-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl opacity-40 group-hover:opacity-60 transition-opacity" style={{ filter: 'blur(20px)' }} />
                      <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                  </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Upload Your Leads</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      Import your old leads — You know, the ones collecting dust.
                    </p>
                  </div>
                </div>
                
              {/* Step 2 */}
                <div className="group relative animate-in fade-in slide-in-from-bottom" style={{ animationDelay: '200ms', animationDuration: '600ms' }}>
                  {/* Gradient Glow Behind Card - Soft */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ filter: 'blur(40px)' }} />
                  
                  <div className="relative bg-[#0B1437] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-purple-500/30 group-hover:border-purple-400/60 transition-all duration-300 group-hover:scale-[1.02]">
                    {/* Floating Step Number */}
                    <div className="absolute -top-4 -right-2 sm:-top-5 sm:-right-3 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                      2
                    </div>
                    
                    {/* Glowing Icon */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6">
                      <div className="absolute -inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl opacity-40 group-hover:opacity-60 transition-opacity" style={{ filter: 'blur(20px)' }} />
                      <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                        <Rocket className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Launch AI Agent</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      Set your daily budget and Hit "Launch." AI starts calling immediately.
                  </p>
              </div>
            </div>

              {/* Step 3 */}
                <div className="group relative animate-in fade-in slide-in-from-bottom" style={{ animationDelay: '300ms', animationDuration: '600ms' }}>
                  {/* Gradient Glow Behind Card - Soft */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-green-500/40 to-emerald-500/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ filter: 'blur(40px)' }} />
                  
                  <div className="relative bg-[#0B1437] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-green-500/30 group-hover:border-green-400/60 transition-all duration-300 group-hover:scale-[1.02]">
                    {/* Floating Step Number */}
                    <div className="absolute -top-4 -right-2 sm:-top-5 sm:-right-3 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-green-500/50 group-hover:scale-110 transition-transform">
                      3
                    </div>
                    
                    {/* Glowing Icon */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6">
                      <div className="absolute -inset-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl opacity-40 group-hover:opacity-60 transition-opacity" style={{ filter: 'blur(20px)' }} />
                      <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                  </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Get Appointments</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      AI books appointments directly on your calendar. Wake up to a full schedule.
                    </p>
                  </div>
                </div>
                      </div>
                    </div>
                  </div>
        </section>

        {/* ROI CALCULATOR SECTION - Mobile Optimized */}
        <section className="py-10 sm:py-24 px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl sm:rounded-2xl p-5 sm:p-12 border border-gray-800 animate-in fade-in zoom-in-95 duration-700">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-3 sm:mb-4">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                  <span className="text-xs sm:text-sm font-bold text-green-400">ROI CALCULATOR</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">
                  The Math Is Simple
                </h2>
                <p className="text-sm sm:text-base text-gray-400">See why Sterling AI pays for itself</p>
              </div>

              {/* ROI Grid - Stack on mobile */}
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10">
                {/* Left: Costs */}
                <div className="bg-[#0B1437] border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    Your Investment
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-800">
                      <span className="text-xs sm:text-sm text-gray-400">Sterling AI Monthly</span>
                      <span className="text-sm sm:text-base text-white font-semibold">$499</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-800">
                      <span className="text-xs sm:text-sm text-gray-400">~300 calls per day</span>
                      <span className="text-sm sm:text-base text-white font-semibold">~$18/day</span>
            </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2">
                      <span className="text-xs sm:text-sm text-gray-400 font-semibold">Total Monthly</span>
                      <span className="text-lg sm:text-xl text-white font-bold">~$1040</span>
                  </div>
                  </div>
                </div>
                
                {/* Right: Returns */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    Your Return
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-green-500/20">
                      <span className="text-xs sm:text-sm text-gray-300">Avg. Policy Value</span>
                      <span className="text-sm sm:text-base text-white font-semibold">$1,200/yr</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-green-500/20">
                      <span className="text-xs sm:text-sm text-gray-300">Break Even</span>
                      <span className="text-sm sm:text-base text-green-400 font-bold">Just 1 Policy</span>
                      </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2">
                      <span className="text-xs sm:text-sm text-green-400 font-semibold">Every Policy After</span>
                      <span className="text-lg sm:text-xl text-green-400 font-bold">Profit 💰</span>
              </div>
            </div>
          </div>
        </div>

              {/* Bottom Stats - Compact on mobile */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6 bg-[#0B1437] rounded-xl sm:rounded-2xl border border-gray-800">
                <div className="text-center">
                  <div className="text-xl sm:text-3xl font-bold text-white">300+</div>
                  <div className="text-[10px] sm:text-sm text-gray-400">Calls/Day</div>
                </div>
                <div className="text-center border-x border-gray-800">
                  <div className="text-xl sm:text-3xl font-bold text-white">50+</div>
                  <div className="text-[10px] sm:text-sm text-gray-400">Appts/Mo</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-3xl font-bold text-green-400">10+</div>
                  <div className="text-[10px] sm:text-sm text-gray-400">Sold/Mo</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA - Mobile Optimized */}
        <section className="py-10 sm:py-24 px-3 sm:px-4 pb-20 sm:pb-24">
          <div className="max-w-3xl mx-auto">
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl sm:rounded-2xl p-6 sm:p-12 border-2 border-blue-500/30 text-center animate-in fade-in zoom-in-95 duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 animate-pulse" />
              <div className="relative">
                <h2 className="text-4xl sm:text-4xl font-bold text-white mb-6 sm:mb-4">
                  Ready to Revive Your Leads?
            </h2>
                <p className="text-1sm sm:text-lg text-gray-300 mb-8 sm:mb-8">
                  Sterling AI pays for itself with just one policy. Start today.
                </p>
                
                {/* Buttons - Full width on mobile */}
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-center">
                <Link
                  href="/signup"
                    className="group px-6 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base sm:text-lg rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                >
                    <Rocket className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    Get Started Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/pricing"
                    className="px-6 py-3.5 sm:px-8 sm:py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold text-base sm:text-lg rounded-xl transition-all hover:scale-105"
                >
                  View Pricing
                </Link>
                </div>
                
                {/* Trust badges - All in 1 line on mobile */}
                <div className="mt-8 sm:mt-10 flex items-center justify-center gap-2.5 sm:gap-6 text-[10px] sm:text-sm text-gray-400">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    <span className="whitespace-nowrap">No contracts</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    <span className="whitespace-nowrap">Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    <span className="whitespace-nowrap">15 min setup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <PublicFooter />
      <MobileFooter />
    </div>
  );
}
