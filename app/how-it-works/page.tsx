'use client';

import { useState, useRef } from 'react';
import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { Upload, Settings, Rocket, Calendar, TrendingUp, Play, Pause, Gift, ArrowRight, Sparkles, Zap, Phone, CheckCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksPage() {
  // Audio player state
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);
  const [isPlaying3, setIsPlaying3] = useState(false);
  const [progress1, setProgress1] = useState(0);
  const [progress2, setProgress2] = useState(0);
  const [progress3, setProgress3] = useState(0);
  const audio1Ref = useRef<HTMLAudioElement>(null);
  const audio2Ref = useRef<HTMLAudioElement>(null);
  const audio3Ref = useRef<HTMLAudioElement>(null);

  const togglePlay1 = () => {
    if (audio1Ref.current) {
      if (isPlaying1) {
        audio1Ref.current.pause();
      } else {
        audio1Ref.current.play();
      }
      setIsPlaying1(!isPlaying1);
    }
  };

  const togglePlay2 = () => {
    if (audio2Ref.current) {
      if (isPlaying2) {
        audio2Ref.current.pause();
      } else {
        audio2Ref.current.play();
      }
      setIsPlaying2(!isPlaying2);
    }
  };

  const togglePlay3 = () => {
    if (audio3Ref.current) {
      if (isPlaying3) {
        audio3Ref.current.pause();
      } else {
        audio3Ref.current.play();
      }
      setIsPlaying3(!isPlaying3);
    }
  };

  const handleTimeUpdate1 = () => {
    if (audio1Ref.current) {
      const progress = (audio1Ref.current.currentTime / audio1Ref.current.duration) * 100;
      setProgress1(progress);
    }
  };

  const handleTimeUpdate2 = () => {
    if (audio2Ref.current) {
      const progress = (audio2Ref.current.currentTime / audio2Ref.current.duration) * 100;
      setProgress2(progress);
    }
  };

  const handleTimeUpdate3 = () => {
    if (audio3Ref.current) {
      const progress = (audio3Ref.current.currentTime / audio3Ref.current.duration) * 100;
      setProgress3(progress);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437]">
      <PublicNav />
      <MobilePublicNav />
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl top-0 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl top-1/3 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[700px] h-[700px] bg-pink-500/10 rounded-full blur-3xl bottom-0 left-1/4 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative z-10 pt-16">
        {/* Hero */}
        {/* Header - Hidden on Mobile */}
        <div className="hidden lg:block max-w-6xl mx-auto px-4 py-20 text-center animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-12">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-blue-400 font-semibold">Simple & Powerful</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-bold mb-8 text-center">
            <div className="flex justify-center">
              <BlurText
                text="Turn Old Leads Into"
                delay={100}
                className="text-white"
                animateBy="words"
                direction="top"
              />
            </div>
            <div className="flex justify-center mt-2">
              <BlurText
                text="Booked Appointments"
                delay={120}
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                animateBy="words"
                direction="top"
              />
            </div>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Have thousands of old life insurance leads collecting dust? Let Sterling AI revive them into booked appointments — automatically.
          </p>
          
        </div>

        {/* Hear It In Action */}
        <div className="max-w-6xl mx-auto px-4 mb-20 pt-20 lg:pt-0">
          <div className="text-center mb-12 lg:mb-12">
            {/* Mobile: Two-row title */}
            <h2 className="text-4xl md:text-5xl font-bold mb-4 lg:hidden">
              <div className="flex justify-center mb-2">
                <BlurText
                  text="Hear Sterling AI"
                  delay={100}
                  className="text-white"
                  animateBy="words"
                  direction="top"
                />
              </div>
              <div className="text-5xl flex justify-center">
                <BlurText
                  text="In Action"
                  delay={120}
                  className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                  animateBy="words"
                  direction="top"
                />
              </div>
            </h2>
            
            {/* Desktop: Single line, white */}
            <h2 className="hidden lg:block text-4xl md:text-5xl font-bold mb-4 text-white">
              Hear Sterling AI In Action
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 lg:mb-0">
              Real calls. Real conversations. Real results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-y-14 md:gap-6 mt-18 md:mt-0">
            {/* Call Recording 1 - Busy at Work */}
            <div className="group relative animate-in fade-in slide-in-from-left duration-700 transition-transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0.2s' }}>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500 animate-pulse" />
              <div className="relative bg-[#1A2647] rounded-2xl p-6 border border-gray-800 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <Phone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Busy → Closed</h3>
                    <p className="text-gray-400 text-xs">Called back on weekend</p>
                  </div>
                </div>
                
                {/* Audio Player */}
                <div className="bg-[#0B1437] rounded-xl p-6 border border-gray-700 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div 
                      onClick={togglePlay1}
                      className="w-14 h-14 rounded-full bg-blue-600/20 hover:bg-blue-600/30 border-2 border-blue-500/50 flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-xl hover:shadow-blue-500/50"
                    >
                      {isPlaying1 ? (
                        <Pause className="w-6 h-6 text-blue-400" />
                      ) : (
                        <Play className="w-6 h-6 text-blue-400 ml-1" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-200"
                          style={{ width: `${progress1}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <audio 
                    ref={audio1Ref}
                    src="/recordings/busy-at-work.mp3"
                    onTimeUpdate={handleTimeUpdate1}
                    onEnded={() => {
                      setIsPlaying1(false);
                      setProgress1(0);
                    }}
                    className="hidden"
                  />
                </div>
                
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-blue-300 text-xs leading-relaxed">
                    💡 Vet was busy at work, AI scheduled callback. Client closed on weekend for $112/month!
                  </p>
                </div>
              </div>
            </div>

            {/* Call Recording 2 - Not Interested */}
            <div className="group relative animate-in fade-in slide-in-from-bottom duration-700 transition-transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0.3s' }}>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500 animate-pulse" />
              <div className="relative bg-[#1A2647] rounded-2xl p-6 border border-gray-800 hover:border-purple-500/50 transition-all hover:shadow-2xl hover:shadow-purple-500/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border-2 border-purple-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <Phone className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Objection Handled</h3>
                    <p className="text-gray-400 text-xs">Simply marked "Not interested" in CRM</p>
                  </div>
                </div>
                
                {/* Audio Player */}
                <div className="bg-[#0B1437] rounded-xl p-6 border border-gray-700 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div 
                      onClick={togglePlay2}
                      className="w-14 h-14 rounded-full bg-purple-600/20 hover:bg-purple-600/30 border-2 border-purple-500/50 flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-xl hover:shadow-purple-500/50"
                    >
                      {isPlaying2 ? (
                        <Pause className="w-6 h-6 text-purple-400" />
                      ) : (
                        <Play className="w-6 h-6 text-purple-400 ml-1" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200"
                          style={{ width: `${progress2}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <audio 
                    ref={audio2Ref}
                    src="/recordings/not-interested-objection.mp3"
                    onTimeUpdate={handleTimeUpdate2}
                    onEnded={() => {
                      setIsPlaying2(false);
                      setProgress2(0);
                    }}
                    className="hidden"
                  />
                </div>
                
                <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-purple-300 text-xs leading-relaxed">
                    💡 Example of Sterling AI handling the "Not Interested" objection smoothly!
                  </p>
                </div>
              </div>
            </div>

            {/* Call Recording 3 - Never Filled Form */}
            <div className="group relative animate-in fade-in slide-in-from-right duration-700 transition-transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0.4s' }}>
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500 animate-pulse" />
              <div className="relative bg-[#1A2647] rounded-2xl p-6 border border-gray-800 hover:border-green-500/50 transition-all hover:shadow-2xl hover:shadow-green-500/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border-2 border-green-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <Phone className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Confused → Closed</h3>
                    <p className="text-gray-400 text-xs">Never filled form → Sold</p>
                  </div>
                </div>
                
                {/* Audio Player */}
                <div className="bg-[#0B1437] rounded-xl p-6 border border-gray-700 hover:border-green-500/30 transition-colors">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div 
                      onClick={togglePlay3}
                      className="w-14 h-14 rounded-full bg-green-600/20 hover:bg-green-600/30 border-2 border-green-500/50 flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-xl hover:shadow-green-500/50"
                    >
                      {isPlaying3 ? (
                        <Pause className="w-6 h-6 text-green-400" />
                      ) : (
                        <Play className="w-6 h-6 text-green-400 ml-1" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-200"
                          style={{ width: `${progress3}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <audio 
                    ref={audio3Ref}
                    src="/recordings/never-filled-form.mp3"
                    onTimeUpdate={handleTimeUpdate3}
                    onEnded={() => {
                      setIsPlaying3(false);
                      setProgress3(0);
                    }}
                    className="hidden"
                  />
                </div>
                
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-green-300 text-xs leading-relaxed">
                    💡 "I never filled the form" → "I wanna see what I qualify for" → Booked! Client sold $172/month policy!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Steps */}
        <div className="max-w-6xl mx-auto px-4 py-5 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-5xl font-bold text-white mb-4">
              3 Simple Steps to Success
            </h2>
            <p className="text-1xl md:text-xl text-gray-400">
              From dusty leads to booked calendar
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group relative bg-[#1A2647] rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '0.1s' }}>
              <div className="hidden md:flex absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                1
              </div>
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all border border-blue-500/30">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Upload Your Old Leads</h3>
                <p className="text-gray-400">
                  Import those leads from 6 months, 1 year, even 2 years ago. The ones collecting dust in your CRM. Sterling AI will call them ALL.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative bg-[#1A2647] rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '0.2s' }}>
              <div className="hidden md:flex absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                2
              </div>
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all border border-purple-500/30">
                  <Settings className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Configure & Launch</h3>
                <p className="text-gray-400">
                  Set your daily call limit (up to 1,800 with Elite). Choose lead count or time-based execution. Click "Launch AI Agent." That's it.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative bg-[#1A2647] rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '0.3s' }}>
              <div className="hidden md:flex absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-green-500 items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                3
              </div>
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all border border-green-500/30">
                  <Calendar className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Watch Calendar Fill Up</h3>
                <p className="text-gray-400">
                  AI calls, qualifies, and books appointments automatically. You wake up to a full calendar. No manual dialing. No chasing. Just appointments.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* The Problem/Solution - Hidden on Mobile */}
        <div className="hidden lg:block max-w-4xl mx-auto px-4 py-18">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-12 border border-gray-800 text-center animate-in fade-in zoom-in duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Still chasing new leads when you haven't even worked the old ones?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Sterling AI does it all — automatically calling, following up, and booking your calendar full. 
              You already paid for those leads. Let's make sure you get your money's worth.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-600/20 border border-green-500/40 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-bold">$999/month. 600 dials a day. What's one policy worth to you?</span>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-15 text-center">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl sm:rounded-2xl p-6 sm:p-10 md:p-12 border-2 border-blue-500/30 group hover:border-blue-500/50 transition-all animate-in fade-in zoom-in duration-700">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            <div className="relative">
              <h2 className="text-3xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                Ready to Revive Those Old Leads?
              </h2>
              <p className="text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg leading-relaxed">
                Sterling AI pays for itself by lunch. What are you waiting for?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  href="/login"
                  className="group/btn px-6 py-3 sm:px-10 sm:py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base sm:text-lg rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                >
                  <Rocket className="w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:translate-y-[-4px] transition-transform" />
                  Launch My AI Agent
                </Link>
                <Link
                  href="/pricing"
                  className="px-6 py-3 sm:px-10 sm:py-5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold text-base sm:text-lg rounded-xl transition-all hover:scale-105"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
      <MobileFooter />
    </div>
  );
}

