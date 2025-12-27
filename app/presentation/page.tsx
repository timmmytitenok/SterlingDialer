'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, Users, Brain, Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 6;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const slides = [
    // Slide 1 - Frame the Call
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Image
              src="/SterlingAI Logo.png"
              alt="Sterling AI"
              width={200}
              height={60}
              className="mx-auto"
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
          >
            How Agents Book More Appointments
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              Without Hiring Callers
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 max-w-2xl"
          >
            <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">💬 You say:</p>
            <p className="text-zinc-300 text-lg italic">
              "This will take about 10–15 minutes. I'll show you how this works, and at the end we'll decide if it makes sense for you."
            </p>
          </motion.div>
        </div>
      ),
    },

    // Slide 2 - The Problem
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400 text-sm uppercase tracking-widest mb-4"
          >
            The Problem
          </motion.p>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl font-bold text-white mb-12"
          >
            Why Leads Go <span className="text-red-400">Cold</span>
          </motion.h2>

          <div className="grid gap-6 max-w-3xl w-full">
            {[
              { icon: '📉', text: 'Leads not getting worked fast enough', delay: 0.4 },
              { icon: '🎭', text: 'Human callers are inconsistent', delay: 0.6 },
              { icon: '🔄', text: "You're the bottleneck in your own business", delay: 0.8 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: item.delay }}
                className="flex items-center gap-4 p-5 bg-zinc-800/60 rounded-xl border border-zinc-700/50 text-left"
              >
                <span className="text-3xl">{item.icon}</span>
                <p className="text-xl text-zinc-200">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 max-w-2xl"
          >
            <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">💬 You say:</p>
            <p className="text-zinc-300 text-lg italic">
              "Most agents don't have a lead problem — they have a follow-up problem."
            </p>
          </motion.div>
        </div>
      ),
    },

    // Slide 3 - Why Current Solutions Fail
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400 text-sm uppercase tracking-widest mb-4"
          >
            Why Current Solutions Fail
          </motion.p>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl font-bold text-white mb-12"
          >
            Every Option <span className="text-amber-400">Falls Short</span>
          </motion.h2>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl w-full">
            {[
              { icon: '👥', title: 'Hiring Callers', problem: 'Unreliable, expensive, need management', delay: 0.4 },
              { icon: '🤖', title: 'Auto Dialers', problem: 'Robotic, low connect rates, spam flagged', delay: 0.6 },
              { icon: '📊', title: 'CRM Follow-ups', problem: 'Passive, easily ignored, no conversations', delay: 0.8 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay }}
                className="p-6 bg-zinc-800/60 rounded-xl border border-red-500/20 text-center"
              >
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400">{item.problem}</p>
                <div className="mt-4 text-red-400 text-2xl">✗</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 max-w-2xl"
          >
            <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">💬 You say:</p>
            <p className="text-zinc-300 text-lg italic">
              "Every option works until it needs management."
            </p>
          </motion.div>
        </div>
      ),
    },

    // Slide 4 - The Solution
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400 text-sm uppercase tracking-widest mb-4"
          >
            The Solution
          </motion.p>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl font-bold text-white mb-4"
          >
            Meet Your <span className="text-green-400">AI Appointment Setter</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-zinc-400 mb-12"
          >
            Not a dialer. A trained sales assistant.
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 max-w-4xl w-full">
            {[
              { icon: <Zap className="w-10 h-10 text-green-400" />, text: 'AI calls your leads', delay: 0.5 },
              { icon: <Brain className="w-10 h-10 text-green-400" />, text: 'Handles objections naturally', delay: 0.7 },
              { icon: <Calendar className="w-10 h-10 text-green-400" />, text: 'Books to your calendar', delay: 0.9 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: item.delay }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="text-zinc-200 font-medium">{item.text}</p>
                {i < 2 && <ArrowRight className="hidden sm:block w-6 h-6 text-zinc-600 absolute right-0" />}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-12 p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 max-w-2xl"
          >
            <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">💬 You say:</p>
            <p className="text-zinc-300 text-lg italic">
              "This is a trained appointment setter — not a dialer."
            </p>
          </motion.div>
        </div>
      ),
    },

    // Slide 5 - How It Works
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400 text-sm uppercase tracking-widest mb-4"
          >
            How It Works In Real Life
          </motion.p>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl font-bold text-white mb-12"
          >
            Simple as <span className="text-green-400">1-2-3-4</span>
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl w-full">
            {[
              { step: '1', title: 'Upload Leads', desc: 'Drop your leads into the system', delay: 0.4 },
              { step: '2', title: 'Set Calling Hours', desc: 'Choose when AI makes calls', delay: 0.6 },
              { step: '3', title: 'AI Runs Daily', desc: 'Works your list automatically', delay: 0.8 },
              { step: '4', title: 'You Take Appointments', desc: 'Show up and close deals', delay: 1.0 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay }}
                className="flex items-start gap-4 p-5 bg-zinc-800/60 rounded-xl border border-zinc-700/50 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-black">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="text-zinc-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-12 p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 max-w-2xl"
          >
            <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">💬 You say:</p>
            <p className="text-zinc-300 text-lg italic">
              "If you can check a calendar, you can run this."
            </p>
          </motion.div>
        </div>
      ),
    },

    // Slide 6 - Fit + Next Step
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400 text-sm uppercase tracking-widest mb-4"
          >
            Is This Right For You?
          </motion.p>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl font-bold text-white mb-12"
          >
            Let's See If We're A <span className="text-green-400">Good Fit</span>
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl w-full mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 bg-zinc-800/60 rounded-xl border border-green-500/30 text-left"
            >
              <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Good Fit If...
              </h3>
              <ul className="space-y-3">
                {['You have leads to work', 'You want consistency', 'You answer booked calls'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-200">
                    <span className="text-green-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="p-6 bg-zinc-800/60 rounded-xl border border-zinc-700/50 text-left"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ArrowRight className="w-6 h-6 text-green-400" />
                Next Step
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-zinc-200">
                  <span className="text-green-400">→</span>
                  Start your free trial
                </li>
                <li className="flex items-center gap-3 text-zinc-200">
                  <span className="text-green-400">→</span>
                  Get set up same day or within 24-48 hrs
                </li>
                <li className="flex items-center gap-3 text-zinc-200">
                  <span className="text-green-400">→</span>
                  AI starts booking appointments
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 max-w-2xl"
          >
            <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">💬 You say:</p>
            <p className="text-zinc-300 text-lg italic">
              "If this feels aligned, we can get you live quickly. If not, totally fine."
            </p>
          </motion.div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/10 via-transparent to-transparent" />

      {/* Slide counter */}
      <div className="absolute top-6 left-6 z-20">
        <span className="text-zinc-500 text-sm font-mono">
          {currentSlide + 1} / {totalSlides}
        </span>
      </div>

      {/* Navigation dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === currentSlide
                ? 'bg-green-400 w-8'
                : 'bg-zinc-600 hover:bg-zinc-500'
            }`}
          />
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="absolute top-6 right-6 z-20 hidden sm:flex items-center gap-2 text-zinc-600 text-xs">
        <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700">←</kbd>
        <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700">→</kbd>
        <span>to navigate</span>
      </div>

      {/* Main slide area */}
      <div className="relative z-10 h-screen flex items-center justify-center">
        <AnimatePresence mode="wait" custom={currentSlide}>
          <motion.div
            key={currentSlide}
            custom={currentSlide}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`p-3 rounded-full border transition-all duration-200 ${
            currentSlide === 0
              ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
              : 'border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400 hover:bg-green-500/10'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className={`p-3 rounded-full border transition-all duration-200 ${
            currentSlide === totalSlides - 1
              ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
              : 'border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400 hover:bg-green-500/10'
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Click to advance (on mobile) */}
      <div
        className="absolute inset-0 z-0 sm:hidden"
        onClick={nextSlide}
      />
    </div>
  );
}

