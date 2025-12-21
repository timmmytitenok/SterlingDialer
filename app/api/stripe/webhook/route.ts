import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { calculateAIExpense } from '@/lib/ai-cost-calculator';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('⚠️ No stripe-signature header found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('✅ Webhook received:', event.type);

    // Use service role client to bypass RLS policies
    const supabase = createServiceRoleClient();
    console.log('🔧 Using service role client for webhook');

    // Handle checkout completion (for immediate subscription activation)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('🛒 Checkout completed:', session.id);
      
      // Handle payment method setup (for auto-refill)
      if (session.mode === 'setup' && session.setup_intent) {
        console.log('💳 Payment method setup completed');
        
        try {
          const setupIntent = await stripe.setupIntents.retrieve(
            typeof session.setup_intent === 'string' ? session.setup_intent : session.setup_intent.id
          );
          
          const customerId = session.customer as string;
          const paymentMethodId = setupIntent.payment_method as string;
          
          if (paymentMethodId && customerId) {
            // Set this payment method as the default for invoices (auto-refill)
            await stripe.customers.update(customerId, {
              invoice_settings: {
                default_payment_method: paymentMethodId,
              },
            });
            
            console.log('✅ Payment method set as default for customer:', customerId);
          }
        } catch (error: any) {
          console.error('❌ Error setting up payment method:', error.message);
        }
        
        // Don't continue to subscription/payment processing
        return NextResponse.json({ received: true });
      }
      
      // If this is a subscription checkout, fetch the subscription
      if (session.mode === 'subscription' && session.subscription) {
        const subscriptionId = typeof session.subscription === 'string' 
          ? session.subscription 
          : session.subscription.id;
        
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['default_payment_method']
          });
          const customerId = subscription.customer as string;
          const priceId = subscription.items.data[0]?.price.id;

          console.log('📦 Processing subscription from checkout:', {
            id: subscription.id,
            customerId,
            priceId,
            status: subscription.status,
          });

          // Get payment method - Stripe attaches it to subscription automatically
          let paymentMethodId: string | null = null;
          
          // Try from subscription (most reliable for trial subscriptions)
          if (subscription.default_payment_method) {
            paymentMethodId = typeof subscription.default_payment_method === 'string'
              ? subscription.default_payment_method
              : subscription.default_payment_method.id;
            console.log('💳 Found payment method from subscription:', paymentMethodId);
          }
          
          // Fallback: List all payment methods for this customer
          if (!paymentMethodId) {
            console.log('🔍 Payment method not on subscription, fetching from customer...');
            try {
              const paymentMethods = await stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
                limit: 1, // Get the most recently added
              });
              
              if (paymentMethods.data.length > 0) {
                paymentMethodId = paymentMethods.data[0].id;
                console.log('💳 Found payment method from customer list:', paymentMethodId);
              }
            } catch (listError: any) {
              console.error('⚠️ Could not list payment methods:', listError.message);
            }
          }

          // Set the payment method as default for the customer (for auto-refill & future charges)
          if (paymentMethodId) {
            console.log('💳 Setting payment method as default for customer:', paymentMethodId);
            
            try {
              await stripe.customers.update(customerId, {
                invoice_settings: {
                  default_payment_method: paymentMethodId,
                },
              });
              console.log('✅ Default payment method set successfully!');
              console.log('   → Will be used for subscription billing after trial');
              console.log('   → Will be used for auto-refill');
            } catch (pmError: any) {
              console.error('⚠️ Failed to set default payment method:', pmError.message);
            }
          } else {
            console.warn('⚠️ No payment method found - this should not happen for subscription checkouts');
          }

          // Get user_id from stripe_customer_id (with fallback)
          console.log('🔍 Looking up profile for customer:', customerId);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, stripe_customer_id')
            .eq('stripe_customer_id', customerId)
            .maybeSingle();
          
          if (profileError) {
            console.log('⚠️ Profile lookup error:', profileError.message);
          }
          
          let userProfile = profile;

          // Fallback: If not found, try to get from Stripe customer metadata
          if (!userProfile) {
            console.warn('⚠️ Profile not found by customer_id, checking Stripe metadata...');
            try {
              const customer = await stripe.customers.retrieve(customerId);
              
              // Cast to any to access properties safely
              const customerData = customer as any;
              
              console.log('📋 Stripe customer data:', {
                id: customerData.id,
                email: customerData.email,
                deleted: customerData.deleted,
                metadata: customerData.metadata
              });
              
              // Check both possible metadata keys
              const userId = customerData.metadata?.supabase_user_id || customerData.metadata?.user_id;
              
              if (customerData && !customerData.deleted && userId) {
                console.log('✅ Found user ID in Stripe metadata:', userId);
                
                // Update profile with this customer ID for future lookups
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ stripe_customer_id: customerId })
                  .eq('user_id', userId);
                
                if (updateError) {
                  console.error('❌ Failed to update profile with customer ID:', updateError);
                } else {
                  console.log('✅ Profile updated with customer ID');
                }
                
                userProfile = { user_id: userId };
              } else {
                console.error('❌ Stripe customer has no supabase_user_id in metadata!');
                console.error('📋 Customer email:', customerData.email);
                
                // Try to find user by email as last resort
                if (customerData.email) {
                  console.log('🔍 Attempting to find user by email:', customerData.email);
                  const { data: authUser } = await supabase.auth.admin.listUsers();
                  const matchingUser = authUser?.users.find((u: any) => u.email === customerData.email);
                  
                  if (matchingUser) {
                    console.log('✅ Found user by email:', matchingUser.id);
                    
                    // Update both Stripe metadata and profile
                    await stripe.customers.update(customerId, {
                      metadata: { supabase_user_id: matchingUser.id }
                    });
                    
                    await supabase
                      .from('profiles')
                      .update({ stripe_customer_id: customerId })
                      .eq('user_id', matchingUser.id);
                    
                    console.log('✅ Updated Stripe metadata and profile with user mapping');
                    userProfile = { user_id: matchingUser.id };
                  }
                }
              }
            } catch (err: any) {
              console.error('❌ Error fetching Stripe customer:', err.message);
            }
          }

          if (!userProfile) {
            console.error('❌ No user found for customer:', customerId);
            console.error('❌ Tried profile lookup, Stripe metadata, and email lookup');
            // Return 200 to prevent Stripe from retrying, but log the error
            console.error('⚠️ Returning 200 to prevent retry loop');
            return NextResponse.json({ 
              received: true, 
              warning: 'User not found but acknowledged to prevent retry' 
            }, { status: 200 });
          }
          
          console.log('✅ Found user for customer:', userProfile.user_id);

          // 🔒 SECURITY: Check if this is a trial activation (card was required)
          const isTrialActivation = session.metadata?.type === 'trial_activation';
          
          if (isTrialActivation) {
            console.log('🎁 TRIAL ACTIVATION DETECTED - User added payment method!');
            console.log('🔒 Card required: YES ✅');
            
            // Grant free trial access NOW (card is on file)
            const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            
            const { error: trialError } = await supabase
              .from('profiles')
              .update({
                subscription_tier: 'free_trial',
                free_trial_started_at: new Date().toISOString(),
                free_trial_ends_at: trialEnd.toISOString(),
                cost_per_minute: 0.30,
                stripe_customer_id: customerId,
                has_active_subscription: true,
                // DON'T set onboarding_all_complete - they need to do Quick Setup!
              })
              .eq('user_id', userProfile.user_id);
            
            if (trialError) {
              console.error('❌ Error granting trial access:', trialError);
            } else {
              console.log('✅ FREE TRIAL ACTIVATED - 7 days of access granted');
              console.log('✅ Payment method on file - will charge $499 after 7 days');
            }
            
            // Continue to regular subscription processing below
            // (The subscription record still needs to be created)
          }

          // Single tier: SterlingAI Pro Access ($499/month)
          const tier = 'pro';
          const maxCalls = 999999; // Unlimited
          const hasChecker = true;
          const callerCount = 99; // Unlimited
          const costPerMinute = 0.30; // Everyone pays $0.30/min

          console.log('💎 SterlingAI Pro Access subscription');
          console.log('   - Tier: pro');
          console.log('   - Cost per minute: $0.30');
          console.log('   - Features: Unlimited');

          // Upsert subscription
          const { error: upsertError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userProfile.user_id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId,
              subscription_tier: tier,
              cost_per_minute: costPerMinute, // Set cost per minute
              max_daily_calls: maxCalls,
              has_appointment_checker: hasChecker,
              ai_caller_count: callerCount,
              status: subscription.status,
              plan_name: `Sterling AI - ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
              amount: subscription.items.data[0]?.price.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
              currency: (subscription as any).currency,
              current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              cancel_at_period_end: (subscription as any).cancel_at_period_end,
            }, {
              onConflict: 'stripe_subscription_id'
            });

          if (upsertError) {
            console.error('❌ Error upserting subscription:', upsertError);
            throw upsertError;
          }

          console.log('✅ Subscription created from checkout for user:', userProfile.user_id, `Tier: ${tier}`);
          console.log(`💰 Setting cost_per_minute to $${costPerMinute} for ${tier} tier`);

          // Check if user is upgrading from free trial BEFORE updating
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('ai_setup_status, subscription_tier, upgraded_from_trial, previous_tier, onboarding_completed')
            .eq('user_id', userProfile.user_id)
            .single();

          const wasOnFreeTrial = existingProfile?.subscription_tier === 'free_trial';

          // 🚨 CRITICAL: Update profiles table with subscription info (for middleware checks)
          const profileUpdate: any = {
            subscription_tier: tier,
            cost_per_minute: costPerMinute, // 🔥 SET COST PER MINUTE
            stripe_customer_id: customerId,
            subscription_status: subscription.status,
            has_active_subscription: true // 🔥 SIMPLE BOOLEAN FLAG
          };

          // 🎁 If upgrading from free trial, clear free trial data
          if (wasOnFreeTrial) {
            console.log('🎁 User is upgrading from FREE TRIAL - clearing trial data');
            profileUpdate.free_trial_started_at = null;
            profileUpdate.free_trial_ends_at = null;
            profileUpdate.free_trial_days_remaining = null;
            profileUpdate.upgraded_from_trial = true;
            profileUpdate.previous_tier = 'free_trial';
          }

          const { error: profileSubError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('user_id', userProfile.user_id);

          if (profileSubError) {
            console.error('❌ Error updating profile subscription info:', profileSubError);
          } else {
            console.log('✅ Profile updated with subscription tier, cost_per_minute, and customer ID');
            if (wasOnFreeTrial) {
              console.log('✅ Free trial data cleared - upgraded to paid subscription');
            }
          }

          const isUpgradeFromTrial = existingProfile?.upgraded_from_trial === true;
          const previousTier = existingProfile?.previous_tier;
          const hasCompletedOnboarding = existingProfile?.onboarding_completed === true;
          
          // 🔥 ALWAYS set to pending_setup for ANY subscription purchase/change
          const setupStatus = 'pending_setup';
          
          if (!hasCompletedOnboarding) {
            console.log('🆕 New user - setting to pending_setup (needs onboarding and AI setup)');
          } else if (isUpgradeFromTrial) {
            console.log(`🎁 Upgrade from trial to ${tier.toUpperCase()} - setting to pending_setup (AI needs reconfiguration)`);
          } else {
            console.log(`🔄 Subscription change to ${tier.toUpperCase()} - setting to pending_setup (AI needs reconfiguration)`);
          }
          
          console.log(`🔧 Setting AI setup status to: ${setupStatus}`);
          
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ 
              ai_setup_status: setupStatus,
              setup_requested_at: new Date().toISOString(),
              setup_completed_at: null
            })
            .eq('user_id', userProfile.user_id);

          if (profileUpdateError) {
            console.error('❌ Error updating setup status:', profileUpdateError);
          } else {
            console.log('✅ AI setup status updated');
          }

          // Check if this user was referred and credit the referrer
          try {
            console.log('🎁 Checking for referral...');
            const { data: profileCheck } = await supabase
              .from('profiles')
              .select('referred_by')
              .eq('user_id', userProfile.user_id)
              .single();

            if (profileCheck?.referred_by) {
              console.log(`🎯 User ${userProfile.user_id} was referred with code ${profileCheck.referred_by}`);
              
              // Call credit API to process the referral reward
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
              const creditResponse = await fetch(`${baseUrl}/api/referral/credit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refereeId: userProfile.user_id })
              });

              const creditResult = await creditResponse.json();
              
              if (creditResponse.ok) {
                console.log(`✅ Successfully credited referrer: $${creditResult.credited}`);
              } else {
                console.log(`⚠️ Referral credit response:`, creditResult);
              }

              // 💰 AFFILIATE COMMISSION: Mark as converted (first payment made!)
              console.log('💰 Marking referral as converted for affiliate commission...');
              const { error: conversionError } = await supabase.rpc('mark_referral_converted', {
                p_user_id: userProfile.user_id
              });

              if (conversionError) {
                console.error('⚠️ Error marking conversion:', conversionError);
              } else {
                console.log('✅ Referral marked as converted - commission created!');
              }
            } else {
              console.log('ℹ️ User was not referred by anyone (old system)');
            }

            // Free trial extension system removed - affiliates only now
          } catch (refError: any) {
            console.error('⚠️ Error processing referral credit:', refError.message);
            // Don't fail the whole webhook if referral fails
          }
        } catch (error) {
          console.error('❌ Error processing checkout subscription:', error);
        }
      }
    }

    // Handle subscription events
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0]?.price.id;

      console.log('📦 Processing subscription:', {
        id: subscription.id,
        customerId,
        priceId,
        status: subscription.status,
      });

      // Get user_id from stripe_customer_id (with fallback)
      console.log('🔍 Looking up profile for customer:', customerId);
      const { data: profile2, error: profileError2 } = await supabase
        .from('profiles')
        .select('user_id, stripe_customer_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (profileError2) {
        console.log('⚠️ Profile lookup error:', profileError2.message);
      }
      
      let userProfile2 = profile2;

      // Fallback: If not found, try to get from Stripe customer metadata
      if (!userProfile2) {
        console.warn('⚠️ Profile not found by customer_id, checking Stripe metadata...');
        try {
          const customer = await stripe.customers.retrieve(customerId);
          const customerData2 = customer as any;
          
          console.log('📋 Stripe customer data:', {
            id: customerData2.id,
            email: customerData2.email,
            deleted: customerData2.deleted,
            metadata: customerData2.metadata
          });
          
          if (customerData2 && !customerData2.deleted && customerData2.metadata?.supabase_user_id) {
            const userId = customerData2.metadata.supabase_user_id;
            console.log('✅ Found user ID in Stripe metadata:', userId);
            
            // Update profile with this customer ID for future lookups
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ stripe_customer_id: customerId })
              .eq('user_id', userId);
            
            if (updateError) {
              console.error('❌ Failed to update profile with customer ID:', updateError);
            } else {
              console.log('✅ Profile updated with customer ID');
            }
            
            userProfile2 = { user_id: userId };
          } else {
            console.error('❌ Stripe customer has no supabase_user_id in metadata!');
            console.error('📋 Customer email:', customerData2.email);
            
            // Try to find user by email as last resort
            if (customerData2.email) {
              console.log('🔍 Attempting to find user by email:', customerData2.email);
              const { data: authUser } = await supabase.auth.admin.listUsers();
              const matchingUser = authUser?.users.find((u: any) => u.email === customerData2.email);
              
              if (matchingUser) {
                console.log('✅ Found user by email:', matchingUser.id);
                
                // Update both Stripe metadata and profile
                await stripe.customers.update(customerId, {
                  metadata: { supabase_user_id: matchingUser.id }
                });
                
                await supabase
                  .from('profiles')
                  .update({ stripe_customer_id: customerId })
                  .eq('user_id', matchingUser.id);
                
                console.log('✅ Updated Stripe metadata and profile with user mapping');
                userProfile2 = { user_id: matchingUser.id };
              }
            }
          }
        } catch (err: any) {
          console.error('❌ Error fetching Stripe customer:', err.message);
        }
      }

      if (!userProfile2) {
        console.error('❌ No user found for customer:', customerId);
        console.error('❌ Tried profile lookup, Stripe metadata, and email lookup');
        // Return 200 to prevent Stripe from retrying, but log the error
        console.error('⚠️ Returning 200 to prevent retry loop');
        return NextResponse.json({ 
          received: true, 
          warning: 'User not found but acknowledged to prevent retry' 
        }, { status: 200 });
      }
      
      console.log('✅ Found user for customer:', userProfile2.user_id);

      // Determine tier based on price ID
      let tier: 'starter' | 'pro' | 'elite' = 'starter';
      let maxCalls = 600;
      let hasChecker = false;
      let callerCount = 1;

      if (priceId === process.env.STRIPE_PRICE_ID_STARTER) {
        tier = 'starter';
        maxCalls = 600;
        hasChecker = false;
        callerCount = 1;
      } else if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
        tier = 'pro';
        maxCalls = 1200;
        hasChecker = false;
        callerCount = 2;
      } else if (priceId === process.env.STRIPE_PRICE_ID_ELITE) {
        tier = 'elite';
        maxCalls = 1800;
        hasChecker = false;
        callerCount = 3;
      } else {
        console.warn('⚠️ Unknown price ID:', priceId, '- Defaulting to starter');
      }

      console.log('🎯 Determined tier:', { tier, maxCalls, hasChecker, callerCount });

      // Everyone pays $0.30/min - ONE SIMPLE PRICE
      const costPerMinuteForSub = 0.30;

      // Upsert subscription
      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userProfile2.user_id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          subscription_tier: tier,
          cost_per_minute: costPerMinuteForSub, // 🔥 SET COST PER MINUTE IN SUBSCRIPTIONS TABLE
          max_daily_calls: maxCalls,
          has_appointment_checker: hasChecker,
          ai_caller_count: callerCount,
          status: subscription.status,
          plan_name: `Sterling AI - ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
          amount: subscription.items.data[0]?.price.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
          currency: (subscription as any).currency,
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: (subscription as any).cancel_at_period_end,
        }, {
          onConflict: 'stripe_subscription_id'
        });

      if (upsertError) {
        console.error('❌ Error upserting subscription:', upsertError);
        throw upsertError;
      }

      console.log(`✅ Subscription ${event.type === 'customer.subscription.created' ? 'created' : 'updated'} for user:`, userProfile2.user_id, `Tier: ${tier}`);

      // Everyone pays $0.30/min - ONE SIMPLE PRICE
      const costPerMinute = 0.30;

      console.log(`💰 Setting cost_per_minute to $${costPerMinute} for ${tier} tier`);

      // 🔍 FIRST: Check current tier BEFORE updating (to detect tier changes)
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('user_id', userProfile2.user_id)
        .single();

      console.log(`📊 Current profile tier BEFORE update: ${currentProfile?.subscription_tier}`);

      // Check if this is a trial ending (trialing -> active)
      const wasOnTrial = currentProfile?.subscription_tier === 'free_trial';
      const isNowActive = subscription.status === 'active';
      
      if (wasOnTrial && isNowActive) {
        console.log('🎉 TRIAL ENDED - Auto-converting to Pro Access!');
        console.log('   Status changed: trialing → active');
        console.log('   User will be charged automatically by Stripe');
      }

      // 🚨 CRITICAL: Update profiles table with subscription info (for middleware checks)
      const profileUpdate: any = {
        subscription_tier: tier,
        cost_per_minute: costPerMinute, // 🔥 SET COST PER MINUTE ON UPGRADE
        stripe_customer_id: customerId,
        subscription_status: subscription.status,
        has_active_subscription: true // 🔥 SIMPLE BOOLEAN FLAG
      };

      // If converting from trial, clear trial data
      if (wasOnTrial && isNowActive) {
        console.log('🧹 Clearing trial data - user is now on paid subscription');
        profileUpdate.free_trial_started_at = null;
        profileUpdate.free_trial_ends_at = null;
        profileUpdate.free_trial_days_remaining = null;
        profileUpdate.upgraded_from_trial = true;
        profileUpdate.previous_tier = 'free_trial';
      }

      const { error: profileSubError2 } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', userProfile2.user_id);

      if (profileSubError2) {
        console.error('❌ Error updating profile subscription info:', profileSubError2);
      } else {
        console.log('✅ Profile updated with subscription tier, cost_per_minute, and customer ID');
      }

      const isNewSubscription = event.type === 'customer.subscription.created';
      const isTierChange = !isNewSubscription && currentProfile && currentProfile.subscription_tier !== tier;
      
      console.log(`📊 Subscription change:`, { 
        isNewSubscription, 
        isTierChange,
        oldTier: currentProfile?.subscription_tier,
        newTier: tier,
        eventType: event.type
      });

      // ALWAYS set AI to pending_setup for ANY subscription change (new, upgrade, or downgrade)
      if (isNewSubscription || isTierChange) {
        const setupStatus = 'pending_setup'; // 🔥 ALWAYS pending_setup for ANY tier change
        
        console.log(`🔧 Setting AI setup status to: ${setupStatus} (${isTierChange ? 'tier change detected' : 'new subscription'})`);
        console.log(`🔍 Updating profile for user_id: ${userProfile2.user_id}`);
        
        const { error: profileUpdateError2 } = await supabase
          .from('profiles')
          .update({ 
            ai_setup_status: setupStatus,
            setup_requested_at: new Date().toISOString(),
            setup_completed_at: null
          })
          .eq('user_id', userProfile2.user_id);

        if (profileUpdateError2) {
          console.error('❌ Error updating setup status:', profileUpdateError2);
          console.error('❌ Full error details:', JSON.stringify(profileUpdateError2, null, 2));
        } else {
          console.log(`✅ AI setup status set to ${setupStatus} - admin needs to configure N8N workflows`);
          console.log(`✅ User ${userProfile2.user_id} should now see pending_setup status`);
        }
      } else {
        console.log(`ℹ️ No tier change detected - keeping existing AI setup status`);
        console.log(`ℹ️ isNewSubscription: ${isNewSubscription}, isTierChange: ${isTierChange}`);
      }

      // Check if this user was referred and credit the referrer (for subscription.created only)
      if (event.type === 'customer.subscription.created') {
        try {
          console.log('🎁 Checking for referral...');
          const { data: profileCheck2 } = await supabase
            .from('profiles')
            .select('referred_by')
            .eq('user_id', userProfile2.user_id)
            .single();

          if (profileCheck2?.referred_by) {
            console.log(`🎯 User ${userProfile2.user_id} was referred with code ${profileCheck2.referred_by}`);
            
            // Call credit API to process the referral reward
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const creditResponse = await fetch(`${baseUrl}/api/referral/credit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refereeId: userProfile2.user_id })
            });

            const creditResult = await creditResponse.json();
            
            if (creditResponse.ok) {
              console.log(`✅ Successfully credited referrer: $${creditResult.credited}`);
            } else {
              console.log(`⚠️ Referral credit response:`, creditResult);
            }
          } else {
            console.log('ℹ️ User was not referred by anyone');
          }
        } catch (refError: any) {
          console.error('⚠️ Error processing referral credit:', refError.message);
          // Don't fail the whole webhook if referral fails
        }
      }
    }

    // Handle subscription deletion (subscription period ended after cancellation)
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      console.log('🗑️ Processing subscription deletion:', subscription.id);
      console.log('📅 Subscription period has ENDED - blocking AI features now');

      // Update subscription status
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id);

      if (deleteError) {
        console.error('❌ Error canceling subscription:', deleteError);
        throw deleteError;
      }

      console.log('✅ Subscription canceled in database:', subscription.id);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile?.user_id) {
        console.log('👤 Found user:', profile.user_id);
        
        // 🔒 BLOCK AI FEATURES - Subscription period has ended
        console.log('🔒 BLOCKING AI FEATURES:');
        console.log('   - Setting has_active_subscription = false');
        console.log('   - Setting subscription_tier = none');
        console.log('   - Clearing free trial data (if applicable)');
        console.log('   - AI Dialer page will be blocked');
        console.log('   - Auto schedule will stop working');
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            has_active_subscription: false,
            subscription_tier: 'none',
            subscription_status: 'canceled',
            // Clear trial data if they were on trial
            free_trial_started_at: null,
            free_trial_ends_at: null,
            free_trial_days_remaining: null,
          })
          .eq('user_id', profile.user_id);
        
        if (profileError) {
          console.error('❌ Error updating profile:', profileError);
        } else {
          console.log('✅ Profile updated - AI features blocked');
        }

        // 🛑 TURN OFF AUTO SCHEDULE
        console.log('🛑 Disabling auto schedule...');
        const { error: scheduleError } = await supabase
          .from('dialer_settings')
          .update({ 
            auto_schedule_enabled: false,
            // Keep the schedule config (days/time) so they can see what it was
          })
          .eq('user_id', profile.user_id);
        
        if (scheduleError) {
          console.error('❌ Error disabling auto schedule:', scheduleError);
        } else {
          console.log('✅ Auto schedule disabled');
        }

        // 🧹 CLEAR AI AGENT CONFIGURATION
        console.log('🧹 Clearing AI agent configuration (Agent ID & Phone Number)...');
        const { error: retellError } = await supabase
          .from('user_retell_config')
          .update({ 
            retell_agent_id: null,
            phone_number: null,
            is_active: false,
          })
          .eq('user_id', profile.user_id);
        
        if (retellError) {
          console.error('❌ Error clearing agent config:', retellError);
        } else {
          console.log('✅ Agent configuration cleared (prevents accidental AI usage)');
        }

        // Mark referral as cancelled (stops future commissions, but keeps earned ones!)
        console.log('🎯 Marking referral as cancelled for user:', profile.user_id);
        
        const { error: refCancelError } = await supabase
          .from('referrals')
          .update({ 
            conversion_status: 'cancelled' 
          })
          .eq('referee_id', profile.user_id)
          .eq('conversion_status', 'converted'); // Only cancel active converted referrals

        if (refCancelError) {
          console.error('⚠️ Error cancelling referral:', refCancelError);
        } else {
          console.log('✅ Referral marked as cancelled - no more monthly commissions!');
          console.log('💰 Already earned commissions are kept - affiliate earned them!');
        }

        console.log('🎯 SUBSCRIPTION CANCELLATION COMPLETE');
        console.log('   ✅ User can still access dashboard, settings, leads, etc.');
        console.log('   🔒 AI Dialer page is now blocked');
        console.log('   🔒 Auto Schedule is now blocked');
        console.log('   🧹 Agent configuration cleared (no accidental usage)');
      }
    }

    // Handle payment succeeded - AUTO-CREATE MONTHLY COMMISSIONS & TRACK REVENUE
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const amountPaid = (invoice.amount_paid || 0) / 100; // Convert from cents
      
      console.log('💰 Payment succeeded for invoice:', invoice.id);
      console.log('💰 Amount paid:', amountPaid);

      // Find the user
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile?.user_id) {
        // 📊 AUTO-TRACK SUBSCRIPTION REVENUE (only if amount > 0, skip $0 trial invoices)
        if (amountPaid > 0) {
          console.log('📊 Auto-tracking subscription revenue...');
          const { error: subRevenueError } = await supabase
            .from('custom_revenue_expenses')
            .insert({
              type: 'revenue',
              category: 'Subscription',
              amount: amountPaid, // Usually $499
              description: `Auto-tracked: Subscription payment`,
              date: new Date().toISOString().split('T')[0],
            });

          if (subRevenueError) {
            console.error('⚠️ Error tracking subscription revenue:', subRevenueError);
          } else {
            console.log(`✅ Revenue auto-tracked: $${amountPaid} Subscription`);
          }
        } else {
          console.log('ℹ️ Skipping revenue tracking for $0 invoice (trial)');
        }

        // Check if this user was referred
        const { data: referral } = await supabase
          .from('referrals')
          .select('*')
          .eq('referee_id', profile.user_id)
          .eq('conversion_status', 'converted')
          .maybeSingle();

        if (referral) {
          const currentMonth = new Date().toISOString().substring(0, 7); // '2025-11'
          
          console.log('🎁 User was referred - creating commission for:', currentMonth);
          
          // Create commission for this month (if doesn't exist)
          const { error: commissionError } = await supabase
            .from('commission_payouts')
            .insert({
              referrer_id: referral.referrer_id,
              referee_id: profile.user_id,
              month: currentMonth,
              amount: 99.80,
              status: 'pending',
            })
            .select()
            .maybeSingle();

          if (commissionError) {
            // If duplicate, that's fine - commission already exists for this month
            if (commissionError.code === '23505') {
              console.log('ℹ️ Commission already exists for this month');
            } else {
              console.error('⚠️ Error creating commission:', commissionError);
            }
          } else {
            console.log('✅ Commission created: $99.80 pending for affiliate');
          }
        } else {
          console.log('ℹ️ User was not referred or not converted');
        }

        // 🎯 SALES TEAM COMMISSION - Check if user was referred by sales person
        const { data: salesReferral } = await supabase
          .from('sales_referrals')
          .select('*, sales_team(*)')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        if (salesReferral && salesReferral.sales_team) {
          const salesPerson = salesReferral.sales_team;
          const currentMonth = new Date().toISOString().substring(0, 7); // '2025-01'
          const commissionRate = salesPerson.commission_rate || 0.35;
          const commissionAmount = amountPaid * commissionRate;

          console.log('🎯 SALES TEAM REFERRAL FOUND!');
          console.log(`   Sales Person: ${salesPerson.full_name}`);
          console.log(`   Referral Commission Type: ${salesReferral.commission_type || 'recurring'} (per-user setting)`);
          console.log(`   Amount Paid: $${amountPaid}`);
          console.log(`   Commission Rate: ${commissionRate * 100}%`);
          console.log(`   Commission Amount: $${commissionAmount.toFixed(2)}`);

          // Update referral status to converted if first payment
          if (salesReferral.status === 'trial' && amountPaid > 0) {
            console.log('🎉 Marking referral as CONVERTED!');
            await supabase
              .from('sales_referrals')
              .update({
                status: 'converted',
                subscription_amount: amountPaid,
                converted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', salesReferral.id);
          }

          // Only create commission if amount > 0
          if (amountPaid > 0) {
            // Check if this is one-time or recurring based on the REFERRAL's commission_type (set per user in admin)
            const isOneTime = salesReferral.commission_type === 'one_time';

            // For one-time: only pay once (check if already paid)
            if (isOneTime) {
              const { data: existingCommission } = await supabase
                .from('sales_commissions')
                .select('id')
                .eq('referral_id', salesReferral.id)
                .eq('commission_type', 'one_time')
                .maybeSingle();

              if (existingCommission) {
                console.log('ℹ️ One-time commission already paid for this referral - sales person will NOT receive commission for this payment (2nd+ payment)');
              } else {
                // Create one-time commission
                const { error: commError } = await supabase
                  .from('sales_commissions')
                  .insert({
                    sales_person_id: salesPerson.id,
                    referral_id: salesReferral.id,
                    user_id: profile.user_id,
                    user_email: salesReferral.user_email,
                    amount: commissionAmount,
                    commission_type: 'one_time',
                    status: 'pending',
                    month_year: currentMonth,
                    description: `One-time commission for ${salesReferral.user_name || salesReferral.user_email}`,
                  });

                if (commError) {
                  console.error('⚠️ Error creating sales commission:', commError);
                } else {
                  console.log(`✅ Sales commission created: $${commissionAmount.toFixed(2)} (one-time)`);
                }
              }
            } else {
              // Recurring commission - create for each month
              const { data: existingMonthly } = await supabase
                .from('sales_commissions')
                .select('id')
                .eq('referral_id', salesReferral.id)
                .eq('month_year', currentMonth)
                .maybeSingle();

              if (existingMonthly) {
                console.log(`ℹ️ Commission already exists for ${currentMonth}`);
              } else {
                const { error: commError } = await supabase
                  .from('sales_commissions')
                  .insert({
                    sales_person_id: salesPerson.id,
                    referral_id: salesReferral.id,
                    user_id: profile.user_id,
                    user_email: salesReferral.user_email,
                    amount: commissionAmount,
                    commission_type: 'recurring',
                    status: 'pending',
                    month_year: currentMonth,
                    description: `Monthly commission for ${salesReferral.user_name || salesReferral.user_email} (${currentMonth})`,
                  });

                if (commError) {
                  console.error('⚠️ Error creating sales commission:', commError);
                } else {
                  console.log(`✅ Sales commission created: $${commissionAmount.toFixed(2)} (recurring for ${currentMonth})`);
                }
              }
            }

            // Update sales person stats
            const { data: allCommissions } = await supabase
              .from('sales_commissions')
              .select('amount, status')
              .eq('sales_person_id', salesPerson.id);

            const totalEarnings = (allCommissions || []).reduce((sum, c) => sum + (c.amount || 0), 0);
            const totalPaid = (allCommissions || []).filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0);
            const pendingPayout = (allCommissions || []).filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0);

            const { data: allReferrals } = await supabase
              .from('sales_referrals')
              .select('id, status')
              .eq('sales_person_id', salesPerson.id);

            const totalReferred = (allReferrals || []).length;
            const totalConversions = (allReferrals || []).filter(r => r.status === 'converted').length;

            await supabase
              .from('sales_team')
              .update({
                total_earnings: totalEarnings,
                total_paid: totalPaid,
                pending_payout: pendingPayout,
                total_users_referred: totalReferred,
                total_conversions: totalConversions,
                updated_at: new Date().toISOString(),
              })
              .eq('id', salesPerson.id);

            console.log(`✅ Updated sales person stats: ${salesPerson.full_name}`);
          }
        } else {
          console.log('ℹ️ User was not referred by sales team');
        }
      }
    }

    // Handle payment failed
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('❌ Payment failed for invoice:', invoice.id);
      
      // You might want to send an email notification here
    }

    // Handle balance refill (one-time payment completed)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Check if this is a balance refill (not a subscription)
      if (session.mode === 'payment' && session.metadata?.type === 'balance_refill') {
        const userId = session.metadata.user_id;
        const amount = 25; // Always $25
        const isFirstRefill = session.metadata.is_first_refill === 'true';
        
        console.log('💰💰💰 BALANCE REFILL PAYMENT COMPLETED 💰💰💰');
        console.log('💰 User ID:', userId);
        console.log('💰 Amount: $25 (fixed)');
        console.log('💰 Is first refill:', isFirstRefill);
        console.log('💰 Session ID:', session.id);

        try {
          // Get current balance
          const { data: currentBalance } = await supabase
            .from('call_balance')
            .select('balance')
            .eq('user_id', userId)
            .single();

          const balanceBefore = currentBalance?.balance || 0;
          const balanceAfter = balanceBefore + amount;

          console.log(`💰 Balance: $${balanceBefore.toFixed(2)} → $${balanceAfter.toFixed(2)}`);

          // Update balance (and enable auto-refill if first refill)
          const updateData: any = {
            user_id: userId,
            balance: balanceAfter,
            last_refill_at: new Date().toISOString(),
          };

          // If this is the first refill, enable auto-refill
          if (isFirstRefill) {
            updateData.auto_refill_enabled = true;
            updateData.auto_refill_amount = 25; // Fixed $25
            console.log('💳 Enabling auto-refill with fixed $25 amount');
          }

          const { error: updateError } = await supabase
            .from('call_balance')
            .upsert(updateData, {
              onConflict: 'user_id'
            });

          if (updateError) {
            console.error('❌ Error updating balance:', updateError);
          } else {
            console.log('✅ Balance updated successfully:', balanceAfter);
            if (isFirstRefill) {
              console.log('✅ Auto-refill enabled with amount:', updateData.auto_refill_amount);
            }
          }

          // 🎁 If this is first refill, check if this completes a referral sign-up
          if (isFirstRefill) {
            console.log('🎁 First refill detected - checking for referral completion');
            console.log('🔍 Looking for pending referral for user:', userId);
            
            try {
              // Check if user was referred (simple query without foreign key hint)
              const { data: referral, error: referralQueryError } = await supabase
                .from('referrals')
                .select('*')
                .eq('referee_id', userId)
                .eq('status', 'pending')
                .maybeSingle();

              if (referralQueryError) {
                console.error('❌ Error querying referrals:', referralQueryError);
              }

              console.log('📊 Referral query result:', referral ? 'FOUND' : 'NOT FOUND');

              if (referral) {
                console.log('🎉 Valid referral found!');
                console.log('  - Referral ID:', referral.id);
                console.log('  - Referrer ID:', referral.referrer_id);
                console.log('  - Referee ID:', referral.referee_id);
                console.log('  - Status:', referral.status);
                console.log('  - Type:', referral.referral_type);

                // Get user's email verification status
                console.log('📧 Checking email verification for user:', userId);
                const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
                
                if (authError) {
                  console.error('❌ Error getting auth user:', authError);
                }

                console.log('📧 Email confirmed at:', authUser?.user?.email_confirmed_at || 'NOT CONFIRMED');
                
                if (!authUser?.user?.email_confirmed_at) {
                  console.log('⚠️ Email not verified yet - skipping referral completion');
                } else {
                  console.log('✅ Email verified! Proceeding with referral completion...');
                  
                  // Mark referral as completed
                  const { error: refUpdateError } = await supabase
                    .from('referrals')
                    .update({
                      status: 'completed',
                      completed_at: new Date().toISOString()
                    })
                    .eq('id', referral.id);

                  if (refUpdateError) {
                    console.error('❌ Error updating referral:', refUpdateError);
                  } else {
                    console.log('✅ Referral marked as completed');

                    // Get referrer's profile separately
                    console.log('👤 Fetching referrer profile...');
                    const { data: referrerProfile, error: profileFetchError } = await supabase
                      .from('profiles')
                      .select('subscription_tier, free_trial_ends_at, free_trial_total_days')
                      .eq('user_id', referral.referrer_id)
                      .single();

                    if (profileFetchError) {
                      console.error('❌ Error fetching referrer profile:', profileFetchError);
                    }

                    console.log('👤 Referrer profile:', {
                      tier: referrerProfile?.subscription_tier,
                      trial_ends: referrerProfile?.free_trial_ends_at,
                      total_days: referrerProfile?.free_trial_total_days
                    });

                    // Trial extension system removed - no longer adding days to trials
                    console.log('ℹ️ Trial extension system disabled');
                  }
                }
              } else {
                console.log('ℹ️ No pending referral found for this user');
              }
            } catch (refError: any) {
              console.error('❌ Error processing referral completion:', refError);
              // Don't fail the whole webhook if referral processing fails
            }
          }

          // Record transaction
          console.log('💾 [WEBHOOK] Logging transaction...');
          const { data: insertData, error: insertError } = await supabase
            .from('balance_transactions')
            .insert({
              user_id: userId,
              amount: amount,
              type: isFirstRefill ? 'first_refill' : 'credit',
              description: isFirstRefill ? `First refill: $${amount}` : `Refill: $${amount}`,
              stripe_payment_intent_id: session.payment_intent as string,
              balance_after: balanceAfter,
            })
            .select();

          if (insertError) {
            console.error('❌ [WEBHOOK] Transaction insert failed:', insertError);
          } else {
            console.log('✅ [WEBHOOK] Transaction logged:', insertData);
          }

          console.log('✅ Balance refill completed for user:', userId);

          // NOTE: Removed duplicate auto-tracking to custom_revenue_expenses
          // Balance refills are already tracked in balance_transactions table
          // Adding to custom_revenue_expenses was causing double-counting in admin dashboard

          // Mark onboarding step 2 complete (they added balance!)
          await supabase
            .from('profiles')
            .update({ onboarding_step_2_balance: true })
            .eq('user_id', userId);

          console.log('✅ Onboarding Step 2 (Balance) marked complete - user added funds');

          // Check if all onboarding steps are now complete
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_step_1_form, onboarding_step_2_balance, onboarding_step_3_sheet, onboarding_step_4_schedule')
            .eq('user_id', userId)
            .single();

          const allComplete = profile?.onboarding_step_1_form &&
                              profile?.onboarding_step_2_balance &&
                              profile?.onboarding_step_3_sheet &&
                              profile?.onboarding_step_4_schedule;

          if (allComplete) {
            console.log('🎉 All onboarding steps complete! Hiding Quick Setup forever.');
            
            await supabase
              .from('profiles')
              .update({
                onboarding_all_complete: true,
                onboarding_completed_at: new Date().toISOString(),
              })
              .eq('user_id', userId);
          }
        } catch (error) {
          console.error('❌ Error processing balance refill:', error);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

