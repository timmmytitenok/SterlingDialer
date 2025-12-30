'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

export default function SalesLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sales/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store sales team session
      if (typeof window !== 'undefined') {
        localStorage.setItem('sales_session', JSON.stringify(data.salesPerson));
        document.cookie = `sales_session=${data.salesPerson.id}; path=/; SameSite=Lax; max-age=86400`;
      }

      // Use window.location for reliable redirect
      window.location.href = '/sales/dashboard';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center p-4 py-20">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl top-20 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl bottom-20 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Back Button */}
      <Link 
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-500/20 to-gray-600/20 backdrop-blur-sm border border-gray-500/30 hover:border-gray-400/50 text-white rounded-lg transition-all duration-300 shadow-lg shadow-gray-500/20 hover:shadow-xl hover:shadow-gray-400/40 hover:scale-110 hover:from-gray-500/30 hover:to-gray-600/30 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Back to Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mb-3 shadow-lg">
            <span className="text-xl font-bold text-white">$</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sales Team Login</h1>
          <p className="text-gray-300">Sign in to view your earnings</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1A2647] rounded-2xl p-6 border border-gray-800 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-500 hover:via-green-500 hover:to-teal-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link href="/sales/signup" className="text-green-400 hover:text-green-300 font-semibold transition">
                Create Sales Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
