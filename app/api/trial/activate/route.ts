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
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Create Stripe Checkout Session in SETUP mode (saves card, no charge)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'setup', // CRITICAL: Setup mode, not payment mode!
      payment_method_types: ['card'],
      success_url: `${request.headers.get('origin')}/onboarding?trial_activated=true`,
      cancel_url: `${request.headers.get('origin')}/trial-activate?canceled=true`,
      metadata: {
        user_id: user.id,
        type: 'trial_activation',
      },
    });

    // Start the free trial
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free_trial',
        free_trial_started_at: new Date().toISOString(),
        free_trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cost_per_minute: 0.30,
      })
      .eq('user_id', user.id);

    console.log('✅ Trial activation session created');

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating trial activation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

