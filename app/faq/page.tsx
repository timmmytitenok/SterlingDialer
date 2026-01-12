'use client';

import { useEffect } from 'react';
import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { ChevronDown, Sparkles, Zap, DollarSign, Phone, Calendar, Clock, Rocket, ArrowRight, Shield, Settings, Users, Bot, CreditCard, PlayCircle, Upload, PhoneCall, Globe, Pause, MessageSquare, CalendarCheck, FileText, Cpu, Scale } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type Category = 'all' | 'getting-started' | 'pricing' | 'features' | 'support';

interface FAQ {
  question: string;
  answer: React.ReactNode;
  category: Category;
  icon: React.ReactNode;
}

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
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const categories = [
    { id: 'all' as Category, label: 'All Questions', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'getting-started' as Category, label: 'Getting Started', icon: <PlayCircle className="w-4 h-4" /> },
    { id: 'pricing' as Category, label: 'Pricing & Billing', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'features' as Category, label: 'Features', icon: <Settings className="w-4 h-4" /> },
    { id: 'support' as Category, label: 'Support & Compliance', icon: <Shield className="w-4 h-4" /> },
  ];

  const faqs: FAQ[] = [
    // Getting Started
    {
      category: 'getting-started',
      icon: <Upload className="w-5 h-5 text-blue-400" />,
      question: "Have thousands of old leads collecting dust?",
      answer: <>Sterling Dialer is <span className="text-blue-400 font-semibold">PERFECT</span> for you. Those leads you paid for months or years ago? We'll call them <span className="text-emerald-400 font-semibold">automatically</span> — no manual dialing, no wasted time. Our AI revives old leads into booked appointments while you focus on closing. You already paid for them. Let's make sure you get your money's worth.</>
    },
    {
      category: 'getting-started',
      icon: <Bot className="w-5 h-5 text-purple-400" />,
      question: "How does Sterling Dialer actually work?",
      answer: <>Simple. You upload your leads and launch. Our AI <span className="text-purple-400 font-semibold">automatically dials</span> each lead, has natural conversations, handles objections, and books appointments directly to your calendar. You wake up to a <span className="text-emerald-400 font-semibold">full calendar</span>. It's like having unlimited SDRs working <span className="text-blue-400 font-semibold">24/7</span> — for a fraction of the cost.</>
    },
    {
      category: 'getting-started',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      question: "What happens after I subscribe?",
      answer: <>After you subscribe, we need <span className="text-amber-400 font-semibold">24-72 hours</span> to configure your dedicated AI agents and calling workflows. We'll email you the moment everything is ready. Then you log in, 'Launch AI Agent,' and watch your calendar fill up. Simple as that.</>
    },
    {
      category: 'getting-started',
      icon: <Upload className="w-5 h-5 text-blue-400" />,
      question: "Do I need to provide my own leads?",
      answer: <>Yes — but that's the beauty of it. You already HAVE leads sitting in your CRM collecting dust. Those old leads you paid for but never called? Sterling Dialer will call them <span className="text-emerald-400 font-semibold">ALL</span>. No more guilt about wasted lead spend. Put your old leads to work.</>
    },
    {
      category: 'getting-started',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      question: "How fast will I see results?",
      answer: <>Most agents see booked appointments within the <span className="text-emerald-400 font-semibold">first 24 hours</span> of launching. With unlimited calling capacity, you're making more calls in ONE day than most agents make in a month. More dials = more conversations = more appointments. It's simple math.</>
    },
    {
      category: 'getting-started',
      icon: <Settings className="w-5 h-5 text-gray-400" />,
      question: "Do I need any tech skills?",
      answer: <>No. Setup takes under <span className="text-blue-400 font-semibold">10 minutes</span>. If you can upload a CSV and connect your calendar, you're good to go. Our team also handles the initial AI agent configuration for you — all you do is launch when ready.</>
    },
    // Pricing & Billing
    {
      category: 'pricing',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      question: "How much does it cost per call?",
      answer: <>Calls cost <span className="text-emerald-400 font-semibold">$0.65 per minute</span>. Not all calls get picked up, but on average it takes about 2-3 minutes of conversation to book an appointment. With our <span className="text-purple-400 font-semibold">Pay As You Go</span> model, there are no monthly fees — you only pay for what you use.</>
    },
    {
      category: 'pricing',
      icon: <Rocket className="w-5 h-5 text-purple-400" />,
      question: "How does Pay As You Go pricing work?",
      answer: <>Simple! With our <span className="text-purple-400 font-semibold">Pay As You Go</span> model, there are <span className="text-blue-400 font-semibold">no monthly fees</span>. You only pay <span className="text-blue-400 font-semibold">$0.65 per minute</span> for the calls you make. Add funds to your account, and you're ready to go. No contracts, no commitments!</>
    },
    {
      category: 'pricing',
      icon: <CreditCard className="w-5 h-5 text-blue-400" />,
      question: "What if I run out of calling credits?",
      answer: <>Sterling Dialer uses a prepaid system with <span className="text-blue-400 font-semibold">auto-refill</span> to keep your AI running. Calls cost <span className="text-emerald-400 font-semibold">$0.65 per minute</span>. We auto-refill <span className="text-emerald-400 font-semibold">$25</span> to your balance when it drops below $1, so your AI never stops working. You can manage your balance and payment methods in your dashboard.</>
    },
    {
      category: 'pricing',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      question: "What features are included with Sterling Dialer?",
      answer: <>Everything! With our <span className="text-purple-400 font-semibold">Pay As You Go</span> model at just <span className="text-emerald-400 font-semibold">$0.65/min</span>, you get unlimited AI calling agents, unlimited leads per day, live call transfers, Cal.ai appointment booking, Google Sheets integration, call recordings & transcripts, performance dashboard, priority support, and <span className="text-blue-400 font-semibold">24/7 AI operation</span>. No monthly fees — all features unlocked.</>
    },
    {
      category: 'pricing',
      icon: <ArrowRight className="w-5 h-5 text-red-400" />,
      question: "Can I cancel anytime?",
      answer: <>Absolutely. <span className="text-emerald-400 font-semibold">No contracts, no commitments</span>. Cancel anytime through your billing portal. But here's the thing: most agents <span className="text-purple-400 font-semibold">DOUBLE</span> their appointments in the first month. Once you see results, you won't want to stop.</>
    },
    {
      category: 'pricing',
      icon: <DollarSign className="w-5 h-5 text-amber-400" />,
      question: "Can I set a daily budget or daily call limit?",
      answer: <>Yes. You can limit the number of leads called per day or set a <span className="text-amber-400 font-semibold">maximum budget</span> for call minutes. This gives you complete control over your spending while the AI works within your parameters. Adjust these settings anytime from your dashboard.</>
    },
    // Features
    {
      category: 'features',
      icon: <Upload className="w-5 h-5 text-blue-400" />,
      question: "Can I upload as many leads as I want?",
      answer: <>Yes. You can upload <span className="text-blue-400 font-semibold">unlimited leads</span> and run unlimited campaigns. Whether you have 500 leads or 50,000 leads, Sterling Dialer will work through them systematically. Upload your entire database and let the AI do what it does best.</>
    },
    {
      category: 'features',
      icon: <PhoneCall className="w-5 h-5 text-emerald-400" />,
      question: "Can the AI transfer live calls to me?",
      answer: <>Yes. When a lead is interested and wants to speak with you, the AI can <span className="text-emerald-400 font-semibold">instantly transfer</span> the call to your phone in real-time. You only take the hot, qualified calls — the AI handles all the initial conversations, objections, and qualification.</>
    },
    {
      category: 'features',
      icon: <CalendarCheck className="w-5 h-5 text-purple-400" />,
      question: "How accurate are the appointment bookings?",
      answer: <>Very accurate. Sterling confirms interest, checks availability, and books a time directly onto your calendar. You'll also get a transcript of every booking call so you know exactly what was discussed. No-show rate is typically <span className="text-emerald-400 font-semibold">under 20%</span> — same as manually booked appointments.</>
    },
    {
      category: 'features',
      icon: <Cpu className="w-5 h-5 text-blue-400" />,
      question: "Does Sterling sound like a real human?",
      answer: <>Yes. The AI uses <span className="text-blue-400 font-semibold">natural, human-sounding voices</span> with realistic pauses, tone, and conversation flow. Most prospects don't realize they're speaking to AI until the call ends. It sounds professional, friendly, and conversational.</>
    },
    {
      category: 'features',
      icon: <Pause className="w-5 h-5 text-amber-400" />,
      question: "Can I pause or stop my campaigns anytime?",
      answer: <>Yes. You have <span className="text-amber-400 font-semibold">complete control</span>. Pause, stop, or modify campaign settings instantly from your dashboard. Need to take a break? Click pause. Ready to ramp back up? Click resume. You're always in control.</>
    },
    {
      category: 'features',
      icon: <Globe className="w-5 h-5 text-purple-400" />,
      question: "What about Spanish-speaking leads?",
      answer: <>Spanish support is <span className="text-purple-400 font-semibold">coming soon</span>! We're working on multilingual AI agents that can handle conversations in Spanish and other languages. If you need this feature now, contact our support team — we may be able to accommodate early access.</>
    },
    {
      category: 'features',
      icon: <Phone className="w-5 h-5 text-blue-400" />,
      question: "Will there be a mobile app?",
      answer: <>Yes! iOS and Android app is <span className="text-blue-400 font-semibold">launching soon</span>. You'll be able to manage your AI dialer, check appointments, and track sales right from your phone.</>
    },
    {
      category: 'features',
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
      question: "Does this work for life insurance, health insurance, final expense, mortgage protection, or Medicare?",
      answer: <>Yes. Sterling works with <span className="text-emerald-400 font-semibold">all types of insurance leads</span>. Whether you sell final expense, term life, whole life, mortgage protection, annuities, or Medicare — the AI adapts to your script and product. Just upload your leads and configure your pitch.</>
    },
    // Support & Compliance
    {
      category: 'support',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      question: "What if my leads are really old — like 1-2 years?",
      answer: <>Even better. Old leads cost you <span className="text-emerald-400 font-semibold">ZERO now</span> (you already paid), and people's situations change. Someone who said 'no' 18 months ago might be ready NOW. Sterling Dialer will find out — automatically. You have nothing to lose and appointments to gain.</>
    },
    {
      category: 'support',
      icon: <MessageSquare className="w-5 h-5 text-red-400" />,
      question: "What if a prospect gets mad or confused?",
      answer: <>The AI is trained to handle objections <span className="text-blue-400 font-semibold">professionally and politely</span>. All calls are recorded, so you always know exactly what happened. If someone requests to be removed from your list, the AI notes it immediately and they won't be called again. You stay compliant and professional.</>
    },
    {
      category: 'support',
      icon: <Scale className="w-5 h-5 text-emerald-400" />,
      question: "Is Sterling TCPA compliant?",
      answer: <>Yes — when used correctly. Sterling only calls <span className="text-emerald-400 font-semibold">opt-in leads</span> that YOU already own. You must follow standard TCPA guidelines and ensure your leads are compliant. The AI respects do-not-call requests immediately and all calls are recorded for your records.</>
    },
    {
      category: 'support',
      icon: <Users className="w-5 h-5 text-purple-400" />,
      question: "Still chasing new leads when you haven't worked the old ones?",
      answer: <>This is the biggest mistake agents make. You're spending money on NEW leads while thousands of OLD leads sit untouched. Sterling Dialer solves this. Load up ALL your old leads — the ones from 6 months ago, a year ago, even <span className="text-purple-400 font-semibold">2 years ago</span>. Our AI will systematically call every single one, follow up, and book appointments. Work what you already paid for FIRST.</>
    },
  ];

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0B1437] relative">
      <PublicNav />
      <MobilePublicNav />
      
      {/* Animated Background - Soft gradual glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-blue-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-purple-500/8 rounded-full top-[30%] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
        <div className="absolute w-[1000px] h-[1000px] bg-pink-500/8 rounded-full bottom-[-300px] left-[20%] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern - Fixed to cover entire page */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 pt-28 pb-20 sm:py-32">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4 sm:mb-6">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 animate-pulse" />
            <span className="text-blue-400 font-semibold text-xs sm:text-base">Frequently Asked Questions</span>
          </div>
          
          {/* Desktop Title */}
          <h1 className="hidden sm:block text-4xl md:text-6xl font-bold mb-6 text-center">
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
          
          {/* Mobile Title */}
          <h1 className="sm:hidden text-3xl font-bold mb-4 text-center">
            <div className="flex justify-center">
              <BlurText
                text="Got Questions?"
                delay={100}
                className="text-white"
                animateBy="words"
                direction="top"
              />
            </div>
            <div className="flex justify-center mt-1">
              <BlurText
                text="We've Got Answers"
                delay={120}
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                animateBy="words"
                direction="top"
              />
            </div>
          </h1>
          
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto px-2">
            Everything you need to know about reviving your old leads.
          </p>
        </div>

        {/* Category Tabs - Desktop only */}
        <div className="hidden sm:block mb-10">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setOpenIndex(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-[#1A2647] text-gray-400 hover:text-white hover:bg-[#1A2647]/80 border border-gray-700/50'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Count - Hidden on mobile */}
        <div className="hidden sm:block text-center mb-6">
          <p className="text-gray-500 text-sm">
            Showing <span className="text-white font-semibold">{filteredFaqs.length}</span> questions
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 sm:space-y-4 mb-16 sm:mb-16">
          {filteredFaqs.map((faq, index) => {
            // First 2 questions load immediately, rest have staggered reveal
            const getRevealClass = () => {
              if (index < 2) return '';
              const delayIndex = index - 2;
              if (delayIndex === 0) return 'scroll-reveal';
              if (delayIndex === 1) return 'scroll-reveal delay-1';
              if (delayIndex === 2) return 'scroll-reveal delay-2';
              if (delayIndex === 3) return 'scroll-reveal delay-3';
              if (delayIndex === 4) return 'scroll-reveal delay-4';
              return 'scroll-reveal delay-5';
            };
            
            return (
            <div
              key={index}
              className={`group bg-[#1A2647] border border-gray-800 rounded-lg sm:rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 ${getRevealClass()}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between text-left hover:bg-[#0B1437]/50 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4 pr-2 sm:pr-4">
                  <div className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-lg bg-[#0B1437] items-center justify-center border border-gray-700/50">
                    {faq.icon}
                  </div>
                  <span className="text-sm sm:text-lg font-semibold text-white group-hover:text-blue-400 transition-colors leading-snug">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-[500px]' : 'max-h-0'
                }`}
              >
                <div className="px-4 pb-4 sm:px-6 sm:pb-5 text-gray-300 text-sm sm:text-base leading-relaxed border-t border-gray-800/50 pt-3 sm:pt-4 sm:ml-14">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
          })}
        </div>

        {/* CTA Section */}
        <div className="scroll-reveal-scale relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl sm:rounded-2xl p-5 sm:p-10 md:p-12 border border-blue-500/30 text-center mt-24 sm:mt-32">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 animate-pulse" />
          <div className="relative">
            {/* Desktop title */}
            <h2 className="hidden sm:block text-4xl font-bold text-white mb-4 leading-tight">
              Ready to Revive Your Old Leads?
            </h2>
            {/* Mobile title */}
            <h2 className="sm:hidden text-2xl font-bold text-white mb-3 leading-tight">
              Revive Your Old Leads?
            </h2>
            {/* Desktop subtitle */}
            <p className="hidden sm:block text-base text-gray-300 mb-7 max-w-2xl mx-auto leading-relaxed">
              Unlimited leads. Appointments booked automatically.
            </p>
            {/* Mobile subtitle */}
            <p className="sm:hidden text-xs text-gray-300 mb-5 max-w-2xl mx-auto leading-relaxed">
              Unlimited leads. Booked automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="group w-full sm:w-auto px-5 py-2.5 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm sm:text-lg rounded-lg sm:rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-y-[-2px] transition-transform" />
                Get Started
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-5 py-2.5 sm:px-8 sm:py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white font-semibold text-sm sm:text-lg rounded-lg sm:rounded-xl transition-all hover:scale-105"
              >
                View Pricing
              </Link>
            </div>
            <p className="text-[10px] sm:text-sm text-gray-400 mt-3 sm:mt-4">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 text-green-400" />
              Pay As You Go — $0.65/min • No Monthly Fees
            </p>
          </div>
        </div>

        {/* Still Have Questions */}
        <div className="scroll-reveal mt-12 sm:mt-24 text-center pb-8 sm:pb-0">
          <p className="text-gray-400 text-sm sm:text-base mb-1 sm:mb-4">Still have questions?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold text-sm sm:text-base transition-colors"
          >
            Contact Us
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <PublicFooter />
      <MobileFooter />

    </div>
  );
}
