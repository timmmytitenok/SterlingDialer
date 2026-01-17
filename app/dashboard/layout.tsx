import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardMobileNav } from '@/components/dashboard-mobile-nav';
import { AdminPanelWrapper } from '@/components/admin-panel-wrapper';
import { isAdminMode } from '@/lib/admin-check';
import { PrivacyProvider } from '@/contexts/privacy-context';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  // Check if logged in via master password (admin controls)
  const showAdminPanel = await isAdminMode();
  
  // Extra safety check - only show for specific admin email or if explicitly in admin mode
  const isReallyAdmin = showAdminPanel && (
    user.email === 'timothytitenok9@gmail.com' || 
    user.email === 'timothytitenokspam@gmail.com' ||
    showAdminPanel === true
  );

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Track last login - update every time user accesses dashboard
  // This runs server-side so it's efficient
  await supabase
    .from('profiles')
    .update({ last_login: new Date().toISOString() })
    .eq('user_id', user.id);

  // Auto-charging is enabled - no need to redirect for expired trials
  // Stripe will automatically charge when trial ends
  // Users will be auto-upgraded to Pro Access

  return (
    <PrivacyProvider>
      <div className="flex h-screen bg-[#0B1437] text-white overflow-hidden relative">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '700ms' }}></div>
          <div className="absolute w-96 h-96 bg-pink-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '1000ms' }}></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none"></div>

        <DashboardSidebar user={user} profile={profile} />
        <DashboardMobileNav user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto relative z-10 pt-14 md:pt-0">
          {children}
        </main>
        
        {/* Admin Test Panel - Only visible on settings pages when logged in via master password */}
        {isReallyAdmin && profile && (
          <AdminPanelWrapper
            userId={user.id}
            userEmail={user.email || ''}
            userName={profile.full_name || user.email?.split('@')[0] || 'User'}
            subscriptionTier={profile.subscription_tier || 'none'}
            aiSetupStatus={profile.ai_setup_status || 'ready'}
          />
        )}
      </div>
    </PrivacyProvider>
  );
}

