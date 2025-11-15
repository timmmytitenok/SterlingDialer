'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Client component that auto-refreshes the dashboard every 5 seconds
 * to show real-time updates from AI calls
 */
export function DashboardRefresher() {
  const router = useRouter();

  useEffect(() => {
    // Refresh dashboard every 5 seconds
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  return null; // This component doesn't render anything
}

