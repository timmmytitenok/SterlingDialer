'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, Brain, Calendar, CheckCircle, ArrowRight, Play, Pause } from 'lucide-react';

export default function SalesPresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const totalSlides = 8;

  const speedOptions = [1, 1.25, 1.5, 2];

  // Handle audio play/pause
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Change playback speed
  const changeSpeed = () => {
    const currentIndex = speedOptions.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    const newSpeed = speedOptions[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // Update progress bar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      setCurrentTime(0);
    };

    // Check if metadata is already loaded
    if (audio.readyState >= 1 && audio.duration && !isNaN(audio.duration)) {
      setAudioDuration(audio.duration);
    }

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('durationchange', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
    };
  }, []);

  // Format time as M:SS
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Pause audio when navigating away from the demo slide (slide 5, index 4)
  useEffect(() => {
    if (currentSlide !== 4 && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [currentSlide, isPlaying]);

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
          {/* Static glow orbs for slide 1 - optimized for performance */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform' }}>
            <div 
              className="absolute w-[500px] h-[500px] bg-blue-500/15 rounded-full top-[-200px] left-[-150px]"
              style={{ filter: 'blur(80px)' }}
            />
            <div 
              className="absolute w-[400px] h-[400px] bg-purple-500/20 rounded-full top-[10%] right-[-100px]"
              style={{ filter: 'blur(70px)' }}
            />
            <div 
              className="absolute w-[500px] h-[500px] bg-indigo-500/12 rounded-full bottom-[-250px] left-[30%]"
              style={{ filter: 'blur(80px)' }}
            />
          </div>

          {/* Framing Line */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            className="mb-6"
          >
            <span className="text-sm sm:text-base text-blue-400/80 font-medium tracking-widest uppercase">
              Quick Walkthrough
            </span>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
            className="mb-12 flex items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur opacity-60" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
                <span className="text-white font-bold text-3xl sm:text-4xl">SA</span>
              </div>
            </div>
            <span className="text-4xl sm:text-5xl font-bold text-white">
              Sterling<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"> AI</span>
            </span>
          </motion.div>
          
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 80 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight"
          >
            How Insurance Agents Book More Appointments
          </motion.h1>

          {/* "Without Hiring Callers" with GLOW effect - optimized */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 80 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold leading-tight relative"
            style={{ willChange: 'transform' }}
          >
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
              style={{ 
                filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.5))'
              }}
            >
              Without Hiring Callers
            </span>
          </motion.h2>

          {/* Subtext - Simplified */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="mt-8 text-lg sm:text-xl text-gray-400 max-w-xl"
          >
            Turn your old leads into booked appointments — automatically.
          </motion.p>

          {/* "You'll See" Micro-Promise */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="mt-12 flex items-center gap-6 sm:gap-8 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>How it works</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Who it's for</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              <span>Next steps</span>
            </div>
          </motion.div>
        </div>
      ),
    },

    // Slide 2 - The Problem
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          {/* Static glow orbs - optimized */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform' }}>
            <div 
              className="absolute w-[400px] h-[400px] bg-red-500/10 rounded-full top-[-150px] right-[-100px]"
              style={{ filter: 'blur(70px)' }}
            />
            <div 
              className="absolute w-[450px] h-[450px] bg-orange-500/10 rounded-full bottom-[-200px] left-[-100px]"
              style={{ filter: 'blur(80px)' }}
            />
          </div>

          {/* Section Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400/80 text-sm uppercase tracking-widest mb-6"
          >
            The Problem
          </motion.p>
          
          {/* Main Headline - All in one line */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-12"
            style={{ willChange: 'transform' }}
          >
            Why Leads Go{' '}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-500"
              style={{ filter: 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.5))' }}
            >
              Cold
            </span>
          </motion.h2>

          {/* Bullet Points */}
          <div className="grid gap-4 max-w-2xl w-full">
            {[
              { icon: '⏰', text: 'Old leads expire fast', delay: 0.4 },
              { icon: '📈', text: "Manual follow-up doesn't scale", delay: 0.5 },
              { icon: '😓', text: 'Callers burn out or quit', delay: 0.6 },
              { icon: '🚫', text: "You can't call everyone yourself", delay: 0.7 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: item.delay }}
                className="flex items-center gap-4 p-4 sm:p-5 bg-[#0f1a3d]/60 backdrop-blur-sm rounded-xl border border-red-500/20 text-left"
              >
                <span className="text-2xl sm:text-3xl">{item.icon}</span>
                <p className="text-lg sm:text-xl text-gray-200">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },

    // Slide 3 - Why Traditional Solutions Fail
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          {/* Static glow orbs - amber/orange theme */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform' }}>
            <div 
              className="absolute w-[400px] h-[400px] bg-amber-500/10 rounded-full top-[-100px] left-[-150px]"
              style={{ filter: 'blur(70px)' }}
            />
            <div 
              className="absolute w-[350px] h-[350px] bg-orange-500/12 rounded-full bottom-[-150px] right-[-100px]"
              style={{ filter: 'blur(70px)' }}
            />
          </div>

          {/* Section Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-amber-400/80 text-sm uppercase tracking-widest mb-6"
          >
            Why Traditional Solutions Fail
          </motion.p>
          
          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-12"
            style={{ willChange: 'transform' }}
          >
            Why Most Solutions{' '}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"
              style={{ filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.5))' }}
            >
              Don't Work
            </span>
          </motion.h2>

          {/* Bullet Points - 4 cards in grid */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl w-full">
            {[
              { icon: '😓', text: 'Callers burn out or quit', delay: 0.3 },
              { icon: '🚫', text: 'Dialers get blocked or ignored', delay: 0.4 },
              { icon: '📊', text: "CRMs don't revive old leads", delay: 0.5 },
              { icon: '📈', text: 'More volume means more overhead', delay: 0.6 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay }}
                className="flex items-center gap-4 p-4 sm:p-5 bg-[#0f1a3d]/60 backdrop-blur-sm rounded-xl border border-amber-500/20 text-left"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <p className="text-base sm:text-lg text-gray-200">{item.text}</p>
              </motion.div>
            ))}
          </div>

          {/* X marks to emphasize failure */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex items-center gap-3"
          >
            <span className="text-red-400/60 text-2xl">✗</span>
            <span className="text-gray-500 text-sm">None of these scale without you</span>
            <span className="text-red-400/60 text-2xl">✗</span>
          </motion.div>
        </div>
      ),
    },

    // Slide 4 - The Solution
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          {/* Static glow orbs - green/teal theme for solution */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform' }}>
            <div 
              className="absolute w-[450px] h-[450px] bg-green-500/12 rounded-full top-[-150px] right-[-100px]"
              style={{ filter: 'blur(80px)' }}
            />
            <div 
              className="absolute w-[400px] h-[400px] bg-emerald-500/10 rounded-full bottom-[-150px] left-[-100px]"
              style={{ filter: 'blur(70px)' }}
            />
          </div>

          {/* Section Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400/80 text-sm uppercase tracking-widest mb-6"
          >
            The Solution
          </motion.p>
          
          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-12"
            style={{ willChange: 'transform' }}
          >
            An{' '}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"
              style={{ filter: 'drop-shadow(0 0 30px rgba(34, 197, 94, 0.5))' }}
            >
              AI Appointment Setter
            </span>
          </motion.h2>

          {/* Bullet Points */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl w-full">
            {[
              { icon: <Zap className="w-6 h-6 text-green-400" />, text: 'AI calls every lead — instantly and consistently', delay: 0.3 },
              { icon: <Brain className="w-6 h-6 text-green-400" />, text: 'Handles objections naturally, like a human', delay: 0.4 },
              { icon: <Calendar className="w-6 h-6 text-green-400" />, text: 'Books qualified appointments directly to your calendar', delay: 0.5 },
              { icon: <CheckCircle className="w-6 h-6 text-green-400" />, text: 'Runs daily without management or payroll', delay: 0.6 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay }}
                className="flex items-center gap-4 p-4 sm:p-5 bg-[#0f1a3d]/60 backdrop-blur-sm rounded-xl border border-green-500/20 text-left"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-green-500/10 flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="text-base sm:text-lg text-gray-200">{item.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Micro-line - differentiator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-full"
          >
            <p className="text-green-400 text-sm sm:text-base font-medium">
              This is not a dialer. It's a trained appointment setter.
            </p>
          </motion.div>
        </div>
      ),
    },

    // Slide 5 - Hear It In Action (Demo Recording)
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          {/* Static glow orbs - teal/green theme */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform' }}>
            <div 
              className="absolute w-[400px] h-[400px] bg-teal-500/12 rounded-full top-[-100px] left-[20%]"
              style={{ filter: 'blur(70px)' }}
            />
            <div 
              className="absolute w-[350px] h-[350px] bg-green-500/10 rounded-full bottom-[-100px] right-[20%]"
              style={{ filter: 'blur(70px)' }}
            />
          </div>

          {/* Section Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-teal-400/80 text-sm uppercase tracking-widest mb-6"
          >
            Live Demo
          </motion.p>
          
          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4"
            style={{ willChange: 'transform' }}
          >
            Hear It{' '}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-green-400 to-teal-500"
              style={{ filter: 'drop-shadow(0 0 30px rgba(20, 184, 166, 0.5))' }}
            >
              In Action
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-400 mb-10"
          >
            Listen to a real AI call that booked an appointment
          </motion.p>

          {/* Audio Player Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-lg p-6 bg-[#0f1a3d]/80 backdrop-blur-sm rounded-2xl border border-teal-500/30"
          >
            {/* Waveform Visual - Random animated bars */}
            <div className="flex items-end gap-[2px] mb-6 h-16 justify-center">
              {[...Array(35)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full ${
                    isPlaying 
                      ? 'bg-gradient-to-t from-teal-500 to-green-400 animate-[waveform_0.5s_ease-in-out_infinite_alternate]' 
                      : 'bg-gray-600'
                  }`}
                  style={{
                    height: isPlaying ? '55px' : '8px',
                    animationDelay: isPlaying ? `${i * 0.05}s` : '0s',
                    animationDuration: isPlaying ? `${0.3 + (i % 5) * 0.1}s` : '0s',
                    transition: 'height 0.3s ease',
                  }}
                />
              ))}
              <style>{`
                @keyframes waveform {
                  0% { transform: scaleY(0.2); }
                  100% { transform: scaleY(1); }
                }
              `}</style>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAudio}
                className="w-14 h-14 flex-shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center shadow-lg shadow-teal-500/30 hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </button>
              
              {/* Progress Bar */}
              <div className="flex-1">
                <div 
                  className="h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    if (audioRef.current) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      audioRef.current.currentTime = percent * audioRef.current.duration;
                    }
                  }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-green-400 rounded-full transition-all duration-100"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>

              {/* Speed Button */}
              <motion.button
                onClick={changeSpeed}
                whileTap={{ scale: 0.9 }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-teal-400 transition-colors flex-shrink-0 min-w-[48px]"
              >
                <motion.span
                  key={playbackSpeed}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                >
                  {playbackSpeed}x
                </motion.span>
              </motion.button>
            </div>

            {/* Call Label */}
            <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-green-400 text-sm font-medium">Live Call — Appointment Booked</span>
            </div>
          </motion.div>

          {/* Micro-line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-gray-500 text-sm"
          >
            This is not a robotic dialer — it's a real conversation
          </motion.p>
        </div>
      ),
    },

    // Slide 6 - How It Works
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          {/* Static glow orbs - blue/cyan theme */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform' }}>
            <div 
              className="absolute w-[400px] h-[400px] bg-blue-500/12 rounded-full top-[-100px] left-[-100px]"
              style={{ filter: 'blur(70px)' }}
            />
            <div 
              className="absolute w-[350px] h-[350px] bg-cyan-500/10 rounded-full bottom-[-100px] right-[-100px]"
              style={{ filter: 'blur(70px)' }}
            />
          </div>

          {/* Section Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-blue-400/80 text-sm uppercase tracking-widest mb-6"
          >
            Simple Setup
          </motion.p>
          
          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-12"
            style={{ willChange: 'transform' }}
          >
            How It{' '}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500"
              style={{ filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.5))' }}
            >
              Works
            </span>
          </motion.h2>

          {/* Step Cards - Numbered flow */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl w-full">
            {[
              { step: '1', text: 'Upload your leads and set calling hours', delay: 0.3 },
              { step: '2', text: 'AI calls, qualifies, and handles follow-up automatically', delay: 0.4 },
              { step: '3', text: 'Appointments are booked directly to your calendar', delay: 0.5 },
              { step: '4', text: 'You just show up and close', delay: 0.6 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay }}
                className="flex items-center gap-4 p-4 sm:p-5 bg-[#0f1a3d]/60 backdrop-blur-sm rounded-xl border border-blue-500/20 text-left"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-xl font-bold text-white">{item.step}</span>
                </div>
                <p className="text-base sm:text-lg text-gray-200">{item.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Micro-line - speed/simplicity */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 px-6 py-3 bg-blue-500/10 border border-blue-500/30 rounded-full"
          >
            <p className="text-blue-400 text-sm sm:text-base font-medium">
              ⚡ Live in 24-48 hours
            </p>
          </motion.div>
        </div>
      ),
    },

    // Slide 7 - Real Results (Testimonials)
    {
      content: (() => {
        const testimonials = [
          {
            name: 'Marcus J.',
            role: 'Life Insurance Agent',
            video: '/testimonials/marcus.mp4', // placeholder
            stats: {
              calls: '1170',
              appointments: '8',
              policies: '3',
              premium: '$1,987'
            }
          },
          {
            name: 'Sarah K.',
            role: 'Insurance Agency Owner',
            video: '/testimonials/sarah.mp4', // placeholder
            stats: {
              calls: '1,234',
              appointments: '31',
              policies: '6',
              premium: '$18,750'
            }
          },
          {
            name: 'David R.',
            role: 'Independent Agent',
            video: '/testimonials/david.mp4', // placeholder
            stats: {
              calls: '652',
              appointments: '18',
              policies: '3',
              premium: '$9,200'
            }
          }
        ];

        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
            {/* Static glow orbs - gold/yellow theme for success */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform' }}>
              <div 
                className="absolute w-[400px] h-[400px] bg-yellow-500/10 rounded-full top-[-100px] left-[10%]"
                style={{ filter: 'blur(70px)' }}
              />
              <div 
                className="absolute w-[350px] h-[350px] bg-amber-500/12 rounded-full bottom-[-100px] right-[10%]"
                style={{ filter: 'blur(70px)' }}
              />
            </div>

            {/* Section Label */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-yellow-400/80 text-sm uppercase tracking-widest mb-6"
            >
              Social Proof
            </motion.p>
            
            {/* Main Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-10"
              style={{ willChange: 'transform' }}
            >
              Real{' '}
              <span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"
                style={{ filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.5))' }}
              >
                Results
              </span>
            </motion.h2>

            {/* Content Layout */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-5xl mb-16 pl-12 sm:pl-28"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-20">
                {/* Phone Frame - Standalone (no card wrapper) */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative aspect-[9/16] w-[200px] sm:w-[240px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2.5rem] overflow-hidden border-[5px] border-gray-700 shadow-2xl shadow-yellow-500/10 flex-shrink-0"
                >
                  {/* Video placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2">
                        <Play className="w-7 h-7 text-yellow-400" />
                      </div>
                      <p className="text-gray-400 text-xs">Video Testimonial</p>
                    </div>
                  </div>
                  {/* Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full" />
                </motion.div>

                {/* Stats Card - Right (wider) */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-[#0f1a3d]/80 backdrop-blur-sm rounded-2xl border border-yellow-500/30 p-6 sm:p-8 w-full sm:w-[400px]"
                >
                  <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
                    📊 First 7 Days
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { label: 'Calls Made', value: testimonials[currentTestimonial].stats.calls, icon: '📞' },
                      { label: 'Appointments Booked', value: testimonials[currentTestimonial].stats.appointments, icon: '📅' },
                      { label: 'Policies Sold', value: testimonials[currentTestimonial].stats.policies, icon: '✅' },
                      { label: 'Premium Written', value: testimonials[currentTestimonial].stats.premium, icon: '💰' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl"
                      >
                        <span className="text-gray-300 flex items-center gap-3">
                          <span className="text-lg">{stat.icon}</span>
                          {stat.label}
                        </span>
                        <span className="text-white font-bold text-lg">{stat.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        );
      })(),
    },

    // Slide 8 - Fit + Next Step
    {
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 sm:px-12">
          {/* Static glow orbs - purple/pink theme for closing */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform' }}>
            <div 
              className="absolute w-[400px] h-[400px] bg-purple-500/12 rounded-full top-[-100px] right-[-100px]"
              style={{ filter: 'blur(70px)' }}
            />
            <div 
              className="absolute w-[350px] h-[350px] bg-pink-500/10 rounded-full bottom-[-100px] left-[-100px]"
              style={{ filter: 'blur(70px)' }}
            />
          </div>

          {/* Section Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-purple-400/80 text-sm uppercase tracking-widest mb-6"
          >
            Final Step
          </motion.p>
          
          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-12"
            style={{ willChange: 'transform' }}
          >
            Is This a{' '}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500"
              style={{ filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.5))' }}
            >
              Fit?
            </span>
          </motion.h2>

          {/* Two Column Layout */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl w-full">
            {/* Left - Good Fit If */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 bg-[#0f1a3d]/60 backdrop-blur-sm rounded-xl border border-green-500/30 text-left"
            >
              <h3 className="text-lg font-bold text-green-400 mb-5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Good Fit If...
              </h3>
              <ul className="space-y-4">
                {[
                  'You have leads (new or old)',
                  'You want consistent follow-up',
                  'You answer booked appointments'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-200">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-400 text-sm">✓</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right - Next Steps */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 bg-[#0f1a3d]/60 backdrop-blur-sm rounded-xl border border-purple-500/30 text-left"
            >
              <h3 className="text-lg font-bold text-purple-400 mb-5 flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Next Steps
              </h3>
              <ul className="space-y-4">
                {[
                  'Quick setup call',
                  'AI goes live in 24-48 hours',
                  'Review results after launch'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-200">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 text-sm">{i + 1}</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Micro-line - no commitment */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 px-6 py-3 bg-purple-500/10 border border-purple-500/30 rounded-full"
          >
            <p className="text-purple-400 text-sm sm:text-base font-medium">
              No long-term commitment to get started
            </p>
          </motion.div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Global Audio Element - always mounted */}
      <audio 
        ref={audioRef} 
        src="/recordings/busy-at-work.MP3" 
        preload="auto"
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          if (audio.duration && !isNaN(audio.duration)) {
            setAudioDuration(audio.duration);
          }
        }}
      />

      {/* Background - matching landing page theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1437] via-[#0a1230] to-[#070d24]" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Slide counter */}
      <div className="absolute top-6 left-6 z-20">
        <span className="text-blue-400/60 text-sm font-mono">
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
                ? 'bg-gradient-to-r from-blue-400 to-purple-400 w-8'
                : 'bg-blue-900/50 hover:bg-blue-800/50'
            }`}
          />
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="absolute top-6 right-6 z-20 hidden sm:flex items-center gap-2 text-blue-400/40 text-xs">
        <kbd className="px-2 py-1 bg-blue-900/30 rounded border border-blue-500/20">←</kbd>
        <kbd className="px-2 py-1 bg-blue-900/30 rounded border border-blue-500/20">→</kbd>
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
              ? 'border-blue-900/30 text-blue-900/50 cursor-not-allowed'
              : 'border-blue-500/30 text-blue-400 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className={`p-3 rounded-full border transition-all duration-200 ${
            currentSlide === totalSlides - 1
              ? 'border-blue-900/30 text-blue-900/50 cursor-not-allowed'
              : 'border-blue-500/30 text-blue-400 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20'
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

