'use client';

import { useEffect, useState } from 'react';
import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { TrendingUp, Calendar, Phone, DollarSign, Zap, ArrowRight, Sparkles, Rocket, Clock, Star, Users, Target, CheckCircle, Play, Quote, Award, Headphones, HelpCircle } from 'lucide-react';
import Link from 'next/link';

// Case studies with video testimonials
const caseStudies = [
  {
    name: "Marcus J.",
    location: "Houston, TX",
    role: "Independent Agent",
    avatar: "MJ",
    color: "blue",
    videoPlaceholder: true,
    quote: "I was sitting on 4,000+ leads from the past 3 years. Never had time to call them all. Sterling Dialer called every single one in 6 weeks. My calendar has never been this full.",
    stats: {
      firstWeek: {
        calls: "2,847",
        connected: "342",
        appointments: "18",
      },
      total: {
        leads: "4,200",
        appointments: "67",
        policies: "14",
        revenue: "$21,400",
      }
    },
    highlight: "14 policies from 'dead' leads"
  },
  {
    name: "Jennifer T.",
    location: "Miami, FL", 
    role: "Agency Owner",
    avatar: "JT",
    color: "purple",
    videoPlaceholder: true,
    quote: "My team was spending 6 hours a day dialing. Now they spend that time closing. We 3x'd our production in the first 60 days.",
    stats: {
      firstWeek: {
        calls: "4,126",
        connected: "512",
        appointments: "31",
      },
      total: {
        leads: "8,500",
        appointments: "134",
        policies: "28",
        revenue: "$42,000",
      }
    },
    highlight: "$42K revenue in 60 days"
  },
  {
    name: "David R.",
    location: "Phoenix, AZ",
    role: "Solo Agent (15 Years)",
    avatar: "DR",
    color: "green",
    videoPlaceholder: true,
    quote: "I've tried every dialer on the market. This is the first one that actually books appointments for me. It's like having 10 SDRs working 24/7.",
    stats: {
      firstWeek: {
        calls: "1,892",
        connected: "234",
        appointments: "12",
      },
      total: {
        leads: "2,400",
        appointments: "48",
        policies: "11",
        revenue: "$16,500",
      }
    },
    highlight: "First policy in 72 hours"
  },
  {
    name: "Amanda K.",
    location: "Atlanta, GA",
    role: "Team Lead (3 Agents)",
    avatar: "AK",
    color: "amber",
    videoPlaceholder: true,
    quote: "We were buying fresh leads at $15-20 each. Now we're reviving our old leads for pennies. Our cost per acquisition dropped 80%.",
    stats: {
      firstWeek: {
        calls: "3,456",
        connected: "428",
        appointments: "24",
      },
      total: {
        leads: "6,800",
        appointments: "98",
        policies: "21",
        revenue: "$31,500",
      }
    },
    highlight: "80% lower cost per acquisition"
  }
];

// Additional testimonials (text only)
const textTestimonials = [
  { name: "Robert M.", location: "Dallas, TX", text: "Week 1: 11 appointments. Week 2: 14 appointments. This thing is relentless.", rating: 5 },
  { name: "Lisa C.", location: "Chicago, IL", text: "My VA was dialing 50 leads a day. Sterling does 700. No comparison.", rating: 5 },
  { name: "Chris B.", location: "Denver, CO", text: "Closed my first deal within 5 days of signing up. Already paid for itself.", rating: 5 },
  { name: "Maria S.", location: "Los Angeles, CA", text: "I was skeptical about AI calling. After seeing my calendar, I'm a believer.", rating: 5 },
  { name: "Steve W.", location: "Seattle, WA", text: "4,000 old leads. 89 appointments. 19 policies. Do the math.", rating: 5 },
  { name: "Nicole P.", location: "Boston, MA", text: "The AI sounds so natural, clients don't even realize it's not human.", rating: 5 },
];

