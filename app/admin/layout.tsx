import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminMobileNav } from '@/components/admin-mobile-nav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-[#0B1437] text-white overflow-hidden relative">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '700ms' }} />
        <div className="absolute w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '1400ms' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />

      {/* Desktop Top Navigation - Full Width Bar */}
      <AdminSidebar />

      {/* Mobile Navigation - Hidden */}
      <div className="hidden">
        <AdminMobileNav />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}

