import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const salesId = searchParams.get('id');

    // Also check cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sales_session');

    const actualId = salesId || sessionCookie?.value;

    if (!actualId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get sales person
    const { data: salesPerson, error: personError } = await supabase
      .from('sales_team')
      .select('*')
      .eq('id', actualId)
      .single();

    if (personError || !salesPerson) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    if (salesPerson.status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

    // Update last_login to track activity (every time they access dashboard)
    await supabase
      .from('sales_team')
      .update({ last_login: new Date().toISOString() })
      .eq('id', actualId);

    // Get commissions
    const { data: commissions } = await supabase
      .from('sales_commissions')
      .select('*')
      .eq('sales_person_id', actualId)
      .order('created_at', { ascending: false });

    // Get referrals
    const { data: referralsRaw } = await supabase
      .from('sales_referrals')
      .select('*')
      .eq('sales_person_id', actualId)
      .order('created_at', { ascending: false });

    // Get actual user signup dates from auth
    const { data: authData } = await supabase.auth.admin.listUsers();
    const userSignupDates = new Map((authData?.users || []).map((u: any) => [u.id, u.created_at]));

    // Add real signup date to referrals
    const referrals = (referralsRaw || []).map((r: any) => ({
      ...r,
      user_signup_date: userSignupDates.get(r.user_id) || r.created_at,
    }));

    // Remove sensitive data
    const { password_hash, ...safeData } = salesPerson;

    return NextResponse.json({
      salesPerson: safeData,
      commissions: commissions || [],
      referrals: referrals || [],
    });
  } catch (error: any) {
    console.error('Sales dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}

