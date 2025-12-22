'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, Zap, Phone, Clock, TrendingUp, Rocket, DollarSign, 
  Target, Calendar, AlertCircle, CheckCircle, Play, Square, RefreshCw, ListChecks, Settings, Check, X 
} from 'lucide-react';
import Link from 'next/link';
import { LaunchAIModalV2 } from './launch-ai-modal-v2';

interface AIDialerControlProps {
  userId: string;
}

export function AIDialerControl({ userId }: AIDialerControlProps) {
  const [status, setStatus] = useState<any>({ status: 'stopped', calls_today: 0, total_calls: 0 });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [dailyBudget, setDailyBudget] = useState(25);
  const [isUnlimitedBudget, setIsUnlimitedBudget] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: '',
  });
  const [showNoLeadsWarning, setShowNoLeadsWarning] = useState(false);
  const [noLeadsMessage, setNoLeadsMessage] = useState('');
  const [noLeadsReason, setNoLeadsReason] = useState<'no_sheets' | 'no_leads' | 'all_dialed_today' | 'all_exhausted' | null>(null);
  const [noLeadsData, setNoLeadsData] = useState<{ potentialLeadsCount?: number; leadsDialedToday?: number } | null>(null);
  const [previousStatus, setPreviousStatus] = useState<any>(null);
  const [dialerSettings, setDialerSettings] = useState<any>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStep, setLaunchStep] = useState(0);
  
  // Fetch status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/dialer/status');
      const data = await response.json();
      if (data.success) {
        setPreviousStatus(status); // Save previous for animation detection
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      // After first fetch, mark initial loading as complete
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  };

  // Check if a metric changed (for animation trigger)
  const hasChanged = (key: string) => {
    return previousStatus && status && previousStatus[key] !== status[key];
  };

  // Fetch dialer settings (with cache busting to always get fresh data)
  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/dialer/settings?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const data = await response.json();
      console.log('🔄 Fetched dialer settings, auto_start_enabled:', data.settings?.auto_start_enabled);
      if (data.success) {
        setDialerSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchSettings();
  }, []);

  // Poll status constantly (every 2 seconds) to show real-time updates
  // Also refresh settings every 5 seconds to catch automation changes
  useEffect(() => {
    // Immediate fetch
    fetchStatus();
    fetchSettings();
    
    // Poll status every 2 seconds for responsive UI
    const statusInterval = setInterval(() => {
      fetchStatus();
    }, 2000);
    
    // Poll settings every 5 seconds to catch automation changes
    const settingsInterval = setInterval(() => {
      fetchSettings();
    }, 5000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(settingsInterval);
    };
  }, []); // Run once on mount, intervals handle updates

  const showError = (title: string, message: string) => {
    setErrorModal({ show: true, title, message });
  };

  // ========================================================================
  // CHECK LEADS FIRST - Called when user clicks Launch button
  // ========================================================================
  const handleLaunchButtonClick = async () => {
    setActionLoading(true);
    
    try {
      // Check for callable leads BEFORE showing any modals
      const leadsCheckResponse = await fetch(`/api/ai-control/check-leads?userId=${userId}`);
      const leadsCheckData = await leadsCheckResponse.json();
      
      if (!leadsCheckData.hasCallableLeads) {
        setActionLoading(false);
        setNoLeadsMessage(leadsCheckData.message || 'You have no leads available to call.');
        setNoLeadsReason(leadsCheckData.reason || null);
        setNoLeadsData({
          potentialLeadsCount: leadsCheckData.potentialLeadsCount,
          leadsDialedToday: leadsCheckData.leadsDialedToday,
        });
        setShowNoLeadsWarning(true);
        return;
      }
      
      console.log(`✅ Found ${leadsCheckData.callableLeadsCount} callable leads - proceeding to launch flow`);
      setActionLoading(false);
      
      // Now proceed with the normal flow
      if (autoScheduleEnabled && isPausedBudget) {
        setShowOverrideModal(true);
      } else if (!autoScheduleEnabled) {
        setShowBudgetModal(true);
      } else {
        handleLaunch();
      }
    } catch (error) {
      console.error('Error checking leads:', error);
      setActionLoading(false);
      showError('Error', 'Failed to check leads. Please try again.');
    }
  };

  const handleBudgetConfirm = async (budget: number, unlimited: boolean) => {
    setShowBudgetModal(false);
    await handleLaunch(budget);
  };

  const handleLaunch = async (budgetOverride?: number) => {
    setActionLoading(true);
    setIsLaunching(true);
    
    try {
      // If budget was provided, save it to settings first
      if (budgetOverride !== undefined) {
        await fetch('/api/ai-control/automation-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            dailySpendLimit: budgetOverride,
          }),
        });
      }
      
      // Launch sequence animation
      setLaunchStep(1); // Preparing...
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setLaunchStep(2); // Initializing AI...
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setLaunchStep(3); // Launching...
      
      const response = await fetch('/api/dialer/launch', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setLaunchStep(4); // Success!
        await new Promise(resolve => setTimeout(resolve, 800));
        await fetchStatus();
        setIsLaunching(false);
        setLaunchStep(0);
      } else {
        setIsLaunching(false);
        setLaunchStep(0);
        showError('Cannot Launch', data.error || 'Failed to launch AI dialer');
      }
    } catch (error) {
      setIsLaunching(false);
      setLaunchStep(0);
      showError('Launch Failed', 'Unable to start the AI dialer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    
    // Immediately update UI to show "STANDBY" (optimistic update)
    setStatus((prev: any) => ({ ...prev, status: 'idle' }));
    
    try {
      const response = await fetch('/api/dialer/stop', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        // Fetch latest status to confirm
        await fetchStatus();
      } else {
        // Revert UI if stop failed
        await fetchStatus();
        showError('Stop Failed', data.error || 'Failed to stop AI dialer');
      }
    } catch (error) {
      // Revert UI if stop failed
      await fetchStatus();
      showError('Stop Failed', 'Unable to stop the AI dialer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverride = async (extraLeads: number = 20) => {
    setActionLoading(true);
    setShowOverrideModal(false);
    
    try {
      const response = await fetch('/api/dialer/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraLeads }),
      });
      const data = await response.json();
      
      if (response.ok) {
        // Show success briefly then refresh
        await fetchStatus();
      } else {
        showError('Override Failed', data.error || 'Failed to activate override');
      }
    } catch (error) {
      showError('Override Failed', 'Unable to activate override. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case 'running': return 'green';
      case 'idle': return 'gray';
      case 'outside-hours': return 'purple';
      case 'paused-budget': return 'yellow';
      case 'paused-balance': return 'red';
      case 'no-leads': return 'orange';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = () => {
    switch (status?.status) {
      case 'running': return 'ACTIVE';
      case 'idle': return 'STANDBY';
      case 'outside-hours': return 'AFTER HOURS';
      case 'paused-budget': return 'PAUSED - BUDGET';
      case 'paused-balance': return 'PAUSED - LOW BALANCE';
      case 'no-leads': return 'NO LEADS';
      case 'error': return 'ERROR';
      default: return 'LOADING';
    }
  };

  const getStatusSubtext = () => {
    if (status?.status === 'outside-hours') {
      return ''; // We'll show a custom message in the UI
    }
    if (status?.reason) return status.reason;
    switch (status?.status) {
      case 'running': return 'AI is actively dialing leads';
      case 'idle': 
        // Don't show subtext when auto-schedule is on (message shown below button instead)
        if (autoScheduleEnabled) {
          return '';
        }
        return 'AI is ready to launch';
      case 'paused-budget': return "You've hit today's spend limit. The AI paused automatically to protect your budget.";
      case 'paused-balance': return 'Call balance too low';
      case 'no-leads': return 'No pending leads to call';
      default: return '';
    }
  };

  const formatTime = (time: string) => {
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } catch {
      return time;
    }
  };

  // Handle division by zero when budget is not set
  const spendPercent = status && status.dailyBudgetCents > 0 
    ? Math.min((status.todaySpendCents / status.dailyBudgetCents) * 100, 100) 
    : 0;
  const isRunning = status?.status === 'running';
  const isPausedBudget = status?.status === 'paused-budget';
  const isOutsideHours = status?.status === 'outside-hours';
  const noBudgetSet = status && status.dailyBudgetCents === 0;
  const color = getStatusColor();
  
  // Auto-schedule logic - explicitly check for true (not just truthy)
  const autoScheduleEnabled = dialerSettings?.auto_start_enabled === true;
  const autoStartTime = dialerSettings?.auto_start_time || '09:00';
  
  console.log('🎛️ Auto-schedule status:', { autoScheduleEnabled, rawValue: dialerSettings?.auto_start_enabled });
  
  // Determine button state - also hide button when outside calling hours
  const isButtonDisabled = (autoScheduleEnabled && !isPausedBudget && !isRunning) || isOutsideHours;
  const buttonText = isRunning ? 'Stop AI Dialer' : 
                     (autoScheduleEnabled && isPausedBudget) ? 'Override Budget' :
                     'Launch AI Dialer';

  // Calculate dynamic override leads based on time remaining until 8 PM
  const calculateOverrideLeads = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // End of calling hours is 8 PM (20:00)
    const endHour = 20;
    
    console.log('🕐 Current time:', `${currentHour}:${currentMinute}`);
    console.log('🕐 End hour:', endHour);
    
    // If already past 8 PM, default to 20 leads
    if (currentHour >= endHour) {
      console.log('⏰ Past 8 PM, using default 20 leads');
      return 20;
    }
    
    // Calculate time remaining
    const totalMinutesNow = currentHour * 60 + currentMinute;
    const totalMinutesEnd = endHour * 60;
    const minutesRemaining = totalMinutesEnd - totalMinutesNow;
    const hoursRemainingDecimal = minutesRemaining / 60;
    
    console.log('⏰ Minutes remaining:', minutesRemaining);
    console.log('⏰ Hours remaining:', hoursRemainingDecimal.toFixed(2));
    
    // 60 dials per hour
    const potentialDials = Math.round(hoursRemainingDecimal * 60);
    console.log('📊 Potential dials:', potentialDials);
    
    // Take 20% of potential dials
    const recommendedLeads = Math.round(potentialDials * 0.2);
    console.log('🎯 Recommended leads (20%):', recommendedLeads);
    
    // Minimum 10, maximum 200
    const finalLeads = Math.max(10, Math.min(recommendedLeads, 200));
    console.log('✅ Final override leads:', finalLeads);
    
    return finalLeads;
  };

  const overrideLeads = calculateOverrideLeads();
  const overrideCostCents = overrideLeads * 1 * 30; // leads × 1 min × $0.30
  const overrideCostDollars = (overrideCostCents / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <main className="container mx-auto px-4 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
              <Phone className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                AI Dialer
              </h1>
              <p className="text-gray-400 mt-1">Deploy and monitor your AI calling agent</p>
            </div>
          </div>
          
          {/* Settings Icon */}
          <Link
            href="/dashboard/settings/dialer-automation"
            className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gray-800/50 hover:bg-gray-800 border-2 border-gray-700 hover:border-blue-500/50 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
            title="Dialer Settings"
          >
            <Settings className="w-6 h-6 text-gray-400 group-hover:text-blue-400 group-hover:rotate-90 transition-all duration-300" />
          </Link>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* EXECUTION MODE PROGRESS - Dynamic based on Budget or Lead Count */}
          {isRunning && (() => {
            // Budget mode is detected by isBudgetMode flag or budgetLimitCents > 0
            const isBudgetMode = status?.isBudgetMode || (status?.budgetLimitCents && status.budgetLimitCents > 0);
            const isLeadMode = !isBudgetMode;
            
            // Calculate progress based on mode
            let current = 0;
            let target = 0;
            let remaining = 0;
            let progressPercent = 0;
            
            if (isLeadMode) {
              // Lead Count Mode
              current = status?.callsMadeToday || 0;
              target = status?.targetLeadCount || 0;
              remaining = Math.max(0, target - current);
              progressPercent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            } else {
              // Budget Mode - use budgetLimitCents (session budget), not dailyBudgetCents
              current = status?.todaySpendCents || 0;
              target = status?.budgetLimitCents || 0; // Use session budget, not daily budget setting
              remaining = Math.max(0, target - current);
              progressPercent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            }
            
            return (
              <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-6 border-2 border-gray-800 shadow-xl overflow-hidden animate-in slide-in-from-top duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 animate-pulse" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {isLeadMode ? (
                        <Target className="w-6 h-6 text-cyan-400" />
                      ) : (
                        <DollarSign className="w-6 h-6 text-green-400" />
                      )}
                      <h3 className="text-xl font-bold text-white">
                        {isLeadMode ? 'Lead Count Progress' : 'Budget Progress'}
                      </h3>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                      target === 0 ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                      progressPercent >= 100 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      progressPercent >= 75 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {target === 0 ? 'NO TARGET SET' :
                       progressPercent >= 100 ? 'TARGET REACHED' :
                       progressPercent >= 75 ? 'APPROACHING' :
                       'ON TRACK'}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-white">
                      {isLeadMode ? current : `$${(current / 100).toFixed(2)}`}
                    </span>
                    <span className="text-gray-400">
                      / {isLeadMode ? target : `$${(target / 100).toFixed(2)}`}
                    </span>
                  </div>

                  {target > 0 && (
                    <p className="text-sm text-gray-400 mb-3">
                      Remaining: <span className={`font-semibold ${progressPercent >= 100 ? 'text-red-400' : 'text-green-400'}`}>
                        {isLeadMode ? `${remaining} leads` : `$${(remaining / 100).toFixed(2)}`}
                      </span>
                    </p>
                  )}

                  <div className="relative w-full h-3 bg-gray-900/50 rounded-full overflow-hidden border border-gray-800">
                    <div 
                      className={`absolute inset-0 blur-md transition-all duration-500 ${
                        progressPercent >= 100 ? 'bg-red-500/30' :
                        progressPercent >= 75 ? 'bg-yellow-500/30' :
                        isLeadMode ? 'bg-cyan-500/30' : 'bg-purple-500/30'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                    <div
                      className={`relative h-full transition-all duration-500 ${
                        progressPercent >= 100 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        progressPercent >= 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        isLeadMode ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500' :
                        'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500'
                      } shadow-lg ${
                        progressPercent >= 100 ? 'shadow-red-500/50' :
                        progressPercent >= 75 ? 'shadow-yellow-500/50' :
                        isLeadMode ? 'shadow-cyan-500/50' : 'shadow-purple-500/50'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STATUS HEADER */}
          {initialLoading ? (
            /* Skeleton Loading UI */
            <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border-2 border-gray-800 p-12 shadow-xl overflow-hidden animate-pulse">
              <div className="relative z-10 text-center">
                {/* Skeleton Icon */}
                <div className="inline-block mb-6">
                  <div className="w-32 h-32 rounded-3xl bg-gray-700/50 flex items-center justify-center">
                    <Zap className="w-16 h-16 text-gray-600" />
                  </div>
                </div>
                
                {/* Skeleton Status Pill */}
                <div className="flex justify-center mb-3">
                  <div className="h-10 w-40 bg-gray-700/50 rounded-full" />
                </div>
                
                {/* Skeleton Subtext */}
                <div className="flex justify-center mb-8">
                  <div className="h-5 w-64 bg-gray-700/30 rounded" />
                </div>
                
                {/* Skeleton Button */}
                <div className="flex justify-center">
                  <div className="h-16 w-56 bg-gray-700/40 rounded-xl" />
                </div>
              </div>
            </div>
          ) : (
          <div className={`relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border-2 p-12 shadow-xl overflow-hidden animate-in fade-in duration-300 ${
            color === 'green' ? 'border-green-500/40 animate-breathing-border' :
            color === 'purple' ? 'border-purple-500/40' :
            color === 'yellow' ? 'border-yellow-500/40' :
            color === 'red' ? 'border-red-500/40' :
            'border-gray-800'
          }`}>
            {/* Animated waves when running */}
            {isRunning && (
              <>
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent animate-wave-1" />
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent animate-wave-2" />
                </div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
              </>
            )}

            {/* Night mode background for outside hours */}
            {isOutsideHours && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-transparent" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
                {/* Decorative stars */}
                <div className="absolute top-8 right-12 text-2xl animate-pulse" style={{ animationDuration: '2s' }}>✨</div>
                <div className="absolute top-16 right-28 text-lg animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>⭐</div>
              </>
            )}

            <div className="relative z-10 text-center">
              {/* Icon */}
              <div className="inline-block mb-6 relative">
                {isRunning && (
                  <>
                    <div className="absolute inset-0 bg-green-500/40 rounded-3xl blur-3xl animate-breathing" />
                    {/* Orbiting particles */}
                    <div className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2">
                      <div className="absolute top-0 left-1/2 w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-500/50 animate-spin-slow" style={{ transformOrigin: '0 96px' }} />
                    </div>
                    <div className="absolute top-1/2 left-1/2 w-56 h-56 -translate-x-1/2 -translate-y-1/2">
                      <div className="absolute top-0 left-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/50 animate-spin-reverse" style={{ animationDelay: '0.5s', transformOrigin: '0 112px' }} />
                    </div>
                  </>
                )}
                
                <div className={`relative w-32 h-32 rounded-3xl flex items-center justify-center border-4 transition-all duration-500 ${
                  color === 'green' ? 'bg-green-500/20 border-green-500 animate-breathing' :
                  color === 'purple' ? 'bg-purple-500/20 border-purple-500' :
                  color === 'yellow' ? 'bg-yellow-500/20 border-yellow-500' :
                  color === 'red' ? 'bg-red-500/20 border-red-500' :
                  'bg-gray-800/30 border-gray-700'
                }`}>
                  {isRunning ? (
                    <Activity className="w-16 h-16 text-green-400 animate-pulse-fast" />
                  ) : isOutsideHours ? (
                    <Clock className="w-16 h-16 text-purple-400" />
                  ) : (
                    <Zap className="w-16 h-16 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Status Pill */}
              <div className={`inline-block px-6 py-2 rounded-full mb-3 font-bold text-lg ${
                color === 'green' ? 'bg-green-500/20 text-green-400 border-2 border-green-500/40 animate-breathing' :
                color === 'purple' ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/40' :
                color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40' :
                color === 'red' ? 'bg-red-500/20 text-red-400 border-2 border-red-500/40' :
                'bg-gray-500/20 text-gray-400 border-2 border-gray-500/40'
              }`}>
                {getStatusText()}
              </div>

              {/* Subtext - or special outside hours message */}
              {isOutsideHours ? (
                <div className="mb-8 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-purple-300">
                    <Clock className="w-5 h-5" />
                    <span className="text-lg font-medium">Calling hours have ended for today</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    AI calling resumes at <span className="text-purple-400 font-semibold">9:00 AM</span> • Current time: <span className="text-white font-medium">{status?.currentTime}</span>
                  </p>
                  <div className="mt-4 px-6 py-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <p className="text-purple-200 text-sm">
                     🌙  The AI dialer operates between <span className="font-bold">9:00 AM - 6:00 PM (Mon-Sat)</span> to ensure calls are made during appropriate business hours. 🌙
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 mb-8">{getStatusSubtext()}</p>
              )}

              {/* Main Button - Hide when auto-schedule is enabled and idle */}
              {!isButtonDisabled && (
                <button
                  onClick={() => {
                    if (isRunning) {
                      handleStop();
                    } else {
                      // Always check for leads first before showing any modal
                      handleLaunchButtonClick();
                    }
                  }}
                  disabled={actionLoading}
                  className={`group relative overflow-hidden px-12 py-5 rounded-xl font-bold text-xl transition-all duration-300 ${
                    isRunning
                      ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-2xl hover:shadow-red-500/50'
                      : (autoScheduleEnabled && isPausedBudget)
                      ? 'bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 hover:from-yellow-500 hover:via-orange-500 hover:to-red-500 text-white hover:shadow-2xl hover:shadow-yellow-500/50'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white hover:shadow-2xl hover:shadow-blue-500/50'
                  } hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isRunning ? (
                      <>
                        <Square className="w-6 h-6" />
                        Stop AI Dialer
                      </>
                    ) : (autoScheduleEnabled && isPausedBudget) ? (
                      <>
                        <Play className="w-6 h-6" />
                        Run {overrideLeads} More Leads (~${overrideCostDollars})
                      </>
                    ) : (
                      <>
                        <Rocket className="w-6 h-6" />
                        Launch AI Dialer
                      </>
                    )}
                  </span>
                  {!isRunning && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  )}
                </button>
              )}

              {/* Auto-schedule info - Only show when enabled */}
              {autoScheduleEnabled && !isPausedBudget && !isRunning && (
                <div className="text-center">
                  <p className="text-blue-400 font-semibold mb-1">
                    ✓ Automation Enabled
                  </p>
                  <p className="text-gray-400 text-sm">
                    AI will auto-run at {formatTime(autoStartTime)} on scheduled days
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* MINI METRICS GRID */}
          <div className="grid grid-cols-3 gap-4">
            {/* ROW 1 */}
            {/* Dials Today */}
            <div className={`bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-5 border border-blue-500/20 transition-all duration-300 hover:scale-105 hover:border-blue-500/40 cursor-pointer ${
              hasChanged('todayCalls') ? 'animate-metric-update' : ''
            }`}>
              <Phone className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-sm text-gray-400">Dials Today</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-blue-400">{status?.todayCalls || 0}</p>
                {status?.callsTrend !== undefined && status.callsTrend !== 0 && (
                  <span className={`text-xs font-semibold ${
                    status.callsTrend > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {status.callsTrend > 0 ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>

            {/* Minutes Used */}
            <div className={`bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-5 border border-purple-500/20 transition-all duration-300 hover:scale-105 hover:border-purple-500/40 cursor-pointer ${
              hasChanged('todayMinutes') ? 'animate-metric-update' : ''
            }`}>
              <Clock className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-sm text-gray-400">Minutes Used</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-purple-400">{status?.todayMinutes || 0}</p>
                {status?.minutesTrend !== undefined && status.minutesTrend !== 0 && (
                  <span className={`text-xs font-semibold ${
                    status.minutesTrend > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {status.minutesTrend > 0 ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>

            {/* Spend Today */}
            <div className={`bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-5 border border-emerald-500/20 transition-all duration-300 hover:scale-105 hover:border-emerald-500/40 cursor-pointer ${
              hasChanged('todaySpendCents') ? 'animate-metric-update' : ''
            }`}>
              <DollarSign className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-sm text-gray-400">Spend Today</p>
              <p className="text-3xl font-bold text-emerald-400">
                ${((status?.todaySpendCents || 0) / 100).toFixed(2)}
              </p>
            </div>

            {/* ROW 2 */}
            {/* Calls Per Appointment */}
            <div className={`bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-5 border border-orange-500/20 transition-all duration-300 hover:scale-105 hover:border-orange-500/40 cursor-pointer ${
              hasChanged('callsPerAppointment') ? 'animate-metric-update' : ''
            }`}>
              <ListChecks className="w-8 h-8 text-orange-400 mb-2" />
              <p className="text-sm text-gray-400">Calls Per Appointment</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-orange-400">
                  {status?.callsPerAppointment || '—'}
                </p>
                {status?.callsPerAppointmentTrend !== undefined && status.callsPerAppointmentTrend !== 0 && (
                  <span className={`text-xs font-semibold ${
                    status.callsPerAppointmentTrend < 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {status.callsPerAppointmentTrend < 0 ? '↓' : '↑'}
                  </span>
                )}
              </div>
            </div>

            {/* Appointments */}
            <div className={`bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-5 border border-green-500/20 transition-all duration-300 hover:scale-105 hover:border-green-500/40 cursor-pointer ${
              hasChanged('todayAppointments') ? 'animate-metric-update' : ''
            }`}>
              <Calendar className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-sm text-gray-400">Appointments</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-400">{status?.todayAppointments || 0}</p>
                {status?.appointmentsTrend !== undefined && status.appointmentsTrend !== 0 && (
                  <span className={`text-xs font-semibold ${
                    status.appointmentsTrend > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {status.appointmentsTrend > 0 ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>

            {/* Remaining Call Balance */}
            <div className={`bg-gradient-to-br rounded-xl p-5 border ${
              status?.lowBalance 
                ? 'from-red-500/10 to-red-600/5 border-red-500/20'
                : 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20'
            } transition-all duration-300 hover:scale-105 cursor-pointer ${
              status?.lowBalance 
                ? 'hover:border-red-500/40'
                : 'hover:border-indigo-500/40'
            } ${
              hasChanged('callBalanceCents') ? 'animate-metric-update' : ''
            }`}>
              <TrendingUp className={`w-8 h-8 mb-2 ${status?.lowBalance ? 'text-red-400' : 'text-indigo-400'}`} />
              <p className="text-sm text-gray-400">Remaining Call Balance</p>
              <p className={`text-3xl font-bold ${status?.lowBalance ? 'text-red-400' : 'text-indigo-400'}`}>
                ${((status?.callBalanceCents || 0) / 100).toFixed(2)}
              </p>
              {status?.lowBalance && (
                <p className="text-xs text-red-400 mt-1">⚠️ Low</p>
              )}
            </div>
          </div>

          {/* INFO FOOTER */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              How It Works
            </h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• AI automatically dials your pending leads based on priority rules</p>
              <p>• Stops when daily budget is reached or no leads remain</p>
              <p>• Configure automation schedule in <a href="/dashboard/settings/dialer-automation" className="text-blue-400 hover:text-blue-300">Dialer Automation Settings</a></p>
            </div>
          </div>
        </div>
      </main>

      {/* Launch Sequence Animation */}
      {isLaunching && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center overflow-hidden">
          {/* Animated Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-3xl animate-launch-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-3xl animate-launch-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/40 rounded-full blur-3xl animate-launch-pulse" style={{ animationDelay: '0.4s' }} />
          </div>

          {/* Launch Content */}
          <div className="relative z-10 text-center animate-in fade-in zoom-in duration-500">
            {/* Icon */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-blue-500/50 rounded-full blur-3xl animate-launch-glow" />
              <div className="relative w-40 h-40 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full border-4 border-blue-500 flex items-center justify-center animate-launch-icon">
                <Rocket className="w-20 h-20 text-blue-400" />
              </div>
              {/* Orbiting rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-ping" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56">
                <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-white animate-pulse">
                {launchStep === 1 && '⚙️ Preparing...'}
                {launchStep === 2 && '🤖 Initializing AI...'}
                {launchStep === 3 && '🚀 Launching...'}
                {launchStep === 4 && '✅ Success!'}
              </h2>
              <p className="text-gray-400 text-lg">
                {launchStep === 1 && 'Setting up your calling environment'}
                {launchStep === 2 && 'Activating AI agents'}
                {launchStep === 3 && 'Starting dialer engine'}
                {launchStep === 4 && 'AI Dialer is now active!'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-8 w-96 max-w-full mx-auto">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 transition-all duration-500 animate-shimmer-progress"
                  style={{ width: `${launchStep * 25}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launch AI Modal V2 - NEW TABS VERSION */}
      {showBudgetModal && (
        <LaunchAIModalV2
          userId={userId}
          initialLimit={dialerSettings?.daily_call_limit || 15}
          initialTransfer={dialerSettings?.auto_transfer_calls ?? true}
          initialMode={dialerSettings?.execution_mode || 'budget'}
          initialLeadCount={dialerSettings?.target_lead_count}
          initialTargetTime={dialerSettings?.target_time_military}
          maxCallsAllowed={600}
          subscriptionTier={dialerSettings?.subscription_tier}
          onClose={() => setShowBudgetModal(false)}
          onLaunched={() => {
            setShowBudgetModal(false);
            fetchStatus(); // Refresh status immediately after launch
          }}
        />
      )}

      {/* Override Confirmation Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border-2 border-yellow-500/40 max-w-lg w-full shadow-2xl">
            <div className="p-8 border-b border-gray-800/50">
              <h2 className="text-3xl font-bold text-white mb-2">Run Extra Batch?</h2>
              <p className="text-gray-400">Temporarily override your daily budget</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-6">
                <p className="text-yellow-400 font-bold text-lg mb-4">Override Details</p>
                <div className="space-y-3 text-base text-gray-200">
                  <p>• Run <strong className="text-white">{overrideLeads} extra leads</strong></p>
                  <p>• Estimated cost: <strong className="text-yellow-400">${overrideCostDollars}</strong></p>
                  <p>• Does not change your daily budget setting</p>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed">
                This will resume the AI dialer for one additional batch. Your daily budget limit will remain unchanged.
              </p>
            </div>

            <div className="p-6 border-t border-gray-800/50 flex gap-3">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="flex-1 px-6 py-4 border-2 border-gray-700 bg-gray-800/30 text-gray-300 hover:text-white hover:bg-gray-800/50 hover:border-gray-600 rounded-xl transition-all font-semibold text-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOverride(overrideLeads)}
                disabled={actionLoading}
                className="group relative overflow-hidden flex-1 px-6 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/60 disabled:opacity-50"
              >
                <span className="relative z-10">Confirm Override</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border-2 border-red-500/40 max-w-lg w-full shadow-2xl shadow-red-500/20 animate-in fade-in zoom-in duration-300">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div className="absolute w-64 h-64 bg-red-500/10 rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
            </div>

            <div className="relative">
              {/* Header */}
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl border-2 border-red-500/50 flex items-center justify-center shadow-lg shadow-red-500/20">
                    <AlertCircle className="w-7 h-7 text-red-400 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">{errorModal.title}</h2>
                    <p className="text-sm text-red-400">Please review the issue below</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-red-950/30 border-2 border-red-500/30 rounded-xl p-5">
                  <p className="text-gray-200 leading-relaxed text-base">{errorModal.message}</p>
                </div>

                {/* Show settings button if it's a budget error */}
                {errorModal.message.includes('daily budget') && (
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-sm text-blue-300 mb-3">
                      💡 You need to configure your daily spend limit before launching the AI dialer
                    </p>
                    <a
                      href="/dashboard/settings/dialer-automation"
                      className="group relative overflow-hidden w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Go to Dialer Settings
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    </a>
                  </div>
                )}

                {/* Show upload leads button if it's a leads error */}
                {errorModal.message.includes('pending leads') && (
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-sm text-blue-300 mb-3">
                      💡 Upload leads to your Lead Manager to start calling
                    </p>
                    <a
                      href="/dashboard/leads"
                      className="group relative overflow-hidden w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Go to Lead Manager
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-800/50">
                <button
                  onClick={() => setErrorModal({ show: false, title: '', message: '' })}
                  className="w-full px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border-2 border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Leads Warning Modal - Different styles for different reasons */}
      {showNoLeadsWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          {noLeadsReason === 'all_dialed_today' ? (
            /* ============ SPECIAL MODAL: All Leads Dialed Today ============ */
            <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-3xl max-w-lg w-full shadow-[0_0_80px_rgba(59,130,246,0.3)] animate-in fade-in zoom-in-95 duration-400">
              {/* Outer Glow Ring - Blue/Green for positive message */}
              <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 rounded-3xl opacity-60 blur-sm animate-pulse" style={{ animationDuration: '2s' }} />
              
              {/* Inner Card */}
              <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-3xl overflow-hidden">
                {/* Animated Background Glows */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] -top-32 -right-32 animate-pulse" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -bottom-20 -left-20 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                  <div className="absolute w-40 h-40 bg-cyan-500/15 rounded-full blur-[60px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                </div>

                {/* Top Glow Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

                <div className="relative">
                  {/* Header */}
                  <div className="p-6 border-b border-blue-500/20">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {/* Icon Glow */}
                        <div className="absolute inset-0 bg-emerald-500/40 rounded-2xl blur-xl animate-pulse" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-blue-600/30 rounded-2xl border-2 border-emerald-500/60 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                          <span className="text-4xl">🎯</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-blue-300 bg-clip-text text-transparent mb-1">Great Work Today!</h2>
                        <p className="text-sm text-emerald-400/80">You&apos;ve dialed all available leads</p>
                      </div>
                      <button
                        onClick={() => setShowNoLeadsWarning(false)}
                        className="p-2 hover:bg-blue-500/10 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-500/30"
                      >
                        <X className="w-5 h-5 text-gray-400 hover:text-blue-300" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Stats Card */}
                    <div className="relative bg-gradient-to-br from-emerald-950/40 to-blue-950/30 border border-emerald-500/30 rounded-2xl p-5 mb-6 shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl" />
                      <div className="relative text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                            <span className="text-3xl">✅</span>
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                          {noLeadsData?.leadsDialedToday || 0} Leads Dialed
                        </p>
                        <p className="text-emerald-400 text-sm">
                          out of {noLeadsData?.potentialLeadsCount || 0} available leads today
                        </p>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                          <p className="text-gray-100 font-medium mb-1">What now?</p>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            These leads will be available again tomorrow! Or you can upload new leads to continue calling today.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <a
                        href="/dashboard/leads"
                        onClick={() => setShowNoLeadsWarning(false)}
                        className="group relative overflow-hidden block w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 text-center text-lg"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Upload More Leads
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                      </a>

                      <button
                        onClick={() => setShowNoLeadsWarning(false)}
                        className="w-full px-6 py-3.5 bg-gray-800/60 hover:bg-gray-800/80 border border-gray-600/50 hover:border-blue-500/30 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">🌙</span>
                        Come Back Tomorrow
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============ DEFAULT MODAL: No Leads / Other Reasons ============ */
            <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-3xl max-w-lg w-full shadow-[0_0_80px_rgba(245,158,11,0.3)] animate-in fade-in zoom-in-95 duration-400">
              {/* Outer Glow Ring */}
              <div className="absolute -inset-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-3xl opacity-60 blur-sm animate-pulse" style={{ animationDuration: '2s' }} />
              
              {/* Inner Card */}
              <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-3xl overflow-hidden">
                {/* Animated Background Glows */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute w-80 h-80 bg-amber-500/20 rounded-full blur-[100px] -top-32 -right-32 animate-pulse" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] -bottom-20 -left-20 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                  <div className="absolute w-40 h-40 bg-yellow-500/15 rounded-full blur-[60px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                </div>

                {/* Top Glow Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

                <div className="relative">
                  {/* Header */}
                  <div className="p-6 border-b border-amber-500/20">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {/* Icon Glow */}
                        <div className="absolute inset-0 bg-amber-500/40 rounded-2xl blur-xl animate-pulse" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-amber-500/30 to-orange-600/30 rounded-2xl border-2 border-amber-500/60 flex items-center justify-center shadow-lg shadow-amber-500/40">
                          <AlertCircle className="w-9 h-9 text-amber-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent mb-1">No Leads to Call!</h2>
                        <p className="text-sm text-amber-400/80">Upload leads to continue</p>
                      </div>
                      <button
                        onClick={() => setShowNoLeadsWarning(false)}
                        className="p-2 hover:bg-amber-500/10 rounded-xl transition-all duration-200 border border-transparent hover:border-amber-500/30"
                      >
                        <X className="w-5 h-5 text-gray-400 hover:text-amber-300" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="relative bg-gradient-to-br from-amber-950/40 to-orange-950/30 border border-amber-500/30 rounded-2xl p-5 mb-6 shadow-inner">
                      {/* Inner glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl" />
                      <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/20">
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <div>
                          <p className="text-gray-100 leading-relaxed text-base font-medium mb-2">
                            {noLeadsMessage || 'No active Google Sheets found. Please upload and activate a lead sheet first!'}
                          </p>
                          <p className="text-gray-400 text-sm">
                            All your leads may have been called, booked, or marked as not interested.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Upload Leads Button */}
                    <a
                      href="/dashboard/leads"
                      onClick={() => setShowNoLeadsWarning(false)}
                      className="group relative overflow-hidden block w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-gray-900 font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/50 text-center text-lg"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload New Leads
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    </a>

                    <p className="text-center text-gray-500 text-sm mt-4">
                      Go to Lead Manager → Google Sheets tab → Upload your lead sheet
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="p-6 pt-0">
                    <button
                      onClick={() => setShowNoLeadsWarning(false)}
                      className="w-full px-6 py-3.5 bg-gray-800/60 hover:bg-gray-800/80 border border-gray-600/50 hover:border-amber-500/30 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        @keyframes metric-update {
          0% { transform: translateY(10px); opacity: 0.7; }
          50% { transform: translateY(-5px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @keyframes neon-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }

        .animate-metric-update {
          animation: metric-update 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), 
                     neon-glow 0.3s ease-in-out;
        }

        @keyframes breathing {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1;
          }
          50% { 
            transform: scale(1.05); 
            opacity: 0.8;
          }
        }
        .animate-breathing {
          animation: breathing 3s ease-in-out infinite;
        }

        @keyframes breathing-border {
          0%, 100% { border-color: rgba(34, 197, 94, 0.4); }
          50% { border-color: rgba(34, 197, 94, 0.7); }
        }
        .animate-breathing-border {
          animation: breathing-border 3s ease-in-out infinite;
        }

        @keyframes wave-1 {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(20px) scale(1.1); opacity: 0.5; }
          100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
        }
        .animate-wave-1 {
          animation: wave-1 8s ease-in-out infinite;
        }

        @keyframes wave-2 {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(20px) translateX(-20px) scale(1.15); opacity: 0.4; }
          100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.2; }
        }
        .animate-wave-2 {
          animation: wave-2 10s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        @keyframes pulse-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1.5s ease-in-out infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 6s linear infinite;
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 8s linear infinite;
        }

        @keyframes launch-pulse {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.6;
          }
        }
        .animate-launch-pulse {
          animation: launch-pulse 2s ease-in-out infinite;
        }

        @keyframes launch-glow {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.3);
          }
        }
        .animate-launch-glow {
          animation: launch-glow 1.5s ease-in-out infinite;
        }

        @keyframes launch-icon {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
          }
          25% { 
            transform: scale(1.1) rotate(-5deg);
          }
          50% { 
            transform: scale(1.2) rotate(0deg);
          }
          75% { 
            transform: scale(1.1) rotate(5deg);
          }
        }
        .animate-launch-icon {
          animation: launch-icon 2s ease-in-out infinite;
        }

        @keyframes shimmer-progress {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .animate-shimmer-progress {
          background-size: 200% 100%;
          animation: shimmer-progress 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}

