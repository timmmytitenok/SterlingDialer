'use client';

import { useEffect, useState } from 'react';
import { BlurredUserName } from '@/contexts/privacy-context';

interface DashboardGreetingProps {
  displayName: string;
}

export function DashboardGreeting({ displayName }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState<string>('Welcome');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString(); // e.g., "Fri Dec 06 2024"
    const lastVisitKey = 'dashboard_last_visit_date';
    const lastVisit = localStorage.getItem(lastVisitKey);

    if (lastVisit && lastVisit !== today) {
      // Different day - show "Welcome back"
      setGreeting('Welcome back');
    } else {
      // Same day or first visit ever - show "Welcome"
      setGreeting('Welcome');
    }

    // Update the last visit date to today
    localStorage.setItem(lastVisitKey, today);
    setMounted(true);
  }, []);

  // Show a simple greeting while loading to prevent flash
  if (!mounted) {
    return (
      <h1 className="hidden md:block text-4xl font-bold text-white bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
        Welcome, <BlurredUserName displayName={displayName} />!
      </h1>
    );
  }

  return (
    <h1 className="hidden md:block text-4xl font-bold text-white bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
      {greeting}, <BlurredUserName displayName={displayName} />!
    </h1>
  );
}

