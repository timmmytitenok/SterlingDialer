'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2 } from 'lucide-react';

export function SubscriptionSuccessHandler() {
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [found, setFound] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const canceled = params.get('canceled');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 SubscriptionSuccessHandler CHECK');
    console.log('📍 URL:', window.location.href);
    console.log('✅ Success:', success);
    console.log('❌ Canceled:', canceled);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Handle canceled payment
    if (canceled === 'true') {
      console.log('❌ Payment was canceled');
      setTimeout(() => {
        window.history.replaceState({}, '', '/dashboard/settings/billing');
      }, 100);
      return;
    }

    // Handle successful payment
    if (success === 'true') {
      console.log('🎉 SUCCESS DETECTED! Starting modal and polling...');
      setChecking(true);

      let attempts = 0;
      const maxAttempts = 15; // 15 seconds max (was 20)

      const pollInterval = setInterval(async () => {
        attempts++;
        console.log(`📡 Poll attempt ${attempts}/${maxAttempts}`);

        try {
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            console.log('👤 User ID:', user.id);

            // Look for ANY subscription, not just active (could be 'incomplete', 'trialing', etc)
            const { data: subscriptions, error } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (error) {
              console.log('⚠️  Subscription query error:', error.message);
              console.log('⚠️  Error code:', error.code);
              console.log('⚠️  Error details:', error);
              
              // If it's an RLS error, we might need to refresh anyway
              if (error.message?.includes('RLS') || error.message?.includes('policy')) {
                console.log('🚨 RLS POLICY ERROR DETECTED! Refreshing page anyway...');
                clearInterval(pollInterval);
                setFound(true);
                setTimeout(() => {
                  // Clean URL redirect
                  window.location.replace('/dashboard/settings/billing');
                }, 1500);
                return;
              }
            }

            console.log('📊 Found subscriptions:', subscriptions?.length || 0);
            if (subscriptions && subscriptions.length > 0) {
              console.log('🔍 Latest subscription:', subscriptions[0]);
            }

            // Accept any subscription that's not canceled
            const activeSubscription = subscriptions?.find(sub => 
              sub.status === 'active' || 
              sub.status === 'trialing' || 
              sub.status === 'incomplete' ||
              sub.status === 'past_due'
            );

            if (activeSubscription) {
              console.log('✅ SUBSCRIPTION FOUND!', activeSubscription);
              setFound(true);
              setChecking(false);
              clearInterval(pollInterval);

              setTimeout(() => {
                console.log('🔄 Redirecting to billing page (clean URL)...');
                // Replace with clean URL (no ?success=true) and force reload
                window.location.replace('/dashboard/settings/billing');
              }, 2000);
              return;
            } else {
              console.log('⏳ No valid subscription yet... (found:', subscriptions?.length || 0, 'total)');
            }
          }
        } catch (err) {
          console.error('❌ Poll error:', err);
        }

        if (attempts >= maxAttempts) {
          console.log('⏱️  Max attempts reached (15s). Webhook should be done - redirecting...');
          console.log('💡 The subscription was likely created but polling timed out.');
          setChecking(false);
          clearInterval(pollInterval);
          // Show success briefly, then redirect with clean URL
          setFound(true);
          setTimeout(() => {
            window.location.replace('/dashboard/settings/billing');
          }, 1500);
        }
      }, 1000);

      return () => {
        console.log('🧹 Cleaning up poll interval');
        clearInterval(pollInterval);
      };
    }
  }, [mounted, supabase]);

  // Only show modal when mounted on client AND actively checking
  if (!mounted || !checking) {
    return null;
  }

  console.log('🎨 RENDERING MODAL - checking:', checking, 'found:', found);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-[#1A2647] rounded-2xl p-8 border-2 border-blue-500 shadow-2xl max-w-md w-full mx-4 text-center">
        {!found ? (
          <>
            <div className="mb-6">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Processing Payment...</h3>
            <p className="text-gray-400 mb-2">
              Please wait while we activate your subscription.
            </p>
            <p className="text-gray-500 text-sm">
              This usually takes just a few seconds.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto animate-pulse" />
            </div>
            <h3 className="text-3xl font-bold text-green-400 mb-3">Subscription Activated! 🎉</h3>
            <p className="text-gray-400 mb-2">
              Your subscription has been successfully activated.
            </p>
            <p className="text-gray-500 text-sm">
              Redirecting and refreshing your dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
