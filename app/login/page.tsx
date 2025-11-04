'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Gift, ArrowLeft } from 'lucide-react';
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

  // Secret master login trigger - click logo 5 times (only works on sign in page)
  const handleLogoClick = () => {
    // Don't allow in sign up mode
    if (isSignUp) return;
    
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount >= 5) {
      // Toggle master login mode (5 clicks = enable, 5 more clicks = disable)
      setIsMasterLogin(!isMasterLogin);
      setLogoClickCount(0); // Reset counter
    }
    
    // Reset counter after 2 seconds of no clicks
    setTimeout(() => {
      setLogoClickCount(0);
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
      // MASTER PASSWORD LOGIN (only works in sign in mode)
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
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-700"></div>
        <div className="absolute w-96 h-96 bg-pink-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-1000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>


      {/* Back Button - Top Left */}
      <Link 
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-all duration-300 backdrop-blur-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-4 py-12 md:py-16">
        {/* Logo - Added padding - Secret: Click 5 times for master login */}
        <div className="text-center mb-8 md:mb-12 pt-18 md:pt-0">
          <div 
            onClick={handleLogoClick}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/50 cursor-pointer hover:scale-105 transition-transform"
          >
            <span className="text-3xl font-bold text-white">SA</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Sterling AI</h1>
          <p className="text-gray-400">
            {isSignUp ? 'Create your account' : isMasterLogin ? 'Admin Access' : 'Welcome back'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#1A2647] rounded-2xl p-8 md:p-10 border border-gray-800 shadow-2xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-8">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={`w-full px-4 py-3 bg-[#0B1437] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  isMasterLogin 
                    ? 'border-purple-500/50 focus:ring-purple-500' 
                    : 'border-gray-700 focus:ring-blue-500'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters
              </p>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-6 text-lg rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                const newIsSignUp = !isSignUp;
                setIsSignUp(newIsSignUp);
                setError(null);
                // Disable master login mode if switching to sign up
                if (newIsSignUp) {
                  setIsMasterLogin(false);
                }
              }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
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
