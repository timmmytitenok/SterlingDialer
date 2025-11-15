'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Gift, ArrowLeft, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function LoginPageContent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isMasterLogin, setIsMasterLogin] = useState(false);
  const [isAdminDashboardMode, setIsAdminDashboardMode] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check for referral code in URL and store in localStorage
  useEffect(() => {
    try {
      const refCode = searchParams.get('ref');
      console.log('🔍 useEffect - Checking URL for ref parameter:', refCode);
      
      if (refCode) {
        console.log('✅ Ref parameter found:', refCode);
        // Store in localStorage so it survives page reloads
        if (typeof window !== 'undefined') {
          localStorage.setItem('pending_referral', refCode);
        }
        setReferralCode(refCode);
        setIsSignUp(true); // Auto-switch to sign up mode if there's a referral code
      } else {
        console.log('❌ No ref parameter in URL');
        // Check localStorage for pending referral
        if (typeof window !== 'undefined') {
          const storedRef = localStorage.getItem('pending_referral');
          if (storedRef) {
            console.log('📦 Found stored referral in localStorage:', storedRef);
            setReferralCode(storedRef);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in referral useEffect:', error);
    }
  }, [searchParams]);

  // Secret master login trigger - click logo 5/10 times (only works on sign in page)
  const handleLogoClick = () => {
    // Don't allow in sign up mode
    if (isSignUp) return;
    
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

  // Handle phone number formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
    
    if (value.length <= 10) {
      // Format as (###) ###-####
      let formatted = value;
      if (value.length > 6) {
        formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
      } else if (value.length > 3) {
        formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      } else if (value.length > 0) {
        formatted = `(${value}`;
      }
      setPhoneNumber(formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ADMIN DASHBOARD MODE (password only, no email)
      if (isAdminDashboardMode && !isSignUp) {
        const response = await fetch('/api/admin/master-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: '', // No email needed for admin dashboard
            masterPassword: password,
            adminDashboard: true, // Flag to indicate this is for admin dashboard
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Admin login failed');
        }

        setError('✅ Admin access granted! Redirecting to admin dashboard...');
        setTimeout(() => {
          // Force a full page reload to ensure cookie is picked up
          window.location.href = '/admin/dashboard';
        }, 1000);
        return;
      }

      // MASTER PASSWORD LOGIN (user impersonation - requires email)
      if (isMasterLogin && !isSignUp) {
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

        // Verify the token to create a session
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

      // NORMAL LOGIN/SIGNUP FLOW
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phoneNumber,
              company_name: agencyName,
            },
          },
        });
        
        // Check for duplicate email error
        if (error) {
          if (error.message.includes('already registered') || error.message.includes('User already registered')) {
            setError('❌ This email is already registered. Please sign in instead.');
            setIsSignUp(false); // Switch to sign in mode
            return;
          }
          throw error;
        }
        
        // Show success message FIRST - signup worked!
        setError('✅ Check your email to confirm your account!');
        
        // If there's a referral code or ref parameter, handle it in the background
        if (data.user) {
          // Check for new free trial referral system (ref parameter - UUID format)
          // Try URL first, then localStorage, then referralCode state
          let referrerId: string | null = null;
          
          try {
            const urlParams = new URLSearchParams(window.location.search);
            referrerId = urlParams.get('ref');
            
            if (!referrerId && typeof window !== 'undefined') {
              referrerId = localStorage.getItem('pending_referral');
              console.log('📦 Retrieved from localStorage:', referrerId);
            }
            
            if (!referrerId && referralCode) {
              referrerId = referralCode;
              console.log('📋 Using referralCode state:', referrerId);
            }
            
            console.log('🔍 DEBUG: Checking for referral parameter');
            console.log('  - URL search params:', window.location.search);
            console.log('  - referrerId:', referrerId);
            console.log('  - referralCode (old system):', referralCode);
            
            // UUID regex to check if ref is a user ID (new system)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(referrerId || '');
            console.log('  - Is UUID?:', isUUID);
            
            if (referrerId && isUUID) {
              console.log('🎁 Processing free trial referral from:', referrerId);
              
              // Clear localStorage after using it
              if (typeof window !== 'undefined') {
                localStorage.removeItem('pending_referral');
              }
            
            // Create referral entry in the background
            fetch('/api/referral/create-from-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                referrerId,
                refereeId: data.user.id,
                refereeEmail: email
              })
            })
            .then(async (res) => {
              console.log('📡 API Response status:', res.status);
              const contentType = res.headers.get('content-type');
              console.log('📡 Content-Type:', contentType);
              
              if (contentType && contentType.includes('application/json')) {
                const result = await res.json();
                if (res.ok) {
                  console.log('✅ Free trial referral tracked!', result);
                } else {
                  console.error('❌ Free trial referral failed:', result);
                }
              } else {
                // API returned HTML instead of JSON
                const text = await res.text();
                console.error('❌ API returned HTML instead of JSON');
                console.error('Response:', text.substring(0, 500));
              }
            })
            .catch((err) => {
              console.error('❌ Free trial referral error:', err);
            });
            }
          } catch (refError) {
            console.error('❌ Error processing referral:', refError);
          }
          
          if (referralCode && referrerId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(referrerId)) {
            // Old referral code system (for paid users with custom codes like "ABC123")
            console.log('🎯 Applying old referral code:', referralCode);
            
            fetch('/api/referral/validate-simple', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                code: referralCode, 
                newUserId: data.user.id 
              })
            })
            .then(async (res) => {
              const result = await res.json();
              if (res.ok) {
                console.log('✅ Referral applied! You will get 30% discount!');
              } else {
                console.error('❌ Referral failed:', result.error);
              }
            })
            .catch((err) => {
              console.error('❌ Referral error:', err);
            });
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
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
        <div className="text-center mb-4 sm:mb-6">
          <div 
            onClick={handleLogoClick}
            className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-3 sm:mb-4 shadow-lg cursor-pointer hover:scale-105 transition-transform"
          >
            <span className="text-xl sm:text-2xl font-bold text-white">SA</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">
            {isSignUp ? 'Create Account' : isAdminDashboardMode ? '🔒 Admin Dashboard' : isMasterLogin ? 'Admin Access' : 'Sterling AI'}
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">
            {isSignUp ? 'Join thousands of agents' : isAdminDashboardMode ? 'Admin login' : isMasterLogin ? 'Master access' : 'Welcome back'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#1A2647] rounded-2xl p-6 sm:p-8 border border-gray-800 shadow-2xl backdrop-blur-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 sm:mb-8">
            {isSignUp ? 'Sign Up' : isAdminDashboardMode ? '🔒 Admin Login' : 'Sign In'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="agencyName" className="block text-sm font-medium text-gray-300 mb-2">
                    Agency/Company Name <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <input
                    id="agencyName"
                    type="text"
                    placeholder="Smith Insurance Group"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    required
                    maxLength={14}
                    className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">10 digits - auto-formatted</p>
                </div>
              </>
            )}

            {/* Hide email field in Admin Dashboard Mode */}
            {!isAdminDashboardMode && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                {isAdminDashboardMode ? 'Admin Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  placeholder={isAdminDashboardMode ? 'Enter admin password' : 'Minimum 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`w-full pl-11 pr-4 py-3 bg-[#0B1437] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    isMasterLogin || isAdminDashboardMode
                      ? 'border-red-500/50 focus:ring-red-500' 
                      : 'border-gray-700 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>

            {error && (
              <div className={`p-4 rounded-lg text-sm ${
                error.includes('✅')
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            {isSignUp ? (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Already have an account? Sign in
              </button>
            ) : (
              <Link
                href="/signup"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Don't have an account? Create one
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-10 mb-8">
          © 2025 Sterling AI. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B1437] flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
