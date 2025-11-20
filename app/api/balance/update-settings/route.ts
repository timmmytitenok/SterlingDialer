import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover' as any,
});

export async function POST(req: Request) {
  try {
    const { auto_refill_enabled, auto_refill_amount } = await req.json();

    if (auto_refill_amount && ![25, 50, 100, 200].includes(auto_refill_amount)) {
      return NextResponse.json({ error: 'Invalid refill amount. Must be 25, 50, 100, or 200' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has a payment method on file
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let hasPaymentMethod = false;
    
    if (profile?.stripe_customer_id) {
      try {
        // Check if customer has a default payment method
        const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
        
        if ('deleted' in customer && customer.deleted) {
          hasPaymentMethod = false;
        } else {
          const defaultPM = customer.invoice_settings?.default_payment_method;
          hasPaymentMethod = !!defaultPM;
          
          // If no default, check if they have any payment methods
          if (!hasPaymentMethod) {
            const paymentMethods = await stripe.paymentMethods.list({
              customer: profile.stripe_customer_id,
              type: 'card',
            });
            hasPaymentMethod = paymentMethods.data.length > 0;
          }
        }
      } catch (error: any) {
        console.error('Error checking payment method:', error);
        hasPaymentMethod = false;
      }
    }

    // If no payment method, return error indicating they need to set one up
    if (!hasPaymentMethod) {
      return NextResponse.json({ 
        success: false,
        needsPaymentMethod: true,
        error: 'No payment method on file. Please add a card first.' 
      }, { status: 400 });
    }

    // Update settings
    const { data, error } = await supabase
      .from('call_balance')
      .update({
        auto_refill_enabled,
        auto_refill_amount,
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

