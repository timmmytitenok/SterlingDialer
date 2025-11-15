import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ paymentMethod: null });
    }

    // Get customer's default payment method from Stripe
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
    
    if (customer.deleted) {
      return NextResponse.json({ paymentMethod: null });
    }

    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    if (!defaultPaymentMethodId || typeof defaultPaymentMethodId !== 'string') {
      return NextResponse.json({ paymentMethod: null });
    }

    // Retrieve payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);

    return NextResponse.json({
      paymentMethod: {
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json({ paymentMethod: null });
  }
}

