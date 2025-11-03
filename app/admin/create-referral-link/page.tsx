'use client';

import { useState } from 'react';
import { Copy, Check, Link as LinkIcon, Search, Users } from 'lucide-react';

export default function CreateReferralLinkPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearchByEmail = async () => {
    if (!email) {
      setError('Please enter an email');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/get-user-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setUserId(data.userId);
        const link = `${window.location.origin}/login?ref=${data.userId}`;
        setReferralLink(link);
        setError('');
      } else {
        setError(data.error || 'User not found');
        setUserId('');
        setReferralLink('');
      }
    } catch (err) {
      setError('Failed to fetch user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromUserId = () => {
    if (!userId) {
      setError('Please enter a user ID');
      return;
    }

    const link = `${window.location.origin}/login?ref=${userId}`;
    setReferralLink(link);
    setError('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1437] via-[#1A2647] to-[#0B1437] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-600/30 flex items-center justify-center mx-auto mb-4 border-2 border-green-500/50">
            <LinkIcon className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Create Referral Link
          </h1>
          <p className="text-gray-400">
            Generate a referral link for any user to share with their friends
          </p>
        </div>

        {/* Method 1: Search by Email */}
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border border-gray-800 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Search className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Method 1: Search by Email</h2>
              <p className="text-sm text-gray-400">Find a user by their email address</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block font-medium">
                User Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 bg-[#0B1437] border-2 border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchByEmail()}
              />
            </div>

            <button
              onClick={handleSearchByEmail}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find User & Create Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* OR Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-gray-800"></div>
          <span className="text-gray-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-800"></div>
        </div>

        {/* Method 2: Direct User ID */}
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border border-gray-800 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Method 2: Direct User ID</h2>
              <p className="text-sm text-gray-400">If you already know the user's ID</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block font-medium">
                User ID (UUID)
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-4 py-3 bg-[#0B1437] border-2 border-gray-700 rounded-lg text-white font-mono text-sm focus:border-purple-500 focus:outline-none transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFromUserId()}
              />
            </div>

            <button
              onClick={handleCreateFromUserId}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-5 h-5" />
              Create Link from User ID
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 font-medium">❌ {error}</p>
          </div>
        )}

        {/* Generated Link Display */}
        {referralLink && (
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl p-8 border-2 border-green-500/50 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-[200px] h-[200px] bg-green-500/10 rounded-full blur-3xl -top-10 -right-10 animate-pulse" />
              <div className="absolute w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-3xl -bottom-10 -left-10 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/30 flex items-center justify-center border border-green-500/50">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">✅ Referral Link Created!</h3>
                  <p className="text-green-300 text-sm">Share this link to start earning referrals</p>
                </div>
              </div>

              {userId && (
                <div className="bg-[#0B1437]/50 rounded-lg p-3 mb-4 border border-green-500/30">
                  <p className="text-xs text-green-400 mb-1 font-medium">User ID:</p>
                  <p className="text-white font-mono text-sm break-all">{userId}</p>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm text-green-300 font-bold flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Your Referral Link:
                </label>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-4 py-3 bg-[#0B1437] border-2 border-green-500/30 rounded-lg text-white text-sm font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 animate-bounce" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                  <p className="text-green-300 text-sm font-medium mb-2">📋 How to use this link:</p>
                  <ul className="text-green-200 text-sm space-y-1 list-disc list-inside">
                    <li>Share this link with friends via email, social media, or text</li>
                    <li>When they sign up, verify email, and add a payment method</li>
                    <li>The referrer will automatically get +7 days added to their trial</li>
                    <li>Max 4 referrals = 28 extra days total</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Helper Info */}
        <div className="mt-8 bg-[#1A2647]/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Quick SQL Query
          </h3>
          <p className="text-gray-400 text-sm mb-3">
            Get a user's ID directly from Supabase SQL Editor:
          </p>
          <div className="bg-[#0B1437] rounded-lg p-4 border border-gray-800">
            <code className="text-green-400 text-xs font-mono block">
              SELECT id, email FROM auth.users WHERE email = 'user@example.com';
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

