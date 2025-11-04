import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('📋 Creating billing portal session...');
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('❌ No user authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 User:', user.id);

    // Get customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    console.log('📊 Profile lookup:', { profile, error: profileError });

    if (!profile?.stripe_customer_id) {
      console.error('❌ No customer ID found in profile');
      return NextResponse.json({ error: 'No Stripe customer found. Please contact support.' }, { status: 404 });
    }

    console.log('✅ Customer ID:', profile.stripe_customer_id);

    // Create portal session
    console.log('🔧 Creating Stripe portal session...');
    
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${request.headers.get('origin')}/dashboard/settings/billing`,
      });

      console.log('✅ Portal session created:', portalSession.url);
      return NextResponse.json({ url: portalSession.url });
    } catch (stripeError: any) {
      console.error('❌ Stripe portal error:', stripeError);
      
      // Check if it's an inactive price error
      if (stripeError.message && stripeError.message.includes('not available to be purchased because its product is not active')) {
        console.error('🔧 Inactive price detected - cleaning up subscription...');
        
        // Get the subscription from database
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (subscription) {
          console.log('🗑️ Canceling subscription with inactive price:', subscription.stripe_price_id);
          
          // Mark as canceled in database
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'canceled',
              canceled_at: new Date().toISOString()
            })
            .eq('id', subscription.id);
          
          console.log('✅ Subscription canceled');
        }
        
        return NextResponse.json({ 
          error: 'Your subscription has an outdated pricing plan. Please contact support or subscribe to a new plan.',
          needsResubscribe: true
        }, { status: 400 });
      }
      
      throw stripeError;
    }
  } catch (error: any) {
    console.error('❌ Error creating portal session:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
    });
    return NextResponse.json({ error: error.message || 'Failed to create billing portal' }, { status: 500 });
  }
}

