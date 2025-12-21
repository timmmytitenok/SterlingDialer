import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServiceRoleClient();

    // Get sales person
    const { data: salesPerson, error: personError } = await supabase
      .from('sales_team')
      .select('*')
      .eq('id', id)
      .single();

    if (personError || !salesPerson) {
      console.error('Sales person not found:', personError);
      return NextResponse.json({ error: 'Sales person not found' }, { status: 404 });
    }

    // Get referrals
    const { data: referralsRaw } = await supabase
      .from('sales_referrals')
      .select('*')
      .eq('sales_person_id', id)
      .order('created_at', { ascending: false });

    // Get commissions
    const { data: commissions } = await supabase
      .from('sales_commissions')
      .select('*')
      .eq('sales_person_id', id)
      .order('created_at', { ascending: false });

    // Get ALL users from auth (same as User Management page)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
    }
    
    // Create user signup dates map
    const userSignupDates = new Map((authData?.users || []).map(u => [u.id, u.created_at]));
    
    // Add real signup date to referrals
    const referrals = (referralsRaw || []).map(r => ({
      ...r,
      user_signup_date: userSignupDates.get(r.user_id) || r.created_at,
    }));

    // Get profiles for names
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name');
    const profilesMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));
    
    // Get all referrals with sales person info to show current assignments
    const { data: allReferrals } = await supabase
      .from('sales_referrals')
      .select('user_id, sales_person_id');
    
    // Get all sales people names for display
    const { data: allSalesPeople } = await supabase
      .from('sales_team')
      .select('id, full_name');
    
    const salesPeopleMap = new Map((allSalesPeople || []).map(sp => [sp.id, sp.full_name]));
    const userAssignments = new Map((allReferrals || []).map(r => [r.user_id, r.sales_person_id]));
    
    // Build users list from auth data (like User Management does)
    // Filter out users who are already assigned to ANY sales person
    const allUsers = (authData?.users || [])
      .filter(u => !userAssignments.has(u.id)) // Only show unassigned users
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(u => ({
        id: u.id,
        full_name: profilesMap.get(u.id) || 'Unnamed User',
        email: u.email || 'No email',
        created_at: u.created_at,
        has_active_subscription: false,
      }));

    return NextResponse.json({
      salesPerson,
      referrals: referrals || [],
      commissions: commissions || [],
      allUsers: allUsers || [],
    });
  } catch (error: any) {
    console.error('Error in sales person detail API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales person' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const updates = await req.json();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('sales_team')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, salesPerson: data });
  } catch (error: any) {
    console.error('Error updating sales person:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update sales person' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('sales_team')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sales person:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete sales person' },
      { status: 500 }
    );
  }
}
