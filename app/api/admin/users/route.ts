import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

/**
 * GET /api/admin/users
 * Fetch all users with their Retell configuration
 */
export async function GET() {
  try {
    // Check if in admin mode
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      console.error('❌ Not in admin mode');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('✅ Admin mode verified, fetching all users...');

    // Use service role client to bypass RLS when in admin mode
    const supabase = createServiceRoleClient();

    // Fetch all users from auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      throw authError;
    }

    console.log(`✅ Found ${authData?.users?.length || 0} auth users`);

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`✅ Found ${profiles?.length || 0} profiles`);

    // Fetch all Retell configs
    const { data: configs, error: configsError } = await supabase
      .from('user_retell_config')
      .select('*');

    if (configsError) {
      console.error('❌ Error fetching configs:', configsError);
      // Don't throw - configs might not exist yet
    }

    console.log(`✅ Found ${configs?.length || 0} Retell configs`);

    // Merge data
    const users = (authData.users || []).map((authUser: any) => {
      const profile = profiles?.find((p: any) => p.user_id === authUser.id);
      const config = configs?.find((c: any) => c.user_id === authUser.id);
      
      return {
        id: authUser.id,
        email: authUser.email || 'No email',
        full_name: profile?.full_name || 'Unnamed User',
        retell_config: config ? {
          agent_id: config.retell_agent_id,
          phone_number: config.phone_number,
          agent_name: config.agent_name,
          is_active: config.is_active,
        } : null,
      };
    }).sort((a: any, b: any) => (a.email || '').localeCompare(b.email || ''));

    console.log(`✅ Returning ${users.length} users`);

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });

  } catch (error: any) {
    console.error('❌ Fatal error in /api/admin/users:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
