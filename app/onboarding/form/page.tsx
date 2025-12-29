'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  CheckCircle, Loader2, ArrowRight, ExternalLink, Calendar, Key, 
  User, Mail, Phone, Building2, FileText, Globe, Sparkles, 
  Link2, ChevronRight, Shield, Zap
} from 'lucide-react';

export default function OnboardingFormPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    timezone: '',
    agencyName: '',
    nicheDescription: '',
    calApiKey: '',
    calEventId: '',
    webhookCompleted: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in to continue');
        setLoading(false);
        return;
      }

      const emailResponse = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userEmail: user.email,
          userId: user.id,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to send onboarding data');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: `${formData.firstName} ${formData.lastName}`,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          ai_setup_status: 'maintenance',
          setup_requested_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError('Failed to save. Please try again.');
        setLoading(false);
        return;
      }

      router.push('/dashboard/onboarding');
      router.refresh();
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isSection1Complete = formData.firstName && formData.lastName && formData.email && formData.phoneNumber && formData.timezone && formData.nicheDescription;
  const isSection2Complete = formData.calApiKey && formData.calEventId && formData.webhookCompleted;

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-blue-500/10 rounded-full top-[-200px] left-[-200px]" style={{ filter: 'blur(150px)' }} />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full top-[30%] right-[-100px]" style={{ filter: 'blur(150px)' }} />
        <div className="absolute w-[700px] h-[700px] bg-indigo-500/8 rounded-full bottom-[-200px] left-[30%]" style={{ filter: 'blur(150px)' }} />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className={`sticky top-0 z-50 backdrop-blur-xl bg-[#0B1437]/80 border-b border-white/5 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
              <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Dashboard</span>
          </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-blue-400 font-medium">Setup Wizard</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8 pb-32">
          {/* Hero Section */}
          <div className={`text-center mb-10 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-800 via-purple-600 to-pink-600 rounded-2xl mb-5 shadow-lg shadow-purple-500/25">
              <span className="text-2xl font-bold text-white">SD</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Configure Your AI Agent
            </h1>
            <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto">
              Complete these steps to activate your Sterling Dialer and start booking appointments
            </p>
          </div>

          {/* Progress Steps */}
          <div className={`flex items-center justify-center gap-4 mb-10 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div 
              onClick={() => setActiveSection(1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                activeSection === 1 
                  ? 'bg-blue-500/20 border border-blue-500/40' 
                  : isSection1Complete 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-white/5 border border-white/10'
              }`}
            >
              {isSection1Complete ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${activeSection === 1 ? 'bg-blue-500 text-white' : 'bg-white/20 text-white'}`}>1</div>
              )}
              <span className={`text-sm font-medium ${activeSection === 1 ? 'text-blue-400' : isSection1Complete ? 'text-green-400' : 'text-gray-400'}`}>Your Info</span>
            </div>
            
            <div className="w-8 h-px bg-gradient-to-r from-blue-500/50 to-purple-500/50" />
            
            <div 
              onClick={() => setActiveSection(2)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                activeSection === 2 
                  ? 'bg-purple-500/20 border border-purple-500/40' 
                  : isSection2Complete 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-white/5 border border-white/10'
              }`}
            >
              {isSection2Complete ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${activeSection === 2 ? 'bg-purple-500 text-white' : 'bg-white/20 text-white'}`}>2</div>
              )}
              <span className={`text-sm font-medium ${activeSection === 2 ? 'text-purple-400' : isSection2Complete ? 'text-green-400' : 'text-gray-400'}`}>Calendar Setup</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECTION 1: Personal Information */}
            <div className={`transition-all duration-500 ${activeSection === 1 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className={`bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent rounded-2xl border border-blue-500/20 overflow-hidden transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Section Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-500/10 to-transparent border-b border-blue-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Your Information</h2>
                      <p className="text-xs text-gray-400">This info helps personalize your AI agent</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Info Banner */}
                  <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300">
                      <span className="text-blue-400 font-medium">For your AI:</span> The agent will reference your name during calls, transfer qualified leads to your phone, and send notifications to your email.
                </p>
              </div>
              
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        First Name <span className="text-red-400">*</span>
                      </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="John"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        Last Name <span className="text-red-400">*</span>
                      </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Smith"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>

                  {/* Email */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      Email Address <span className="text-red-400">*</span>
                    </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@agency.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                    disabled={loading}
                  />
                </div>

                  {/* Phone & Timezone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                    <input
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const input = e.target.value.replace(/\D/g, '');
                        let formatted = '';
                          if (input.length > 0) formatted = '(' + input.substring(0, 3);
                          if (input.length >= 4) formatted += ') ' + input.substring(3, 6);
                          if (input.length >= 7) formatted += '-' + input.substring(6, 10);
                        handleInputChange('phoneNumber', formatted);
                      }}
                      placeholder="(555) 123-4567"
                      maxLength={14}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        Time Zone <span className="text-red-400">*</span>
                      </label>
                    <select
                      required
                      value={formData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all appearance-none cursor-pointer"
                      disabled={loading}
                    >
                        <option value="" className="bg-[#1a1f3e]">Select timezone...</option>
                        <option value="America/New_York" className="bg-[#1a1f3e]">Eastern</option>
                        <option value="America/Chicago" className="bg-[#1a1f3e]">Central</option>
                        <option value="America/Denver" className="bg-[#1a1f3e]">Mountain</option>
                        <option value="America/Los_Angeles" className="bg-[#1a1f3e]">Pacific</option>
                    </select>
                  </div>
                </div>

                  {/* Agency Name */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      Agency Name <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                  <input
                    type="text"
                    value={formData.agencyName}
                    onChange={(e) => handleInputChange('agencyName', e.target.value)}
                      placeholder="ABC Insurance Group"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                    disabled={loading}
                  />
                </div>

                  {/* Niche Description */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      Niche & Products <span className="text-red-400">*</span>
                    </label>
                  <textarea
                    required
                    value={formData.nicheDescription}
                    onChange={(e) => handleInputChange('nicheDescription', e.target.value)}
                    placeholder="Describe your niche and products (e.g., 'Final expense insurance for seniors aged 50-85')"
                    rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all resize-none"
                    disabled={loading}
                  />
                    <p className="text-xs text-gray-500 mt-1.5">Helps AI understand your business and tailor conversations</p>
                  </div>

                  {/* Continue Button */}
                  <button
                    type="button"
                    onClick={() => setActiveSection(2)}
                    disabled={!isSection1Complete}
                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      isSection1Complete
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Continue to Calendar Setup
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 2: Cal.ai Setup */}
            <div className={`transition-all duration-500 ${activeSection === 2 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className={`bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent rounded-2xl border border-purple-500/20 overflow-hidden transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Section Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-transparent border-b border-purple-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Cal.com Calendar Setup</h2>
                      <p className="text-xs text-gray-400">Connect your calendar for appointment booking</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Step 1: Account Creation */}
                  <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">1</div>
                      <h3 className="font-semibold text-white">Account Creation</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-400 ml-8">
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        <a href="https://app.cal.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1">
                          Create Cal.com account <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-gray-500">(if needed)</span>
                    </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        <a href="https://app.cal.com/settings/my-account/calendars" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1">
                          Connect Google Calendar <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        Set your <span className="text-white font-medium">timezone</span> correctly
                      </li>
                  </ul>
                </div>

                  {/* Step 2: Create Event */}
                  <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">2</div>
                      <h3 className="font-semibold text-white">Create Event & Get Event ID</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-400 ml-8">
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        <a href="https://app.cal.com/event-types" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1">
                          Create new event <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        Name: <span className="text-white font-medium">"Life Insurance"</span>
                      </li>
                      <li className="flex items-center gap-2 text-amber-400">
                        <Zap className="w-3 h-3" />
                        Set Duration: <span className="font-semibold">20 minutes</span>
                      </li>
                      <li className="flex items-start gap-2 mt-2 pt-2 border-t border-white/5">
                        <ChevronRight className="w-3 h-3 text-gray-600 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">Get Event ID:</span> Look at URL while editing event<br/>
                          <code className="text-xs text-gray-500 mt-1 block">app.cal.com/event-types/<span className="text-amber-400">3685354</span></code>
                        </div>
                    </li>
                  </ul>
                  
                    {/* Event ID Input */}
                    <div className="ml-8 mt-3 pt-3 border-t border-white/5">
                      <label className="flex items-center gap-2 text-sm font-medium text-amber-400 mb-2">
                        📝 Paste Event ID Here:
                      </label>
                    <input
                      type="text"
                      required
                      value={formData.calEventId}
                      onChange={(e) => handleInputChange('calEventId', e.target.value)}
                      placeholder="3685354"
                        className="w-full px-4 py-3 bg-amber-500/5 border-2 border-amber-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 transition-all font-mono"
                      disabled={loading}
                      maxLength={7}
                    />
                  </div>
                </div>

                  {/* Step 3: API Key */}
                  <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">3</div>
                      <h3 className="font-semibold text-white">Create API Key</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-400 ml-8">
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        <a href="https://app.cal.com/settings/developer/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1">
                          Go to API Keys <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        Click <span className="text-white font-medium">"Add API Key"</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        Name: <span className="text-white font-medium">"Sterling Dialer"</span>
                      </li>
                      <li className="flex items-center gap-2 text-red-400">
                        <Zap className="w-3 h-3" />
                        Set <span className="font-semibold">"Never Expire"</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        Copy immediately <span className="text-gray-500">(won't see again!)</span>
                      </li>
                  </ul>
                  
                    {/* API Key Input */}
                    <div className="ml-8 mt-3 pt-3 border-t border-white/5">
                      <label className="flex items-center gap-2 text-sm font-medium text-purple-400 mb-2">
                      <Key className="w-4 h-4" />
                        Paste API Key Here:
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.calApiKey}
                      onChange={(e) => handleInputChange('calApiKey', e.target.value)}
                      placeholder="cal_live_xxxxxxxx"
                        className="w-full px-4 py-3 bg-purple-500/5 border-2 border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 transition-all font-mono text-sm"
                      disabled={loading}
                    />
                  </div>
                </div>

                  {/* Step 4: Webhook */}
                  <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">4</div>
                      <h3 className="font-semibold text-white">Setup Webhook</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-400 ml-8">
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        <a href="https://app.cal.com/settings/developer/webhooks" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1">
                          Go to Webhooks <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        Click <span className="text-white font-medium">"New Webhook"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600 mt-0.5" />
                        <div>
                          Paste URL:<br/>
                          <code className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded mt-1 inline-block">https://sterlingdialer.com/api/appointments/cal-webhook</code>
                        </div>
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        Trigger: <span className="text-white font-medium">"Booking Created"</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        Enable & save
                      </li>
                  </ul>
                  
                    {/* Webhook Confirmation */}
                    <div className="ml-8 mt-3 pt-3 border-t border-white/5">
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                        formData.webhookCompleted 
                          ? 'bg-green-500/10 border-green-500/40' 
                          : 'bg-white/[0.02] border-white/10 hover:border-green-500/30'
                      }`}>
                      <input
                        type="checkbox"
                        required
                        checked={formData.webhookCompleted}
                        onChange={(e) => handleInputChange('webhookCompleted', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-600 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                        disabled={loading}
                      />
                        <span className={`text-sm font-medium ${formData.webhookCompleted ? 'text-green-400' : 'text-gray-300'}`}>
                          ✅ I've completed the webhook setup in Cal.com
                      </span>
                    </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400">!</span>
                </div>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button - Fixed at bottom on mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B1437] via-[#0B1437] to-transparent md:relative md:p-0 md:bg-transparent">
            <button
              type="submit"
                disabled={loading || !isSection1Complete || !isSection2Complete}
                className={`group relative w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all overflow-hidden ${
                  loading || !isSection1Complete || !isSection2Complete
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
                {/* Shimmer effect */}
                {!loading && isSection1Complete && isSection2Complete && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}
              
                <span className="relative z-10 flex items-center gap-3">
                {loading ? (
                  <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Submitting...
                  </>
                ) : (
                  <>
                      <CheckCircle className="w-6 h-6" />
                      Complete Setup & Activate AI
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}
