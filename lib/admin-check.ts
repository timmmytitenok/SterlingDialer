import { cookies } from 'next/headers';

/**
 * Check if the current session is in admin mode (logged in via master password)
 */
export async function isAdminMode(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminModeCookie = cookieStore.get('admin_mode');
  return adminModeCookie?.value === 'true';
}

