'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { UserCircle, Mail, Save, LogOut, CheckCircle, AlertCircle, Sparkles, Phone, Lock } from 'lucide-react';

interface ProfileFormProps {
  user: User;
  profile: any;
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    router.push('/signup');
    router.refresh();
  };

  return (
    <>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-gray-400">Manage your account information and preferences</p>
      </div>

      <div className="space-y-6 max-w-3xl">
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
                  placeholder={phoneNumber ? "(555) 123-4567" : "Add phone number!"}
                  className="w-full px-4 py-3 bg-[#0B1437]/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200 group-hover/input:border-gray-600"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-500/0 to-emerald-500/0 group-focus-within/input:from-green-500/5 group-focus-within/input:to-emerald-500/5 pointer-events-none transition-all duration-300" />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Mail className="w-4 h-4 text-gray-400" />
                Email Address
                <Lock className="w-3 h-3 text-gray-500 ml-1" />
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 bg-[#0B1437]/30 backdrop-blur-sm border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-600" />
                  <div className="px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-500">Locked</div>
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
        
        <div className="relative p-6">
          {/* Everything in 1 row - title left, button right */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                <LogOut className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-red-400">Sign Out</h3>
            </div>
            
            <button
              onClick={handleSignOut}
              className="relative group/signout overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Button Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/signout:translate-x-[200%] transition-transform duration-1000" />
              
              {/* Button Content */}
              <div className="relative flex items-center justify-center gap-2 px-4 py-2 border border-red-500/50">
                <LogOut className="w-4 h-4" />
                <span className="font-medium text-sm">Sign Out</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

