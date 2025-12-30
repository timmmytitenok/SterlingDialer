'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Loader2, AlertCircle, UserCheck, UserX, Settings, Skull } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string;
  setup_status: string;
  last_sign_in_at: string | null;
  account_type: string;
  days_left: number;
  next_billing_date: string | null;
  created_at: string;
  is_active: boolean;
  has_ai_config: boolean;
  call_balance: number;
  is_vip: boolean;
  is_dead: boolean;
}

type FilterType = 'all' | 'useless' | 'needs_onboarding' | 'needs_ai_setup' | 'active' | 'dead';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Redirect mobile users to My Revenue
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      window.location.href = '/admin/my-revenue';
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (response.status === 403) {
          alert('⚠️ Admin Access Required\n\nTo access the admin panel:\n1. Click the logo 10 times on the login page\n2. Enter the master password\n3. Try again');
          router.push('/signup');
          return;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Sort users with special accounts first, then newest users at top
      const TIMMY_ID = 'd33602b3-4b0c-4ec7-938d-7b1d31722dc5';
      const DEMO_ID = '7619c63f-fcc3-4ff3-83ac-33595b5640a5';
      const sortedUsers = (data.users || []).sort((a: User, b: User) => {
        // Timmy always first (#000)
        if (a.id === TIMMY_ID) return -1;
        if (b.id === TIMMY_ID) return 1;
        // Sterling Demo second (#000)
        if (a.id === DEMO_ID) return -1;
        if (b.id === DEMO_ID) return 1;
        // Everyone else by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setAllUsers(sortedUsers);
      setUsers(sortedUsers);
    } catch (err: any) {
      console.error('❌ Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Create a permanent user number map based on creation order
  // Sterling Demo and Timmy = #000, everyone else starts at #001 (oldest first)
  const getUserNumber = (userId: string): string => {
    const TIMMY_ID = 'd33602b3-4b0c-4ec7-938d-7b1d31722dc5';
    const DEMO_ID = '7619c63f-fcc3-4ff3-83ac-33595b5640a5';
    
    // Special accounts always show #000
    if (userId === DEMO_ID || userId === TIMMY_ID) return '000';
    
    // Filter out special accounts, then sort by created_at ascending (oldest first = #001)
    const regularUsers = allUsers.filter(u => u.id !== DEMO_ID && u.id !== TIMMY_ID);
    const sortedByCreation = [...regularUsers].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const position = sortedByCreation.findIndex(u => u.id === userId);
    const number = position >= 0 ? position + 1 : 0;
    
    return number > 0 ? String(number).padStart(3, '0') : '???';
  };

  const applyFilter = (filter: FilterType) => {
    // Toggle: if clicking the same filter, go back to 'all'
    if (filter !== 'all' && activeFilter === filter) {
      setActiveFilter('all');
      setUsers(allUsers);
      return;
    }
    
    setActiveFilter(filter);
    
    if (filter === 'all') {
      setUsers(allUsers);
      return;
    }

    const TIMMY_ID_FILTER = 'd33602b3-4b0c-4ec7-938d-7b1d31722dc5';
    const DEMO_ID_FILTER = '7619c63f-fcc3-4ff3-83ac-33595b5640a5';

    const filtered = allUsers.filter(user => {
      // Admin accounts should not appear in filtered lists (except 'all')
      const isAdmin = user.id === TIMMY_ID_FILTER || user.id === DEMO_ID_FILTER;
      
      if (filter === 'useless') {
        // No subscription yet - exclude admins AND dead users
        return !isAdmin && !user.is_dead && user.setup_status === 'useless';
      }
      if (filter === 'needs_onboarding') {
        // Has subscription but Step 1 not complete - exclude admins AND dead users
        return !isAdmin && !user.is_dead && user.setup_status === 'needs_onboarding';
      }
      if (filter === 'needs_ai_setup') {
        // Step 1 complete but AI not unlocked - exclude admins AND dead users
        return !isAdmin && !user.is_dead && user.setup_status === 'needs_ai_config';
      }
      if (filter === 'active') {
        // AI unlocked and ready - exclude admins AND dead users
        return !isAdmin && !user.is_dead && user.setup_status === 'active';
      }
      if (filter === 'dead') {
        // Show users marked as dead (excludes admins) - DEAD OVERRIDES EVERYTHING
        if (isAdmin) return false;
        return user.is_dead === true;
      }
      return true;
    });

    // Keep Timmy and Demo first, then newest users at top
    const TIMMY_ID = 'd33602b3-4b0c-4ec7-938d-7b1d31722dc5';
    const DEMO_ID = '7619c63f-fcc3-4ff3-83ac-33595b5640a5';
    const sortedFiltered = filtered.sort((a, b) => {
      // Timmy always first
      if (a.id === TIMMY_ID) return -1;
      if (b.id === TIMMY_ID) return 1;
      // Sterling Demo second
      if (a.id === DEMO_ID) return -1;
      if (b.id === DEMO_ID) return 1;
      // Newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setUsers(sortedFiltered);
  };

  // Calculate stats (excluding admin accounts)
  const TIMMY_ID = 'd33602b3-4b0c-4ec7-938d-7b1d31722dc5';
  const DEMO_ID = '7619c63f-fcc3-4ff3-83ac-33595b5640a5';
  
  // Filter out admin accounts from stats
  const regularUsers = allUsers.filter(u => u.id !== TIMMY_ID && u.id !== DEMO_ID);
  
  // IMPORTANT: Dead users are EXCLUDED from all other categories - they ONLY appear in dead
  const uselessAccounts = regularUsers.filter(u => u.setup_status === 'useless' && !u.is_dead).length; // No subscription (exclude dead)
  const needsOnboarding = regularUsers.filter(u => u.setup_status === 'needs_onboarding' && !u.is_dead).length; // Has subscription but Step 1 not done (exclude dead)
  const needsAISetup = regularUsers.filter(u => u.setup_status === 'needs_ai_config' && !u.is_dead).length; // Step 1 done but AI not unlocked (exclude dead)
  const activeAccounts = regularUsers.filter(u => u.setup_status === 'active' && !u.is_dead).length; // AI unlocked (exclude dead)
  const deadAccounts = regularUsers.filter(u => u.is_dead === true).length; // Dead overrides everything

  const getStatusBadge = (user: User) => {
    const TIMMY_ID = 'd33602b3-4b0c-4ec7-938d-7b1d31722dc5';
    const DEMO_ID = '7619c63f-fcc3-4ff3-83ac-33595b5640a5';
    
    // Admin accounts show special ADMIN badge
    if (user.id === TIMMY_ID || user.id === DEMO_ID) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold bg-purple-500/10 text-purple-400 border-purple-500/30">
          ADMIN
        </span>
      );
    }
    
    // Check if manually marked as dead - THIS OVERRIDES EVERYTHING
    if (user.is_dead) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-bold bg-red-500/20 text-red-400 border-red-500/50 animate-pulse">
          💀 DEAD
        </span>
      );
    }

    // Status badges - 4 statuses
    const statusConfig: Record<string, { label: string; color: string }> = {
      useless: { label: 'Useless', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
      needs_onboarding: { label: 'Onboarding', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      needs_ai_config: { label: 'Activate', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
      active: { label: 'ACTIVE', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
    };

    const config = statusConfig[user.setup_status] || statusConfig.useless;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-xl font-semibold animate-pulse">Loading users...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-gradient-to-br from-red-900/20 to-red-600/10 border-2 border-red-500/30 rounded-2xl p-8 backdrop-blur-xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Error Loading Users</h2>
              <p className="text-red-300 mb-6 text-lg">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={loadUsers}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div 
      className="min-h-screen p-4 md:p-8 pb-24 md:pb-8"
      onClick={() => applyFilter('all')}
    >
      <div className="max-w-7xl mx-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">User Management</h1>
                <p className="text-gray-400">View and manage all user accounts</p>
              </div>
            </div>
            <div className="px-6 py-3 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl">
              <span className="text-blue-300 font-bold text-lg">{users.length} Users</span>
            </div>
          </div>
        </div>

        {/* Filter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Useless - No Subscription */}
          <button
            onClick={() => applyFilter('useless')}
            className={`p-6 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 transition-all duration-200 text-left ${
              activeFilter === 'useless'
                ? 'border-gray-500/50 shadow-xl shadow-gray-500/20 scale-105'
                : 'border-gray-700/30 hover:border-gray-500/30 hover:scale-102'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gray-500/10 rounded-xl border border-gray-500/30">
                <UserX className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase">Useless</div>
            </div>
            <div className="text-4xl font-black text-gray-400 mb-1">{uselessAccounts}</div>
            <div className="text-xs text-gray-500">no subscription</div>
          </button>

          {/* Needs Onboarding */}
          <button
            onClick={() => applyFilter('needs_onboarding')}
            className={`p-6 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 transition-all duration-200 text-left ${
              activeFilter === 'needs_onboarding'
                ? 'border-amber-500/50 shadow-xl shadow-amber-500/20 scale-105'
                : 'border-gray-700/30 hover:border-amber-500/30 hover:scale-102'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <UserX className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase">Onboarding</div>
            </div>
            <div className="text-4xl font-black text-amber-400 mb-1">{needsOnboarding}</div>
            <div className="text-xs text-gray-400">step 1 not done</div>
          </button>

          {/* Needs AI Setup */}
          <button
            onClick={() => applyFilter('needs_ai_setup')}
            className={`p-6 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 transition-all duration-200 text-left ${
              activeFilter === 'needs_ai_setup'
                ? 'border-purple-500/50 shadow-xl shadow-purple-500/20 scale-105'
                : 'border-gray-700/30 hover:border-purple-500/30 hover:scale-102'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
                <Settings className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase">Activate</div>
            </div>
            <div className="text-4xl font-black text-purple-400 mb-1">{needsAISetup}</div>
            <div className="text-xs text-gray-400">waiting for you to unlock</div>
          </button>

          {/* Active Accounts */}
          <button
            onClick={() => applyFilter('active')}
            className={`p-6 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 transition-all duration-200 text-left ${
              activeFilter === 'active'
                ? 'border-green-500/50 shadow-xl shadow-green-500/20 scale-105'
                : 'border-gray-700/30 hover:border-green-500/30 hover:scale-102'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                <UserCheck className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase">Active</div>
            </div>
            <div className="text-4xl font-black text-green-400 mb-1">{activeAccounts}</div>
            <div className="text-xs text-gray-400">AI unlocked & ready</div>
          </button>

          {/* Dead */}
          <button
            onClick={() => applyFilter('dead')}
            className={`p-6 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 transition-all duration-200 text-left ${
              activeFilter === 'dead'
                ? 'border-red-500/50 shadow-xl shadow-red-500/20 scale-105'
                : 'border-gray-700/30 hover:border-red-500/30 hover:scale-102'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30">
                <Skull className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase">Dead</div>
            </div>
            <div className="text-4xl font-black text-red-400 mb-1">{deadAccounts}</div>
            <div className="text-xs text-gray-400">marked as dead</div>
          </button>
        </div>

        {/* Active Filter Indicator */}
        {activeFilter !== 'all' && (
          <div className="mb-4 flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-semibold">
                Showing {users.length} {
                  activeFilter === 'useless' ? 'useless accounts (no subscription)' :
                  activeFilter === 'needs_onboarding' ? 'onboarding users' : 
                  activeFilter === 'needs_ai_setup' ? 'users to activate' : 
                  activeFilter === 'active' ? 'active accounts' :
                  'dead users'
                }
              </span>
            </div>
            <button
              onClick={() => applyFilter('all')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-[#1A2647]/40 backdrop-blur-xl rounded-2xl border-2 border-gray-700/30 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-[#0B1437] border-b-2 border-gray-700/50">
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '8%' }}>
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '18%' }}>
                    Full Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '36%' }}>
                    User ID
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '18%' }}>
                    Setup Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '20%' }}>
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/user-management/${user.id}`)}
                    className="hover:bg-[#0B1437]/70 transition-all duration-200 cursor-pointer"
                  >
                    <td className="px-4 py-4 text-center">
                      <div className="text-gray-400 font-mono font-bold text-sm">
                        #{getUserNumber(user.id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-semibold text-lg">{user.full_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300 font-mono text-sm">{user.id}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-white">{formatDate(user.last_sign_in_at)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-20 h-20 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl font-semibold">No users found</p>
              <p className="text-gray-500 text-sm mt-2">Users will appear here once they sign up</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
