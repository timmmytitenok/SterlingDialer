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

    let paymentMethodId = customer.invoice_settings?.default_payment_method;

    // If no default payment method, try to list attached payment methods
    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      console.log('No default payment method, listing all attached cards...');
      
      const paymentMethods = await stripe.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: 'card',
      });

      if (paymentMethods.data.length > 0) {
        // Use the first card found
        const firstCard = paymentMethods.data[0];
        console.log(`Found ${paymentMethods.data.length} card(s), using: ${firstCard.card?.brand} ending in ${firstCard.card?.last4}`);
        
        return NextResponse.json({
          paymentMethod: {
            brand: firstCard.card?.brand,
            last4: firstCard.card?.last4,
            exp_month: firstCard.card?.exp_month,
            exp_year: firstCard.card?.exp_year,
          },
        });
      }
      
      console.log('No payment methods found for customer');
      return NextResponse.json({ paymentMethod: null });
    }

    // Retrieve default payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId as string);

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

