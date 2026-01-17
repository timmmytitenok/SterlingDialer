import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface AdminStatCardProps {
  title: string;
  value: string | number | ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function AdminStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl overflow-hidden group hover:scale-[1.02] transition-all duration-300',
        'hover:shadow-2xl hover:shadow-blue-500/10',
        className
      )}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 text-center">
        {Icon && (
          <div className="inline-flex p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-4">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
        )}
        
        <p className="text-sm font-medium text-gray-400 mb-3">{title}</p>
        <p className="text-3xl md:text-4xl font-bold text-white mb-2" suppressHydrationWarning>{value}</p>

        {subtitle && (
          <p className="text-xs text-gray-500" suppressHydrationWarning>{subtitle}</p>
        )}

        {trend && (
          <div className="flex items-center justify-center gap-1 mt-3">
            <span
              className={cn(
                'text-xs font-semibold',
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
            <span className="text-xs text-gray-500">vs yesterday</span>
          </div>
        )}
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </div>
  );
}

