'use client';

import { useEffect } from 'react';
import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { ChevronDown, Sparkles, Zap, DollarSign, Phone, Calendar, Clock, Gift, Rocket, ArrowRight, Shield, CheckCircle2, Headphones, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Social proof ticker data
const tickerItems = [
  'John D. just signed up from Texas',
  'Sarah M. booked 4 appointments',
  'Mike R. closed a $2,400 policy',
  'Emily K. started free trial',
];

export default function FAQPage() {
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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Have thousands of old leads collecting dust?",
      answer: "Sterling Dialer is PERFECT for you. Those leads you paid for months or years ago? We'll call them automatically — no manual dialing, no wasted time. Our AI revives old leads into booked appointments while you focus on closing. You already paid for them. Let's make sure you get your money's worth."
    },
    {
      question: "How does Sterling Dialer actually work?",
      answer: "Simple. You upload your leads and launch. Our AI automatically dials each lead, has natural conversations, handles objections, and books appointments directly to your calendar. You wake up to a full calendar. It's like having unlimited SDRs working 24/7 — for a fraction of the cost."
    },
    {
      question: "What happens after I subscribe?",
      answer: "After you subscribe, we need 24-72 hours to configure your dedicated AI agents and calling workflows. We'll email you the moment everything is ready. Then you log in, 'Launch AI Agent,' and watch your calendar fill up. Simple as that."
    },
    {
      question: "How much does it cost per call?",
      answer: "Calls cost $0.35 per minute for everyone. Not all calls get picked up, but on average it takes about 2-3 minutes of conversation to book an appointment. With the $379/month subscription, you get full platform access and unlimited calling capacity."
    },
    {
      question: "Do I need to provide my own leads?",
      answer: "Yes — but that's the beauty of it. You already HAVE leads sitting in your CRM collecting dust. Those old leads you paid for but never called? Sterling Dialer will call them ALL. No more guilt about wasted lead spend. Put your old leads to work."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Absolutely. No contracts, no commitments. Cancel anytime through your billing portal. But here's the thing: most agents DOUBLE their appointments in the first month. Once you see results, you won't want to stop."
    },
    {
      question: "How does the free trial work?",
      answer: "Start with a 7-day free trial! You get full access to all features - unlimited AI agents, unlimited leads, and all premium features. You only pay $0.35 per minute for the calls you make. After 7 days, it's $379/month. Cancel anytime with no questions asked."
    },
    {
      question: "What if I run out of calling credits?",
      answer: "Sterling Dialer uses a prepaid system with auto-refill to keep your AI running. Calls cost $0.35 per minute. We auto-refill $25 to your balance when it drops below $1, so your AI never stops working. You can manage your balance and payment methods in your dashboard."
    },
    {
      question: "What features are included with Sterling Pro Access?",
      answer: "Everything! For $379/month, you get unlimited AI calling agents, unlimited leads per day, live call transfers, Cal.ai appointment booking, Google Sheets integration, call recordings & transcripts, performance dashboard, priority support, and 24/7 AI operation. One simple plan with all features unlocked."
    },
    {
      question: "Still chasing new leads when you haven't worked the old ones?",
      answer: "This is the biggest mistake agents make. You're spending money on NEW leads while thousands of OLD leads sit untouched. Sterling Dialer solves this. Load up ALL your old leads — the ones from 6 months ago, a year ago, even 2 years ago. Our AI will systematically call every single one, follow up, and book appointments. Work what you already paid for FIRST."
    },
    {
      question: "How fast will I see results?",
      answer: "Most agents see booked appointments within the first 24 hours of launching. With unlimited calling capacity, you're making more calls in ONE day than most agents make in a month. More dials = more conversations = more appointments. It's simple math."
    },
    {
      question: "What if my leads are really old — like 1-2 years?",
      answer: "Even better. Old leads cost you ZERO now (you already paid), and people's situations change. Someone who said 'no' 18 months ago might be ready NOW. Sterling Dialer will find out — automatically. You have nothing to lose and appointments to gain."
    },
    {
      question: "Will there be a mobile app?",
      answer: "Yes! iOS and Android app is launching soon. You'll be able to manage your AI dialer, check appointments, and track sales right from your phone."
    },
    {
      question: "Can I upload as many leads as I want?",
      answer: "Yes. You can upload unlimited leads and run unlimited campaigns. Whether you have 500 leads or 50,000 leads, Sterling Dialer will work through them systematically. Upload your entire database and let the AI do what it does best."
    },
    {
      question: "Can the AI transfer live calls to me?",
      answer: "Yes. When a lead is interested and wants to speak with you, the AI can instantly transfer the call to your phone in real-time. You only take the hot, qualified calls — the AI handles all the initial conversations, objections, and qualification."
    },
    {
      question: "Can I set a daily budget or daily call limit?",
      answer: "Yes. You can limit the number of leads called per day or set a maximum budget for call minutes. This gives you complete control over your spending while the AI works within your parameters. Adjust these settings anytime from your dashboard."
    },
    {
      question: "What about Spanish-speaking leads?",
      answer: "Spanish support is coming soon! We're working on multilingual AI agents that can handle conversations in Spanish and other languages. If you need this feature now, contact our support team — we may be able to accommodate early access."
    },
    {
      question: "Can I pause or stop my campaigns anytime?",
      answer: "Yes. You have complete control. Pause, stop, or modify campaign settings instantly from your dashboard. Need to take a break? Click pause. Ready to ramp back up? Click resume. You're always in control."
    },
    {
      question: "What if a prospect gets mad or confused?",
      answer: "The AI is trained to handle objections professionally and politely. All calls are recorded, so you always know exactly what happened. If someone requests to be removed from your list, the AI notes it immediately and they won't be called again. You stay compliant and professional."
    },
    {
      question: "How accurate are the appointment bookings?",
      answer: "Very accurate. Sterling confirms interest, checks availability, and books a time directly onto your calendar. You'll also get a transcript of every booking call so you know exactly what was discussed. No-show rate is typically under 20% — same as manually booked appointments."
    },
    {
      question: "Does this work for life insurance, final expense, mortgage protection, or Medicare?",
      answer: "Yes. Sterling works with all types of insurance leads. Whether you sell final expense, term life, whole life, mortgage protection, annuities, or Medicare — the AI adapts to your script and product. Just upload your leads and configure your pitch."
    },
    {
      question: "Do I need any tech skills?",
      answer: "No. Setup takes under 10 minutes. If you can upload a CSV and connect your calendar, you're good to go. Our team also handles the initial AI agent configuration for you — all you do is launch when ready."
    },
    {
      question: "Does Sterling sound like a real human?",
      answer: "Yes. The AI uses natural, human-sounding voices with realistic pauses, tone, and conversation flow. Most prospects don't realize they're speaking to AI until the call ends. It sounds professional, friendly, and conversational."
    },
    {
      question: "Is Sterling TCPA compliant?",
      answer: "Yes — when used correctly. Sterling only calls opt-in leads that YOU already own. You must follow standard TCPA guidelines and ensure your leads are compliant. The AI respects do-not-call requests immediately and all calls are recorded for your records."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B1437] relative">
      <PublicNav />
      <MobilePublicNav />
      
      {/* Animated Background - Soft gradual glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-blue-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-purple-500/8 rounded-full top-[30%] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
        <div className="absolute w-[1000px] h-[1000px] bg-pink-500/8 rounded-full bottom-[-300px] left-[20%] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern - Fixed to cover entire page */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Social Proof Ticker */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white py-2 overflow-hidden">
        <div className="animate-ticker flex whitespace-nowrap">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="mx-8 text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-30 pt-16">
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

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6">
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


        {/* FAQ Accordion */}
        <div className="scroll-reveal space-y-4 mb-16">
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
        <div className="scroll-reveal-scale relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl sm:rounded-2xl p-6 sm:p-10 md:p-12 border border-blue-500/30 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 animate-pulse" />
          <div className="relative">
            <h2 className="text-4xl sm:text-4xl font-bold text-white mb-7 sm:mb-4 leading-tight">
              Ready to Revive Your Old Leads?
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mb-7 sm:mb-7 max-w-2xl mx-auto leading-relaxed">
              $379/month. Unlimited leads. Appointments booked automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link
                href="/signup"
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
              7-Day Free Trial — Pay Only for Minutes <span className="font-bold">You</span> Use
            </p>
          </div>
        </div>

        {/* Still Have Questions */}
        <div className="scroll-reveal mt-16 text-center">
          <p className="text-gray-400 mb-4">Still have questions?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            Contact Us
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <PublicFooter />
      <MobileFooter />

      {/* Floating Chat Widget */}
      <Link href="/contact" className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 group">
        <Headphones className="w-6 h-6" />
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg pointer-events-none">
          Need help? Chat with us!
        </div>
      </Link>

      {/* Star Rating Badge */}
      <div className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-full px-6 py-2.5 shadow-xl flex items-center gap-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <span className="text-white font-semibold text-sm">4.9/5</span>
          <span className="text-gray-400 text-sm">from 127 reviews</span>
        </div>
      </div>

      {/* Ticker Animation Styles */}
      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

