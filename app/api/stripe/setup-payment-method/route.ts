import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover' as any,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to check for Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile.full_name || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Create Stripe Checkout Session in "setup" mode (for adding payment method)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'setup',
      payment_method_types: ['card'],
      success_url: `${baseUrl}/dashboard/settings/billing?setup=success`,
      cancel_url: `${baseUrl}/dashboard/settings/billing?setup=cancelled`,
      metadata: {
        user_id: user.id,
        setup_type: 'auto_refill',
      },
    });

    return NextResponse.json({ 
      success: true, 
      url: session.url,
      sessionId: session.id 
    });
  } catch (error: any) {
    console.error('Setup payment method error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create setup session' 
    }, { status: 500 });
  }
}

