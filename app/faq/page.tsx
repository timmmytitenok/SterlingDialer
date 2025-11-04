'use client';

import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { ChevronDown, Sparkles, Zap, DollarSign, Phone, Calendar, Clock, Gift, Rocket, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Have thousands of old leads collecting dust?",
      answer: "Sterling AI is PERFECT for you. Those leads you paid for months or years ago? We'll call them automatically — no manual dialing, no wasted time. Our AI revives old leads into booked appointments while you focus on closing. You already paid for them. Let's make sure you get your money's worth."
    },
    {
      question: "How does Sterling AI actually work?",
      answer: "Simple. You upload your leads, set your daily call limit (up to 1,800 with Elite), and launch. Our AI automatically dials each lead, has natural conversations, handles objections, and books appointments directly to your calendar. You wake up to a full calendar. It's like having 3 SDRs working 24/7 — for a fraction of the cost."
    },
    {
      question: "What happens after I subscribe?",
      answer: "After you subscribe, we need 24-72 hours to configure your dedicated AI agents and calling workflows. We'll email you the moment everything is ready. Then you log in, 'Launch AI Agent,' and watch your calendar fill up. Simple as that."
    },
    {
      question: "How much does it cost per call?",
      answer: "Call costs vary by plan: Starter is $0.30 per minute, Pro is $0.25 per minute, and Elite is $0.20 per minute. Not all calls get picked up, but on average it takes about 2-3 minutes of conversation to book an appointment."
    },
    {
      question: "Do I need to provide my own leads?",
      answer: "Yes — but that's the beauty of it. You already HAVE leads sitting in your CRM collecting dust. Those old leads you paid for but never called? Sterling AI will call them ALL. No more guilt about wasted lead spend. Put your old leads to work."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Absolutely. No contracts, no commitments. Cancel anytime through your billing portal. But here's the thing: most agents DOUBLE their appointments in the first month. Once you see results, you won't want to stop."
    },
    {
      question: "How does the free trial work?",
      answer: "Start with a 30-day free trial! You get 1 AI Caller and can make up to 600 calls per day. You only pay $0.30 per minute for calls you make. Cancel anytime with no questions asked."
    },
    {
      question: "What if I run out of calling credits?",
      answer: "Sterling AI uses a prepaid system with auto-refill required to run your AI Agent. Call costs are $0.30/min for Starter, $0.25/min for Pro, and $0.20/min for Elite. You can set your auto-refill amount to $25, $50, $100, or $200. When your balance drops below $10, we'll automatically refill it so your AI never stops working."
    },
    {
      question: "What's the difference between Starter, Pro, and Elite?",
      answer: "Starter ($499/mo + $0.30/min): 1 AI caller, 600 leads/day. Pro ($899/mo + $0.25/min): 2 AI callers, 1,200 leads/day. Elite ($1,499/mo + $0.20/min): 3 AI callers, 2,000 leads/day. More callers = more dials = more appointments. Elite agents can book 3x the meetings and save the most per call."
    },
    {
      question: "Still chasing new leads when you haven't worked the old ones?",
      answer: "This is the biggest mistake agents make. You're spending money on NEW leads while thousands of OLD leads sit untouched. Sterling AI solves this. Load up ALL your old leads — the ones from 6 months ago, a year ago, even 2 years ago. Our AI will systematically call every single one, follow up, and book appointments. Work what you already paid for FIRST."
    },
    {
      question: "How fast will I see results?",
      answer: "Most agents see booked appointments within the first 24 hours of launching. With 600 dials/day on Starter, you're making more calls in ONE day than most agents make in a month. More dials = more conversations = more appointments. It's simple math."
    },
    {
      question: "What if my leads are really old — like 1-2 years?",
      answer: "Even better. Old leads cost you ZERO now (you already paid), and people's situations change. Someone who said 'no' 18 months ago might be ready NOW. Sterling AI will find out — automatically. You have nothing to lose and appointments to gain."
    },
    {
      question: "Will there be a mobile app?",
      answer: "Yes! iOS and Android apps are launching soon. You'll be able to manage your AI dialer, check appointments, and track sales right from your phone."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B1437]">
      <PublicNav />
      <MobilePublicNav />
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl top-20 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl bottom-20 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-30">
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-blue-400 font-semibold">Frequently Asked Questions</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
            <div className="flex justify-center">
              <BlurText
                text="Got Questions?"
                delay={100}
                className="text-white"
                animateBy="words"
                direction="top"
              />
            </div>
            <div className="text-5xl md:text-6xl flex justify-center mt-2">
              <BlurText
                text="We've Got Answers"
                delay={120}
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                animateBy="words"
                direction="top"
              />
            </div>
          </h1>
          <p className="text-1xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about reviving your old leads and booking more appointments
          </p>
        </div>

        {/* Free Trial Banner */}
        <div className="mb-12 group relative overflow-hidden bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-2 border-green-500/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-green-500/60 transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Mobile: Vertical Stack */}
          <div className="relative flex flex-col sm:hidden gap-3 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-base">Start Your 30-Day Free Trial!</p>
                <p className="text-gray-400 text-xs">Only pay <span className="text-green-400 font-bold">$0.30/min</span> for calls</p>
              </div>
            </div>
            <Link
              href="/login"
              className="w-full px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-sm rounded-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-green-500/50"
            >
              Start Free Trial →
            </Link>
          </div>
          
          {/* Desktop: Horizontal Layout */}
          <div className="relative hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Start Your 30-Day Free Trial!</p>
                <p className="text-gray-400 text-sm">Only pay <span className="text-green-400 font-bold">$0.30/min</span> for calls <span className="text-white font-bold">YOU</span> make</p>
              </div>
            </div>
            <Link
              href="/login"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-green-500/50"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4 mb-16">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group bg-[#1A2647] border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: `${0.1 * index}s`, animationDuration: '0.5s' }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#0B1437]/50 transition-colors"
              >
                <span className="text-lg font-semibold text-white pr-4 group-hover:text-blue-400 transition-colors">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-6 h-6 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5 text-gray-300 leading-relaxed border-t border-gray-800/50 pt-4">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl sm:rounded-2xl p-6 sm:p-10 md:p-12 border border-blue-500/30 text-center animate-in fade-in zoom-in duration-700" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 animate-pulse" />
          <div className="relative">
            <h2 className="text-4xl sm:text-4xl font-bold text-white mb-7 sm:mb-4 leading-tight">
              Ready to Revive Your Old Leads?
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mb-7 sm:mb-7 max-w-2xl mx-auto leading-relaxed">
              $499/month. 600 dials a day. Appointments booked automatically.
              What's one policy worth to you? Sterling AI pays for itself by lunch.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link
                href="/login"
                className="group w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base sm:text-lg rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-y-[-2px] transition-transform" />
                Start Free Trial
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white font-semibold text-base sm:text-lg rounded-xl transition-all hover:scale-105"
              >
                View Pricing
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-4">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 text-green-400" />
              30 Days Free • Only Pay <span className="text-green-400 font-bold">$0.30/min</span> for Calls
            </p>
          </div>
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 text-center animate-in fade-in duration-700" style={{ animationDelay: '0.6s' }}>
          <p className="text-gray-400 mb-4">Still have questions?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            Contact Support
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <PublicFooter />
      <MobileFooter />
    </div>
  );
}

