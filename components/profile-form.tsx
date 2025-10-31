'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { User } from '@supabase/supabase-js';
import { UserCircle, Mail, Save, LogOut, CheckCircle, AlertCircle, Sparkles, Phone, Building2, Crown, CreditCard } from 'lucide-react';

interface ProfileFormProps {
  user: User;
  profile: any;
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  // Fetch subscription info
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('subscription_tier, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        if (sub) {
          setSubscriptionInfo(sub);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchSubscription();
  }, [user.id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          phone_number: phoneNumber,
          company_name: companyName,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage('✅ Profile updated successfully!');
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getTierInfo = () => {
    if (!subscriptionInfo) return null;
    
    const tier = subscriptionInfo.subscription_tier;
    const tierData = {
      starter: { name: 'Starter', price: 999, leads: 600, callers: 1, color: 'blue' },
      pro: { name: 'Pro', price: 1399, leads: 1200, callers: 2, color: 'purple' },
      elite: { name: 'Elite', price: 1999, leads: 1800, callers: 3, color: 'amber' },
    };
    
    return tierData[tier as keyof typeof tierData] || null;
  };

  const tierInfo = getTierInfo();

  return (
    <div className="space-y-6">
      {/* Current Plan Display */}
      {tierInfo && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl border border-gray-800 group/plan">
          {/* Glow Effect */}
          <div className={`absolute inset-0 bg-gradient-to-r from-${tierInfo.color}-600/0 via-${tierInfo.color}-600/5 to-${tierInfo.color}-600/0 opacity-0 group-hover/plan:opacity-100 transition-opacity duration-500`} />
          
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 bg-${tierInfo.color}-500/20 rounded-xl border border-${tierInfo.color}-500/30`}>
                  <Crown className={`w-6 h-6 text-${tierInfo.color}-400`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Current Plan</p>
                  <h3 className={`text-2xl font-bold text-${tierInfo.color}-400`}>{tierInfo.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">${tierInfo.price}/month</p>
                </div>
              </div>
              <a
                href="/dashboard/settings/billing"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg transition-all text-sm"
              >
                <CreditCard className="w-4 h-4" />
                Manage Billing
              </a>
            </div>
            
            {/* Plan Features */}
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 text-${tierInfo.color}-400`} />
                <span className="text-gray-300">{tierInfo.callers} AI Caller{tierInfo.callers > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className={`w-4 h-4 text-${tierInfo.color}-400`} />
                <span className="text-gray-300">{tierInfo.leads.toLocaleString()} leads/day</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Information Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl border border-gray-800 group">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Animated Background Orbs */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
              <UserCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Profile Information</h3>
              <p className="text-sm text-gray-400">Manage your personal details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <UserCircle className="w-4 h-4 text-blue-400" />
                Full Name
              </label>
              <div className="relative group/input">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-4 py-3 bg-[#0B1437]/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 group-hover/input:border-gray-600"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-focus-within/input:from-blue-500/5 group-focus-within/input:to-purple-500/5 pointer-events-none transition-all duration-300" />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                This name will be displayed throughout the dashboard
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Phone className="w-4 h-4 text-green-400" />
                Phone Number
              </label>
              <div className="relative group/input">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 bg-[#0B1437]/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200 group-hover/input:border-gray-600"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-500/0 to-emerald-500/0 group-focus-within/input:from-green-500/5 group-focus-within/input:to-emerald-500/5 pointer-events-none transition-all duration-300" />
              </div>
            </div>

            {/* Company/Agency Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Building2 className="w-4 h-4 text-purple-400" />
                Agency/Company Name
              </label>
              <div className="relative group/input">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Smith Insurance Group"
                  className="w-full px-4 py-3 bg-[#0B1437]/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 group-hover/input:border-gray-600"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-focus-within/input:from-purple-500/5 group-focus-within/input:to-pink-500/5 pointer-events-none transition-all duration-300" />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Optional - appears on invoices and communications
              </p>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Mail className="w-4 h-4 text-gray-400" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 bg-[#0B1437]/30 backdrop-blur-sm border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-500">Read Only</div>
                </div>
              </div>
              <p className="text-xs text-gray-500">Email cannot be changed for security reasons</p>
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 ${
                message.includes('Error')
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
                {message.includes('Error') ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 animate-in zoom-in duration-300" />
                )}
                <span className="text-sm font-medium">{message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full group/btn overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {/* Button Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
              
              {/* Button Content */}
              <div className="relative flex items-center justify-center gap-3 px-6 py-4">
                <Save className="w-5 h-5" />
                <span className="font-semibold">
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </span>
              </div>
            </button>
          </form>
        </div>
      </div>

      {/* Sign Out - Danger Zone */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-950/40 to-red-900/20 rounded-xl border border-red-900/50 group/danger">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/5 to-red-600/0 opacity-0 group-hover/danger:opacity-100 transition-opacity duration-500" />
        
        {/* Animated Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
              <LogOut className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
              <p className="text-sm text-gray-400">End your current session</p>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-6">
            You will be signed out and redirected to the login page. Any unsaved changes will be lost.
          </p>
          
          <button
            onClick={handleSignOut}
            className="relative group/signout overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Button Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
            
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/signout:translate-x-[200%] transition-transform duration-1000" />
            
            {/* Button Content */}
            <div className="relative flex items-center justify-center gap-3 px-6 py-3 border border-red-500/50">
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

