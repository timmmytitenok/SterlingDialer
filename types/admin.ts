// Admin Panel TypeScript Types

export type PlanType = 'FreeTrial' | 'Starter' | 'Pro' | 'VIP';
export type UserStatus = 'active' | 'suspended' | 'canceled';
export type DialerHealth = 'good' | 'warning' | 'error';
export type LeadSourceType = 'GoogleSheet' | 'CSV';
export type LeadSourceStatus = 'ok' | 'error';
export type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled';
export type PaymentMethodStatus = 'valid' | 'expired' | 'missing';
export type DialerRunStatus = 'running' | 'paused' | 'completed' | 'error' | 'budget_reached' | 'no_leads' | 'user_stopped';
export type SystemStatus = 'up' | 'degraded' | 'down';
export type AppointmentSource = 'AI Dialer' | 'Manual';
export type AppointmentStatus = 'upcoming' | 'completed' | 'no_show' | 'canceled';
export type LogLevel = 'info' | 'warn' | 'error';
export type LogScope = 'dialer' | 'billing' | 'leads' | 'system' | 'user';

export interface UserAdmin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinedAt: string;
  plan: PlanType;
  isTrial: boolean;
  trialDaysLeft: number;
  status: UserStatus;
  lastLoginAt: string | null;
  totalLogins: number;
  totalSpend: number;
  currentCallBalance: number;
  autoRefillEnabled: boolean;
  leadSources: number;
  totalLeads: number;
  dialerAutomationEnabled: boolean;
  dailyBudget: number;
  todaySpend: number;
  scheduleTime: string;
  scheduleDays: string;
  dialerHealth: DialerHealth;
}

export interface LeadSource {
  id: string;
  userId: string;
  name: string;
  type: LeadSourceType;
  lastSyncedAt: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: LeadSourceStatus;
}

export interface LeadStats {
  userId: string;
  totalLeads: number;
  freshLeads: number;
  agedLeads: number;
  deadLeads: number;
  callbacks: number;
  pickupRate: number;
  conversionRate: number;
  avgCallDurationSec: number;
  leadsAttemptedToday: number;
  callsToday: number;
  minutesToday: number;
}

export interface BillingInfo {
  userId: string;
  stripeCustomerId: string;
  stripeSubId?: string;
  plan: PlanType;
  subStatus: SubStatus;
  renewalDate: string | null;
  paymentMethodStatus: PaymentMethodStatus;
  last4?: string;
  brand?: string;
  lifetimeRevenue: number;
  monthRevenue: number;
  callBalancePurchased: number;
  chargebacks: number;
  autoRefillEnabled: boolean;
  lastAutoRefillAt?: string;
  lastAutoRefillAmount?: number;
  autoRefillFailures: number;
}

export interface DialerRun {
  id: string;
  userId: string;
  userName: string;
  startedAt: string;
  stoppedAt?: string;
  status: DialerRunStatus;
  calls: number;
  minutes: number;
  appointments: number;
  stopReason?: string;
}

export interface SystemHealth {
  twilioStatus: SystemStatus;
  retellStatus: SystemStatus;
  apiErrorRate: number;
  webhooksErrorRate: number;
  serverCpu: number;
  serverRam: number;
  activeCalls: number;
  queuedCalls: number;
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  leadName: string;
  phone: string;
  dateTime: string;
  source: AppointmentSource;
  status: AppointmentStatus;
}

export interface AdminLog {
  id: string;
  ts: string;
  level: LogLevel;
  scope: LogScope;
  message: string;
  userId?: string;
  userName?: string;
}

export interface CallRecord {
  id: string;
  userId: string;
  leadName: string;
  phone: string;
  startedAt: string;
  duration: number;
  outcome: string;
  cost: number;
  recordingUrl?: string;
}