export default function CaseStudiesPage() {
  const [activeVideo, setActiveVideo] = useState<number | null>(null);

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

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string, border: string, text: string, glow: string } } = {
      blue: { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
      purple: { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
      green: { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', text: 'text-green-400', glow: 'shadow-green-500/20' },
      amber: { bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-green-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-blue-500/8 rounded-full top-[30%] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
        <div className="absolute w-[1000px] h-[1000px] bg-purple-500/8 rounded-full bottom-[-200px] left-[20%] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <PublicNav />
      <MobilePublicNav />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 sm:py-32">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <TrendingUp className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-green-400 font-semibold">Real Results from Real Agents</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-center">
            <div className="flex justify-center">
              <BlurText
                text="Success Stories"
                delay={100}
                className="text-white"
                animateBy="words"
                direction="top"
              />
            </div>
            <div className="flex justify-center mt-2">
              <BlurText
                text="That Speak for Themselves"
                delay={120}
                className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent"
                animateBy="words"
                direction="top"
              />
            </div>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Watch how agents are turning old, dusty leads into booked appointments and closed policies.
          </p>

          {/* Aggregate Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl sm:text-3xl font-bold text-green-400">347</p>
              <p className="text-gray-400 text-sm">Appointments Booked</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">74</p>
              <p className="text-gray-400 text-sm">Policies Sold</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl sm:text-3xl font-bold text-purple-400">$111K</p>
              <p className="text-gray-400 text-sm">Total Revenue</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl sm:text-3xl font-bold text-amber-400">21.9K</p>
              <p className="text-gray-400 text-sm">Leads Called</p>
            </div>
          </div>
        </div>

        {/* Video Case Studies - Alternating Layout */}
        <div className="space-y-16 sm:space-y-24 mb-20">
          {caseStudies.map((study, index) => {
            const colors = getColorClasses(study.color);
            const isReversed = index % 2 === 1;
            
            return (
              <div
                key={index}
                className={`scroll-reveal grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${isReversed ? 'lg:flex-row-reverse' : ''}`}
              >
                {/* Video Section */}
                <div className={`${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className={`relative aspect-[9/16] max-w-[280px] sm:max-w-[320px] mx-auto lg:mx-0 ${isReversed ? 'lg:ml-auto' : ''}`}>
                    {/* Phone Frame */}
                    <div className="absolute inset-0 bg-gray-900 rounded-[2.5rem] border-4 border-gray-700 shadow-2xl overflow-hidden">
                      {/* Notch */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-gray-800 rounded-full z-10" />
                      
                      {/* Video Content Placeholder */}
                      <div className={`absolute inset-4 rounded-[2rem] bg-gradient-to-br ${colors.bg} flex flex-col items-center justify-center`}>
                        {/* Play Button */}
                        <button 
                          onClick={() => setActiveVideo(activeVideo === index ? null : index)}
                          className={`w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border-2 ${colors.border} flex items-center justify-center hover:scale-110 transition-all group`}
                        >
                          <Play className={`w-8 h-8 ${colors.text} ml-1 group-hover:scale-110 transition-transform`} />
                        </button>
                        <p className="text-white/60 text-sm mt-4">Watch Testimonial</p>
                        
                        {/* Avatar at bottom */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors.bg} border-2 ${colors.border} flex items-center justify-center mx-auto mb-2`}>
                            <span className={`text-xl font-bold ${colors.text}`}>{study.avatar}</span>
                          </div>
                          <p className="text-white font-semibold">{study.name}</p>
                          <p className="text-gray-400 text-sm">{study.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className={`${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className={`bg-[#1A2647]/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border ${colors.border} hover:shadow-xl ${colors.glow} transition-all`}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl sm:text-3xl font-bold text-white">{study.name}</h3>
                          <div className="flex">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-400">{study.role} • {study.location}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
                        <Award className={`w-6 h-6 ${colors.text}`} />
                      </div>
                    </div>

                    {/* Quote */}
                    <div className={`relative mb-6 p-4 bg-[#0B1437]/50 rounded-xl border-l-4 ${colors.border}`}>
                      <Quote className={`absolute top-2 right-2 w-6 h-6 ${colors.text} opacity-30`} />
                      <p className="text-gray-300 italic leading-relaxed">"{study.quote}"</p>
                    </div>

                    {/* First 7 Days Stats */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">First 7 Days</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#0B1437]/50 rounded-xl p-3 text-center">
                          <p className="text-xl sm:text-2xl font-bold text-blue-400">{study.stats.firstWeek.calls}</p>
                          <p className="text-gray-500 text-xs">Calls Made</p>
                        </div>
                        <div className="bg-[#0B1437]/50 rounded-xl p-3 text-center">
                          <p className="text-xl sm:text-2xl font-bold text-purple-400">{study.stats.firstWeek.connected}</p>
                          <p className="text-gray-500 text-xs">Connected</p>
                        </div>
                        <div className="bg-[#0B1437]/50 rounded-xl p-3 text-center">
                          <p className="text-xl sm:text-2xl font-bold text-green-400">{study.stats.firstWeek.appointments}</p>
                          <p className="text-gray-500 text-xs">Appointments</p>
                        </div>
                      </div>
                    </div>

                    {/* Total Results */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Total Results</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-[#0B1437]/50 rounded-xl p-3 text-center">
                          <p className="text-lg sm:text-xl font-bold text-blue-400">{study.stats.total.leads}</p>
                          <p className="text-gray-500 text-xs">Leads Called</p>
                        </div>
                        <div className="bg-[#0B1437]/50 rounded-xl p-3 text-center">
                          <p className="text-lg sm:text-xl font-bold text-purple-400">{study.stats.total.appointments}</p>
                          <p className="text-gray-500 text-xs">Appointments</p>
                        </div>
                        <div className="bg-[#0B1437]/50 rounded-xl p-3 text-center">
                          <p className="text-lg sm:text-xl font-bold text-green-400">{study.stats.total.policies}</p>
                          <p className="text-gray-500 text-xs">Policies</p>
                        </div>
                        <div className="bg-[#0B1437]/50 rounded-xl p-3 text-center">
                          <p className="text-lg sm:text-xl font-bold text-amber-400">{study.stats.total.revenue}</p>
                          <p className="text-gray-500 text-xs">Revenue</p>
                        </div>
                      </div>
                    </div>

                    {/* Highlight Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-full`}>
                      <Sparkles className={`w-4 h-4 ${colors.text}`} />
                      <span className={`${colors.text} font-semibold text-sm`}>{study.highlight}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Text Testimonials */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">More Agent Reviews</h2>
            <p className="text-gray-400">Real feedback from agents across the country</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {textTestimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="scroll-reveal bg-[#1A2647]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-blue-500/30 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{testimonial.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-gray-500 text-xs">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aggregate Stats Banner */}
        <div className="scroll-reveal bg-gradient-to-r from-green-600/20 via-emerald-600/10 to-green-600/20 rounded-2xl p-8 sm:p-12 border border-green-500/30 mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Platform-Wide Results</h2>
            <p className="text-gray-400">What Sterling Dialer has achieved for all agents combined</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <p className="text-4xl sm:text-5xl font-bold text-green-400 mb-2">2.4M+</p>
              <p className="text-gray-400">Total Calls Made</p>
            </div>
            <div className="text-center">
              <p className="text-4xl sm:text-5xl font-bold text-blue-400 mb-2">47K+</p>
              <p className="text-gray-400">Appointments Booked</p>
            </div>
            <div className="text-center">
              <p className="text-4xl sm:text-5xl font-bold text-purple-400 mb-2">500+</p>
              <p className="text-gray-400">Happy Agents</p>
            </div>
            <div className="text-center">
              <p className="text-4xl sm:text-5xl font-bold text-amber-400 mb-2">$2.1M+</p>
              <p className="text-gray-400">Revenue Generated</p>
            </div>
          </div>
        </div>

        {/* The Math Section */}
        <div className="scroll-reveal bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-2xl p-8 sm:p-12 border border-blue-500/30 mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-10">
            The Math Is Simple
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all border border-blue-500/30">
                <DollarSign className="w-10 h-10 text-blue-400" />
              </div>
              <p className="text-4xl font-bold text-blue-400 mb-2">$379</p>
              <p className="text-gray-400">Per Month</p>
            </div>

            <div className="group">
              <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all border border-purple-500/30">
                <Phone className="w-10 h-10 text-purple-400" />
              </div>
              <p className="text-4xl font-bold text-purple-400 mb-2">720+</p>
              <p className="text-gray-400">Dials Per Day</p>
            </div>

            <div className="group">
              <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all border border-green-500/30">
                <Target className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-4xl font-bold text-green-400 mb-2">1</p>
              <p className="text-gray-400">Policy = ROI</p>
            </div>
          </div>
          <p className="text-center text-gray-300 mt-10 text-lg max-w-2xl mx-auto">
            Sterling Dialer pays for itself with <span className="text-green-400 font-bold">ONE policy</span>. 
            Everything after that is pure profit for your business.
          </p>
        </div>

        {/* CTA */}
        <div className="scroll-reveal text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            You already paid for those leads. Let's make sure you get your money's worth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="group px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 flex items-center justify-center gap-2"
            >
              <Rocket className="w-6 h-6 group-hover:translate-y-[-4px] transition-transform" />
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/demo"
              className="px-8 sm:px-10 py-4 sm:py-5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold text-lg rounded-xl transition-all hover:scale-105"
            >
              Hear Demo Calls
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-6">
            <Zap className="w-4 h-4 inline mr-1 text-green-400 animate-pulse" />
            7 Days Free • Only Pay <span className="text-green-400 font-bold">$0.35/min</span> for Calls
          </p>
        </div>
      </div>

      <PublicFooter />
      <MobileFooter />

      </div>
  );
}
