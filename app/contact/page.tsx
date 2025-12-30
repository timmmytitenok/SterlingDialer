'use client';

import { useEffect } from 'react';
import { PublicNav } from '@/components/public-nav';
import { MobilePublicNav } from '@/components/mobile-public-nav';
import { PublicFooter } from '@/components/public-footer';
import { MobileFooter } from '@/components/mobile-footer';
import BlurText from '@/components/blur-text';
import { Mail, Phone, Clock, Send, CheckCircle, ArrowRight, Calendar, Shield, CheckCircle2, Zap, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ContactPage() {
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        alert('Failed to send message. Please try again or email us directly.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again or email us directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      <PublicNav />
      <MobilePublicNav />
      
      {/* Animated Background - Soft gradual glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-blue-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-purple-500/8 rounded-full bottom-[-200px] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-32">
        {/* Header */}
        <div className="text-center mb-22 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <Mail className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-blue-400 font-semibold">Get In Touch</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-center">
            <div className="flex justify-center">
              <BlurText
                text="Contact"
                delay={100}
                className="text-white"
                animateBy="words"
                direction="top"
              />
            </div>
            <div className="text-4xl md:text-5xl flex justify-center mt-2">
              <BlurText
                text="Sterling Dialer Support"
                delay={120}
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                animateBy="words"
                direction="top"
              />
            </div>
          </h1>
          <p className="text-1xl text-gray-400 max-w-2xl mx-auto">
            Questions about reviving your old leads? We're always here happy to help.
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

        <div className="space-y-8">
          {/* Contact Form - Centered & Wider on Desktop */}
          <div className="scroll-reveal-left max-w-3xl mx-auto bg-[#1A2647] rounded-2xl p-8 border border-gray-800 shadow-2xl">
            {!submitted ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your old leads and how we can help..."
                      rows={5}
                      className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="group w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 border-4 border-green-500/50 animate-bounce">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-gray-400 mb-6">We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>

          {/* Contact Options - 3 Column Grid */}
          <div className="scroll-reveal max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Email Card */}
                  <a
                    href="mailto:SterlingDialer@gmail.com"
              className="group bg-[#1A2647]/80 rounded-xl p-5 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3 border border-blue-500/30 group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Email Us</h3>
              <p className="text-blue-400 text-sm font-medium">SterlingDialer@gmail.com</p>
                  </a>

            {/* Schedule Call Card */}
            <Link 
              href="/schedule-call"
              className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-5 border border-purple-500/40 hover:border-pink-500/50 transition-all duration-300 hover:scale-[1.02] text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center mx-auto mb-3 border border-purple-500/40 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Schedule a Call</h3>
              <p className="text-purple-400 text-sm font-medium group-hover:text-pink-400 transition-colors flex items-center justify-center gap-1">
                Book Free Consultation
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </Link>

            {/* Response Time */}
            <div className="bg-[#1A2647]/80 rounded-xl p-5 border border-gray-800 text-center">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3 border border-green-500/30">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Response Time</h3>
              <p className="text-green-400 text-sm font-bold">Within 24 Hours</p>
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        `}</style>

      <PublicFooter />
      <MobileFooter />

      </div>
  );
}

