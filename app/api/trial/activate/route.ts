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

    console.log('💳 Creating Pay As You Go activation checkout for user:', user.id);

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

    // Pay As You Go price ID ($0/month subscription to save card on file)
    const priceId = process.env.STRIPE_PAY_AS_YOU_GO_PRICE_ID || 'price_1SordgRB7fq2FJAg5dNUjttu';

    // Create Stripe Checkout Session in SUBSCRIPTION mode ($0/month - just saves card)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription', // SUBSCRIPTION mode - $0/month, saves card for pay-per-minute
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // $0/month Pay As You Go
          quantity: 1,
        },
      ],
      subscription_data: {
        // NO trial - Pay As You Go starts immediately!
        metadata: {
          user_id: user.id,
        },
      },
      success_url: `${request.headers.get('origin')}/welcome`,
      cancel_url: `${request.headers.get('origin')}/trial-activate?canceled=true`,
      metadata: {
        user_id: user.id,
        type: 'pay_as_you_go_activation',
      },
    });

    // 🔒 SECURITY: Access granted via webhook after card is saved
    // User pays $0.65 per minute used - no monthly fee!

    console.log('✅ Pay As You Go activation checkout session created');
    console.log('🎯 User saves card, then pays $0.65/min for calls');
    console.log('🔒 Webhook will activate account after checkout.session.completed event');

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating activation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

