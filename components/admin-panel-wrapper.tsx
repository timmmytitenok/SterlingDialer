'use client';

import { usePathname } from 'next/navigation';
import { AdminTestPanel } from './admin-test-panel';

interface AdminPanelWrapperProps {
  userId: string;
  userEmail: string;
  userName: string;
  subscriptionTier: string;
  aiSetupStatus: string;
}

export function AdminPanelWrapper(props: AdminPanelWrapperProps) {
  const pathname = usePathname();
  
  // Only show admin panel on settings pages
  const isSettingsPage = pathname?.startsWith('/dashboard/settings');
  
  if (!isSettingsPage) {
    return null;
  }
  
  return <AdminTestPanel {...props} />;
}

