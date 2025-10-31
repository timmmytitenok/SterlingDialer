'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { CheckCircle2, Zap, ArrowRight, Phone, Calendar, BarChart3, Clock, Shield, Sparkles, Gift, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl top-1/4 -right-40 animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute w-[700px] h-[700px] bg-indigo-500/20 rounded-full blur-3xl bottom-0 left-1/3 animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <PublicNav />
      <MobilePublicNav />

      <main className="relative z-10 pt-32 lg:pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* 30% OFF BANNER */}
          <div className="max-w-4xl mx-auto mb-8 lg:mb-12 animate-in fade-in slide-in-from-top duration-700 px-2 sm:px-4 lg:px-0">
            <div className="relative group overflow-hidden bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 border-2 border-purple-500/50 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 hover:border-purple-500/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/40">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative text-center">
                <p className="text-white font-bold text-[17px] sm:text-xl lg:text-2xl mb-2 leading-tight whitespace-nowrap">
                  🎁 Get 30% OFF Your First Month!
                </p>
                <p className="text-gray-300 text-sm sm:text-base lg:text-lg mb-3 lg:mb-4">
                  Use code <span className="text-purple-400 font-mono font-bold text-base sm:text-lg lg:text-xl px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-500/20 rounded">STERLING</span> at signup
                </p>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Limited time offer • Works on all plans
                </p>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-16 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-sm text-blue-400 font-semibold">Simple, Transparent Pricing</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
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
            </h1>
            <p className="text-1xl md:text-xl text-gray-400 mb-4">
              You already paid for those leads. Let's make sure you get your money's worth.
            </p>
            <p className="hidden sm:block text-lg text-gray-500">
              $999/month. 600 dials a day. What's one policy worth to you?
            </p>
          </div>

          {/* Pricing Cards - 3 Tiers */}
          <div className="max-w-7xl mx-auto mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Starter Plan */}
              <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-blue-500/30 shadow-xl transition-all duration-500 hover:scale-105 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/40 cursor-pointer group">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                  <p className="text-gray-400 text-sm mb-4">Perfect for getting started</p>
                  
                  <div className="flex items-baseline justify-center gap-1 mb-6">
                    <span className="text-5xl font-bold text-white">$999</span>
                    <span className="text-xl text-gray-400">/mo</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">1 AI Caller</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">600 leads per day</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Live call transfer</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Calendar integration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Call recordings & analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Revenue tracking</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">24/7 AI operation</span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="group/btn w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50"
                >
                  <Zap className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                  Activate AI
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Pro Plan - MOST POPULAR */}
              <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-purple-500/40 shadow-2xl shadow-purple-500/20 transform lg:scale-105 transition-all duration-500 hover:scale-110 hover:border-purple-500/70 hover:shadow-3xl hover:shadow-purple-500/50 cursor-pointer group">
                {/* Popular Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 sm:px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300 whitespace-nowrap">
                  ⭐ MOST POPULAR ⭐
                </div>

                <div className="text-center mb-6 mt-4">
                  <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                  <p className="text-gray-400 text-sm mb-4">For serious closers</p>
                  
                  <div className="flex items-baseline justify-center gap-1 mb-6">
                    <span className="text-5xl font-bold text-white">$1,399</span>
                    <span className="text-xl text-gray-400">/mo</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">2 AI Callers</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">1,200 leads per day</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Live call transfer</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Calendar integration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Call recordings & analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Revenue tracking</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Priority support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">24/7 AI operation</span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="group/btn w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50"
                >
                  <Zap className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                  Activate AI
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Elite Plan */}
              <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-amber-500/30 shadow-xl transition-all duration-500 hover:scale-105 hover:border-amber-500/60 hover:shadow-2xl hover:shadow-amber-500/40 cursor-pointer group">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                  👑 ELITE
                </div>

                <div className="text-center mb-6 mt-4">
                  <h3 className="text-2xl font-bold text-white mb-2">Elite</h3>
                  <p className="text-gray-400 text-sm mb-4">Maximum volume & automation</p>
                  
                  <div className="flex items-baseline justify-center gap-1 mb-6">
                    <span className="text-5xl font-bold text-white">$1,999</span>
                    <span className="text-xl text-gray-400">/mo</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-semibold text-sm">3 AI Callers</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-semibold text-sm">1,800 leads per day</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Live call transfer</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Priority support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Calendar integration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Call recordings & analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Revenue tracking</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">24/7 AI operation</span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="group/btn w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/50"
                >
                  <Zap className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                  Activate AI
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>
          </div>

          {/* ROI Calculator */}
          <div className="max-w-4xl mx-auto mb-20 px-2 sm:px-0">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-2xl p-6 sm:p-8 md:p-10 border border-green-500/20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">See Your ROI</h2>
                <p className="text-gray-400">Conservative estimates with Starter plan (600 calls/day)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-400 mb-2">4-6</div>
                  <div className="text-white font-semibold mb-1">Appointments/Day</div>
                  <div className="text-gray-400 text-sm">600 calls daily</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-400 mb-2">80+</div>
                  <div className="text-white font-semibold mb-1">Appointments/Month</div>
                  <div className="text-gray-400 text-sm">20 business days</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-400 mb-2">8x</div>
                  <div className="text-white font-semibold mb-1">Return on Investment</div>
                  <div className="text-gray-400 text-sm">First month</div>
                </div>
              </div>

              <div className="mt-6 md:mt-8 p-3 sm:p-5 md:p-6 bg-green-500/10 rounded-xl border border-green-500/20">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="hidden sm:flex w-8 h-8 rounded-full bg-green-500/20 items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold mb-2 sm:mb-3 text-sm sm:text-lg">The Math:</div>
                    <div className="space-y-2 sm:space-y-2.5">
                      <p className="text-gray-300 text-[10px] sm:text-sm leading-relaxed whitespace-nowrap overflow-x-auto">
                        4 appointments/day × 20 business days = <span className="text-white font-semibold">80 appointments</span>
                      </p>
                      <p className="text-gray-300 text-[10px] sm:text-sm leading-relaxed whitespace-nowrap">
                        Close 1 in 10 appointments = <span className="text-white font-semibold">8 policies</span>
                      </p>
                      <p className="text-gray-300 text-[9px] sm:text-sm leading-relaxed whitespace-nowrap">
                        8 policies × $1,000 avg commission = <span className="text-green-400 font-bold text-[10px] sm:text-lg md:text-xl">$8,000 profit</span>
                      </p>
                      <p className="text-green-400 font-semibold text-[10px] sm:text-sm mt-3 sm:mt-4">
                        That's lost money sitting in your leads sheet!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Old Leads Section */}
          <div className="max-w-5xl mx-auto mb-20 animate-in fade-in zoom-in duration-700 px-2 sm:px-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12 border border-blue-500/30">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 animate-pulse" />
              <div className="relative text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-5 md:mb-6 leading-tight">
                  Have thousands of old leads collecting dust?
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-4 sm:mb-5 md:mb-6 leading-relaxed">
                  Let Sterling AI revive them into booked appointments — automatically. 
                  Those leads from 6 months, 1 year, even 2 years ago? We'll call them ALL.
                </p>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-400 mb-5 sm:mb-6 md:mb-8 leading-relaxed">
                  You already paid for those leads. Sterling AI just makes sure you get your money's worth — 
                  by calling and booking them on autopilot.
                </p>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-green-600/20 border border-green-500/40 rounded-lg sm:rounded-xl">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  <span className="text-green-400 font-bold text-xs sm:text-sm md:text-base">Sterling AI pays for itself by lunch</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="max-w-6xl mx-auto mb-20">
            <h2 className="text-4xl font-bold text-white text-center mb-12">
              Built for Insurance Professionals
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-[#1A2647] rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
                <Phone className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-2">Natural AI Voice</h3>
                <p className="text-gray-400 text-sm">Sounds human, handles objections smoothly</p>
              </div>

              <div className="group bg-[#1A2647] rounded-xl p-6 border border-gray-800 hover:border-indigo-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20">
                <Calendar className="w-10 h-10 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-2">Auto Scheduling</h3>
                <p className="text-gray-400 text-sm">Books directly to your calendar</p>
              </div>

              <div className="group bg-[#1A2647] rounded-xl p-6 border border-gray-800 hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                <BarChart3 className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-2">Deep Analytics</h3>
                <p className="text-gray-400 text-sm">Track every call, conversion, and dollar</p>
              </div>

              <div className="group bg-[#1A2647] rounded-xl p-6 border border-gray-800 hover:border-green-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-green-500/20">
                <Clock className="w-10 h-10 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-2">24/7 Uptime</h3>
                <p className="text-gray-400 text-sm">Works while you sleep, eat, and vacation</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2">How do I get started?</h3>
                <p className="text-gray-400">
                  Create an account, choose your package, set up billing. Then give the team 12 to 24 hours to configure your AI Agent. You will then be able to access your dashboard and start calling your leads right away!
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-400">
                  Yes! Cancel anytime with one click from your dashboard. No contracts, no commitments.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2">What if I need more than 1800 calls per day?</h3>
                <p className="text-gray-400">
                  Contact us for enterprise pricing. We can scale to any volume you need.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2">How much does it cost per call?</h3>
                <p className="text-gray-400">
                  $0.10 per minute. Not all calls get picked up, but on average to book an appointment it takes about a 2-3 minute a conversation.
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-700">
            <div className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl p-6 md:p-12 lg:p-16 border-2 border-blue-500/30 overflow-hidden text-center group hover:border-blue-500/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
              
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
                  Still chasing new leads when you haven't worked the old ones?
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-3 md:mb-4 max-w-2xl mx-auto leading-relaxed">
                  Sterling AI does it for you — automatically calling, following up, and booking your calendar full.
                </p>
                <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-6 md:mb-8">
                  <span className="text-green-400 font-bold">$999/month. 600 dials a day.</span> What's one policy worth to you?
                </p>
                <Link
                  href="/login"
                  className="group/cta inline-flex items-center justify-center gap-2 md:gap-3 px-8 py-4 md:px-12 md:py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg md:text-xl rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 w-full sm:w-auto"
                >
                  <Rocket className="w-5 h-5 md:w-7 md:h-7 group-hover/cta:translate-y-[-4px] transition-transform" />
                  Subscribe Now
                  <ArrowRight className="w-5 h-5 md:w-7 md:h-7 group-hover/cta:translate-x-2 transition-transform" />
                </Link>
                <p className="text-gray-400 text-xs sm:text-sm mt-4 md:mt-6">
                  <Gift className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 text-purple-400 animate-pulse" />
                  Code <span className="text-purple-400 font-mono font-bold">STERLING</span> for 30% off your first month
                </p>
              </div>
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

