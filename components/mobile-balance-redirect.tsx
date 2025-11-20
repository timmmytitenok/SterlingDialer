'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function MobileBalanceRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we're on mobile and coming back from a successful payment
    const isMobile = window.innerWidth < 768; // md breakpoint
    const balanceSuccess = searchParams.get('balance_success');
    const returnUrl = searchParams.get('return_url');

    if (isMobile && balanceSuccess === 'true' && returnUrl) {
      // Redirect mobile users to the billing page (which has balance + billing combined)
      setTimeout(() => {
        router.push(`${returnUrl}?balance_success=true`);
      }, 100);
    }
  }, [searchParams, router]);

  return null;
}

