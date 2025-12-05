import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check for admin mode
  const adminMode = request.cookies.get('admin_mode')?.value === 'true';
  
  console.log('🔍 Middleware Check:', {
    path: request.nextUrl.pathname,
    adminMode,
    allCookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value }))
  });

  // 🔒 ADMIN ROUTE PROTECTION (both /admin pages and /api/admin APIs)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('🔒 Admin route detected:', request.nextUrl.pathname, 'Admin mode:', adminMode);
    if (!adminMode) {
      console.log('❌ NO ADMIN MODE - Redirecting to dashboard');
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    // Admin mode active → Allow access
    console.log('✅ ADMIN MODE ACTIVE - Allowing access');
    return supabaseResponse;
  }

  // Protect routes (except webhooks from N8N and admin APIs)
  const isWebhookRoute = 
    request.nextUrl.pathname === '/api/ai-control/update-queue' ||
    request.nextUrl.pathname === '/api/calls/update';
  const isAdminApiRoute = request.nextUrl.pathname.startsWith('/api/admin');
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    (request.nextUrl.pathname.startsWith('/api') &&
      !request.nextUrl.pathname.startsWith('/api/auth') &&
      !isWebhookRoute &&
      !isAdminApiRoute); // Don't require user auth for admin API routes

  if (isProtectedRoute && !user) {
    // For API routes, return JSON error instead of redirecting (prevents HTML parse errors)
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in', success: false },
        { status: 401 }
      );
    }
    // For page routes, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Admin API routes - check admin mode (no user required)
  if (isAdminApiRoute && !adminMode) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin mode required' },
      { status: 401 }
    );
  }

  // ✅ LOGGED IN USERS ALWAYS HAVE DASHBOARD ACCESS
  // AI Dialer and Auto Schedule pages handle their own blocking
  if (user) {
    // RULE 1: Logged in user trying to access /login → redirect to dashboard
    if (request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    
    // RULE 2: Dashboard access → ALWAYS ALLOWED for logged in users
    // Specific pages (AI Dialer, Auto Schedule) will show "Subscription Ended" if needed
  }

  return supabaseResponse;
}

