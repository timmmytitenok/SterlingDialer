'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setShow(true), 200);
  }, []);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center">
      {/* Animated Background - Soft gradual glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-purple-500/10 rounded-full top-[-200px] left-[10%] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-blue-500/10 rounded-full bottom-[-200px] right-[10%] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
      </div>

      {/* Confetti - Only render on client */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                background: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className={`relative z-10 text-center px-4 transition-all duration-1000 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-8 shadow-2xl shadow-purple-500/50 animate-bounce-slow">
          <Sparkles className="w-16 h-16 text-white animate-pulse" />
        </div>

        {/* Welcome Text */}
        <h1 className="text-6xl md:text-8xl font-black text-white mb-6 animate-fade-in-up">
          Welcome to
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
            Sterling Dialer
          </span>
        </h1>

        {/* Motivational Quote */}
        <p className="text-2xl md:text-3xl text-gray-300 mb-12 max-w-3xl mx-auto font-light italic animate-fade-in-up-delay">
          "Your leads are waiting. Let AI turn them into appointments while you focus on closing deals."
        </p>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="group px-12 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white font-bold text-xl rounded-2xl transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-purple-500/50 flex items-center gap-3 mx-auto animate-fade-in-up-slow"
        >
          <span>Let's Get Started</span>
          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </button>
      </div>

      <style jsx global>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes fade-in-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in-up-delay {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in-up-slow {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-confetti { animation: confetti linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out 0.3s both; }
        .animate-fade-in-up-delay { animation: fade-in-up-delay 0.8s ease-out 0.6s both; }
        .animate-fade-in-up-slow { animation: fade-in-up-slow 0.8s ease-out 0.9s both; }
      `}</style>
    </div>
  );
}

