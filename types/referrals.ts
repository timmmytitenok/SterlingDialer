// Referral Program Types

export interface ReferralPartner {
  id: string;
  userId: string;
  name: string;
  email: string;
  referralCode: string; // 8-digit code
  referralLink: string;
  createdAt: string;
  totalReferrals: number;
  activeReferrals: number;
  totalMonthsBilled: number; // Total subscription-months from all referrals
  totalCommissionEarned: number;
  pendingPayout: number;
}

export interface ReferredUser {
  id: string;
  name: string;
  email: string;
  referredBy: string; // Partner ID
  signedUpAt: string;
  subscriptionMonths: number; // How many months they've been subscribed
  status: 'active' | 'canceled';
  monthlyValue: number; // $379
  commissionPerMonth: number; // $100
  totalCommissionGenerated: number;
}

