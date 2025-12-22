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
  Plus,
  Minus,
  Zap,
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
  cal_api_key: string | null;
  has_active_subscription: boolean;
  subscription_tier: string | null;
  cost_per_minute?: number;
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
  const [calApiKey, setCalApiKey] = useState('');
  const [calEventId, setCalEventId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentPronoun, setAgentPronoun] = useState('she/her');
  const [costPerMinute, setCostPerMinute] = useState('0.40');
  const [timezone, setTimezone] = useState('America/New_York');
  const [confirmationEmail, setConfirmationEmail] = useState('');
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
      if (data.user.cal_api_key) setCalApiKey(data.user.cal_api_key);
      if (data.user.cal_event_id) setCalEventId(data.user.cal_event_id);
      if (data.user.agent_name) setAgentName(data.user.agent_name);
      if (data.user.agent_pronoun) setAgentPronoun(data.user.agent_pronoun);
      if (data.user.timezone) setTimezone(data.user.timezone);
      if (data.user.confirmation_email) setConfirmationEmail(data.user.confirmation_email);
      if (data.user.script_type) setScriptType(data.user.script_type);
      if (data.user.cost_per_minute !== undefined) setCostPerMinute(data.user.cost_per_minute.toString());
      
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
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl animate-pulse"></div>
          <Loader2 className="relative w-16 h-16 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="relative max-w-lg w-full">
          <div className="absolute inset-0 bg-red-500/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-red-900/30 to-red-600/20 border-2 border-red-500/40 rounded-2xl p-8 backdrop-blur-xl text-center shadow-2xl shadow-red-500/10">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg animate-pulse"></div>
              <div className="relative w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">User Not Found</h2>
            <p className="text-red-300 mb-6">{error || 'Unable to load user'}</p>
            <button
              onClick={() => router.push('/admin/user-management')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105"
            >
              Back to Users
            </button>
          </div>
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
          className="group relative flex items-center gap-2 px-6 py-3 bg-[#1A2647]/60 backdrop-blur-sm border border-gray-600/50 hover:border-cyan-500/50 rounded-xl transition-all duration-300 mb-6 text-white font-semibold overflow-hidden hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <ArrowLeft className="w-4 h-4 relative z-10 group-hover:-translate-x-1 transition-transform duration-300 text-cyan-400" />
          <span className="relative z-10">Back to Users</span>
        </button>

        {/* User Information Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-xl rounded-2xl p-8 border border-gray-600/50 shadow-2xl">
            {/* Header with Avatar and Name */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative group/avatar">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-md opacity-50 group-hover/avatar:opacity-75 transition-opacity"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl ring-2 ring-white/10">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{user.full_name}</h1>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300 hover:text-cyan-400 transition-colors cursor-pointer group/item">
                      <Database className="w-4 h-4 text-gray-500 group-hover/item:text-cyan-500 transition-colors" />
                      <span className="font-mono text-xs">{user.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300 hover:text-emerald-400 transition-colors cursor-pointer group/item">
                      <Phone className="w-4 h-4 text-gray-500 group-hover/item:text-emerald-500 transition-colors" />
                      <span className="font-mono">{user.phone || 'No phone number'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300 hover:text-blue-400 transition-colors cursor-pointer group/item">
                      <Mail className="w-4 h-4 text-gray-500 group-hover/item:text-blue-500 transition-colors" />
                      <span className="font-mono">{user.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Account Type Badge & View Dashboard Button */}
              <div className="flex flex-col items-end gap-4">
                {/* Account Type Badge */}
                <div className="relative group/badge">
                  <div className={`absolute inset-0 rounded-full blur-md transition-opacity ${
                    user.account_type?.includes('VIP') || user.subscription_tier === 'vip'
                      ? 'bg-yellow-500/30 opacity-50 group-hover/badge:opacity-75'
                      : user.account_type === 'Pro Access' || user.subscription_tier === 'pro' || user.account_type === 'Free Trial' || user.subscription_tier === 'trial'
                      ? 'bg-blue-500/30 opacity-50 group-hover/badge:opacity-75'
                      : 'bg-purple-500/30 opacity-50 group-hover/badge:opacity-75'
                  }`}></div>
                  <span className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-bold text-sm tracking-wide transition-all hover:scale-105 ${
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
                </div>

                {/* View Dashboard Button */}
                <a
                  href={`/login?email=${encodeURIComponent(user.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn relative flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl font-semibold transition-all duration-300 hover:scale-[1.03]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 rounded-xl shadow-lg shadow-cyan-500/0 group-hover/btn:shadow-cyan-500/30 transition-shadow duration-300"></div>
                  <ExternalLink className="w-5 h-5 relative z-10 text-cyan-400 group-hover/btn:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10 text-white">View Dashboard</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Single Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {/* Last AI Active / Running */}
          <div className="group/card relative cursor-pointer h-full">
            <div className={`absolute -inset-0.5 rounded-2xl blur-md transition-all duration-300 group-hover/card:blur-lg ${
              user.ai_is_running 
                ? 'bg-emerald-500/40 opacity-75 group-hover/card:opacity-100' 
                : 'bg-emerald-500/20 opacity-50 group-hover/card:opacity-75'
            }`}></div>
            <div className="relative h-full bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/40 shadow-xl transition-all duration-300 group-hover/card:scale-[1.02] flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 rounded-xl border transition-all ${
                  user.ai_is_running 
                    ? 'bg-emerald-500/30 border-emerald-400/60 shadow-lg shadow-emerald-500/30' 
                    : 'bg-emerald-500/10 border-emerald-500/30 group-hover/card:bg-emerald-500/20'
                }`}>
                  <Activity className={`w-6 h-6 ${user.ai_is_running ? 'text-emerald-300 animate-pulse' : 'text-emerald-400'}`} />
                </div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Last AI Active</div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {user.ai_is_running ? (
                  <>
                    <div className="text-3xl font-black text-emerald-400 mb-1 flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      Running
                    </div>
                    <div className="text-xs text-emerald-400 font-medium">Dialing now</div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-black text-gray-200 mb-1">
                      {user.last_ai_activity ? 'Inactive' : 'Never ran'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.last_ai_activity ? formatDate(user.last_ai_activity, false) : 'Never started'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Total Dials Made */}
          <div className="group/card relative cursor-pointer h-full">
            <div className="absolute -inset-0.5 bg-blue-500/20 rounded-2xl blur-md opacity-50 group-hover/card:opacity-75 group-hover/card:blur-lg transition-all duration-300"></div>
            <div className="relative h-full bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/40 shadow-xl transition-all duration-300 group-hover/card:scale-[1.02] flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 group-hover/card:bg-blue-500/20 group-hover/card:border-blue-400/50 transition-all shadow-lg shadow-blue-500/0 group-hover/card:shadow-blue-500/30">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Dials</div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-4xl font-black text-blue-400 mb-1 group-hover/card:text-blue-300 transition-colors">{user.total_calls || 0}</div>
                <div className="text-xs text-gray-500">All-time calls</div>
              </div>
            </div>
          </div>

          {/* Total Appointments Booked */}
          <div className="group/card relative cursor-pointer h-full">
            <div className="absolute -inset-0.5 bg-purple-500/20 rounded-2xl blur-md opacity-50 group-hover/card:opacity-75 group-hover/card:blur-lg transition-all duration-300"></div>
            <div className="relative h-full bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/40 shadow-xl transition-all duration-300 group-hover/card:scale-[1.02] flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30 group-hover/card:bg-purple-500/20 group-hover/card:border-purple-400/50 transition-all shadow-lg shadow-purple-500/0 group-hover/card:shadow-purple-500/30">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Appointments</div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-4xl font-black text-purple-400 mb-1 group-hover/card:text-purple-300 transition-colors">{user.total_appointments || 0}</div>
                <div className="text-xs text-gray-500">Booked</div>
              </div>
            </div>
          </div>

          {/* Total Profit */}
          <div className="group/card relative cursor-pointer h-full">
            <div className="absolute -inset-0.5 bg-green-500/25 rounded-2xl blur-md opacity-60 group-hover/card:opacity-100 group-hover/card:blur-lg transition-all duration-300"></div>
            <div className="relative h-full bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-xl rounded-2xl p-6 border-2 border-green-500/50 shadow-xl transition-all duration-300 group-hover/card:scale-[1.02] flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-500/15 rounded-xl border border-green-500/40 group-hover/card:bg-green-500/25 group-hover/card:border-green-400/60 transition-all shadow-lg shadow-green-500/0 group-hover/card:shadow-green-500/30">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Profit</div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-4xl font-black text-green-400 mb-1 group-hover/card:text-green-300 transition-colors">${user.profit?.toFixed(2) || '0.00'}</div>
                <div className="text-xs text-gray-500">From user</div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-full border border-cyan-500/30">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Dashboard Management</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
        </div>

        {/* Two-Column Grid: Dashboard Stats + Call Balance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* LEFT SIDE: Dashboard Stats Update Section */}
          <div className="group/section relative h-full">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-50 group-hover/section:opacity-75 transition-opacity duration-500"></div>
            <div className="relative h-full bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30 shadow-2xl flex flex-col">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Modify User Stats</h3>
                </div>
                <p className="text-sm text-gray-400 ml-11">Adjust dashboard numbers for a specific date.</p>
              </div>

              <div className="space-y-5">
                {/* Date Selection */}
                <div className="group/input">
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    Which date do you want to modify?
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#0B1437]/80 text-white rounded-xl border border-gray-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all hover:border-gray-500/70"
                  />
                </div>

                {/* Category Selection */}
                <div className="group/input">
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    Stat to Adjust
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 bg-[#0B1437]/80 text-white rounded-xl border border-gray-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all appearance-none hover:border-gray-500/70 cursor-pointer"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239CA3AF\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                  >
                    <option value="total_dials">Add/Remove Total Dials</option>
                    <option value="connected_calls">Add/Remove Connected Calls</option>
                    <option value="callback">Add/Remove Callback</option>
                    <option value="not_interested">Add/Remove Not Interested</option>
                    <option value="live_transfer">Add/Remove Live Transfer</option>
                    <option value="appointments">Add/Remove Appointment Booked</option>
                    <option value="policies_sold">Add/Remove Policy Sold</option>
                    <option value="revenue">Add/Remove Revenue</option>
                    <option value="ai_cost">Add/Remove AI Cost</option>
                  </select>
                </div>

                {/* Value Input */}
                <div className="group/input">
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    Adjustment Value
                  </label>
                  <input
                    type="number"
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(e.target.value)}
                    placeholder="Enter number (use + or -)"
                    className="w-full px-4 py-3.5 bg-[#0B1437]/80 text-white rounded-xl border border-gray-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all hover:border-gray-500/70 placeholder:text-gray-500"
                  />
                </div>

                {/* Action Button */}
                <div className="pt-2">
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

                        const notification = document.createElement('div');
                        notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl shadow-green-500/20 z-50 flex items-center gap-3 border border-green-500/30';
                        notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-semibold">Stats updated successfully!</span>';
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 3000);

                        setAdjustmentValue('');
                        loadUser();
                      } catch (err: any) {
                        const notification = document.createElement('div');
                        notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-4 rounded-xl shadow-2xl shadow-red-500/20 z-50 flex items-center gap-3 border border-red-500/30';
                        notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="font-semibold">Error: ' + err.message + '</span>';
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 3000);
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving || !adjustmentValue}
                    className="group/btn relative w-full overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center gap-2 px-8 py-4 text-white font-bold disabled:opacity-50">
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Database className="w-5 h-5" />
                          Apply Changes
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Call Balance Update Section */}
          <div className="group/section relative h-full">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-50 group-hover/section:opacity-75 transition-opacity duration-500"></div>
            <div className="relative h-full bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 shadow-2xl flex flex-col">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
                    <Wallet className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Update Call Balance</h3>
                </div>
                <p className="text-sm text-gray-400 ml-11">Add or remove credits from user's balance.</p>
              </div>

              <div className="flex-1 flex flex-col space-y-6">
                {/* Current Balance Display */}
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                    Current Call Balance
                  </label>
                  <div className="relative group/balance flex-1 flex">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-xl blur-md opacity-50 group-hover/balance:opacity-75 transition-opacity"></div>
                    <div className="relative flex-1 bg-[#0B1437]/80 rounded-xl p-6 border border-blue-500/30 flex items-center justify-center">
                      <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 text-center">
                        ${user.call_balance?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="group/input">
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    Adjustment Amount
                  </label>
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    placeholder="Enter number (use + or -)"
                    step="0.01"
                    className="w-full px-4 py-3.5 bg-[#0B1437]/80 text-white rounded-xl border border-gray-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all hover:border-gray-500/70 placeholder:text-gray-500"
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

                      const notification = document.createElement('div');
                      notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl shadow-green-500/20 z-50 flex items-center gap-3 border border-green-500/30';
                      notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-semibold">Call balance updated!</span>';
                      document.body.appendChild(notification);
                      setTimeout(() => notification.remove(), 3000);

                      setBalanceAmount('');
                      loadUser();
                    } catch (err: any) {
                      const notification = document.createElement('div');
                      notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-4 rounded-xl shadow-2xl shadow-red-500/20 z-50 flex items-center gap-3 border border-red-500/30';
                      notification.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="font-semibold">Error: ' + err.message + '</span>';
                      document.body.appendChild(notification);
                      setTimeout(() => notification.remove(), 3000);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || !balanceAmount}
                  className="group/btn relative w-full overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-600 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center justify-center gap-2 px-8 py-4 text-white font-bold disabled:opacity-50">
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        Apply Changes
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>
        {/* End Two-Column Grid */}

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/30">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">AI Agent Configuration</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
        </div>

        {/* AI Agent Configuration - Unified Section */}
        <div className="group/section relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-500/20 rounded-2xl blur-lg opacity-50 group-hover/section:opacity-75 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-xl rounded-2xl p-8 border border-emerald-500/30 shadow-2xl">
            {/* Header with Status Badge */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">AI Agent Configuration</h3>
                  <p className="text-sm text-gray-400 mt-0.5">Configure Retell AI settings and manage dialer access</p>
                </div>
              </div>
              
              {/* Dialer Status Badge */}
              <div className="relative group/status">
                <div className={`absolute inset-0 rounded-full blur-md transition-opacity ${
                  user.ai_maintenance_mode ? 'bg-red-500/30' : 'bg-green-500/30'
                } opacity-50 group-hover/status:opacity-75`}></div>
                <div className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-sm font-bold transition-all hover:scale-105 ${
                  user.ai_maintenance_mode
                    ? 'bg-red-500/15 border-red-500/50 text-red-400'
                    : 'bg-green-500/15 border-green-500/50 text-green-400'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${user.ai_maintenance_mode ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></span>
                  {user.ai_maintenance_mode ? 'Dialer Blocked' : 'Dialer Active'}
                </div>
              </div>
            </div>

            {/* Input Grid - Row 1: Phone & Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              {/* Phone Number */}
              <div className="group/input">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  📞 Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+15551234567"
                  className="w-full px-4 py-3 bg-[#0B1437]/80 text-white rounded-xl border border-gray-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none font-mono text-sm transition-all hover:border-gray-500/70 placeholder:text-gray-500"
                />
              </div>

              {/* Cal.ai API Key */}
              <div className="group/input">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  📅 Cal.ai API Key
                </label>
                <input
                  type="text"
                  value={calApiKey}
                  onChange={(e) => setCalApiKey(e.target.value)}
                  placeholder="cal_live_xxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 bg-[#0B1437]/80 text-white rounded-xl border border-gray-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none font-mono text-sm transition-all hover:border-gray-500/70 placeholder:text-gray-500"
                />
              </div>

              {/* Cal.ai Event ID */}
              <div className="group/input">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  📆 Cal.ai Event ID
                </label>
                <input
                  type="text"
                  value={calEventId}
                  onChange={(e) => setCalEventId(e.target.value)}
                  placeholder="30min-meeting"
                  className="w-full px-4 py-3 bg-[#0B1437]/80 text-white rounded-xl border border-gray-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none font-mono text-sm transition-all hover:border-gray-500/70 placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Input Grid - Row 2: Agent Identity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              {/* Agent Name */}
              <div className="group/input">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  🤖 Agent Name
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Sarah"
                  className="w-full px-4 py-3 bg-[#0B1437]/80 text-white rounded-xl border border-purple-500/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:outline-none text-sm transition-all hover:border-purple-500/60 placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">AI says: "Hi, I'm {agentName || 'Sarah'}..."</p>
              </div>

              {/* Agent Pronoun */}
              <div className="group/input">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  👤 Agent Pronoun
                </label>
                <select
                  value={agentPronoun}
                  onChange={(e) => setAgentPronoun(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0B1437]/80 text-white rounded-xl border border-purple-500/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:outline-none text-sm transition-all hover:border-purple-500/60 cursor-pointer appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239CA3AF\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                >
                  <option value="she/her">She / Her</option>
                  <option value="he/him">He / Him</option>
                  <option value="they/them">They / Them</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Used in script references</p>
              </div>

              {/* Cost Per Minute */}
              <div className="group/input">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  💰 Cost Per Minute
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">$</span>
                  <input
                    type="number"
                    value={costPerMinute}
                    onChange={(e) => setCostPerMinute(e.target.value)}
                    placeholder="0.40"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-[#0B1437]/80 text-white rounded-xl border border-emerald-500/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none font-mono text-sm transition-all hover:border-emerald-500/60 placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Input Grid - Row 3: Timezone & Email */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              {/* Timezone */}
              <div className="group/input">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  🌍 Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0B1437]/80 text-white rounded-xl border border-sky-500/40 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 focus:outline-none text-sm transition-all hover:border-sky-500/60 cursor-pointer appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239CA3AF\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                >
                  <option value="America/New_York">Eastern (America/New_York)</option>
                  <option value="America/Chicago">Central (America/Chicago)</option>
                  <option value="America/Denver">Mountain (America/Denver)</option>
                  <option value="America/Phoenix">Arizona (America/Phoenix)</option>
                  <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
                  <option value="America/Anchorage">Alaska (America/Anchorage)</option>
                  <option value="Pacific/Honolulu">Hawaii (Pacific/Honolulu)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Use in Retell: {"{{current_time_" + timezone + "}}"}</p>
              </div>

              {/* Confirmation Email */}
              <div className="group/input">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  📧 Confirmation Email
                </label>
                <input
                  type="email"
                  value={confirmationEmail}
                  onChange={(e) => setConfirmationEmail(e.target.value)}
                  placeholder="agent@example.com"
                  className="w-full px-4 py-3 bg-[#0B1437]/80 text-white rounded-xl border border-orange-500/40 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 focus:outline-none text-sm transition-all hover:border-orange-500/60 placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Booking confirmations sent here</p>
              </div>
            </div>

            {/* Agent ID (hidden - using global agents now) */}
            <input type="hidden" value={agentId} />

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              {/* Save AI Config Button */}
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    const response = await fetch('/api/admin/users/update-retell', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.id,
                        agentId: agentId.trim() || null,
                        phoneNumber: phoneNumber.trim() || null,
                        calApiKey: calApiKey.trim() || null,
                        calEventId: calEventId.trim() || null,
                        agentName: agentName.trim() || null,
                        agentPronoun: agentPronoun || 'she/her',
                        costPerMinute: parseFloat(costPerMinute) || 0.40,
                        timezone: timezone || 'America/New_York',
                        confirmationEmail: confirmationEmail.trim() || null,
                      }),
                    });

                    if (!response.ok) throw new Error('Failed to save');

                    const notification = document.createElement('div');
                    notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl shadow-green-500/20 z-50 flex items-center gap-3 border border-green-500/30';
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
                className="group/btn relative flex-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 rounded-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-center gap-2 px-6 py-4 text-white font-bold">
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
                </div>
              </button>

              {/* Dialer Access Toggle Button */}
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
                    notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl shadow-green-500/20 z-50 flex items-center gap-3 border border-green-500/30';
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
                className={`group/btn relative px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 overflow-hidden ${
                  user.ai_maintenance_mode
                    ? 'border-green-500/50 text-green-400'
                    : 'border-red-500/50 text-red-400'
                } disabled:opacity-50`}
              >
                <div className={`absolute inset-0 opacity-10 group-hover/btn:opacity-20 transition-opacity ${
                  user.ai_maintenance_mode ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                ) : user.ai_maintenance_mode ? (
                  <>
                    <Activity className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Unblock Dialer</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Block Dialer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* End AI Agent Configuration */}

        {/* Quick Setup Guide - Hidden when all steps complete */}
        {!onboardingSteps.all_complete && (
          <>
            {/* Divider */}
            <div className="my-10 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/30">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">Quick Setup Guide</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
            </div>

            {/* Quick Setup / Onboarding Steps Control */}
            <div className="group/section relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-orange-500/20 rounded-2xl blur-lg opacity-50 group-hover/section:opacity-75 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-xl rounded-2xl p-8 border border-amber-500/30 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Onboarding Steps Control</h3>
                    <p className="text-sm text-gray-400 mt-0.5">Manually complete onboarding steps for this user</p>
                  </div>
                </div>

                {/* Individual Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1: Configure AI Agent Form */}
                  <div className={`group/step relative transition-all duration-300 hover:scale-[1.02] ${
                    onboardingSteps.step_1_form ? '' : 'hover:shadow-lg hover:shadow-blue-500/10'
                  }`}>
                    <div className={`absolute -inset-0.5 rounded-xl blur-md transition-opacity ${
                      onboardingSteps.step_1_form 
                        ? 'bg-green-500/30 opacity-50' 
                        : 'bg-gray-500/20 opacity-30 group-hover/step:opacity-50'
                    }`}></div>
                    <div className={`relative p-5 rounded-xl border-2 transition-all ${
                      onboardingSteps.step_1_form
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-[#0B1437]/80 border-gray-600/50 hover:border-gray-500/70'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg border transition-all ${
                          onboardingSteps.step_1_form 
                            ? 'bg-green-500/20 border-green-500/50' 
                            : 'bg-gray-700/50 border-gray-600'
                        }`}>
                          {onboardingSteps.step_1_form ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Step 1: Configure AI Agent</h4>
                          <p className="text-xs text-gray-400">Onboarding form completed</p>
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
                            notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3';
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
                        className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all ${
                          onboardingSteps.step_1_form
                            ? 'bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
                        }`}
                      >
                        {onboardingSteps.step_1_form ? 'Completed ✓' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Fund Call Balance */}
                  <div className={`group/step relative transition-all duration-300 hover:scale-[1.02] ${
                    onboardingSteps.step_2_balance ? '' : 'hover:shadow-lg hover:shadow-blue-500/10'
                  }`}>
                    <div className={`absolute -inset-0.5 rounded-xl blur-md transition-opacity ${
                      onboardingSteps.step_2_balance 
                        ? 'bg-green-500/30 opacity-50' 
                        : 'bg-gray-500/20 opacity-30 group-hover/step:opacity-50'
                    }`}></div>
                    <div className={`relative p-5 rounded-xl border-2 transition-all ${
                      onboardingSteps.step_2_balance
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-[#0B1437]/80 border-gray-600/50 hover:border-gray-500/70'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg border transition-all ${
                          onboardingSteps.step_2_balance 
                            ? 'bg-green-500/20 border-green-500/50' 
                            : 'bg-gray-700/50 border-gray-600'
                        }`}>
                          {onboardingSteps.step_2_balance ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Step 2: Fund Call Balance</h4>
                          <p className="text-xs text-gray-400">Added funds & enabled auto-refill</p>
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
                            notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3';
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
                        className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all ${
                          onboardingSteps.step_2_balance
                            ? 'bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
                        }`}
                      >
                        {onboardingSteps.step_2_balance ? 'Completed ✓' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Connect Lead Sheet */}
                  <div className={`group/step relative transition-all duration-300 hover:scale-[1.02] ${
                    onboardingSteps.step_3_sheet ? '' : 'hover:shadow-lg hover:shadow-blue-500/10'
                  }`}>
                    <div className={`absolute -inset-0.5 rounded-xl blur-md transition-opacity ${
                      onboardingSteps.step_3_sheet 
                        ? 'bg-green-500/30 opacity-50' 
                        : 'bg-gray-500/20 opacity-30 group-hover/step:opacity-50'
                    }`}></div>
                    <div className={`relative p-5 rounded-xl border-2 transition-all ${
                      onboardingSteps.step_3_sheet
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-[#0B1437]/80 border-gray-600/50 hover:border-gray-500/70'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg border transition-all ${
                          onboardingSteps.step_3_sheet 
                            ? 'bg-green-500/20 border-green-500/50' 
                            : 'bg-gray-700/50 border-gray-600'
                        }`}>
                          {onboardingSteps.step_3_sheet ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Step 3: Connect Lead Sheet</h4>
                          <p className="text-xs text-gray-400">Uploaded Google Sheet with leads</p>
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
                            notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3';
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
                        className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all ${
                          onboardingSteps.step_3_sheet
                            ? 'bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
                        }`}
                      >
                        {onboardingSteps.step_3_sheet ? 'Completed ✓' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>

                  {/* Step 4: Enable Auto-Schedule */}
                  <div className={`group/step relative transition-all duration-300 hover:scale-[1.02] ${
                    onboardingSteps.step_4_schedule ? '' : 'hover:shadow-lg hover:shadow-blue-500/10'
                  }`}>
                    <div className={`absolute -inset-0.5 rounded-xl blur-md transition-opacity ${
                      onboardingSteps.step_4_schedule 
                        ? 'bg-green-500/30 opacity-50' 
                        : 'bg-gray-500/20 opacity-30 group-hover/step:opacity-50'
                    }`}></div>
                    <div className={`relative p-5 rounded-xl border-2 transition-all ${
                      onboardingSteps.step_4_schedule
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-[#0B1437]/80 border-gray-600/50 hover:border-gray-500/70'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg border transition-all ${
                          onboardingSteps.step_4_schedule 
                            ? 'bg-green-500/20 border-green-500/50' 
                            : 'bg-gray-700/50 border-gray-600'
                        }`}>
                          {onboardingSteps.step_4_schedule ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Step 4: Auto-Schedule</h4>
                          <p className="text-xs text-gray-400">Configured dialer automation</p>
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
                            notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3';
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
                        className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all ${
                          onboardingSteps.step_4_schedule
                            ? 'bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
                        }`}
                      >
                        {onboardingSteps.step_4_schedule ? 'Completed ✓' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Grant VIP Section - HIDDEN (use SQL to grant VIP now) */}
        {/* 
        <div className="my-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Grant VIP</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>
        ... VIP section hidden ...
        */}
      </div>
    </div>
  );
}
