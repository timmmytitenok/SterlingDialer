import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('💳 Creating trial activation checkout for user:', user.id);

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
          supabase_user_id: user.id // Match webhook lookup
        },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
      
      console.log('✅ Created Stripe customer with user_id metadata:', user.id);
    } else {
      console.log('✅ Using existing Stripe customer:', customerId);
    }

    // Get the Pro Access price ID from environment
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      throw new Error('STRIPE_PRO_PRICE_ID not configured');
    }

    // Create Stripe Checkout Session in SUBSCRIPTION mode with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription', // SUBSCRIPTION mode - will auto-charge after trial!
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // $499/month Pro Access
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          user_id: user.id,
        },
      },
      success_url: `${request.headers.get('origin')}/welcome`,
      cancel_url: `${request.headers.get('origin')}/trial-activate?canceled=true`,
      metadata: {
        user_id: user.id,
        type: 'trial_activation',
      },
    });

    // 🔒 SECURITY: DO NOT grant trial access here!
    // Trial access will be granted by the webhook AFTER user adds payment method
    // This prevents users from getting free trial without a card on file

    console.log('✅ Trial activation checkout session created');
    console.log('🎯 User must complete checkout with card before trial access is granted');
    console.log('🔒 Webhook will activate trial after checkout.session.completed event');

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating trial activation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

