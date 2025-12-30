'use client';

import { useEffect, useState, useRef } from 'react';
import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { TrendingUp, Calendar, Phone, DollarSign, Play, Pause, Star, Quote, ArrowRight, Rocket, Users, Zap, Clock, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';

// Text testimonials
const textTestimonials = [
  { name: "Robert M.", location: "El Paso, TX", text: "Week 1 I got 11 appointments. Week 2 I got 14 appointments. Simple but effective.", rating: 5 },
  { name: "Lisa C.", location: "Chicago, IL", text: "My VA was dialing 200 leads a day. Sterling does 500. No comparison.", rating: 5 },
  { name: "Chris B.", location: "Charlotte, NC", text: "Closed my first deal within 2 days of signing up. Already paid for itself.", rating: 5 },
  { name: "Maria S.", location: "Jacksonville, FL", text: "I was skeptical about AI calling. After seeing my calendar, It actully works.", rating: 5 },
  { name: "Steve W.", location: "Fort Lauderdale, WA", text: "4,000 old leads. 89 appointments. 19 policies. Do the math.", rating: 5 },
  { name: "Nicole P.", location: "Clevland, TN", text: "The AI sounds so natural, clients don't even realize it's not human.", rating: 5 },
];

export default function CaseStudiesPage() {
  const [isPlaying, setIsPlaying] = useState(true); // Autoplay by default
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // User manually paused
  const [isInView, setIsInView] = useState(false); // Track if video is in viewport
  const [isMuted, setIsMuted] = useState(true); // Mobile starts muted
  const [isMobile, setIsMobile] = useState(false); // Track if mobile
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll reveal effect
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

  // Autoplay video silently on mount (volume fades in when scrolling into view)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 0; // Start silent, fade in when in view
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Handle hover volume fade (only when video is in view)
  useEffect(() => {
    if (!videoRef.current || !isInView) return;
    
    let animationFrame: number;
    const targetVolume = isHovered ? 0.25 : 0.01; // 25% when hovered, 1% in background
    
    const fadeVolume = () => {
      if (!videoRef.current) return;
      
      const currentVolume = videoRef.current.volume;
      const diff = targetVolume - currentVolume;
      
      // Slower fade in (0.015), faster fade out (0.08)
      const fadeSpeed = isHovered ? 0.015 : 0.08;
      
      if (Math.abs(diff) > 0.005) {
        videoRef.current.volume = currentVolume + diff * fadeSpeed;
        animationFrame = requestAnimationFrame(fadeVolume);
      } else {
        videoRef.current.volume = targetVolume;
      }
    };
    
    fadeVolume();
    return () => cancelAnimationFrame(animationFrame);
  }, [isHovered, isInView]);

  // Fade in/out audio when scrolling in/out of video section (desktop only)
  useEffect(() => {
    if (!videoContainerRef.current || !videoRef.current) return;

    let fadeInterval: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          
          if (fadeInterval) clearInterval(fadeInterval);
          
          if (entry.isIntersecting) {
            setIsInView(true);
            // On mobile, keep muted until user taps
            if (isMobile) {
              videoRef.current.volume = 0;
              return;
            }
            // Desktop: Fade in smoothly to 1% background volume when scrolling into view
            fadeInterval = setInterval(() => {
              if (!videoRef.current) return;
              if (videoRef.current.volume < 0.01) {
                videoRef.current.volume = Math.min(0.01, videoRef.current.volume + 0.0005);
              } else {
                clearInterval(fadeInterval);
              }
            }, 20);
          } else {
            setIsInView(false);
            // Smoothly fade to silent when scrolling away (both desktop and mobile)
            setIsHovered(false);
            
            // For mobile: also mute when scrolling away
            if (isMobile) {
              setIsMuted(true);
            }
            
            // Fade audio to 0 for both desktop and mobile
            fadeInterval = setInterval(() => {
              if (!videoRef.current) return;
              if (videoRef.current.volume > 0.0005) {
                videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.008); // Faster fade for mobile
              } else {
                videoRef.current.volume = 0;
                clearInterval(fadeInterval);
              }
            }, 20);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(videoContainerRef.current);
    return () => {
      observer.disconnect();
      if (fadeInterval) clearInterval(fadeInterval);
    };
  }, [isMobile]);

  const toggleVideo = () => {
    // On mobile, toggle mute/unmute instead of play/pause
    if (isMobile) {
      if (videoRef.current) {
        if (isMuted) {
          setIsMuted(false);
          videoRef.current.volume = 0.20; // 20% volume
        } else {
          setIsMuted(true);
          videoRef.current.volume = 0;
        }
      }
      return;
    }
    
    // Desktop: toggle play/pause
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPaused(true);
      } else {
        videoRef.current.play();
        setIsPaused(false);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-purple-500/8 rounded-full top-[-300px] left-[-300px]" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-blue-500/8 rounded-full top-[30%] right-[-300px]" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[1000px] h-[1000px] bg-purple-500/8 rounded-full bottom-[-200px] left-[20%]" style={{ filter: 'blur(180px)' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <PublicNav />
      <MobilePublicNav />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-28 pb-24 sm:py-32">
        {/* Header */}
        <div className="text-center mb-20 sm:mb-20">
          {/* Pill badge - both mobile and desktop */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-5 sm:mb-8">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-semibold text-xs sm:text-base">Real Results from Real Agents</span>
          </div>
          
          {/* Desktop Title */}
          <h1 className="hidden sm:block text-6xl md:text-7xl font-bold mb-6 text-center">
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
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                animateBy="words"
                direction="top"
              />
            </div>
          </h1>
          
          {/* Mobile Title - 2 lines */}
          <h1 className="sm:hidden text-4xl font-bold mb-4 text-center">
            <div className="flex justify-center">
              <BlurText
                text="Success Stories"
                delay={100}
                className="text-white"
                animateBy="words"
                direction="top"
              />
            </div>
            <div className="flex justify-center mt-1">
              <BlurText
                text="That Speak For It Self"
                delay={120}
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                animateBy="words"
                direction="top"
              />
            </div>
          </h1>
          
          <p className="text-1sm sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Watch how agents are turning old, dusty leads into booked appointments.
          </p>
        </div>

        {/* Platform-Wide Stats Banner - Hidden on Mobile */}
        <div className="scroll-reveal hidden sm:block mb-32">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-5 border border-blue-500/20 text-center">
              <Phone className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">400K+</p>
              <p className="text-gray-400 text-sm">Calls Made</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-5 border border-purple-500/20 text-center">
              <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">3.1K+</p>
              <p className="text-gray-400 text-sm">Appointments</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-5 border border-emerald-500/20 text-center">
              <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">250+</p>
              <p className="text-gray-400 text-sm">Agents</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl p-5 border border-amber-500/20 text-center">
              <DollarSign className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">$1.1M+</p>
              <p className="text-gray-400 text-sm">Revenue</p>
            </div>
          </div>
        </div>

        {/* Featured Video Testimonial */}
        <div className="scroll-reveal mb-32 sm:mb-40 mt-4 sm:mt-32">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-20 items-center justify-center max-w-5xl mx-auto">
            {/* Video Section - Centered */}
            <div className="flex justify-center relative">
              {/* Glow Effect Behind Phone */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[310px] h-[460px] sm:w-[440px] sm:h-[660px] bg-gradient-to-br from-purple-500/40 via-blue-500/30 to-pink-500/40 rounded-full blur-[60px] sm:blur-[80px] animate-pulse" />
              </div>
              <div 
                ref={videoContainerRef}
                className="relative aspect-[9/16] w-[245px] sm:w-[330px] cursor-pointer z-10"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={toggleVideo}
              >
                {/* Phone Frame */}
                <div className="absolute inset-0 bg-gray-900 rounded-[2rem] sm:rounded-[2.5rem] border-[3px] sm:border-4 border-gray-700 shadow-2xl shadow-purple-500/30 overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-1.5 sm:top-2 left-1/2 -translate-x-1/2 w-14 sm:w-20 h-4 sm:h-6 bg-gray-800 rounded-full z-20" />
                  
                  {/* Video Element */}
                  <video
                    ref={videoRef}
                    className="absolute inset-3 sm:inset-4 rounded-[1.5rem] sm:rounded-[2rem] w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] h-[calc(100%-1.5rem)] sm:h-[calc(100%-2rem)] object-cover"
                    poster="/testimonials/marcus-thumbnail.jpg"
                    playsInline
                    loop
                    autoPlay
                  >
                    <source src="/testimonials/marcus-testimonial.mp4" type="video/mp4" />
                  </video>
                  
                  {/* Paused Overlay - Desktop only */}
                  {isPaused && !isMobile && (
                    <div className="absolute inset-3 sm:inset-4 rounded-[1.5rem] sm:rounded-[2rem] bg-black/40 flex flex-col items-center justify-center z-10">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-purple-500/50 flex items-center justify-center">
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 ml-0.5" />
                      </div>
                      <p className="text-white/80 text-[10px] sm:text-xs mt-2 sm:mt-3 font-medium">Tap to play</p>
                    </div>
                  )}
                  
                  {/* Pause button on hover - Desktop */}
                  {!isPaused && isHovered && !isMobile && (
                    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-all">
                      <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                  
                  {/* Mobile: Clean mute/unmute indicator */}
                  {isMobile && (
                    <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${isMuted ? 'bg-black/60 scale-100' : 'bg-purple-500/90 scale-110'}`}>
                      <span className={`text-lg transition-transform duration-300 ${isMuted ? 'scale-100' : 'scale-110'}`}>{isMuted ? '🔇' : '🔊'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section - Cleaner Design */}
            <div className="flex-1 max-w-md lg:pl-8 w-full px-2 sm:px-0">
              {/* Name & Location - Centered on mobile */}
              <div className="text-center lg:text-left mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-0.5 sm:mb-1">Vlad B.</h2>
                <p className="text-gray-400 text-sm sm:text-sm">Independent Agent • Cleveland, OH</p>
              </div>
              
              {/* Stats Grid - 2x2 on mobile, 2x2 on desktop */}
              <div className="grid grid-cols-2 gap-3 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-[#1A2647]/60 rounded-xl p-4 sm:p-4 border border-gray-800 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-400">5,694</p>
                  <p className="text-gray-500 text-xs sm:text-xs mt-1 sm:mt-1">Calls</p>
                </div>
                <div className="bg-[#1A2647]/60 rounded-xl p-4 sm:p-4 border border-gray-800 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-purple-400">24</p>
                  <p className="text-gray-500 text-xs sm:text-xs mt-1 sm:mt-1">Appts</p>
                </div>
                <div className="bg-[#1A2647]/60 rounded-xl p-4 sm:p-4 border border-gray-800 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-400">8</p>
                  <p className="text-gray-500 text-xs sm:text-xs mt-1 sm:mt-1">Policies</p>
                </div>
                <div className="bg-[#1A2647]/60 rounded-xl p-4 sm:p-4 border border-gray-800 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-amber-400">$7.2K</p>
                  <p className="text-gray-500 text-xs sm:text-xs mt-1 sm:mt-1">Revenue</p>
                </div>
              </div>
              
              {/* Quote - Hidden on mobile, shown on tablet+ */}
              <div className="hidden sm:block bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-gray-300 text-sm italic leading-relaxed">
                  "Sterling Dialer called every single one of my old leads in the last 4 weeks. My calendar has never been this full and I was able to make an extra $7K this month of December."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* More Agent Reviews */}
        <div className="scroll-reveal mb-30 sm:mb-36">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-3xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">More Agent Reviews</h2>
            <p className="text-gray-400 text-sm sm:text-base">What other agents are saying</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-6xl mx-auto">
            {textTestimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/10 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center gap-0.5 sm:gap-1 mb-2 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">{testimonial.name}</p>
                    <p className="text-gray-500 text-xs sm:text-sm">{testimonial.location}</p>
                  </div>
                </div>
                      </div>
            ))}
                      </div>
                    </div>
                    
        {/* Before vs After Comparison */}
        <div className="scroll-reveal mb-30 sm:mb-36">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-4xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Before vs After</h2>
            <p className="text-gray-400 text-sm sm:text-base">The difference AI automation makes</p>
                    </div>
                    
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            {/* Before */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-red-500/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Before Sterling</h3>
              </div>
              <div className="space-y-2 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm sm:text-base">100 calls/day manually</p>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm sm:text-base">1-3 appointments/day</p>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm sm:text-base">Old leads collecting dust</p>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm sm:text-base">Inconsistent follow-up</p>
                </div>
                    </div>
                  </div>
                  
            {/* After */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-500/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">After Sterling</h3>
                    </div>
              <div className="space-y-2 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm sm:text-base">500+ calls/day on autopilot</p>
                    </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm sm:text-base">4-6 appointments/day</p>
                    </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm sm:text-base">Every lead gets worked</p>
                    </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm sm:text-base">Consistent daily outreach</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Math Section */}
        <div className="scroll-reveal mb-30 sm:mb-36">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6 sm:mb-10">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Vlad's Results for $379/month</h2>
              <p className="text-gray-400 text-sm sm:text-base">Real numbers from his first month</p>
            </div>

            {/* Desktop: 3 columns with icons */}
            <div className="hidden sm:grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/20 text-center">
                <Phone className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white mb-1">5,694</p>
                <p className="text-gray-400 text-sm">Calls Made</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-6 border border-purple-500/20 text-center">
                <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white mb-1">24</p>
                <p className="text-gray-400 text-sm">Appointments Booked</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-6 border border-emerald-500/20 text-center">
                <DollarSign className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white mb-1">$7.2K</p>
                <p className="text-gray-400 text-sm">Revenue Generated</p>
              </div>
            </div>

            {/* Mobile: Stacked rows */}
            <div className="sm:hidden space-y-2 mb-6">
              <div className="bg-[#1A2647]/60 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                <span className="text-gray-300 text-sm">Calls Made</span>
                <span className="text-xl font-bold text-blue-400">5,694</span>
              </div>
              <div className="bg-[#1A2647]/60 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                <span className="text-gray-300 text-sm">Appointments</span>
                <span className="text-xl font-bold text-purple-400">24</span>
              </div>
              <div className="bg-[#1A2647]/60 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                <span className="text-gray-300 text-sm">Policies Sold</span>
                <span className="text-xl font-bold text-amber-400">8</span>
              </div>
              <div className="bg-[#1A2647]/60 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                <span className="text-gray-300 text-sm">Revenue</span>
                <span className="text-xl font-bold text-emerald-400">$7.2K</span>
              </div>
            </div>

            {/* Desktop: Full ROI breakdown */}
            <div className="hidden sm:block bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-center gap-6 text-center">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Vlad Paid</p>
                  <p className="text-2xl font-bold text-white">$379</p>
                </div>
                <ArrowRight className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm mb-1">Vlad's Return</p>
                  <p className="text-2xl font-bold text-emerald-400">$7,200</p>
                </div>
                <ArrowRight className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm mb-1">Vlad's ROI</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">19x</p>
                </div>
              </div>
            </div>

            {/* Mobile: Simplified ROI */}
            <div className="sm:hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20 text-center">
              <p className="text-gray-400 text-xs mb-1">Return on Investment</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">19x ROI</p>
              <p className="text-gray-500 text-xs mt-2">$379 → $7,200</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="scroll-reveal text-center pb-14 sm:pb-24">
          <div className="max-w-2xl mx-auto p-5 sm:p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl sm:rounded-2xl border border-purple-500/20">
            <h2 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
              Ready to Be Our Next Success?
          </h2>
            <p className="text-gray-400 text-xs sm:text-base mb-4 sm:mb-6">
              7-day free trial and see results in your first week.
          </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm sm:text-lg rounded-lg sm:rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
            >
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
              Start Free Trial
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <p className="text-gray-500 text-[10px] sm:text-sm mt-3 sm:mt-4">
              7-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      <PublicFooter />
      <MobileFooter />

      <style jsx>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
