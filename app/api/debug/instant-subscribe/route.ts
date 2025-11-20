import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { NextResponse } from 'next/server';

/**
 * DEBUG ONLY: Create instant subscription (no trial)
 * For testing auto-charge, affiliate commissions, etc.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('🧪 DEBUG: Creating instant subscription for user:', user.id);

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { 
          user_id: user.id,
          supabase_user_id: user.id
        },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
      
      console.log('✅ Created Stripe customer:', customerId);
    }

    // Get the Pro Access price ID from environment
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      throw new Error('STRIPE_PRO_PRICE_ID not configured');
    }

    // Create Stripe Checkout Session in SUBSCRIPTION mode
    // Set trial to end 'now' = immediate charge!
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // $499/month Pro Access
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_end: 'now', // 🔥 Trial ends immediately = instant charge!
        metadata: {
          user_id: user.id,
          debug_instant: 'true',
        },
      },
      success_url: `${request.headers.get('origin')}/dashboard/settings/debug?instant_success=true`,
      cancel_url: `${request.headers.get('origin')}/dashboard/settings/debug?canceled=true`,
      metadata: {
        user_id: user.id,
        type: 'debug_instant_subscribe',
      },
    });

    console.log('✅ DEBUG: Instant subscription session created (NO TRIAL)');
    console.log('   Customer will be charged $499 immediately');

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating instant subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

