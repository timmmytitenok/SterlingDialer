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

  // Protect routes (except webhooks from N8N)
  const isWebhookRoute = 
    request.nextUrl.pathname === '/api/ai-control/update-queue' ||
    request.nextUrl.pathname === '/api/calls/update';
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    (request.nextUrl.pathname.startsWith('/api') &&
      !request.nextUrl.pathname.startsWith('/api/auth') &&
      !isWebhookRoute);

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 🔥 BRAND NEW SIMPLE LOGIC - ONE CHECK
  if (user) {
    // Check if user has EVER completed a checkout (subscription record exists)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    const hasEverSubscribed = !!subscription;

    // RULE 1: Trying to access DASHBOARD
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (!hasEverSubscribed) {
        // Never subscribed → Must subscribe first
        const url = request.nextUrl.clone();
        url.pathname = '/subscribe';
        return NextResponse.redirect(url);
      }
      // Has subscribed before → FULL ACCESS
    }

    // RULE 2: Trying to access /subscribe
    if (request.nextUrl.pathname === '/subscribe') {
      if (hasEverSubscribed) {
        // Already subscribed → Go to dashboard
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
      // Never subscribed → Show them subscribe page
    }

    // RULE 3: Logged in user trying to access /login
    if (request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = hasEverSubscribed ? '/dashboard' : '/subscribe';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

