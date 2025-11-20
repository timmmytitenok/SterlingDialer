import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover' as any,
});

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 });
    }

    // Get upcoming invoice
    const upcomingInvoice = await (stripe.invoices as any).retrieveUpcoming({
      customer: profile.stripe_customer_id,
    });

    // Format the response
    const prorationItems = upcomingInvoice.lines.data.filter(
      (item: any) => item.proration
    );

    const response = {
      total: upcomingInvoice.total / 100, // Convert cents to dollars
      subtotal: upcomingInvoice.subtotal / 100,
      amountDue: upcomingInvoice.amount_due / 100,
      currency: upcomingInvoice.currency.toUpperCase(),
      periodStart: new Date(upcomingInvoice.period_start * 1000).toLocaleDateString(),
      periodEnd: new Date(upcomingInvoice.period_end * 1000).toLocaleDateString(),
      lines: upcomingInvoice.lines.data.map((line: any) => ({
        description: line.description,
        amount: line.amount / 100,
        proration: line.proration,
        period: {
          start: new Date(line.period.start * 1000).toLocaleDateString(),
          end: new Date(line.period.end * 1000).toLocaleDateString(),
        }
      })),
      prorationAmount: prorationItems.reduce((sum: number, item: any) => sum + item.amount, 0) / 100,
      hasProration: prorationItems.length > 0,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching invoice preview:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

