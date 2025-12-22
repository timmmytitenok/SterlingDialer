'use client';

import { useState, useEffect, useMemo } from 'react';
import { Phone, Settings, X, Loader2, Calendar, Clock, User, ChevronDown, Eye, EyeOff, Shield, ShieldOff } from 'lucide-react';
import { usePrivacy } from '@/contexts/privacy-context';

interface AdminTestPanelProps {
  userId: string;
  userEmail: string;
  userName: string;
  subscriptionTier: string;
  aiSetupStatus: string;
}

export function AdminTestPanel({ 
  userId, 
  userEmail, 
  userName,
  subscriptionTier,
  aiSetupStatus 
}: AdminTestPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  
  // Bypass calling restrictions toggle
  const [bypassRestrictions, setBypassRestrictions] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);
  
  // Appointment modal state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentMessage, setAppointmentMessage] = useState('');
  
  // Appointment form state
  const [aptName, setAptName] = useState('');
  const [aptPhone, setAptPhone] = useState('');
  const [aptAge, setAptAge] = useState('');
  const [aptState, setAptState] = useState('');
  const [aptDuration, setAptDuration] = useState('20');
  const [aptDate, setAptDate] = useState('');
  const [aptTime, setAptTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  // Privacy blur toggle
  const { blurSensitive, setBlurSensitive } = usePrivacy();

  // Fetch bypass restrictions setting on mount
  useEffect(() => {
    const fetchBypassSetting = async () => {
      try {
        const response = await fetch(`/api/admin/bypass-restrictions?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setBypassRestrictions(data.bypassEnabled || false);
        }
      } catch (error) {
        console.error('Failed to fetch bypass setting:', error);
      }
    };
    fetchBypassSetting();
  }, [userId]);

  // Toggle bypass restrictions
  const handleToggleBypass = async () => {
    setBypassLoading(true);
    try {
      const response = await fetch('/api/admin/bypass-restrictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          enabled: !bypassRestrictions
        }),
      });

      if (response.ok) {
        setBypassRestrictions(!bypassRestrictions);
      }
    } catch (error) {
      console.error('Failed to toggle bypass:', error);
    } finally {
      setBypassLoading(false);
    }
  };

  // Time picker options
  const hours = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutes = ['00', '10', '20', '30', '40', '50'];

  // Update time value when hour/minute/period changes
  const updateTime = (hour: string, minute: string, period: 'AM' | 'PM') => {
    let hour24 = parseInt(hour);
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    const timeStr = `${String(hour24).padStart(2, '0')}:${minute}`;
    setAptTime(timeStr);
  };

  // Format time for display
  const formatTimeDisplay = () => {
    if (!aptTime) return 'Select time';
    const [hour, minute] = aptTime.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    let formatted = '';
    if (input.length > 0) formatted = '(' + input.substring(0, 3);
    if (input.length >= 4) formatted += ') ' + input.substring(3, 6);
    if (input.length >= 7) formatted += '-' + input.substring(6, 10);
    setAptPhone(formatted);
  };

  // Generate date options (7 days ahead)
  const dateOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayNum = date.getDate();
      const ordinal = dayNum + (dayNum > 3 && dayNum < 21 ? 'th' : ['th', 'st', 'nd', 'rd'][dayNum % 10] || 'th');
      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      else label = ordinal;
      options.push({ value: dateStr, label, date });
    }
    return options;
  }, []);

  // Reset appointment form
  const resetAppointmentForm = () => {
    setAptName('');
    setAptPhone('');
    setAptAge('');
    setAptState('');
    setAptDuration('20');
    setAptDate('');
    setAptTime('');
    setAppointmentMessage('');
  };

  // Handle appointment creation
  const handleCreateAppointment = async () => {
    if (!aptName.trim()) {
      setAppointmentMessage('❌ Please enter a name');
      return;
    }
    if (!aptPhone.trim()) {
      setAppointmentMessage('❌ Please enter a phone number');
      return;
    }
    if (!aptDate) {
      setAppointmentMessage('❌ Please select a date');
      return;
    }
    if (!aptTime) {
      setAppointmentMessage('❌ Please select a time');
      return;
    }

    setAppointmentLoading(true);
    setAppointmentMessage('');

    try {
      const scheduledAt = new Date(`${aptDate}T${aptTime}`).toISOString();

      const payload: any = {
        userId,
        contactName: aptName.trim(),
        contactPhone: aptPhone.trim(),
        duration: parseInt(aptDuration),
        scheduledAt,
      };

      if (aptAge && parseInt(aptAge) > 0) {
        payload.contactAge = parseInt(aptAge);
      }
      if (aptState.trim()) {
        payload.contactState = aptState.trim();
      }

      const response = await fetch('/api/admin/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setAppointmentMessage('✅ Appointment created successfully!');
        setTimeout(() => {
          setShowAppointmentModal(false);
          resetAppointmentForm();
        }, 1500);
      } else {
        setAppointmentMessage(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setAppointmentMessage(`❌ Failed: ${error.message}`);
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleLaunchAI = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Call the admin test endpoint to make a test call to +6149403824
      const response = await fetch('/api/admin/test-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          testPhoneNumber: '+16149403824', // Your test number
          testName: 'Timmy', // Name for the AI to use
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start test call');
      }

      setResult({
        success: true,
        message: '🎯 Test call launched!',
        details: data,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to launch test call',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Admin Badge - Always visible */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-purple-400/50"
        title="Admin Controls"
      >
        <Settings className="w-6 h-6 animate-spin-slow" />
      </button>

      {/* Admin Panel */}
      <div 
        className={`fixed bottom-24 right-6 z-50 bg-gradient-to-br from-[#121c3d] via-[#0d1529] to-[#0a1020] rounded-2xl shadow-2xl border border-purple-500/40 overflow-hidden transition-all duration-500 ease-out origin-bottom-right ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
        } ${
          isMinimized ? 'w-80 h-16' : 'w-[420px]'
        }`}
        style={{
          transitionTimingFunction: isOpen ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          
          {/* Header */}
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#121c3d] animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Admin Tools</h3>
                <p className="text-gray-500 text-[10px]">Testing Environment</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
              >
                {isMinimized ? '□' : '−'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className={`p-5 space-y-5 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
              style={{ animationDelay: '100ms' }}
            >
              {/* User Badge */}
              <div className="flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '50ms' }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">Testing as</p>
                  <p className="text-white font-bold">{userName}</p>
                </div>
              </div>

              {/* Settings Section */}
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '100ms' }}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold px-1">Settings</p>
                
                {/* Bypass Restrictions Toggle */}
                <div className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      bypassRestrictions 
                        ? 'bg-orange-500/20 text-orange-400' 
                        : 'bg-gray-800/50 text-gray-500 group-hover:bg-gray-800'
                    }`}>
                      {bypassRestrictions ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Bypass Restrictions</p>
                      <p className="text-[11px] text-gray-500">Skip Sunday & hours check</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleBypass}
                    disabled={bypassLoading}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                      bypassRestrictions 
                        ? 'bg-orange-500 shadow-lg shadow-orange-500/30' 
                        : 'bg-gray-700'
                    } ${bypassLoading ? 'opacity-50' : ''}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${
                      bypassRestrictions ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Privacy Blur Toggle */}
                <div className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      blurSensitive 
                        ? 'bg-violet-500/20 text-violet-400' 
                        : 'bg-gray-800/50 text-gray-500 group-hover:bg-gray-800'
                    }`}>
                      {blurSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Privacy Mode</p>
                      <p className="text-[11px] text-gray-500">Blur phone numbers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBlurSensitive(!blurSensitive)}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                      blurSensitive 
                        ? 'bg-violet-500 shadow-lg shadow-violet-500/30' 
                        : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${
                      blurSensitive ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Actions Section */}
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '150ms' }}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold px-1">Quick Actions</p>
                
                {/* Launch AI Button - Premium Card Style */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-30 group-hover:opacity-50 blur transition-all duration-300" />
                  <button
                    onClick={handleLaunchAI}
                    disabled={loading}
                    className={`relative w-full p-4 rounded-xl transition-all duration-300 ${
                      loading 
                        ? 'bg-gray-800 cursor-not-allowed' 
                        : 'bg-gradient-to-br from-[#0d1a30] to-[#0a1525] hover:from-[#0f1f38] hover:to-[#0c1a2c] border border-blue-500/20 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                        loading 
                          ? 'bg-gray-700' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/30'
                      }`}>
                        {loading ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <Phone className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-white font-bold text-base">{loading ? 'Calling...' : 'Launch AI Agent'}</p>
                        <p className="text-blue-400/80 text-xs font-mono">+1 (614) 940-3824</p>
                      </div>
                      {!loading && (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-blue-400 text-lg">→</span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {/* Add Appointment Button - Premium Card Style */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-30 group-hover:opacity-50 blur transition-all duration-300" />
                  <button
                    onClick={() => setShowAppointmentModal(true)}
                    className="relative w-full p-4 rounded-xl transition-all duration-300 bg-gradient-to-br from-[#0d1a30] to-[#0a1525] hover:from-[#0f1f38] hover:to-[#0c1a2c] border border-emerald-500/20 hover:border-emerald-500/40"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-white font-bold text-base">Add Appointment</p>
                        <p className="text-emerald-400/80 text-xs">Create for this user</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-emerald-400 text-lg">+</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Result Message */}
              {result && (
                <div className={`p-4 rounded-xl border ${
                  result.success 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className={`text-sm font-medium flex items-center gap-2 ${
                    result.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <span className="text-lg">{result.success ? '✓' : '✕'}</span>
                    {result.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-4 py-8">
            <div className="bg-[#1A2647] rounded-2xl border border-emerald-500/50 max-w-lg w-full shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Add Appointment</h2>
                    <p className="text-xs text-gray-400">For: {userName}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAppointmentModal(false);
                    resetAppointmentForm();
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={aptName}
                    onChange={(e) => setAptName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={appointmentLoading}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={aptPhone}
                    onChange={handlePhoneChange}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                    className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={appointmentLoading}
                  />
                </div>

                {/* Age & State Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={aptAge}
                      onChange={(e) => setAptAge(e.target.value)}
                      placeholder="45"
                      min="0"
                      max="120"
                      className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      disabled={appointmentLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={aptState}
                      onChange={(e) => setAptState(e.target.value)}
                      placeholder="CA"
                      maxLength={2}
                      className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
                      disabled={appointmentLoading}
                    />
                  </div>
                </div>

                {/* Duration Pills */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration
                  </label>
                  <div className="flex gap-2">
                    {['10', '20', '30'].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setAptDuration(dur)}
                        disabled={appointmentLoading}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          aptDuration === dur
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-[#0B1437] border border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {dur}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Pills */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dateOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAptDate(option.value)}
                        disabled={appointmentLoading}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          aptDate === option.value
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-[#0B1437] border border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Time *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTimePicker(!showTimePicker);
                      if (!showTimePicker && !aptTime) {
                        setAptTime('09:00');
                      }
                    }}
                    className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-gray-600"
                    disabled={appointmentLoading}
                  >
                    <div className="flex items-center justify-between">
                      <span className={aptTime ? 'text-white' : 'text-gray-500'}>
                        {formatTimeDisplay()}
                      </span>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>

                  {showTimePicker && (
                    <div className="mt-3 w-full bg-[#0B1437] border border-gray-700 rounded-lg p-4">
                      <div className="flex gap-2 mb-3">
                        {/* Hours */}
                        <div className="flex-1">
                          <label className="block text-xs text-gray-400 mb-2 text-center">Hour</label>
                          <div className="h-32 overflow-y-auto bg-[#0B1437] rounded-lg border border-gray-700">
                            {hours.map((hour) => (
                              <button
                                key={hour}
                                type="button"
                                onClick={() => {
                                  setSelectedHour(hour);
                                  updateTime(hour, selectedMinute, selectedPeriod);
                                }}
                                className={`w-full px-3 py-2 text-center transition-colors ${
                                  selectedHour === hour
                                    ? 'bg-emerald-600 text-white font-semibold'
                                    : 'text-gray-400 hover:bg-gray-800/50'
                                }`}
                              >
                                {hour}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Minutes */}
                        <div className="flex-1">
                          <label className="block text-xs text-gray-400 mb-2 text-center">Minute</label>
                          <div className="h-32 overflow-y-auto bg-[#0B1437] rounded-lg border border-gray-700">
                            {minutes.map((minute) => (
                              <button
                                key={minute}
                                type="button"
                                onClick={() => {
                                  setSelectedMinute(minute);
                                  updateTime(selectedHour, minute, selectedPeriod);
                                }}
                                className={`w-full px-3 py-2 text-center transition-colors ${
                                  selectedMinute === minute
                                    ? 'bg-emerald-600 text-white font-semibold'
                                    : 'text-gray-400 hover:bg-gray-800/50'
                                }`}
                              >
                                {minute}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* AM/PM */}
                        <div className="w-16">
                          <label className="block text-xs text-gray-400 mb-2 text-center">Period</label>
                          <div className="h-32 flex flex-col gap-2 bg-[#0B1437] rounded-lg border border-gray-700 p-2">
                            {['AM', 'PM'].map((period) => (
                              <button
                                key={period}
                                type="button"
                                onClick={() => {
                                  const p = period as 'AM' | 'PM';
                                  setSelectedPeriod(p);
                                  updateTime(selectedHour, selectedMinute, p);
                                }}
                                className={`flex-1 rounded-lg text-sm font-semibold transition-colors ${
                                  selectedPeriod === period
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800/50'
                                }`}
                              >
                                {period}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTimePicker(false)}
                        className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview */}
                {aptName && aptDate && aptTime && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <p className="text-xs text-emerald-400 font-medium mb-2">Preview</p>
                    <p className="text-white text-sm">
                      <span className="font-semibold">{aptName}</span>
                      {' — '}
                      <span>{dateOptions.find(d => d.value === aptDate)?.label}</span>
                      {' — '}
                      <span>{formatTimeDisplay()}</span>
                      {' — '}
                      <span>{aptDuration} min</span>
                    </p>
                  </div>
                )}

                {/* Message */}
                {appointmentMessage && (
                  <div className={`p-4 rounded-lg text-sm font-medium ${
                    appointmentMessage.includes('❌')
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}>
                    {appointmentMessage}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-700 p-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAppointmentModal(false);
                    resetAppointmentForm();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-700 bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all font-medium"
                  disabled={appointmentLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateAppointment}
                  disabled={appointmentLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg transition-all hover:scale-[1.02] hover:shadow-lg"
                >
                  {appointmentLoading ? '⏳ Creating...' : '✅ Create Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </>
  );
}

