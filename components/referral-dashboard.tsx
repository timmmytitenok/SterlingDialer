'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, DollarSign, Clock, ExternalLink, Share2, Sparkles } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
  referrals: any[];
}

export function ReferralDashboard({ userId }: { userId: string }) {
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasCode, setHasCode] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [creatingCode, setCreatingCode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      // Get referral code
      const codeRes = await fetch('/api/referral/get-code');
      const codeData = await codeRes.json();
      
      if (codeData.hasCode && codeData.code) {
        setHasCode(true);
        setReferralCode(codeData.code);
        setReferralLink(codeData.link);

        // Get stats only if they have a code
        const statsRes = await fetch('/api/referral/stats');
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setHasCode(false);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    setCodeError('');
    
    // Validation
    const trimmedCode = customCode.trim().toUpperCase();
    
    if (trimmedCode.length !== 8) {
      setCodeError('Code must be exactly 8 characters');
      return;
    }
    
    if (!/^[A-Z0-9]+$/.test(trimmedCode)) {
      setCodeError('Code can only contain letters and numbers (no symbols)');
      return;
    }

    setCreatingCode(true);

    try {
      const res = await fetch('/api/referral/create-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode })
      });

      const data = await res.json();

      if (!res.ok) {
        setCodeError(data.error || 'Failed to create code');
        return;
      }

      // Success!
      setReferralCode(data.code);
      setReferralLink(data.link);
      setHasCode(true);
      
      // Show confetti celebration!
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      
      // Fetch stats now that they have a code
      const statsRes = await fetch('/api/referral/stats');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (error: any) {
      setCodeError('Error creating code. Please try again.');
      console.error('Error creating code:', error);
    } finally {
      setCreatingCode(false);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Sterling AI!',
          text: `Use my referral code ${referralCode} to get started with Sterling AI - the best AI calling automation platform!`,
          url: referralLink,
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      copyToClipboard(referralLink, 'link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Show "Join Referral Program" screen if user doesn't have a code yet
  if (!hasCode) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Money Rain Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                  fontSize: `${20 + Math.random() * 20}px`,
                }}
              >
                {['💰', '💵', '💸', '✨', '⭐', '🎉'][Math.floor(Math.random() * 6)]}
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border border-purple-500/20 relative overflow-hidden shadow-2xl">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
            <div className="absolute w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl -bottom-20 -left-20 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute w-[200px] h-[200px] bg-pink-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          <style>{`
            @keyframes fall {
              0% {
                transform: translateY(-100px) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
              }
            }
            .animate-fall {
              animation: fall linear infinite;
            }
          `}</style>

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 flex items-center justify-center border-2 border-purple-500/50 mx-auto mb-6 animate-bounce-slow hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/20">
                <Gift className="w-10 h-10 text-purple-400 animate-pulse" />
                <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-ping" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-gradient">
                Join Our Referral Program
              </h2>
              <p className="text-gray-400 text-lg">Create your unique referral code and start earning!</p>
            </div>

            {/* Benefits with Hover Effects */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="group bg-[#0B1437]/50 rounded-xl p-5 border border-green-500/30 text-center hover:border-green-500/60 hover:bg-[#0B1437]/80 hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/10 group-hover:to-green-500/5 transition-all duration-300" />
                <div className="relative">
                  <div className="text-5xl mb-2 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">🎉</div>
                  <p className="text-green-400 font-bold mb-1 group-hover:text-green-300 transition-colors">Free to Join</p>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">No cost, just benefits</p>
                </div>
              </div>
              
              <div className="group bg-[#0B1437]/50 rounded-xl p-5 border border-purple-500/30 text-center hover:border-purple-500/60 hover:bg-[#0B1437]/80 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden animate-pulse-glow">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:to-purple-500/5 transition-all duration-300" />
                <div className="relative">
                  <div className="text-5xl mb-2 group-hover:scale-125 group-hover:animate-bounce transition-all duration-300">💰</div>
                  <p className="text-purple-400 font-bold mb-1 text-lg group-hover:text-purple-300 transition-colors">$200 Per Referral</p>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">When friends subscribe</p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
                  </div>
                </div>
              </div>
              
              <div className="group bg-[#0B1437]/50 rounded-xl p-5 border border-blue-500/30 text-center hover:border-blue-500/60 hover:bg-[#0B1437]/80 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/5 transition-all duration-300" />
                <div className="relative">
                  <div className="text-5xl mb-2 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-300">🚀</div>
                  <p className="text-blue-400 font-bold mb-1 group-hover:text-blue-300 transition-colors">Unlimited Earnings</p>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">No cap on referrals</p>
                </div>
              </div>
            </div>
            
            <style>{`
              @keyframes bounce-slow {
                0%, 100% {
                  transform: translateY(0);
                }
                50% {
                  transform: translateY(-10px);
                }
              }
              @keyframes gradient {
                0%, 100% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
              }
              @keyframes pulse-glow {
                0%, 100% {
                  box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
                }
                50% {
                  box-shadow: 0 0 40px rgba(168, 85, 247, 0.6);
                }
              }
              .animate-bounce-slow {
                animation: bounce-slow 3s ease-in-out infinite;
              }
              .animate-gradient {
                background-size: 200% 200%;
                animation: gradient 3s ease infinite;
              }
              .animate-pulse-glow {
                animation: pulse-glow 2s ease-in-out infinite;
              }
            `}</style>

            {/* Create Code Form */}
            <div className="bg-[#0B1437]/50 rounded-xl p-6 border border-gray-800/50">
              <label className="text-white font-bold mb-3 block text-center">
                Choose Your Referral Code
              </label>
              <p className="text-gray-400 text-sm mb-4 text-center">
                Create a unique 8-character code using only letters and numbers
              </p>
              
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length <= 8) {
                        setCustomCode(value);
                        setCodeError('');
                      }
                    }}
                    placeholder="MYCODE24"
                    maxLength={8}
                    className={`w-full px-6 py-4 bg-[#1A2647] border-2 rounded-lg text-white text-center text-2xl font-bold tracking-widest transition-all duration-300 ${
                      customCode.length === 8 
                        ? 'border-green-500 shadow-lg shadow-green-500/30 focus:shadow-xl focus:shadow-green-500/50' 
                        : 'border-gray-700 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/30'
                    }`}
                  />
                  {customCode.length === 8 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce border-2 border-[#1A2647]">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 px-2">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Only letters & numbers
                    </p>
                    <div className="flex items-center gap-2">
                      {customCode.length === 8 && (
                        <span className="text-xs text-green-400 animate-pulse">✨ Perfect!</span>
                      )}
                      <p className={`text-sm font-medium transition-colors ${
                        customCode.length === 8 ? 'text-green-400 font-bold' : 'text-gray-500'
                      }`}>
                        {customCode.length}/8
                      </p>
                    </div>
                  </div>
                </div>

                {codeError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-shake">
                    <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                      <span className="text-lg">⚠️</span>
                      {codeError}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCreateCode}
                  disabled={customCode.length !== 8 || creatingCode}
                  className="group w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {creatingCode ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5 group-hover:animate-bounce" />
                      <span className="relative z-10">Create My Referral Code</span>
                      <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                    </>
                  )}
                </button>
                
                <style>{`
                  @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                  }
                  .animate-shake {
                    animation: shake 0.5s ease-in-out;
                  }
                `}</style>
              </div>

              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm text-center">
                  💡 <strong>Pro tip:</strong> Choose something memorable! Your friends will use this to sign up.
                </p>
              </div>
            </div>

            {/* How it Works */}
            <div className="mt-8 bg-[#0B1437]/30 rounded-xl p-6 border border-gray-800/30">
              <h3 className="text-white font-bold mb-4 text-center">How It Works</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                    <span className="text-purple-400 font-bold text-sm">1</span>
                  </div>
                  <p className="text-gray-300 text-sm">Create your unique referral code</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                    <span className="text-purple-400 font-bold text-sm">2</span>
                  </div>
                  <p className="text-gray-300 text-sm">Share your code or referral link with friends</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                    <span className="text-purple-400 font-bold text-sm">3</span>
                  </div>
                  <p className="text-gray-300 text-sm">When they subscribe to any plan, you get $200 in credits instantly!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Money Rain Animation for Main Dashboard */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
                fontSize: `${20 + Math.random() * 20}px`,
              }}
            >
              {['💰', '💵', '💸', '✨', '⭐', '🎉'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
      
      {/* Header Card */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border border-purple-500/20 relative overflow-hidden shadow-2xl hover:shadow-purple-500/20 transition-shadow duration-300">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
          <div className="absolute w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl -bottom-20 -left-20 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute w-[200px] h-[200px] bg-pink-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 flex items-center justify-center border-2 border-purple-500/50 hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/20 relative">
              <Gift className="w-6 h-6 text-purple-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Referral Program
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </h2>
              <p className="text-gray-400 text-sm">Earn $200 in calling credits for each friend who subscribes!</p>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-[#0B1437]/50 rounded-xl p-6 border border-gray-800/50 mb-6">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                  <span className="text-blue-400 font-bold">1</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Share Your Link</p>
                  <p className="text-gray-400 text-xs">Send your unique referral link to friends</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <span className="text-green-400 font-bold">2</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">They Subscribe</p>
                  <p className="text-gray-400 text-xs">When they sign up and subscribe to any plan</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                  <span className="text-purple-400 font-bold">3</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">You Get $200</p>
                  <p className="text-gray-400 text-xs">Credits are added instantly to your balance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-[#0B1437]/50 rounded-xl p-5 border border-gray-800/50 mb-4 hover:border-purple-500/30 transition-colors duration-300">
            <label className="text-sm text-gray-400 mb-2 block font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Your Unique Referral Code
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-[#1A2647] border-2 border-gray-700 rounded-lg flex items-center justify-center hover:border-purple-500 transition-colors duration-300 shadow-lg hover:shadow-purple-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="text-white text-2xl font-bold tracking-widest relative z-10">{referralCode || 'Loading...'}</span>
              </div>
              <button
                onClick={() => copyToClipboard(referralCode, 'code')}
                className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {copied ? <Check className="w-4 h-4 animate-bounce" /> : <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                <span className="font-medium relative z-10">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-[#0B1437]/50 rounded-xl p-5 border border-gray-800/50">
            <label className="text-sm text-gray-400 mb-2 block font-medium">Your Unique Referral Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-3 bg-[#1A2647] border border-gray-700 rounded-lg text-white text-sm"
              />
              <button
                onClick={() => copyToClipboard(referralLink, 'link')}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={shareReferralLink}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                <Share2 className="w-4 h-4" />
                <span className="font-medium">Share</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Share this link with friends. When they subscribe to any plan, you'll automatically receive $200 in calling credits!
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Pending Referrals - FIRST */}
        <div className="group bg-gradient-to-br from-orange-600/20 to-orange-500/10 rounded-xl p-6 border-2 border-orange-500/30 hover:border-orange-500/60 hover:shadow-xl hover:shadow-orange-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/10 group-hover:to-orange-500/5 transition-all duration-300" />
          <div className="relative">
            <Clock className="w-8 h-8 text-orange-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-4xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">{stats?.pendingReferrals || 0}</p>
            <p className="text-orange-300 text-sm font-medium">Pending</p>
            <p className="text-orange-400/60 text-xs mt-1">Waiting for subscription</p>
          </div>
        </div>

        {/* 2. Total Referrals - SECOND (only counts subscribed users) */}
        <div className="group bg-gradient-to-br from-blue-600/20 to-blue-500/10 rounded-xl p-6 border-2 border-blue-500/30 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/5 transition-all duration-300" />
          <div className="relative">
            <Users className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-4xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">{stats?.totalReferrals || 0}</p>
            <p className="text-blue-300 text-sm font-medium">Total Referrals</p>
            <p className="text-blue-400/60 text-xs mt-1">Friends who subscribed</p>
          </div>
        </div>

        {/* 3. Credits Earned - THIRD */}
        <div className="group bg-gradient-to-br from-green-600/20 to-green-500/10 rounded-xl p-6 border-2 border-green-500/30 hover:border-green-500/60 hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden animate-pulse-glow-green">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/10 group-hover:to-green-500/5 transition-all duration-300" />
          <div className="relative">
            <DollarSign className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            <p className="text-4xl font-bold text-white mb-1 group-hover:scale-105 transition-transform flex items-center gap-2">
              ${stats?.totalCreditsEarned || 0}
              <Sparkles className="w-5 h-5 text-yellow-400 opacity-0 group-hover:opacity-100 group-hover:animate-spin transition-opacity" />
            </p>
            <p className="text-green-300 text-sm font-medium">Credits Earned</p>
            <p className="text-green-400/60 text-xs mt-1">Added to your balance</p>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse-glow-green {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(34, 197, 94, 0.6);
          }
        }
        .animate-pulse-glow-green {
          animation: pulse-glow-green 2s ease-in-out infinite;
        }
      `}</style>

      {/* Referral List */}
      {stats?.referrals && stats.referrals.length > 0 && (
        <div className="bg-[#1A2647] rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Your Referrals
          </h3>
          <div className="space-y-3">
            {stats.referrals.map((ref: any) => (
              <div 
                key={ref.id} 
                className="flex items-center justify-between bg-[#0B1437]/50 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                    <span className="text-purple-400 font-bold text-sm">
                      {ref.referee?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{ref.referee?.name || 'User'}</p>
                    <p className="text-xs text-gray-400">
                      Signed up {new Date(ref.referee?.signupDate || ref.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    ref.status === 'credited' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    ref.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}>
                    {ref.status === 'credited' ? '✅ Credited' :
                     ref.status === 'completed' ? '✓ Completed' :
                     '⏳ Pending'}
                  </span>
                  {ref.status === 'credited' && (
                    <span className="text-green-400 font-bold text-lg">
                      +${parseFloat(ref.credit_amount).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Referrals Yet */}
      {stats?.referrals && stats.referrals.length === 0 && (
        <div className="bg-[#1A2647] rounded-xl p-12 border border-gray-800 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No referrals yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Start sharing your referral link to earn $200 in credits for every friend who subscribes!
          </p>
          <button
            onClick={shareReferralLink}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 inline-flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Your Link Now
          </button>
        </div>
      )}
    </div>
  );
}

