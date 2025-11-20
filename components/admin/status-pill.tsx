import { cn } from '@/lib/utils';
import type {
  UserStatus,
  DialerHealth,
  SystemStatus,
  AppointmentStatus,
  SubStatus,
  PaymentMethodStatus,
  DialerRunStatus,
  LogLevel,
} from '@/types/admin';

type StatusType =
  | UserStatus
  | DialerHealth
  | SystemStatus
  | AppointmentStatus
  | SubStatus
  | PaymentMethodStatus
  | DialerRunStatus
  | LogLevel
  | string;

interface StatusPillProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { bg: string; text: string; border: string; dot?: boolean }> = {
  // User Status
  active: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', dot: true },
  suspended: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: true },
  canceled: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', dot: true },

  // Dialer Health
  good: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', dot: true },
  warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: true },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: true },

  // System Status
  up: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', dot: true },
  degraded: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: true },
  down: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: true },

  // Appointment Status
  upcoming: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  completed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  no_show: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },

  // Sub Status
  trialing: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  past_due: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },

  // Payment Method Status
  valid: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  expired: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  missing: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },

  // Dialer Run Status
  running: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: true },
  paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  budget_reached: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  no_leads: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  user_stopped: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },

  // Log Level
  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  warn: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },

  // Plans
  FreeTrial: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Starter: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Pro: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  VIP: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },

  // Source types
  ok: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', dot: true },
};

export function StatusPill({ status, size = 'md' }: StatusPillProps) {
  const config = statusConfig[status] || {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold border',
        config.bg,
        config.text,
        config.border,
        sizeClasses[size]
      )}
    >
      {config.dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', config.text.replace('text-', 'bg-'))} />
      )}
      {status.replace(/_/g, ' ')}
    </span>
  );
}

