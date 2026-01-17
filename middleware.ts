import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Block access to hidden pages (redirect to home)
  const pathname = request.nextUrl.pathname;
  if (pathname === '/case-studies') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // TEMPORARILY DISABLED: Block ALL sales-related URLs completely
  // Remove this block when ready to re-enable sales team
  if (
    pathname.startsWith('/sales') ||
    pathname.startsWith('/admin/sales-team') ||
    pathname.startsWith('/api/sales') ||
    pathname.startsWith('/api/admin/sales-team')
  ) {
    // Return 404 for API routes, redirect for pages
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // First, handle Supabase session
  const response = await updateSession(request);
  
  // Then, check for referral code in ANY page
  const refCode = request.nextUrl.searchParams.get('ref');
  
  if (refCode) {
    console.log('🎯 Middleware: Detected referral code:', refCode);
    
    // Store referral code in uppercase (standardized)
    const codeToStore = refCode.toUpperCase();
    console.log('💾 Storing affiliate code as:', codeToStore);
    
    // Store referral code in a session cookie (expires when browser closes)
    response.cookies.set('pending_referral', codeToStore, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // No maxAge = session cookie (cleared when browser closes)
    });
    
    console.log('✅ Middleware: Stored referral code in session cookie');
    
    // If they landed on a page that's not signup, redirect to signup page
    const pathname = request.nextUrl.pathname;
    if (pathname !== '/signup' && !pathname.startsWith('/api')) {
      console.log('🔄 Middleware: Redirecting to signup with referral code');
      const signupUrl = new URL('/signup', request.url);
      signupUrl.searchParams.set('ref', refCode);
      return NextResponse.redirect(signupUrl);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/appointments/cal-webhook (Cal.ai webhook - no auth needed)
     * - api/ai-control/complete (N8N completion callback - no auth needed)
     * - api/ai-control/next-call (Internal server-to-server call - no auth needed)
     * - api/ai-control/cron-start (Vercel cron job - has own CRON_SECRET auth)
     * - api/retell/call-result (Retell webhook - no auth needed)
     * - api/stripe/webhook (Stripe webhook - no auth needed)
     * - api/referral/validate-simple (Referral validation - called during signup)
     * - api/referral/credit (Referral crediting - called by webhook)
     * - api/debug/instant-subscribe (Debug tool - instant subscription for testing)
     * - api/admin/complete-pending-referrals (Admin tool - temp for testing)
     * - api/admin/master-login (Master password login - no auth needed)
     * - api/demo/login (Demo dashboard login - no auth needed)
     * - api/demo/refresh-data (Demo data refresh - no auth needed)
     * - api/retell/book-appointment (Retell webhook for booking - no auth needed)
     * - api/retell/live-transfer (Retell webhook for transfers - no auth needed)
     * - api/retell/check-availability (Retell webhook for calendar availability - no auth needed)
     * - api/debug/check-config (Debug endpoint - no auth needed)
     * - api/schedule-call (Public scheduling endpoints - no auth needed)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|fil|webp)$|api/appointments/cal-webhook|api/ai-control/complete|api/ai-control/next-call|api/ai-control/cron-start|api/retell/call-result|api/retell/book-appointment|api/retell/live-transfer|api/retell/check-availability|api/stripe/webhook|api/referral/validate-simple|api/referral/credit|api/debug/instant-subscribe|api/debug/check-config|api/admin/complete-pending-referrals|api/admin/master-login|api/demo/login|api/demo/refresh-data|api/schedule-call).*)',
  ],
};

