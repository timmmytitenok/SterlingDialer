import { AdminSidebar } from '@/components/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#050816] text-white overflow-hidden relative">
      {/* Deep Space Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1f] via-[#0B1437] to-[#0f0520] pointer-events-none" />
      
      {/* Animated Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Purple Nebula - Top Left */}
        <div className="absolute w-[800px] h-[800px] bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-transparent rounded-full blur-[100px] -top-60 -left-60 animate-pulse" />
        
        {/* Pink/Magenta Orb - Bottom Right */}
        <div className="absolute w-[700px] h-[700px] bg-gradient-to-tl from-pink-600/20 via-fuchsia-500/10 to-transparent rounded-full blur-[100px] -bottom-60 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Cyan Accent - Center */}
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-[80px] top-1/3 left-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Small Floating Orbs */}
        <div className="absolute w-[200px] h-[200px] bg-violet-500/20 rounded-full blur-[60px] top-1/4 right-1/4 animate-bounce" style={{ animationDuration: '8s' }} />
        <div className="absolute w-[150px] h-[150px] bg-indigo-500/15 rounded-full blur-[50px] bottom-1/3 left-1/3 animate-bounce" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute w-[100px] h-[100px] bg-emerald-500/10 rounded-full blur-[40px] top-2/3 right-1/3 animate-bounce" style={{ animationDuration: '7s', animationDelay: '1s' }} />
      </div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_100%_80%_at_50%_30%,black_40%,transparent)] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
      
      {/* Subtle Starfield Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute w-1 h-1 bg-white rounded-full top-[10%] left-[20%] animate-pulse" style={{ animationDuration: '2s' }} />
        <div className="absolute w-0.5 h-0.5 bg-white/70 rounded-full top-[15%] left-[70%] animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        <div className="absolute w-1 h-1 bg-purple-300 rounded-full top-[30%] left-[85%] animate-pulse" style={{ animationDuration: '2.5s' }} />
        <div className="absolute w-0.5 h-0.5 bg-white/60 rounded-full top-[50%] left-[10%] animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
        <div className="absolute w-1 h-1 bg-cyan-300/80 rounded-full top-[70%] left-[60%] animate-pulse" style={{ animationDuration: '3s', animationDelay: '2s' }} />
        <div className="absolute w-0.5 h-0.5 bg-white/50 rounded-full top-[85%] left-[30%] animate-pulse" style={{ animationDuration: '2s', animationDelay: '1.5s' }} />
        <div className="absolute w-1 h-1 bg-pink-300/70 rounded-full top-[25%] left-[45%] animate-pulse" style={{ animationDuration: '3.5s' }} />
        <div className="absolute w-0.5 h-0.5 bg-white/40 rounded-full top-[60%] left-[80%] animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.8s' }} />
      </div>

      {/* Desktop Left Sidebar */}
      <div className="relative z-10 h-full">
        <AdminSidebar />
      </div>


      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
