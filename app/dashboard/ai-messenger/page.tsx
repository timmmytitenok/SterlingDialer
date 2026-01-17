'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Zap, DollarSign, TrendingUp, Mail, Sparkles, Rocket } from 'lucide-react';

export default function AIMessengerPage() {
  const router = useRouter();

  // Redirect to main dashboard - page is hidden but preserved
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <main className="container mx-auto px-4 lg:px-8 py-12 relative z-10">
        {/* Coming Soon Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-full animate-pulse">
            <Rocket className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-bold text-lg">COMING SOON</span>
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
        </div>

        {/* Main Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mb-6 shadow-2xl shadow-purple-500/30">
            <MessageSquare className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 mb-4">
            AI Messenger
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Automated text messaging that follows up with your leads, nurtures relationships, 
            and <span className="text-purple-400 font-semibold">books appointments for you</span> — 
            at a <span className="text-green-400 font-semibold">fraction of the cost</span>!
          </p>
        </div>

        {/* Feature Preview Cards - 3 Main Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Smart Follow-ups */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Follow-ups</h3>
              <p className="text-gray-400">
                AI-powered conversation flows that know when to follow up, what to say, and how to keep leads engaged.
              </p>
            </div>
          </div>

          {/* Fraction of the Cost */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border border-yellow-500/20 p-6 hover:border-yellow-500/40 transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-colors" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center mb-4">
                <DollarSign className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Fraction of the Cost</h3>
              <p className="text-gray-400">
                Text messages cost pennies compared to phone calls. Maximize your outreach while minimizing your expenses.
              </p>
            </div>
          </div>

          {/* Higher Response Rates */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border border-pink-500/20 p-6 hover:border-pink-500/40 transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-colors" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Higher Response Rates</h3>
              <p className="text-gray-400">
                People check texts more than calls. Get up to 5x more responses with SMS compared to cold calling alone.
              </p>
            </div>
          </div>
        </div>

        {/* Sterling Promise */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-3xl border border-purple-500/30 p-8 md:p-12 mb-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">Our Promise</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Sterling Dialer Just Keeps Getting{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Better & Better
              </span>
            </h2>
            
            <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed mb-8">
              We're constantly building new features to help you close more deals, save more time, and grow your business. 
              AI Messenger is just the beginning — there's so much more coming your way!
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="px-4 py-2 bg-[#1A2647] rounded-lg border border-gray-700">
                <span className="text-green-400">✓</span> <span className="text-gray-300">AI Dialer</span> <span className="text-green-400 font-medium">LIVE</span>
              </div>
              <div className="px-4 py-2 bg-[#1A2647] rounded-lg border border-purple-500/30">
                <span className="text-purple-400">🚀</span> <span className="text-gray-300">AI Messenger</span> <span className="text-purple-400 font-medium">COMING SOON</span>
              </div>
              <div className="px-4 py-2 bg-[#1A2647] rounded-lg border border-gray-700">
                <span className="text-gray-500">⏳</span> <span className="text-gray-400">More features</span> <span className="text-gray-500">PLANNED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Request CTA */}
        <div className="bg-[#1A2647] rounded-2xl border border-gray-700 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">
            Have More Suggestions?
          </h3>
          <p className="text-gray-400 max-w-xl mx-auto mb-6">
            We'd love to hear what features YOU want to see! Your feedback shapes our roadmap. 
            Drop us an email with your ideas — we read every single one.
          </p>
          
          <a
            href="mailto:SterlingDialer@gmail.com?subject=Feature%20Request%20-%20Sterling%20AI"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <Mail className="w-5 h-5" />
            <span>SterlingDialer@gmail.com</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
          
          <p className="text-gray-500 text-sm mt-4">
         
          </p>
        </div>
      </main>
    </div>
  );
}

