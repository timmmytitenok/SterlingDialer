'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  CreditCard,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  CheckCircle,
  Circle,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Activity,
  Database,
  Wallet,
  Save,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';

interface UserDetail {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  account_type: string;
  days_left: number;
  total_calls: number;
  total_appointments: number;
  profit: number;
  last_ai_activity: string | null;
  ai_is_running: boolean;
  total_leads: number;
  call_balance: number;
  setup_status: string;
  ai_maintenance_mode: boolean;
  retell_agent_id: string | null;
  retell_phone_number: string | null;
  has_active_subscription: boolean;
  subscription_tier: string | null;
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dashboard stat adjustments
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState('total_dials');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  
  // Call balance adjustment
  const [balanceAmount, setBalanceAmount] = useState('');
  
  // Subscription management
  
  // Other functions
  
  // AI Agent configuration
  const [agentId, setAgentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [scriptType, setScriptType] = useState<'final_expense' | 'mortgage_protection'>('final_expense');
  

  // Quick Setup / Onboarding steps
  const [onboardingSteps, setOnboardingSteps] = useState({
    step_1_form: false,
    step_2_balance: false,
    step_3_sheet: false,
    step_4_schedule: false,
    all_complete: false,
  });

  useEffect(() => {
    if (userId && typeof userId === 'string') {
      loadUser();
    } else {
      setError('Invalid user ID');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUser = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Fetching user data for ID:', userId);
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/admin/user-management');
          return;
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API error:', errorData);
        throw new Error(errorData.error || `Failed to load user`);
      }

      const data = await response.json();
      console.log('✅ User data loaded:', data);
      
      if (!data.user) {
        throw new Error('No user data returned');
      }
      
      setUser(data.user);
      
      // Load onboarding steps
      setOnboardingSteps({
        step_1_form: data.user.onboarding_step_1_form || false,
        step_2_balance: data.user.onboarding_step_2_balance || false,
        step_3_sheet: data.user.onboarding_step_3_sheet || false,
        step_4_schedule: data.user.onboarding_step_4_schedule || false,
        all_complete: data.user.onboarding_all_complete || false,
      });
      
      // Set AI config values if they exist
      if (data.user.retell_agent_id) setAgentId(data.user.retell_agent_id);
      if (data.user.retell_phone_number) setPhoneNumber(data.user.retell_phone_number);
      if (data.user.script_type) setScriptType(data.user.script_type);
      
    } catch (err: any) {
      console.error('❌ Error loading user:', err);
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null, includeTime = false) => {
    if (!dateString) return 'Never';
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-gradient-to-br from-red-900/20 to-red-600/10 border-2 border-red-500/30 rounded-2xl p-8 backdrop-blur-xl text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">User Not Found</h2>
          <p className="text-red-300 mb-6">{error || 'Unable to load user'}</p>
          <button
            onClick={() => router.push('/admin/user-management')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin/user-management')}
          className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500/20 to-gray-600/20 backdrop-blur-sm border border-gray-500/30 hover:border-gray-400/50 rounded-lg transition-all duration-300 mb-6 text-white font-semibold shadow-lg shadow-gray-500/20 hover:shadow-xl hover:shadow-gray-400/40 hover:scale-105 hover:from-gray-500/30 hover:to-gray-600/30 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-gray-600/10 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
          <ArrowLeft className="w-4 h-4 relative z-10 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="relative z-10">Back to Users</span>
        </button>

        {/* User Information Card */}
        <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-xl">
          {/* Header with Avatar and Name */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">{user.full_name}</h1>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Database className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-xs">{user.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">{user.phone || 'No phone number'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Account Type Badge & View Dashboard Button */}
            <div className="flex flex-col items-end gap-4">
              {/* Account Type Badge */}
              <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-bold text-sm tracking-wide ${
                user.account_type?.includes('VIP') || user.subscription_tier === 'vip'
                  ? 'bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                  : user.account_type === 'Pro Access' || user.subscription_tier === 'pro' || user.account_type === 'Free Trial' || user.subscription_tier === 'trial'
                  ? 'bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 text-blue-400 border-blue-500/50 shadow-lg shadow-blue-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              }`}>
                {user.account_type?.includes('VIP') || user.subscription_tier === 'vip' ? (
                  <span className="text-lg">👑</span>
                ) : user.account_type === 'Pro Access' || user.subscription_tier === 'pro' ? (
                  <span className="text-lg">⚡</span>
                ) : user.account_type === 'Free Trial' || user.subscription_tier === 'trial' ? (
                  <span className="text-lg">🆓</span>
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {user.account_type}
              </span>

              {/* View Dashboard Button */}
              <a
                href={`/login?email=${encodeURIComponent(user.email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 hover:border-blue-400/50 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-400/40 hover:scale-105 hover:from-blue-500/30 hover:to-purple-500/30 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                <ExternalLink className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">View Dashboard</span>
              </a>
            </div>
          </div>
        </div>

        {/* Stats Cards - Single Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {/* Last AI Active / Running */}
          <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-3 rounded-xl border ${
                user.ai_is_running 
                  ? 'bg-emerald-500/20 border-emerald-500/50 animate-pulse' 
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <Activity className={`w-6 h-6 ${user.ai_is_running ? 'text-emerald-300' : 'text-emerald-400'}`} />
            </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Last AI Active</div>
            </div>
            {user.ai_is_running ? (
              <>
                <div className="text-2xl font-black text-emerald-400 mb-2 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  AI Running
                </div>
                <div className="text-xs text-emerald-400">Dialing now</div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-gray-300 mb-2">
                  {user.last_ai_activity ? formatDate(user.last_ai_activity, false) : 'Never ran'}
                </div>
                <div className="text-xs text-gray-400">
                  {user.last_ai_activity ? 'Last active' : 'Never started'}
                      </div>
                    </>
                  )}
            </div>

          {/* Total Dials Made */}
          <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                <Phone className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Dials</div>
            </div>
            <div className="text-4xl font-black text-blue-400 mb-2">{user.total_calls || 0}</div>
            <div className="text-xs text-gray-400">All-time calls</div>
                  </div>

          {/* Total Appointments Booked */}
          <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
                <Calendar className="w-6 h-6 text-purple-400" />
                    </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Appointments</div>
                    </div>
            <div className="text-4xl font-black text-purple-400 mb-2">{user.total_appointments || 0}</div>
            <div className="text-xs text-gray-400">Booked</div>
          </div>

          {/* Total Profit */}
          <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-green-500/40 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Profit</div>
                    </div>
            <div className="text-4xl font-black text-green-400 mb-2">${user.profit?.toFixed(2) || '0.00'}</div>
            <div className="text-xs text-gray-400">From user</div>
                </div>
              </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Dashboard Management</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                  </div>

        {/* Two-Column Grid: Dashboard Stats + Call Balance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT SIDE: Dashboard Stats Update Section */}
        <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-xl">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Modify User Stats</h3>
              <p className="text-sm text-gray-400">Adjust dashboard numbers for a specific date.</p>
                  </div>

            <div className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-lg font-semibold text-white mb-3">
                  Which date do you want to modify?
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-4 bg-[#0B1437] text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-lg"
              />
              </div>

              {/* Category Selection */}
            <div>
                <label className="block text-lg font-semibold text-white mb-3">
                  Stat to Adjust
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 bg-[#0B1437] text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-lg appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239CA3AF\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                >
                  <option value="total_dials">Add/Remove Total Dials</option>
                  <option value="callback">Add/Remove Callback</option>
                  <option value="not_interested">Add/Remove Not Interested</option>
                  <option value="live_transfer">Add/Remove Live Transfer</option>
                  <option value="appointments">Add/Remove Appointment Booked</option>
                  <option value="policies_sold">Add/Remove Policy Sold</option>
                  <option value="revenue">Add/Remove Revenue</option>
              </select>
                </div>

            {/* Value Input */}
                    <div>
                <label className="block text-lg font-semibold text-white mb-3">
                Adjustment Value
              </label>
              <input
                type="number"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder="Enter number (use + or -)"
                  className="w-full px-4 py-4 bg-[#0B1437] text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-lg"
              />
                    </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                    <button
                onClick={async () => {
                  const val = parseFloat(adjustmentValue);
                  if (isNaN(val) || val === 0) return;

                  setSaving(true);
                  try {
                    const response = await fetch('/api/admin/users/update-dashboard-stats', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.id,
                        date: selectedDate,
                        category: selectedCategory,
                        value: val,
                      }),
                    });

                    if (!response.ok) throw new Error('Failed to update stats');

                    // Success notification
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-4 flex items-center gap-3';
                      notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-semibold">Stats updated successfully!</span>';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);

                    setAdjustmentValue('');
                      loadUser();
                  } catch (err: any) {
                    // Error notification
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-4 flex items-center gap-3';
                      notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="font-semibold">Error: ' + err.message + '</span>';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || !adjustmentValue}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
              >
                {saving ? (
                  <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Loading...
                  </>
                ) : (
                  <>
                      <Database className="w-6 h-6" />
                    Apply Changes
                  </>
                )}
                    </button>
                
                <button
                  onClick={() => {
                    if (confirm('Reset all dashboard stats for this user? This cannot be undone!')) {
                      alert('Stats reset functionality will be implemented');
                    }
                  }}
                  className="px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-2 border-red-500/30 hover:border-red-500/50 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-lg"
                >
                  <Trash2 className="w-6 h-6" />
                  Reset Stats
                </button>
                  </div>
          </div>
        </div>

          {/* RIGHT SIDE: Call Balance Update Section */}
        <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-xl">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Update Call Balance</h3>
              <p className="text-sm text-gray-400">Add or remove credits from user's balance.</p>
          </div>

            <div className="space-y-8">
              {/* Current Balance Display */}
                  <div>
                <label className="block text-lg font-semibold text-white mb-4">
                  Current Call Balance
              </label>
                <div className="bg-[#0B1437] rounded-xl p-8 border border-gray-700">
                  <div className="text-7xl font-black text-blue-400 text-center">
                    ${user.call_balance?.toFixed(2) || '0.00'}
                  </div>
                </div>
                  </div>

              {/* Amount Input */}
              <div className="pt-4">
                <label className="block text-lg font-semibold text-white mb-3">
                  Adjustment Amount
                </label>
                      <input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Enter number (use + or -)"
                  step="0.01"
                  className="w-full px-4 py-4 bg-[#0B1437] text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-lg"
                />
              </div>

              {/* Apply Button */}
                      <button
                onClick={async () => {
                  const val = parseFloat(balanceAmount);
                  if (isNaN(val) || val === 0) {
                    alert('Please enter a valid amount');
                    return;
                  }

                  setSaving(true);
                  try {
                    const response = await fetch('/api/admin/users/update-balance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.id,
                        amount: val,
                      }),
                    });

                    if (!response.ok) throw new Error('Failed to update balance');

                    // Success notification
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-4 flex items-center gap-3';
                    notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-semibold">Call balance updated successfully!</span>';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);

                    setBalanceAmount('');
                    loadUser();
                  } catch (err: any) {
                    // Error notification
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-4 flex items-center gap-3';
                    notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="font-semibold">Error: ' + err.message + '</span>';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || !balanceAmount}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Wallet className="w-6 h-6" />
                    Apply Changes
                  </>
                )}
                      </button>
                    </div>
                  </div>

              </div>
        {/* End Two-Column Grid */}

        {/* Divider */}
        <div className="my-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">AI Agent Configuration</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                  </div>

        {/* AI Agent Configuration Functions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: AI Agent Configuration */}
          <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-xl flex flex-col">
            <h3 className="text-xl font-bold text-white mb-8">AI Agent Configuration</h3>

            <div className="flex-1 flex flex-col justify-between space-y-6">
              {/* Retell Agent ID */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">
                  Agent ID
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="agent_xxxxxxxxxxxxx"
                  className="w-full px-5 py-4 bg-[#0B1437] text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none font-mono text-sm transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+15551234567"
                  className="w-full px-5 py-4 bg-[#0B1437] text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none font-mono text-sm transition-all"
                />
              </div>

              {/* Save AI Config Button */}
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    const response = await fetch('/api/admin/users/update-ai-config', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.id,
                        agentId: agentId.trim() || null,
                        phoneNumber: phoneNumber.trim() || null,
                        agentName: null,
                        maintenanceMode: user.ai_maintenance_mode,
                        scriptType: scriptType,
                      }),
                    });

                    if (!response.ok) throw new Error('Failed to save');

                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
                    notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-semibold">AI configuration saved!</span>';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);

                    loadUser();
                  } catch (err: any) {
                    alert(`Error: ${err.message}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save AI Config
                  </>
                )}
              </button>

              <div className="p-5 bg-[#0B1437]/70 rounded-xl border border-gray-700/50">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Configure the Retell AI agent settings for this user. Agent ID and phone number are required for AI calling functionality.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: AI Dialer Access Control */}
          <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-xl flex flex-col">
            <h3 className="text-xl font-bold text-white mb-6 text-center">AI Dialer Access Control</h3>

            <div className="flex-1 flex items-center justify-center">
              {/* Big Dialer Access Toggle Button */}
              <button
                onClick={async () => {
                  const newMode = !user.ai_maintenance_mode;
                  
                  if (!confirm(`${newMode ? 'BLOCK' : 'UNBLOCK'} AI Dialer access for this user?\n\n${newMode ? 'User will see "AI Agent Setup in Progress" page and cannot use dialer.' : 'User can access and use the AI Dialer!'}`)) return;
                  
                  setSaving(true);
                  try {
                    const response = await fetch('/api/admin/users/toggle-maintenance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.id,
                        maintenanceMode: newMode,
                      }),
                    });

                    if (!response.ok) throw new Error('Failed to toggle');

                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
                    notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-semibold">AI Dialer ' + (newMode ? 'BLOCKED' : 'UNBLOCKED') + '!</span>';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);

                    loadUser();
                  } catch (err: any) {
                    alert(`Error: ${err.message}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className={`group relative overflow-hidden w-full max-w-sm py-8 px-8 rounded-2xl border-2 font-bold text-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center ${
                  user.ai_maintenance_mode
                    ? 'bg-gradient-to-br from-red-600/20 to-rose-600/20 border-red-500/50 hover:border-red-400/70 text-red-400 hover:shadow-2xl hover:shadow-red-500/30'
                    : 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/50 hover:border-green-400/70 text-green-400 hover:shadow-2xl hover:shadow-green-500/30'
                }`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  <div className="relative z-10 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      {user.ai_maintenance_mode ? (
                        <Activity className="w-8 h-8" />
                      ) : (
                        <AlertCircle className="w-8 h-8" />
                      )}
                      <span>
                        {user.ai_maintenance_mode ? 'Unblock AI Dialer' : 'Block AI Dialer'}
                      </span>
                    </div>
                    <div className="text-sm font-normal opacity-80">
                      Status: {user.ai_maintenance_mode ? '🔴 DIALER BLOCKED' : '✅ DIALER ACTIVE'}
                    </div>
                  </div>
                )}
                
                {/* Animated shine effect */}
                {!saving && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* End AI Agent Configuration Functions Grid */}

        {/* Quick Setup Guide - Hidden when all steps complete */}
        {!onboardingSteps.all_complete && (
          <>
        {/* Divider */}
        <div className="my-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Check className="w-4 h-4" />
            Quick Setup Guide
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>

        {/* Quick Setup / Onboarding Steps Control */}
        <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-8 border border-yellow-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                <Clock className="w-6 h-6 text-yellow-400" />
                Onboarding Steps Control
              </h3>
              <p className="text-sm text-gray-400">Manually complete onboarding steps for this user</p>
                  </div>

            {/* Complete All Button */}
            <button
              onClick={async () => {
                if (!confirm('Mark ALL onboarding steps as complete for this user?')) return;
                
                setSaving(true);
                try {
                  const response = await fetch('/api/admin/users/complete-onboarding-steps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: user.id,
                      completeAll: true,
                    }),
                  });

                  if (!response.ok) throw new Error('Failed to complete all steps');

                  const notification = document.createElement('div');
                  notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
                  notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-semibold">✅ All steps completed!</span>';
                  document.body.appendChild(notification);
                  setTimeout(() => notification.remove(), 3000);

                  loadUser();
                } catch (err: any) {
                  alert(`Error: ${err.message}`);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || onboardingSteps.all_complete}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Complete All Steps
            </button>
          </div>

          {/* Onboarding Status Overview */}
          <div className="mb-6 p-4 bg-[#0B1437]/50 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Overall Status:</span>
              <span className={`px-4 py-2 rounded-full font-bold ${
                onboardingSteps.all_complete 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
              }`}>
                {onboardingSteps.all_complete ? '✅ All Complete' : '⏳ In Progress'}
              </span>
            </div>
          </div>

          {/* Individual Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Configure AI Agent Form */}
            <div className={`p-5 rounded-xl border-2 transition-all ${
              onboardingSteps.step_1_form
                ? 'bg-green-500/10 border-green-500/50'
                : 'bg-gray-800/50 border-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {onboardingSteps.step_1_form ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-500" />
                  )}
                  <div>
                    <h4 className="font-bold text-white">Step 1: Configure AI Agent</h4>
                    <p className="text-xs text-gray-400">Onboarding form completed</p>
                  </div>
                </div>
              </div>
                      <button
                    onClick={async () => {
                  setSaving(true);
                  try {
                    const response = await fetch('/api/admin/users/complete-onboarding-steps', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.id,
                        step: 1,
                      }),
                    });

                    if (!response.ok) throw new Error('Failed');
                    
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
                    notification.innerHTML = `<span class="font-semibold">✅ Step 1 marked complete!</span>`;
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 2000);

                    loadUser();
                  } catch (err: any) {
                    alert(`Error: ${err.message}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || onboardingSteps.step_1_form}
                className={`w-full mt-3 px-4 py-2 rounded-lg font-semibold transition-all ${
                  onboardingSteps.step_1_form
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {onboardingSteps.step_1_form ? 'Completed ✓' : 'Mark Complete'}
              </button>
            </div>

            {/* Step 2: Fund Call Balance */}
            <div className={`p-5 rounded-xl border-2 transition-all ${
              onboardingSteps.step_2_balance
                ? 'bg-green-500/10 border-green-500/50'
                : 'bg-gray-800/50 border-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {onboardingSteps.step_2_balance ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-500" />
                  )}
                  <div>
                    <h4 className="font-bold text-white">Step 2: Fund Call Balance</h4>
                    <p className="text-xs text-gray-400">Added funds & enabled auto-refill</p>
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                      setSaving(true);
                      try {
                    const response = await fetch('/api/admin/users/complete-onboarding-steps', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: user.id,
                        step: 2,
                          }),
                        });

                    if (!response.ok) throw new Error('Failed');

                        const notification = document.createElement('div');
                        notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
                    notification.innerHTML = `<span class="font-semibold">✅ Step 2 marked complete!</span>`;
                        document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 2000);

                        loadUser();
                      } catch (err: any) {
                        alert(`Error: ${err.message}`);
                      } finally {
                        setSaving(false);
                      }
                        }}
                disabled={saving || onboardingSteps.step_2_balance}
                className={`w-full mt-3 px-4 py-2 rounded-lg font-semibold transition-all ${
                  onboardingSteps.step_2_balance
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {onboardingSteps.step_2_balance ? 'Completed ✓' : 'Mark Complete'}
                      </button>
                    </div>

            {/* Step 3: Connect Lead Sheet */}
            <div className={`p-5 rounded-xl border-2 transition-all ${
              onboardingSteps.step_3_sheet
                ? 'bg-green-500/10 border-green-500/50'
                : 'bg-gray-800/50 border-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {onboardingSteps.step_3_sheet ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-500" />
                  )}
                  <div>
                    <h4 className="font-bold text-white">Step 3: Connect Lead Sheet</h4>
                    <p className="text-xs text-gray-400">Uploaded Google Sheet with leads</p>
                    </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    const response = await fetch('/api/admin/users/complete-onboarding-steps', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.id,
                        step: 3,
                      }),
                    });

                    if (!response.ok) throw new Error('Failed');
                    
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
                    notification.innerHTML = `<span class="font-semibold">✅ Step 3 marked complete!</span>`;
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 2000);

                    loadUser();
                  } catch (err: any) {
                    alert(`Error: ${err.message}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || onboardingSteps.step_3_sheet}
                className={`w-full mt-3 px-4 py-2 rounded-lg font-semibold transition-all ${
                  onboardingSteps.step_3_sheet
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {onboardingSteps.step_3_sheet ? 'Completed ✓' : 'Mark Complete'}
              </button>
            </div>

            {/* Step 4: Enable Auto-Schedule */}
            <div className={`p-5 rounded-xl border-2 transition-all ${
              onboardingSteps.step_4_schedule
                ? 'bg-green-500/10 border-green-500/50'
                : 'bg-gray-800/50 border-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {onboardingSteps.step_4_schedule ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-500" />
                  )}
                  <div>
                    <h4 className="font-bold text-white">Step 4: Auto-Schedule</h4>
                    <p className="text-xs text-gray-400">Configured dialer automation</p>
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    const response = await fetch('/api/admin/users/complete-onboarding-steps', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.id,
                        step: 4,
                      }),
                    });

                    if (!response.ok) throw new Error('Failed');
                    
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
                    notification.innerHTML = `<span class="font-semibold">✅ Step 4 marked complete!</span>`;
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 2000);

                    loadUser();
                  } catch (err: any) {
                    alert(`Error: ${err.message}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || onboardingSteps.step_4_schedule}
                className={`w-full mt-3 px-4 py-2 rounded-lg font-semibold transition-all ${
                  onboardingSteps.step_4_schedule
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {onboardingSteps.step_4_schedule ? 'Completed ✓' : 'Mark Complete'}
              </button>
                  </div>
                </div>
              </div>
          </>
        )}

        {/* Divider */}
        <div className="my-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Grant VIP</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                  </div>

        {/* Grant VIP Section */}
        <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-xl">
          {/* VIP Status Display */}
          <div className="mb-8 p-8 bg-[#0B1437]/70 rounded-xl border-2 border-gray-700/50 text-center">
            {user.account_type === 'VIP Access (Lifetime)' ? (
            <div>
                <div className="text-6xl mb-4 animate-pulse">✨👑✨</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  VIP GRANTED
            </div>
                <p className="text-gray-400 mt-2">Lifetime access • $0.30/minute</p>
              </div>
            ) : (
            <div>
                <div className="text-5xl mb-4">❌</div>
                <div className="text-3xl font-bold text-red-500">
                  VIP NOT GRANTED!!
            </div>
                <p className="text-gray-400 mt-2">Call Rate: $0.30/minute</p>
              </div>
            )}
          </div>

          {/* VIP Grant Button - ONLY SHOW IF NOT VIP */}
          {user.account_type !== 'VIP Access (Lifetime)' && (
            <div className="space-y-4">
                    <button
              onClick={async () => {
                  if (!confirm(`Grant ${user.full_name} VIP ACCESS? This gives them LIFETIME access with NO charges EVER!`)) return;
                setSaving(true);
                try {
                    const response = await fetch('/api/admin/users/update-subscription-tier', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: user.id,
                        tier: 'vip',
                    }),
                  });

                    const result = await response.json();
                    console.log('👑 VIP Grant Response:', result);
                    
                    if (!response.ok) throw new Error(result.error || 'Failed to grant VIP');

                  const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-yellow-500 to-orange-600 text-black px-8 py-5 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 flex items-center gap-4 font-bold text-lg';
                    notification.innerHTML = '<span class="text-3xl animate-bounce">👑</span><span>VIP ACCESS GRANTED!</span>';
                  document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 4000);
                  loadUser();
                } catch (err: any) {
                    console.error('❌ VIP Grant Error:', err);
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-4 flex items-center gap-3';
                    notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="font-semibold">Error: ' + err.message + '</span>';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
                className="relative group w-full py-12 px-8 rounded-2xl border-4 transition-all duration-300 overflow-hidden cursor-pointer border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Magical shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="text-center relative z-10">
                  <div className="text-7xl mb-4 animate-bounce inline-block">👑</div>
                  <h4 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent mb-3">
                    GRANT VIP ACCESS
                  </h4>
                  <p className="text-lg text-gray-200 font-medium mb-2">Lifetime Access • No Charges Ever</p>
                  <p className="text-sm text-gray-400">User will have unlimited access forever at $0.30/min call rate</p>
                </div>
                    </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
