import { createServiceRoleClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, masterPassword, adminDashboard } = await request.json();

    // Verify master password
    if (masterPassword !== process.env.MASTER_ADMIN_PASSWORD) {
      console.log('❌ Invalid master password attempt');
      return NextResponse.json(
        { error: 'Invalid master password' },
        { status: 401 }
      );
    }

    console.log('✅ Master password verified');

    // If adminDashboard mode, just set the cookie and return success
    if (adminDashboard) {
      console.log('✅ Admin Dashboard mode - setting admin_mode cookie only');
      console.log('🍪 Cookie settings:', {
        name: 'admin_mode',
        value: 'true',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
      
      const response = NextResponse.json({
        success: true,
        adminDashboard: true,
      });

      // Set admin mode cookie (expires in 24 hours)
      response.cookies.set('admin_mode', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      console.log('✅ Cookie set on response, returning success');
      return response;
    }

    // Regular master login with user impersonation
    console.log('✅ User impersonation mode, logging in as:', email);

    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();

    // Find user by email in auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return NextResponse.json(
        { error: 'Failed to find user' },
        { status: 500 }
      );
    }

    const targetUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      console.error('❌ User not found:', email);
      return NextResponse.json(
        { error: 'User not found with that email' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', targetUser.id);

    // Generate a magic link for this user
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email!,
    });

    if (linkError || !linkData) {
      console.error('❌ Error generating link:', linkError);
      return NextResponse.json(
        { error: 'Failed to generate login link' },
        { status: 500 }
      );
    }

    console.log('✅ Login link generated for user:', targetUser.email);

    // Extract the token from the hashed_token
    // The hashed_token can be used to verify and create a session
    const token = linkData.properties.hashed_token;

    // Create response with admin mode cookie
    const response = NextResponse.json({
      success: true,
      token: token,
      email: targetUser.email,
      type: 'magiclink'
    });

    // Set admin mode cookie (expires in 24 hours)
    response.cookies.set('admin_mode', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('❌ Master login error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

