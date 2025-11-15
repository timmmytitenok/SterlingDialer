'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Settings, CheckCircle, XCircle, Save, Loader2, Phone, AlertCircle } from 'lucide-react';

interface RetellConfig {
  agent_id: string | null;
  phone_number: string | null;
  agent_name: string | null;
  is_active: boolean;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  retell_config: RetellConfig | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [agentId, setAgentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agentName, setAgentName] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Fetching users from API...');
      
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // If 403 (Forbidden), redirect to login with admin mode instructions
        if (response.status === 403) {
          alert('⚠️ Admin Access Required\n\nTo access the admin panel:\n1. Click the logo 10 times on the login page\n2. Enter the master password\n3. Try again');
          router.push('/login');
          return;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Loaded users:', data.total);

      setUsers(data.users || []);
    } catch (err: any) {
      console.error('❌ Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openConfigModal = (user: User) => {
    setSelectedUser(user);
    setAgentId(user.retell_config?.agent_id || '');
    setPhoneNumber(user.retell_config?.phone_number || '');
    setAgentName(user.retell_config?.agent_name || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setAgentId('');
    setPhoneNumber('');
    setAgentName('');
  };

  const saveConfiguration = async () => {
    if (!selectedUser) return;

    setSaving(true);

    try {
      console.log('💾 Saving configuration...');

      const response = await fetch('/api/admin/users/update-retell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          agentId: agentId.trim() || null,
          phoneNumber: phoneNumber.trim() || null,
          agentName: agentName.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to save');
      }

      console.log('✅ Configuration saved!');
      alert('✅ Configuration saved successfully!');
      
      closeModal();
      loadUsers(); // Refresh the list
    } catch (err: any) {
      console.error('❌ Error saving:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1437] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#0B1437] flex items-center justify-center p-4">
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
                  onClick={() => router.push('/admin/dashboard')}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                >
                  Back to Dashboard
                </button>
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
    <div className="min-h-screen bg-[#0B1437] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-all mb-4"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Back to Admin Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">User Management</h1>
                <p className="text-gray-400">Configure Retell AI settings for each user</p>
              </div>
            </div>
            <div className="px-6 py-3 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl">
              <span className="text-blue-300 font-bold text-lg">{users.length} Users</span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#1A2647]/40 backdrop-blur-xl rounded-2xl border-2 border-gray-700/30 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0B1437] border-b-2 border-gray-700/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Agent Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Agent ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {users.map((user, idx) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#0B1437]/70 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-gray-400">
                        {user.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-semibold">{user.full_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {user.retell_config?.agent_name ? (
                        <div className="text-white font-medium">{user.retell_config.agent_name}</div>
                      ) : (
                        <span className="text-gray-500 text-sm italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.retell_config?.agent_id ? (
                        <div className="font-mono text-xs text-gray-400">
                          {user.retell_config.agent_id.substring(0, 20)}...
                        </div>
                      ) : (
                        <span className="text-red-400 text-sm font-semibold">Not configured</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.retell_config?.phone_number ? (
                        <div className="font-mono text-sm text-gray-300">
                          {user.retell_config.phone_number}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.retell_config?.is_active ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-300 text-xs font-bold">Active</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/10 border border-gray-500/30 rounded-full">
                          <XCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400 text-xs font-bold">Inactive</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openConfigModal(user)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/30 hover:border-blue-500/60 text-blue-300 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                      >
                        <Settings className="w-4 h-4" />
                        Configure
                      </button>
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

      {/* Configuration Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-3xl border-2 border-blue-500/40 max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">Configure Retell AI Agent</h2>
                  <p className="text-blue-100 text-sm mt-1">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* User Info Card */}
              <div className="p-4 bg-[#0B1437]/70 rounded-xl border border-gray-700/30">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400 block mb-1">Full Name</span>
                    <span className="text-white font-semibold">{selectedUser.full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">User ID</span>
                    <span className="text-white font-mono text-xs">{selectedUser.id.substring(0, 16)}...</span>
                  </div>
                </div>
              </div>

              {/* Agent Name */}
              <div>
                <label className="text-white font-bold block mb-2 flex items-center gap-2">
                  <span className="text-xl">📝</span>
                  Agent Name (Optional)
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g., John's AI Agent"
                  className="w-full px-4 py-3 bg-[#0B1437] text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all"
                />
                <p className="text-gray-400 text-xs mt-1.5">Give this agent a friendly name for easy identification</p>
              </div>

              {/* Retell Agent ID */}
              <div>
                <label className="text-white font-bold block mb-2 flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  Retell Agent ID
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="agent_xxxxxxxxxxxxx"
                  className="w-full px-4 py-3 bg-[#0B1437] text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none font-mono text-sm transition-all"
                />
                <p className="text-gray-400 text-xs mt-1.5">The AI agent ID from your Retell dashboard</p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-white font-bold block mb-2 flex items-center gap-2">
                  <span className="text-xl">📞</span>
                  Outbound Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+15551234567"
                  className="w-full px-4 py-3 bg-[#0B1437] text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none font-mono text-sm transition-all"
                />
                <p className="text-gray-400 text-xs mt-1.5">Phone number in E.164 format (e.g., +12223334444)</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0B1437]/90 backdrop-blur-sm border-t-2 border-gray-700/50 p-6 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveConfiguration}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
