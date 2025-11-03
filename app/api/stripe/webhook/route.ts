import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
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
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer as string;
          const priceId = subscription.items.data[0]?.price.id;

          console.log('📦 Processing subscription from checkout:', {
            id: subscription.id,
            customerId,
            priceId,
            status: subscription.status,
          });

          // Set the payment method as default for the customer (for auto-refill)
          if (subscription.default_payment_method) {
            const paymentMethodId = typeof subscription.default_payment_method === 'string'
              ? subscription.default_payment_method
              : subscription.default_payment_method.id;

            console.log('💳 Setting default payment method for customer:', paymentMethodId);
            
            try {
              await stripe.customers.update(customerId, {
                invoice_settings: {
                  default_payment_method: paymentMethodId,
                },
              });
              console.log('✅ Default payment method set for auto-refill');
            } catch (pmError: any) {
              console.error('⚠️ Failed to set default payment method:', pmError.message);
            }
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
              
              if (customerData && !customerData.deleted && customerData.metadata?.supabase_user_id) {
                const userId = customerData.metadata.supabase_user_id;
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

          // Determine cost_per_minute based on tier
          let costPerMinute = 0.30; // Default (Starter)
          if (tier === 'pro') {
            costPerMinute = 0.25;
          } else if (tier === 'elite') {
            costPerMinute = 0.20;
          }

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

          // 🚨 CRITICAL: Update profiles table with subscription info (for middleware checks)
          const { error: profileSubError } = await supabase
            .from('profiles')
            .update({
              subscription_tier: tier,
              cost_per_minute: costPerMinute, // 🔥 SET COST PER MINUTE
              stripe_customer_id: customerId,
              subscription_status: subscription.status,
              has_active_subscription: true // 🔥 SIMPLE BOOLEAN FLAG
            })
            .eq('user_id', userProfile.user_id);

          if (profileSubError) {
            console.error('❌ Error updating profile subscription info:', profileSubError);
          } else {
            console.log('✅ Profile updated with subscription tier, cost_per_minute, and customer ID');
          }

          // Check if user is upgrading from free trial
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('ai_setup_status, upgraded_from_trial, previous_tier, onboarding_completed')
            .eq('user_id', userProfile.user_id)
            .single();

          const isUpgradeFromTrial = existingProfile?.upgraded_from_trial === true;
          const previousTier = existingProfile?.previous_tier;
          const hasCompletedOnboarding = existingProfile?.onboarding_completed === true;
          
          // Determine if we need maintenance mode
          let setupStatus = 'ready';
          
          if (!hasCompletedOnboarding) {
            // Brand new user - needs onboarding and setup
            setupStatus = 'pending_setup';
            console.log('🆕 New user - setting to pending_setup (needs onboarding)');
          } else if (isUpgradeFromTrial) {
            // Upgrading from free trial
            if (tier === 'starter') {
              // Free trial → Starter: Same 1 AI, no maintenance needed
              setupStatus = 'ready';
              console.log('🎁 Upgrade from trial to Starter - AI stays ready (same 1 AI)');
            } else if (tier === 'pro' || tier === 'elite') {
              // Free trial → Pro/Elite: Need to activate 2nd/3rd AI
              setupStatus = 'maintenance';
              console.log(`🎁 Upgrade from trial to ${tier.toUpperCase()} - setting to maintenance (need to enable extra AIs)`);
            }
          } else {
            // Existing paid user upgrading/downgrading
            if (tier === 'pro' || tier === 'elite') {
              setupStatus = 'maintenance';
              console.log(`🔄 Upgrade to ${tier.toUpperCase()} - setting to maintenance (need to enable extra AIs)`);
            } else {
              setupStatus = 'ready';
              console.log('✅ Downgrade or same tier - AI stays ready');
            }
          }
          
          console.log(`🔧 Setting AI setup status to: ${setupStatus}`);
          
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ 
              ai_setup_status: setupStatus,
              ...(setupStatus === 'pending_setup' || setupStatus === 'maintenance' ? {
                setup_requested_at: new Date().toISOString(),
                setup_completed_at: null
              } : {})
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
            } else {
              console.log('ℹ️ User was not referred by anyone');
            }
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

      // Determine cost per minute based on tier
      let costPerMinuteForSub = 0.30; // default
      if (tier === 'starter') costPerMinuteForSub = 0.30;
      else if (tier === 'pro') costPerMinuteForSub = 0.25;
      else if (tier === 'elite') costPerMinuteForSub = 0.20;

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

      // Determine cost per minute based on tier
      let costPerMinute = 0.30; // default
      if (tier === 'starter') costPerMinute = 0.30;
      else if (tier === 'pro') costPerMinute = 0.25;
      else if (tier === 'elite') costPerMinute = 0.20;

      console.log(`💰 Setting cost_per_minute to $${costPerMinute} for ${tier} tier`);

      // 🚨 CRITICAL: Update profiles table with subscription info (for middleware checks)
      const { error: profileSubError2 } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          cost_per_minute: costPerMinute, // 🔥 SET COST PER MINUTE ON UPGRADE
          stripe_customer_id: customerId,
          subscription_status: subscription.status,
          has_active_subscription: true // 🔥 SIMPLE BOOLEAN FLAG
        })
        .eq('user_id', userProfile2.user_id);

      if (profileSubError2) {
        console.error('❌ Error updating profile subscription info:', profileSubError2);
      } else {
        console.log('✅ Profile updated with subscription tier, cost_per_minute, and customer ID');
      }

      // Check if this is an upgrade (tier change) or new subscription
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('subscription_tier')
        .eq('user_id', userProfile2.user_id)
        .eq('status', 'active')
        .single();

      const isNewSubscription = event.type === 'customer.subscription.created';
      const isUpgrade = !isNewSubscription && existingSubscription && existingSubscription.subscription_tier !== tier;
      const isDowngrade = !isNewSubscription && existingSubscription && 
        ((existingSubscription.subscription_tier === 'elite' && (tier === 'pro' || tier === 'starter')) ||
         (existingSubscription.subscription_tier === 'pro' && tier === 'starter'));

      console.log(`📊 Subscription change type:`, { isNewSubscription, isUpgrade, isDowngrade });

      // Set AI setup status: new subscriptions and upgrades need setup, downgrades don't
      if (isNewSubscription || isUpgrade) {
        const setupStatus = isUpgrade ? 'maintenance' : 'pending_setup';
        
        console.log(`🔧 Setting AI setup status to: ${setupStatus}`);
        
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
        } else {
          console.log(`✅ AI setup status set to ${setupStatus} - admin needs to configure N8N workflows`);
        }
      } else if (isDowngrade) {
        console.log('⬇️ Downgrade detected - user can continue using AI until manually downgraded');
        // Don't change setup status - let them keep using it
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

    // Handle subscription deletion
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      console.log('🗑️ Processing subscription deletion:', subscription.id);

      const { error: deleteError } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id);

      if (deleteError) {
        console.error('❌ Error canceling subscription:', deleteError);
        throw deleteError;
      }

      console.log('✅ Subscription canceled:', subscription.id);
    }

    // Handle payment succeeded
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('💰 Payment succeeded for invoice:', invoice.id);
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
        const amount = parseFloat(session.metadata.amount);
        
        console.log('💰 Balance refill payment completed:', { userId, amount });

        try {
          // Get current balance
          const { data: currentBalance } = await supabase
            .from('call_balance')
            .select('balance')
            .eq('user_id', userId)
            .single();

          const balanceBefore = currentBalance?.balance || 0;
          const balanceAfter = balanceBefore + amount;

          // Update balance
          const { error: updateError } = await supabase
            .from('call_balance')
            .upsert({
              user_id: userId,
              balance: balanceAfter,
              last_refill_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (updateError) {
            console.error('❌ Error updating balance:', updateError);
          } else {
            console.log('✅ Balance updated successfully:', balanceAfter);
          }

          // Record transaction
          await supabase
            .from('balance_transactions')
            .insert({
              user_id: userId,
              amount: amount,
              type: 'credit',
              description: `Balance refill: $${amount}`,
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              stripe_payment_intent_id: session.payment_intent as string,
              metadata: {
                session_id: session.id,
                amount_cents: session.amount_total,
              },
            });

          console.log('✅ Balance refill completed for user:', userId);
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

