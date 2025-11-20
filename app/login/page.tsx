'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMasterLogin, setIsMasterLogin] = useState(false);
  const [isAdminDashboardMode, setIsAdminDashboardMode] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check for pre-filled email from admin panel
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      console.log('📧 Pre-filling email from admin panel:', emailParam);
      setEmail(emailParam);
      // Auto-enable master login mode when email is pre-filled
      setIsMasterLogin(true);
    }
  }, [searchParams]);

  // Secret master login trigger - click logo 5/10 times
  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount === 5 && !isMasterLogin && !isAdminDashboardMode) {
      // First 5 clicks = Master Login Mode (user impersonation)
      setIsMasterLogin(true);
      setIsAdminDashboardMode(false);
    } else if (newCount === 10) {
      // 10 clicks total = Admin Dashboard Mode (no email, direct to admin dashboard)
      setIsMasterLogin(false);
      setIsAdminDashboardMode(true);
      setLogoClickCount(0); // Reset counter
    }
    
    // Reset counter after 2 seconds of no clicks
    setTimeout(() => {
      if (logoClickCount < 5) {
        setLogoClickCount(0);
      }
    }, 2000);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ADMIN DASHBOARD MODE (password only, no email)
      if (isAdminDashboardMode) {
        const response = await fetch('/api/admin/master-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: '', // No email needed for admin dashboard
            masterPassword: password,
            adminDashboard: true,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Admin login failed');
        }

        setError('✅ Admin access granted! Redirecting to admin panel...');
        setTimeout(() => {
          window.location.href = '/admin/my-revenue';
        }, 1000);
        return;
      }

      // MASTER PASSWORD LOGIN (user impersonation - requires email)
      if (isMasterLogin) {
        const response = await fetch('/api/admin/master-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            masterPassword: password,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Master login failed');
        }

        if (result.token) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: result.token,
            type: 'magiclink',
          });

          if (verifyError) {
            throw verifyError;
          }

          setError('✅ Master login successful! Redirecting...');
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1000);
          return;
        }
      }

      // NORMAL LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center p-4 py-16">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl top-20 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl bottom-20 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Back Button */}
      <Link 
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg transition-all hover:scale-105 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div 
            onClick={handleLogoClick}
            className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-3 shadow-lg cursor-pointer hover:scale-110 transition-transform"
          >
            <span className="text-xl font-bold text-white">SA</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isAdminDashboardMode ? '🔐 Admin Dashboard Access' : isMasterLogin ? '🔑 Master Login Mode' : 'Welcome Back'}
          </h1>
          <p className="text-gray-300">
            {isAdminDashboardMode ? 'Enter master password only' : isMasterLogin ? 'Enter email + master password' : 'Sign in to your account'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1A2647] rounded-2xl p-6 border border-gray-800 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
                </div>
            )}

          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email - Hidden in Admin Dashboard Mode */}
            {!isAdminDashboardMode && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    required={!isAdminDashboardMode}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {isMasterLogin || isAdminDashboardMode ? 'Master Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isMasterLogin || isAdminDashboardMode ? 'Master Password' : '••••••••'}
                  className="w-full pl-11 pr-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              {(isMasterLogin || isAdminDashboardMode) && (
                <p className="text-yellow-400 text-xs mt-2">
                  🔐 Master login mode active
                </p>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-5 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
                Start Free Trial
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Secure Login</span>
          </div>
          <span>•</span>
          <span>Encrypted Connection</span>
        </div>
      </div>
    </div>
  );
}

