'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { TrendingUp, Calendar, Phone, DollarSign, Zap, ArrowRight, Sparkles, Gift, Rocket, BarChart3, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CaseStudiesPage() {
  const caseStudies = [
    {
      name: "John D.",
      role: "Independent Life Insurance Agent",
      timeframe: "90 Days",
      results: {
        oldLeadsRevived: "5,489",
        appointments: "112",
        policies: "22",
        revenue: "$33,093",
        roi: "33x"
      },
      quote: "I had thousands of leads sitting in my CRM from the past 2 years. Paid good money for them but never had time to call. Sterling AI called them ALL in 90 days. Booked 112 appointments. Closed 22 policies. Best investment I've ever made.",
      highlight: "Dusty leads to $33K in 90 days"
    },
    {
      name: "Sarah M.",
      role: "Agency Owner - 5 Agents",
      timeframe: "60 Days",
      results: {
        oldLeadsRevived: "8,723",
        appointments: "168",
        policies: "34",
        revenue: "$54,342",
        roi: "54x"
      },
      quote: "We had leads from conferences, trade shows, Facebook ads — all going cold. Sterling AI with Elite plan (1,800 dials/day) worked through our entire backlog. My agents' calendars have never been this full. We're closing more deals than ever.",
      highlight: "Turned 8,723 old leads into $54k"
    },
    {
      name: "Mike J.",
      role: "Life Insurance Agent (10 Years Experience)",
      timeframe: "30 Days",
      results: {
        oldLeadsRevived: "1,678",
        appointments: "38",
        policies: "7",
        revenue: "$8,402",
        roi: "8x"
      },
      quote: "Started with Starter plan ($999/mo). First week: 14 appointments. Second week: 11 appointments. By week 3, I upgraded to Pro because it was doing so much for me! Sterling AI is a cheat code.",
      highlight: "ROI in the first week!"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B1437]">
      <PublicNav />
      <MobilePublicNav />
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[700px] h-[700px] bg-green-500/10 rounded-full blur-3xl top-20 -left-40 animate-pulse" />
        <div className="absolute w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-3xl bottom-20 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-40">
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <TrendingUp className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-green-400 font-semibold">Real Results</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            <div className="flex justify-center">
              <BlurText
                text="Success Stories"
                delay={100}
                className="text-white"
                animateBy="words"
                direction="top"
              />
            </div>
            <div className="text-4xl md:text-6xl flex justify-center mt-2">
              <BlurText
                text="From Real Agents"
                delay={120}
                className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent"
                animateBy="words"
                direction="top"
              />
            </div>
          </h1>
          <p className="text-1xl text-gray-400 max-w-2xl mx-auto">
            See how agents are reviving old leads and booking more appointments than ever
          </p>
        </div>

        {/* Case Studies */}
        <div className="space-y-16 mb-16">
          {caseStudies.map((study, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 md:p-12 border border-gray-800 hover:border-green-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/20 animate-in fade-in slide-in-from-bottom duration-700"
              style={{ animationDelay: `${0.2 * index}s` }}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">{study.name}</h3>
                    <p className="text-gray-400">{study.role}</p>
                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold text-sm">{study.timeframe}</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600/30 to-emerald-600/30 flex items-center justify-center border-2 border-green-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="text-lg text-gray-300 italic mb-8 leading-relaxed border-l-4 border-blue-500/50 pl-6">
                  "{study.quote}"
                </blockquote>

                {/* Results Grid - Mobile: Custom 3-row layout, Desktop: 5-column */}
                <div className="mb-6">
                  {/* Mobile Layout */}
                  <div className="grid md:hidden gap-3">
                    {/* Row 1: Old Leads, Appointments */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0B1437]/50 rounded-xl p-3 border border-gray-800 text-center">
                        <p className="text-2xl font-bold text-blue-400 mb-1">{study.results.oldLeadsRevived}</p>
                        <p className="text-gray-400 text-xs">Old Leads</p>
                      </div>
                      <div className="bg-[#0B1437]/50 rounded-xl p-3 border border-gray-800 text-center">
                        <p className="text-2xl font-bold text-purple-400 mb-1">{study.results.appointments}</p>
                        <p className="text-gray-400 text-xs">Appointments</p>
                      </div>
                    </div>
                    
                    {/* Row 2: Policies Sold, ROI */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0B1437]/50 rounded-xl p-3 border border-gray-800 text-center">
                        <p className="text-2xl font-bold text-green-400 mb-1">{study.results.policies}</p>
                        <p className="text-gray-400 text-xs">Policies Sold</p>
                      </div>
                      <div className="bg-[#0B1437]/50 rounded-xl p-3 border border-gray-800 text-center">
                        <p className="text-2xl font-bold text-pink-400 mb-1">{study.results.roi}</p>
                        <p className="text-gray-400 text-xs">ROI</p>
                      </div>
                    </div>
                    
                    {/* Row 3: REVENUE (full width) */}
                    <div className="bg-[#0B1437]/50 rounded-xl p-4 border border-gray-800 text-center">
                      <p className="text-3xl font-bold text-yellow-400 mb-1">{study.results.revenue}</p>
                      <p className="text-gray-400 text-sm font-semibold">REVENUE</p>
                    </div>
                  </div>
                  
                  {/* Desktop Layout - Original 5-column */}
                  <div className="hidden md:grid grid-cols-5 gap-4">
                    <div className="bg-[#0B1437]/50 rounded-xl p-4 border border-gray-800 text-center group-hover:border-blue-500/30 transition-colors">
                      <p className="text-3xl font-bold text-blue-400 mb-1">{study.results.oldLeadsRevived}</p>
                      <p className="text-gray-400 text-xs">Old Leads Revived</p>
                    </div>
                    <div className="bg-[#0B1437]/50 rounded-xl p-4 border border-gray-800 text-center group-hover:border-purple-500/30 transition-colors">
                      <p className="text-3xl font-bold text-purple-400 mb-1">{study.results.appointments}</p>
                      <p className="text-gray-400 text-xs">Appointments</p>
                    </div>
                    <div className="bg-[#0B1437]/50 rounded-xl p-4 border border-gray-800 text-center group-hover:border-green-500/30 transition-colors">
                      <p className="text-3xl font-bold text-green-400 mb-1">{study.results.policies}</p>
                      <p className="text-gray-400 text-xs">Policies Sold</p>
                    </div>
                    <div className="bg-[#0B1437]/50 rounded-xl p-4 border border-gray-800 text-center group-hover:border-yellow-500/30 transition-colors">
                      <p className="text-3xl font-bold text-yellow-400 mb-1">{study.results.revenue}</p>
                      <p className="text-gray-400 text-xs">Revenue</p>
                    </div>
                    <div className="bg-[#0B1437]/50 rounded-xl p-4 border border-gray-800 text-center group-hover:border-pink-500/30 transition-colors">
                      <p className="text-3xl font-bold text-pink-400 mb-1">{study.results.roi}</p>
                      <p className="text-gray-400 text-xs">ROI</p>
                    </div>
                  </div>
                </div>

                {/* Highlight */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/40 rounded-lg">
                  <Sparkles className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-semibold text-sm">{study.highlight}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* The Math Section */}
        <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-2xl p-12 border border-blue-500/30 mb-36 animate-in fade-in zoom-in duration-700">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            The Math Is Simple
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all border border-blue-500/30">
                <DollarSign className="w-10 h-10 text-blue-400" />
              </div>
              <p className="text-4xl font-bold text-blue-400 mb-2">$999</p>
              <p className="text-gray-400">Per Month (Starter)</p>
            </div>

            <div className="group">
              <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all border border-purple-500/30">
                <Phone className="w-10 h-10 text-purple-400" />
              </div>
              <p className="text-4xl font-bold text-purple-400 mb-2">600</p>
              <p className="text-gray-400">Dials Per Day</p>
            </div>

            <div className="group">
              <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all border border-green-500/30">
                <Calendar className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-4xl font-bold text-green-400 mb-2">1</p>
              <p className="text-gray-400">Policy = ROI</p>
            </div>
          </div>
          <p className="text-center text-gray-300 mt-8 text-lg">
            Sterling AI pays for itself with <span className="text-green-400 font-bold">ONE policy</span>. 
            Everything after that is pure profit.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center mb-4 animate-in fade-in duration-700">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-xl text-gray-400 mb-16 sm:mb-8 max-w-2xl mx-auto">
            You already paid for those leads. Let's make get your money's worth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="group px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 flex items-center justify-center gap-2"
            >
              <Rocket className="w-6 h-6 group-hover:translate-y-[-4px] transition-transform" />
              Start Today
            </Link>
            <Link
              href="/faq"
              className="px-10 py-5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold text-lg rounded-xl transition-all hover:scale-105"
            >
              Have Questions?
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-6">
            <Zap className="w-4 h-4 inline mr-1 text-green-400 animate-pulse" />
            30 Days Free • Only Pay <span className="text-green-400 font-bold">$0.30/min</span> for Calls
          </p>
        </div>
      </div>

      <PublicFooter />
      <MobileFooter />
    </div>
  );
}

