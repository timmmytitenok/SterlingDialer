'use client';

import { Mail, Phone, MessageCircle, Bug, Lightbulb, Clock, Heart, Sparkles, ExternalLink } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Support</h1>
        <p className="text-gray-400 text-sm md:text-base">We're here to help you succeed!</p>
      </div>

      {/* MOBILE: Quick Contact Buttons - Large tap targets */}
      <div className="md:hidden space-y-3">
        {/* Call/Text Button - Primary Action */}
        <a
          href="tel:+16142305525"
          className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Call or Text</p>
              <p className="text-green-100 text-sm">(614) 230-5525</p>
            </div>
          </div>
          <ExternalLink className="w-5 h-5 text-white/70" />
        </a>

        {/* Email Button */}
        <a
          href="mailto:SterlingDialer@gmail.com?subject=Support%20Request%20-%20Sterling%20AI"
          className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Email Us</p>
              <p className="text-blue-100 text-sm">SterlingDialer@gmail.com</p>
            </div>
          </div>
          <ExternalLink className="w-5 h-5 text-white/70" />
        </a>

        {/* Response Time - Compact */}
        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-gray-300">
            We respond within <span className="text-yellow-400 font-bold">48 hours</span>
          </p>
        </div>
      </div>

      {/* Beta Banner - Compact on mobile */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 rounded-xl md:rounded-2xl border border-purple-500/30 p-4 md:p-6">
        <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2 md:mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">We're in Beta! 🚀</h2>
              <p className="text-purple-300 text-xs md:text-sm">Thank you for being an early adopter</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            <span className="hidden md:inline">Please bear with us — there's so much we're working to improve! Your feedback helps us build a better product. </span>
            Found a bug? Have a feature request? We want to hear from you!
          </p>
        </div>
      </div>

      {/* DESKTOP: Contact Options - Hidden on mobile */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        {/* Email Card */}
        <a
          href="mailto:SterlingDialer@gmail.com?subject=Support%20Request%20-%20Sterling%20AI"
          className="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border-2 border-blue-500/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Email Us</h3>
            <p className="text-blue-400 font-mono text-lg mb-3">SterlingDialer@gmail.com</p>
            <p className="text-gray-400 text-sm">
              Best for detailed questions, bug reports, or feature requests.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-blue-400 font-medium group-hover:translate-x-2 transition-transform">
              <span>Send Email</span>
              <span>→</span>
            </div>
          </div>
        </a>

        {/* Phone Card */}
        <a
          href="tel:+16142305525"
          className="group relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border-2 border-green-500/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-green-500/60 hover:shadow-2xl hover:shadow-green-500/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Call or Text</h3>
            <p className="text-green-400 font-mono text-lg mb-3">(614) 230-5525</p>
            <p className="text-gray-400 text-sm">
              Need help with onboarding or have an urgent issue? Text or call us!
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-green-400 font-medium group-hover:translate-x-2 transition-transform">
              <span>Call Now</span>
              <span>→</span>
            </div>
          </div>
        </a>
      </div>

      {/* Response Time - Desktop only */}
      <div className="hidden md:block bg-[#1A2647] rounded-2xl border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Response Time</h3>
        </div>
        <p className="text-gray-300">
          We typically respond within <span className="text-yellow-400 font-bold">48 hours</span>. 
          For urgent matters, texting is usually fastest!
        </p>
      </div>

      {/* What We Can Help With - Compact grid on mobile */}
      <div className="bg-[#1A2647] rounded-xl md:rounded-2xl border border-gray-700 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">What can we help you with?</h3>
        
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 p-3 md:p-4 bg-[#0B1437] rounded-xl border border-gray-800 text-center md:text-left">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Bug className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm md:text-base">Bug Reports</p>
              <p className="text-xs md:text-sm text-gray-400 hidden md:block">Found something broken? Let us know!</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 p-3 md:p-4 bg-[#0B1437] rounded-xl border border-gray-800 text-center md:text-left">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm md:text-base">Feature Requests</p>
              <p className="text-xs md:text-sm text-gray-400 hidden md:block">Have an idea? We'd love to hear it!</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 p-3 md:p-4 bg-[#0B1437] rounded-xl border border-gray-800 text-center md:text-left">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm md:text-base">Questions</p>
              <p className="text-xs md:text-sm text-gray-400 hidden md:block">Confused about something? Ask away!</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 p-3 md:p-4 bg-[#0B1437] rounded-xl border border-gray-800 text-center md:text-left">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm md:text-base">Onboarding</p>
              <p className="text-xs md:text-sm text-gray-400 hidden md:block">Need help getting started? We've got you!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thank You Note - Compact on mobile */}
      <div className="text-center py-4 md:py-8">
        <p className="text-gray-400 text-xs md:text-sm">
          Thank you for choosing Sterling AI! 💙
        </p>
        <p className="text-gray-500 text-[10px] md:text-xs mt-1 md:mt-2">
          Your success is our success
        </p>
      </div>
    </div>
  );
}

