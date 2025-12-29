'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Mail, Lock, User, ArrowRight, Zap, CheckCircle, Phone, ArrowLeft, Gift } from 'lucide-react';

function SignupPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [salesReferralCode, setSalesReferralCode] = useState<string | null>(null);
  const [salesPersonName, setSalesPersonName] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check for referral code from URL or cookie
  useEffect(() => {
    try {
      const refCode = searchParams.get('ref');
      
      // Helper function to get cookie value
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      let finalRefCode: string | null = null;
      
      // Priority: URL > Cookie > LocalStorage
      if (refCode) {
        console.log('✅ Referral code found in URL:', refCode);
        finalRefCode = refCode;
        // Store in localStorage and cookie as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('pending_referral', refCode);
          document.cookie = `pending_referral=${refCode.toUpperCase()}; path=/; SameSite=Lax`;
        }
      } else {
        // Check cookie first (middleware stores it here)
        const cookieRef = getCookie('pending_referral');
        if (cookieRef) {
          console.log('📦 Found referral in cookie:', cookieRef);
          finalRefCode = cookieRef;
        } else {
          // Fallback to localStorage
          if (typeof window !== 'undefined') {
            const storedRef = localStorage.getItem('pending_referral');
            if (storedRef) {
              console.log('📦 Found stored referral in localStorage:', storedRef);
              finalRefCode = storedRef;
            }
          }
        }
      }
      
      if (finalRefCode) {
        console.log('🎯 Referral code active for session:', finalRefCode);
        
        // Check if this is a SALES TEAM referral code first
        (async () => {
          try {
            // Check sales_team table first
            const { data: salesData } = await supabase
              .from('sales_team')
              .select('id, full_name, referral_code')
              .eq('referral_code', finalRefCode.toUpperCase())
              .eq('status', 'active')
              .single();
            
            if (salesData) {
              console.log('🎯 SALES TEAM referral detected:', salesData.full_name);
              setSalesReferralCode(finalRefCode.toUpperCase());
              setSalesPersonName(salesData.full_name);
              // Store sales referral separately
              if (typeof window !== 'undefined') {
                localStorage.setItem('pending_sales_referral', finalRefCode.toUpperCase());
              }
              return; // Don't check affiliate codes
            }
            
            // If not a sales code, check affiliate referral codes
            setReferralCode(finalRefCode);
            
            const { data: codeData } = await supabase
              .from('referral_codes')
              .select('user_id')
              .eq('code', finalRefCode.toUpperCase())
              .single();
            
            if (codeData?.user_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', codeData.user_id)
                .single();
              
              if (profileData?.full_name) {
                console.log('✅ Affiliate referrer name found:', profileData.full_name);
                setReferrerName(profileData.full_name);
              }
            }
          } catch (err) {
            console.error('❌ Error fetching referrer info:', err);
            // Still set as potential affiliate code
            setReferralCode(finalRefCode);
          }
        })();
      }
    } catch (error) {
      console.error('❌ Error in referral useEffect:', error);
    }
  }, [searchParams]);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create account with Supabase (disable email confirmation for faster onboarding)
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone_number: phoneNumber,
          },
          emailRedirectTo: undefined, // Don't require email confirmation
        },
      });

      // If account already exists, just sign them in instead
      if (signupError && signupError.message.includes('already')) {
        console.log('📧 Account exists - signing in instead...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError('Account exists but password is incorrect. Please use the correct password or click Sign In.');
          setLoading(false);
          return;
        }

        if (signInData.user) {
          // Check if they already activated trial
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('user_id', signInData.user.id)
            .single();

          if (profile?.subscription_tier === 'free_trial' || profile?.subscription_tier === 'pro') {
            // Already activated - go to dashboard
            router.push('/dashboard');
          } else {
            // Not activated yet - go to trial activation
            router.push('/trial-activate');
          }
          return;
        }
      }

      if (signupError) throw signupError;

      if (data.user) {
        // Save phone number to profile
        await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            full_name: name,
            phone_number: phoneNumber,
            updated_at: new Date().toISOString(),
          });

        // Process SALES TEAM referral if present
        if (salesReferralCode) {
          console.log('🎁 Processing SALES TEAM referral:', salesReferralCode);
          
          // Clear localStorage after using it
          if (typeof window !== 'undefined') {
            localStorage.removeItem('pending_sales_referral');
          }

          fetch('/api/sales-referral/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              referralCode: salesReferralCode, 
              userId: data.user.id,
              userEmail: email,
              userName: name,
            })
          })
          .then(async (res) => {
            const result = await res.json();
            if (res.ok) {
              console.log('✅ Sales referral created!', result);
            } else {
              console.error('❌ Sales referral failed:', result.error);
            }
          })
          .catch((err) => {
            console.error('❌ Sales referral error:', err);
          });
        }
        // Process affiliate referral code if present (and not a sales referral)
        else if (referralCode) {
          console.log('🎁 Processing affiliate referral code:', referralCode);
          
          // Clear localStorage and cookie after using it
          if (typeof window !== 'undefined') {
            localStorage.removeItem('pending_referral');
            document.cookie = 'pending_referral=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }

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
              console.log('✅ Affiliate referral applied successfully!', result);
            } else {
              console.error('❌ Affiliate referral failed:', result.error);
            }
          })
          .catch((err) => {
            console.error('❌ Affiliate referral error:', err);
          });
        }

        // Account created! Now go to trial activation page
        router.push('/trial-activate');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      // Handle network errors gracefully
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Failed to create account');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center p-4 py-26">
      {/* Animated Background - Soft gradual glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-blue-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-purple-500/8 rounded-full bottom-[-200px] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-500/20 to-gray-600/20 backdrop-blur-sm border border-gray-500/30 hover:border-gray-400/50 text-white rounded-lg transition-all duration-300 shadow-lg shadow-gray-500/20 hover:shadow-xl hover:shadow-gray-400/40 hover:scale-110 hover:from-gray-500/30 hover:to-gray-600/30 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Back to Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        {/* Header - MATCHES LOGIN */}
        <div className="text-center mb-4 sm:mb-6 mt-4 sm:mt-0">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-800 via-purple-600 to-pink-600 rounded-2xl mb-2 sm:mb-3 shadow-lg">
            <span className="text-lg sm:text-xl font-bold text-white">SD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
            Start Your Free Trial
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            Create an account to activate your 7-day trial
          </p>
        </div>

        {/* Sales Referral Badge */}
        {salesReferralCode && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold text-sm">🤝 Referred by Sales Team</span>
            </div>
            {salesPersonName ? (
              <p className="text-gray-300 text-xs mt-1">
                Your representative: <span className="font-bold text-green-300">{salesPersonName}</span>
              </p>
            ) : (
              <p className="text-gray-300 text-xs mt-1">
                Referral code: <span className="font-mono font-bold text-green-300">{salesReferralCode}</span>
              </p>
            )}
          </div>
        )}

        {/* Affiliate Referral Badge - Show for affiliate referrals */}
        {referralCode && !salesReferralCode && (
          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl animate-pulse">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-bold text-sm">🎉 You're invited!</span>
            </div>
            {referrerName ? (
              <p className="text-gray-300 text-xs mt-1">
                Invited by: <span className="font-bold text-purple-300">{referrerName}</span>
              </p>
            ) : (
              <p className="text-gray-300 text-xs mt-1">
                Referral code: <span className="font-mono font-bold text-purple-300">{referralCode}</span>
              </p>
            )}
          </div>
        )}

        {/* Benefits - COMPACT */}
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 font-bold text-xs">7 Days Free — No Charge Today</span>
          </div>
          <p className="text-gray-300 text-xs">
            We'll ask for a card, but you won't be charged until after your trial ends.
          </p>
        </div>

        {/* Form Card - COMPACT */}
        <div className="bg-[#1A2647] rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3.5 sm:space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="(555) 123-4567"
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                />
                </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Continue to Trial Activation
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* What's Next - Compact */}
          <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-800">
            <p className="text-xs text-gray-400 mb-2">What happens next:</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span>Add your card (no charge today)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span>7 days of full access</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span>Cancel anytime before trial ends</span>
              </div>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-4 sm:mt-5 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Badges - All visible on mobile */}
        <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 sm:gap-6 text-[10px] sm:text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">Secure</span>
          </div>
          <span>•</span>
          <span className="whitespace-nowrap">No charge for 7 days</span>
          <span>•</span>
          <span className="whitespace-nowrap">Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}

