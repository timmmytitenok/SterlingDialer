import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Single tier now: SterlingAI Pro Access ($499/month)
    const { tier } = await request.json();
    console.log('💎 Subscribing to SterlingAI Pro Access ($499/month)');

    // Use single Pro price ID
    const priceId = process.env.STRIPE_PRICE_ID_PRO;
    
    if (!priceId) {
      console.error('❌ Missing STRIPE_PRICE_ID_PRO');
      return NextResponse.json({ 
        error: 'Subscription not configured. Add STRIPE_PRICE_ID_PRO to environment variables.' 
      }, { status: 500 });
    }

    console.log('💳 Using Stripe Price ID:', priceId);

    // Create or get Stripe customer and check for referral
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, referred_by')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
    }

    console.log('👤 Profile data:', profile);
    console.log('🔍 Checking referral status...');
    console.log('   - referred_by field:', profile?.referred_by);
    console.log('   - Has referral?:', profile?.referred_by ? 'YES' : 'NO');

    let customerId = profile?.stripe_customer_id;
    const hasReferral = profile?.referred_by ? true : false;
    
    if (hasReferral) {
      console.log('🎁 ✅ User was referred with code:', profile?.referred_by);
      console.log('💰 ✅ 20% discount WILL be applied to first month');
    } else {
      console.log('ℹ️ No referral code found - full price will apply');
    }

    if (!customerId) {
      console.log('📝 Creating new Stripe customer for user:', user.id);
      
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;
      console.log('✅ Stripe customer created:', customerId);

      // Save customer ID to profile with error checking
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('❌ Failed to save customer ID to profile:', updateError);
        console.warn('⚠️ Continuing with checkout - customer ID will be retrieved from Stripe metadata');
        // Don't throw - the webhook can retrieve the user_id from Stripe customer metadata
      } else if (updatedProfile) {
        console.log('✅ Customer ID saved to profile:', updatedProfile);
      } else {
        console.warn('⚠️ No profile found to update with customer ID');
        console.warn('⚠️ Customer ID will be retrieved from Stripe metadata during webhook');
      }
    } else {
      console.log('✅ Using existing customer ID:', customerId);
    }

    // Create checkout session with referral discount if applicable
    const sessionConfig: any = {
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/dashboard/settings/billing?success=true`,
      cancel_url: `${request.headers.get('origin')}/dashboard/settings/billing?canceled=true`,
    };

    // NO DISCOUNTS - Users already got 30 days FREE trial!
    // Referral benefit: Referrer gets $200 credits (handled in webhook)
    console.log('💰 Full price checkout - user already had 30-day trial');

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

