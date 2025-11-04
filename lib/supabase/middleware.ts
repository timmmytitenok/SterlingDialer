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

  // 🔥 BRAND NEW SIMPLE LOGIC - ONE CHECK
  if (user) {
    // Check if user has EVER completed a checkout (subscription record exists) OR has active free trial
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    // Also check if user has an active free trial
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    const hasEverSubscribed = !!subscription;
    const hasFreeTrial = profile?.subscription_tier === 'free_trial';
    const hasVIPAccess = profile?.subscription_tier === 'free_access';
    const hasAccess = hasEverSubscribed || hasFreeTrial || hasVIPAccess;

    // RULE 1: Trying to access DASHBOARD
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (!hasAccess) {
        // Never subscribed AND no free trial → Must subscribe first
        const url = request.nextUrl.clone();
        url.pathname = '/subscribe';
        return NextResponse.redirect(url);
      }
      // Has subscribed before OR has free trial → FULL ACCESS
    }

    // RULE 2: Trying to access /subscribe
    if (request.nextUrl.pathname === '/subscribe') {
      if (hasAccess) {
        // Already has access (subscribed or free trial) → Go to dashboard
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
      // No access → Show them subscribe page
    }

    // RULE 3: Logged in user trying to access /login
    if (request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = hasAccess ? '/dashboard' : '/subscribe';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

