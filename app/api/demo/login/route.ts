import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Demo user credentials - Make sure this user exists in Supabase Auth!
const DEMO_USER_EMAIL = 'demo@sterling.ai';
const DEMO_USER_PASSWORD = 'demosterlingai'; // Set this password in Supabase for the demo user
const DEMO_USER_ID = '7619c63f-fcc3-4ff3-83ac-33595b5640a5';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const baseUrl = requestUrl.origin;
  
  try {
    console.log('🎭 Demo Login: Starting...');
    
    // Create a Supabase client that can set cookies
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Can be ignored if running on server
            }
          },
        },
      }
    );
    
    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
    });
    
    if (error) {
      console.error('❌ Demo Login Error:', error.message);
      
      // If password login fails, try magic link approach with admin client
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: DEMO_USER_EMAIL,
        options: {
          redirectTo: `${baseUrl}/dashboard`,
        }
      });
      
      if (linkError) {
        console.error('❌ Magic Link Error:', linkError.message);
        // Redirect to login page with error
        return NextResponse.redirect(new URL('/signup?error=demo_login_failed', baseUrl));
      }
      
      if (linkData?.properties?.action_link) {
        console.log('✅ Generated magic link, redirecting...');
        return NextResponse.redirect(linkData.properties.action_link);
      }
    }
    
    if (data?.session) {
      console.log('✅ Demo Login Success! Redirecting to dashboard...');
      // Redirect to dashboard - the session cookies are already set
      return NextResponse.redirect(new URL('/dashboard', baseUrl));
    }
    
    // Fallback
    console.log('⚠️ No session created, redirecting to signup');
    return NextResponse.redirect(new URL('/signup?error=demo_session_failed', baseUrl));
    
  } catch (error: any) {
    console.error('❌ Demo Login Exception:', error);
    return NextResponse.redirect(new URL('/signup?error=demo_exception', request.url));
  }
}
