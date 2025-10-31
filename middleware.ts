import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
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
     * - api/stripe/webhook (Stripe webhook - no auth needed)
     * - api/referral/validate-simple (Referral validation - called during signup)
     * - api/referral/credit (Referral crediting - called by webhook)
     * - api/admin/credit-latest-referral (Admin tool - temp for debugging)
     * - api/admin/master-login (Master password login - no auth needed)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|fil|webp)$|api/appointments/cal-webhook|api/ai-control/complete|api/stripe/webhook|api/referral/validate-simple|api/referral/credit|api/admin/credit-latest-referral|api/admin/master-login).*)',
  ],
};

