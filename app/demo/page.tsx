'use client';

import { useState, useRef } from 'react';
import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { Upload, Rocket, Calendar, Play, Pause, DollarSign, Phone, CheckCircle, ArrowRight, Headphones, Clock, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  // Audio player state
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [progress, setProgress] = useState<{[key: number]: number}>({1: 0, 2: 0, 3: 0, 4: 0});
  
  const audioRefs = {
    1: useRef<HTMLAudioElement>(null),
    2: useRef<HTMLAudioElement>(null),
    3: useRef<HTMLAudioElement>(null),
    4: useRef<HTMLAudioElement>(null),
  };

  const togglePlay = (playerNum: number) => {
    // Stop all other players
    Object.entries(audioRefs).forEach(([num, ref]) => {
      if (parseInt(num) !== playerNum && ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    
    const audioRef = audioRefs[playerNum as keyof typeof audioRefs];
    if (audioRef.current) {
      if (activePlayer === playerNum) {
        audioRef.current.pause();
        setActivePlayer(null);
      } else {
        audioRef.current.volume = 1.0;
        audioRef.current.play();
        setActivePlayer(playerNum);
      }
    }
  };

  const handleTimeUpdate = (playerNum: number) => {
    const audioRef = audioRefs[playerNum as keyof typeof audioRefs];
    if (audioRef.current) {
      const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(prev => ({...prev, [playerNum]: prog}));
    }
  };

  const handleEnded = (playerNum: number) => {
    setActivePlayer(null);
    setProgress(prev => ({...prev, [playerNum]: 0}));
  };

  const recordings = [
    { id: 1, title: 'Busy at Work → Closed', tag: 'Callback', tagColor: 'emerald', desc: 'AI scheduled callback, Agent closed for $112/mo', src: '/recordings/busy-at-work.mp3' },
    { id: 2, title: '"Not Interested" Handled', tag: 'Objection', tagColor: 'violet', desc: 'AI turns a hard "no" into engagement', src: '/recordings/not-interested-objection.mp3' },
    { id: 3, title: '"Never Filled Form" → Sold', tag: 'Confused', tagColor: 'cyan', desc: 'Confused lead → Agent sold him a $172/month policy', src: '/recordings/never-filled-form.mp3' },
    { id: 4, title: 'Appointment Booked Live', tag: 'Booked', tagColor: 'amber', desc: 'AI books appointment straight to your calendar', src: '/recordings/appointment-booked.mp3' },
  ];

  const tagColors: {[key: string]: string} = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const playerColors: {[key: string]: {bg: string, glow: string, bar: string}} = {
    emerald: { bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50', bar: 'from-emerald-500 to-emerald-400' },
    violet: { bg: 'bg-violet-500', glow: 'shadow-violet-500/50', bar: 'from-violet-500 to-violet-400' },
    cyan: { bg: 'bg-cyan-500', glow: 'shadow-cyan-500/50', bar: 'from-cyan-500 to-cyan-400' },
    amber: { bg: 'bg-amber-500', glow: 'shadow-amber-500/50', bar: 'from-amber-500 to-amber-400' },
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      <PublicNav />
      <MobilePublicNav />
      
      {/* Animated Background - Same as Landing Page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl top-0 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl top-1/3 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[700px] h-[700px] bg-pink-500/10 rounded-full blur-3xl bottom-0 left-1/4 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern - Same as Landing Page */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

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

        {/* LISTEN TO STERLING AI SECTION - Mobile Optimized */}
        <section className="py-8 sm:py-20 px-3 sm:px-4">
          <div className="max-w-3xl mx-auto">
            {/* Section Header - Compact on mobile */}
            <div className="text-center mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3 sm:mb-6">
                <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                <span className="text-xs sm:text-sm font-medium text-blue-400">Real AI Conversations</span>
                  </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">
                Hear Sterling AI In Action
              </h2>
              <p className="text-sm sm:text-base text-gray-400">Tap any recording to listen</p>
                  </div>

            {/* Audio Players - Mobile Optimized */}
            <div className="space-y-2.5 sm:space-y-3">
              {recordings.map((rec, index) => {
                const isPlaying = activePlayer === rec.id;
                const colors = playerColors[rec.tagColor];
                
                return (
                  <div
                    key={rec.id}
                    onClick={() => togglePlay(rec.id)}
                    className={`group relative rounded-xl sm:rounded-2xl p-3 sm:p-5 cursor-pointer transition-all duration-300 active:scale-[0.98] animate-in fade-in slide-in-from-bottom ${
                      isPlaying 
                        ? `bg-[#1A2647] border-2 border-blue-500/50 shadow-xl ${colors.glow}` 
                        : 'bg-[#1A2647] border border-gray-800 hover:border-blue-500/30'
                    }`}
                    style={{ animationDelay: `${index * 100}ms`, animationDuration: '500ms' }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Play Button - Smaller on mobile */}
                      <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                        isPlaying 
                          ? `${colors.bg} shadow-lg ${colors.glow}` 
                          : 'bg-blue-500/20 group-hover:bg-blue-500/30'
                      }`}>
                        {isPlaying ? (
                          <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        ) : (
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" />
                      )}
                    </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                          <h3 className="text-sm sm:text-lg font-semibold text-white truncate">{rec.title}</h3>
                          <span className={`px-1.5 py-0.5 text-[9px] sm:text-xs font-bold rounded-full border ${tagColors[rec.tagColor]} flex-shrink-0`}>
                            {rec.tag}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">{rec.desc}</p>
                        
                        {/* Progress Bar */}
                        <div className="mt-2 sm:mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-150`}
                            style={{ width: `${progress[rec.id]}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                  <audio 
                      ref={audioRefs[rec.id as keyof typeof audioRefs]}
                      src={rec.src}
                      onTimeUpdate={() => handleTimeUpdate(rec.id)}
                      onEnded={() => handleEnded(rec.id)}
                    className="hidden"
                  />
                </div>
                );
              })}
                </div>
              </div>
        </section>

        {/* HOW IT WORKS SECTION - Mobile Optimized */}
        <section className="py-10 sm:py-24 px-3 sm:px-4">
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-14 animate-in fade-in slide-in-from-bottom duration-700">
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">
                How It Works
              </h2>
              <p className="text-sm sm:text-base text-gray-400">Three simple steps. That's it.</p>
            </div>

            {/* Steps - Stack on mobile */}
            <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
              {/* Step 1 */}
              <div className="group relative bg-[#1A2647] rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 sm:hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 animate-in fade-in slide-in-from-bottom" style={{ animationDelay: '100ms', animationDuration: '600ms' }}>
                <div className="flex items-start gap-4 sm:block">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-500/20 flex items-center justify-center sm:mb-5 group-hover:scale-110 transition-all border border-blue-500/30 flex-shrink-0">
                    <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-blue-400 text-xs sm:text-sm font-bold mb-1 sm:mb-2">STEP 1</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Upload Your Leads</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      Import your old leads — The ones collecting dust. Sterling AI will start calling them all.
                    </p>
                  </div>
                  </div>
                </div>
                
              {/* Step 2 */}
              <div className="group relative bg-[#1A2647] rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 sm:hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 animate-in fade-in slide-in-from-bottom" style={{ animationDelay: '200ms', animationDuration: '600ms' }}>
                <div className="flex items-start gap-4 sm:block">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-purple-500/20 flex items-center justify-center sm:mb-5 group-hover:scale-110 transition-all border border-purple-500/30 flex-shrink-0">
                    <Rocket className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                    </div>
                    <div className="flex-1">
                    <div className="text-purple-400 text-xs sm:text-sm font-bold mb-1 sm:mb-2">STEP 2</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Launch AI Agent</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      Set your daily budget and Hit "Launch." AI starts calling immediately.
                    </p>
                </div>
              </div>
            </div>

              {/* Step 3 */}
              <div className="group relative bg-[#1A2647] rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-gray-800 hover:border-green-500/50 transition-all duration-300 sm:hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 animate-in fade-in slide-in-from-bottom" style={{ animationDelay: '300ms', animationDuration: '600ms' }}>
                <div className="flex items-start gap-4 sm:block">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-green-500/20 flex items-center justify-center sm:mb-5 group-hover:scale-110 transition-all border border-green-500/30 flex-shrink-0">
                    <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-green-400 text-xs sm:text-sm font-bold mb-1 sm:mb-2">STEP 3</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Get Appointments</h3>
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
