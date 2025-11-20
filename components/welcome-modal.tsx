'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Zap, CheckCircle } from 'lucide-react';

interface WelcomeModalProps {
  userName: string;
  onContinue: () => void;
}

export function WelcomeModal({ userName, onContinue }: WelcomeModalProps) {
  const [show, setShow] = useState(false);
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    // Show modal after a brief delay
    setTimeout(() => setShow(true), 300);
    
    // Stop confetti after 3 seconds
    setTimeout(() => setConfetti(false), 3000);
  }, []);

  const handleContinue = () => {
    setShow(false);
    setTimeout(onContinue, 300);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Confetti Animation */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Modal Content */}
      <div className="relative max-w-2xl w-full mx-4 bg-gradient-to-br from-[#1A2647] via-[#0F1629] to-[#1A2647] rounded-3xl border-2 border-purple-500/50 shadow-2xl animate-scale-in p-8 md:p-12">
        {/* Glowing Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 rounded-3xl blur-xl animate-pulse" />
        
        <div className="relative z-10 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-6 shadow-2xl shadow-purple-500/50 animate-bounce-in">
            <Sparkles className="w-12 h-12 text-white animate-pulse" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 animate-slide-up">
            🎉 Welcome to Sterling AI!
          </h1>

          {/* Personalized Message */}
          <p className="text-xl md:text-2xl text-gray-300 mb-6 animate-slide-up-delay">
            Hey {userName}, thanks for joining! 👋
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-8 text-left max-w-md mx-auto">
            {[
              'Your 30-day trial is now active',
              'AI agent ready to revive your leads',
              'Automatic appointment booking enabled',
              'Full access to all premium features',
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg animate-slide-in-right"
                style={{ animationDelay: `${idx * 0.1 + 0.3}s` }}
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-green-300 font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <p className="text-gray-400 mb-6">
            Let's get you set up in <span className="text-purple-400 font-bold">4 simple steps</span>
          </p>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="group px-10 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-purple-500/50 flex items-center gap-3 mx-auto"
          >
            <span>Let's Get Started</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-up-delay {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .animate-slide-up { animation: slide-up 0.6s ease-out 0.2s both; }
        .animate-slide-up-delay { animation: slide-up-delay 0.6s ease-out 0.4s both; }
        .animate-slide-in-right { animation: slide-in-right 0.6s ease-out both; }
        .animate-confetti { animation: confetti linear both; }
      `}</style>
    </div>
  );
}

