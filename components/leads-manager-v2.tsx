'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plus, X, Phone, Mail, MapPin, Calendar, TrendingUp, FileSpreadsheet, Search, ChevronLeft, ChevronRight, Clock, PhoneCall, PhoneOff, PhoneMissed, CheckCircle, XCircle, Voicemail, Home, User, Target } from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  state?: string;
  status: string;
  times_dialed: number;
  last_dial_at?: string;
  last_call_outcome?: string;
  created_at: string;
  google_sheet_id?: string;
  sheet_row_number?: number;
  // Enhanced tracking
  morning_missed_calls?: number;
  daytime_missed_calls?: number;
  evening_missed_calls?: number;
  total_missed_calls?: number;
  total_calls_made?: number;
  total_pickups?: number;
  pickup_rate?: number;
  last_call_time_period?: string;
};

type GoogleSheet = {
  id: string;
  sheet_name: string;
  sheet_url: string;
  last_sync_at?: string;
  lead_count?: number;
};

type CallRecord = {
  id: string;
  call_id: string;
  lead_name: string;
  phone_number: string;
  duration: number;
  disposition: string;
  outcome: string;
  connected: boolean;
  recording_url?: string;
  in_voicemail?: boolean;
  created_at: string;
};

interface LeadsManagerV2Props {
  userId: string;
}

export function LeadsManagerV2({ userId }: LeadsManagerV2Props) {
  const router = useRouter();
  const supabase = createClient();
  
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadCallHistory, setLeadCallHistory] = useState<CallRecord[]>([]);
  const [loadingCallHistory, setLoadingCallHistory] = useState(false);
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [activeSection, setActiveSection] = useState('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    potential: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 100;

  // Fetch call history when a lead is selected
  const fetchCallHistory = async (leadId: string) => {
    setLoadingCallHistory(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('lead_id', leadId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setLeadCallHistory(data as CallRecord[]);
      }
    } catch (err) {
      console.error('Error fetching call history:', err);
    } finally {
      setLoadingCallHistory(false);
    }
  };

  // Handle lead selection
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetail(true);
    fetchCallHistory(lead.id);
  };

  useEffect(() => {
    fetchSheets();
    fetchLeads();
  }, [activeSection]);

  // Auto-refresh leads every 3 seconds to show real-time updates from AI calls
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeSection]);

  const fetchSheets = async () => {
    const { data } = await supabase
      .from('user_google_sheets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100); // Support up to 100 connected sheets

    if (data) {
      // Get lead counts for each sheet
      const sheetsWithCounts = await Promise.all(
        data.map(async (sheet) => {
          const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('google_sheet_id', sheet.id)
            .eq('user_id', userId);
          
          return { ...sheet, lead_count: count || 0 };
        })
      );
      
      setSheets(sheetsWithCounts);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', userId)
        .eq('is_qualified', true) // Only show qualified leads
        .order('created_at', { ascending: false })
        .limit(10000); // Display up to 10,000 leads in the table

      // Apply filters based on active section
      if (activeSection === 'potential') {
        // Potential leads: no_answer, callback_later, unclassified, or new (not dead or not_interested)
        query = query.in('status', ['no_answer', 'callback_later', 'unclassified', 'new']);
      } else if (activeSection === 'closed') {
        // Closed/Dead leads: not_interested OR dead_lead
        query = query.in('status', ['not_interested', 'dead_lead']);
      } else if (activeSection !== 'all') {
        // Standard status filters (for any other sections)
        query = query.eq('status', activeSection);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLeads(data || []);

      // Get accurate counts for ALL leads (not limited to 10000, only qualified)
      const [
        { count: totalCount },
        { count: potentialCount },
        { count: closedCount }
      ] = await Promise.all([
        // Total Leads - all qualified leads across all sheets
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_qualified', true),
        // Potential Leads - no answer, callback_later, unclassified, or new (qualified only, not dead)
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_qualified', true).in('status', ['no_answer', 'callback_later', 'new', 'unclassified']),
        // Closed/Dead Leads - not_interested OR dead_lead
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_qualified', true).in('status', ['not_interested', 'dead_lead']),
      ]);

      setCounts({
        total: totalCount || 0,
        potential: potentialCount || 0,
        closed: closedCount || 0,
      });
    } finally {
      setLoading(false);
    }
  };


  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[2]}) ${match[3]}-${match[4]}`;
    }
    return phone;
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; colors: string }> = {
      new: { label: 'New', colors: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      no_answer: { label: 'No Answer', colors: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      not_interested: { label: 'Not Interested', colors: 'bg-red-500/20 text-red-400 border-red-500/30' },
      callback_later: { label: 'Call Back', colors: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      appointment_booked: { label: 'Appointment', colors: 'bg-green-500/20 text-green-400 border-green-500/30' },
      live_transfer: { label: 'Live Transfer', colors: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      unclassified: { label: 'Unclassified', colors: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      dead_lead: { label: '💀 Dead Lead', colors: 'bg-black/40 text-gray-300 border-gray-700' },
      needs_review: { label: '⚠️ Needs Review', colors: 'bg-red-500/30 text-red-300 border-red-500/50' },
      booked: { label: 'Booked', colors: 'bg-green-500/20 text-green-400 border-green-500/30' },
      sold: { label: 'Sold', colors: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    };

    const badge = badges[status] || { label: status, colors: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.colors}`}>
        {badge.label}
      </span>
    );
  };

  const getSheetName = (sheetId?: string) => {
    if (!sheetId) return 'N/A';
    const sheet = sheets.find(s => s.id === sheetId);
    return sheet?.sheet_name || 'Unknown Sheet';
  };

  // Filter leads based on search query
  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    
    // Clean phone numbers for comparison (remove all non-digits)
    const cleanQuery = query.replace(/\D/g, '');
    const cleanPhone = lead.phone.replace(/\D/g, '');
    
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.state?.toLowerCase().includes(query) ||
      // Search by phone (both formatted and unformatted)
      lead.phone.includes(query) ||
      (cleanQuery.length > 0 && cleanPhone.includes(cleanQuery))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const endIndex = startIndex + leadsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset to page 1 when search or section changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeSection]);

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <main className="container mx-auto px-4 lg:px-8 py-4 md:py-8 relative z-10">
        {/* Header */}
        <div className="mb-4 md:mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 md:mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">📋 Lead Manager</h1>
              {sheets.length > 0 && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs md:text-sm font-semibold border border-blue-500/30">
                  {sheets.length} Sheet{sheets.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm md:text-base text-gray-400">All leads from all connected Google Sheets</p>
          </div>
          
          <button
            onClick={() => router.push('/dashboard/leads/settings')}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/20 border-2 border-blue-500/30 text-blue-400 transition-all duration-200 hover:scale-110 hover:bg-blue-600/30 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/40 hover:text-blue-300"
            title="Manage Google Sheets"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Summary Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Leads */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
            onClick={() => setActiveSection('all')}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-gray-300 text-sm mb-1 font-medium">TOTAL LEADS</p>
            <p className="text-4xl font-bold text-blue-400">{counts.total}</p>
            <p className="text-xs text-blue-400/60 mt-1">All leads in your system</p>
          </div>

          {/* Still Potential */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-6 border border-green-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer"
            onClick={() => setActiveSection('potential')}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">🎯</span>
            </div>
            <p className="text-gray-300 text-sm mb-1 font-medium">STILL POTENTIAL</p>
            <p className="text-4xl font-bold text-green-400">{counts.potential}</p>
            <p className="text-xs text-green-400/60 mt-1">Leads still worth pursuing</p>
          </div>

          {/* Dead Leads */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-6 border border-red-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10 cursor-pointer"
            onClick={() => setActiveSection('closed')}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">💀</span>
            </div>
            <p className="text-gray-300 text-sm mb-1 font-medium">DEAD LEADS</p>
            <p className="text-4xl font-bold text-red-400">{counts.closed}</p>
            <p className="text-xs text-red-400/60 mt-1">Unqualified or uninterested</p>
          </div>
        </div>

        {/* Search Bar */}
        {!loading && leads.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone number, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#1A2647] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-gray-400 text-sm mt-2">
                Found {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </p>
            )}
          </div>
        )}

        {/* Leads Table */}
        {loading ? (
          <div className="bg-[#1A2647] rounded-xl p-12 border border-gray-800 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-4">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 && searchQuery ? (
          <div className="bg-[#1A2647] rounded-xl p-12 border border-gray-800 text-center">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
            <p className="text-gray-400 mb-6">
              No leads match your search for "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all"
            >
              Clear Search
            </button>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-[#1A2647] rounded-xl p-12 border border-gray-800 text-center">
            <div className="text-6xl mb-4">
              {activeSection === 'all' && '📋'}
              {activeSection === 'potential' && '🎯'}
              {activeSection === 'closed' && '💀'}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {activeSection === 'all' && 'No Leads Yet'}
              {activeSection === 'potential' && 'No Potential Leads'}
              {activeSection === 'closed' && 'No Dead Leads'}
            </h3>
            <p className="text-gray-400 mb-6">
              {activeSection === 'all' && 'Connect a Google Sheet to get started!'}
              {activeSection === 'potential' && 'No leads in potential status yet.'}
              {activeSection === 'closed' && 'No leads have been closed out yet.'}
            </p>
            {activeSection === 'all' && (
              <button
                onClick={() => router.push('/dashboard/leads/settings')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Connect Google Sheet
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[#1A2647] rounded-xl border border-gray-800 overflow-hidden">
            {/* Table Header */}
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">
                {activeSection === 'all' && 'All Leads'}
                {activeSection === 'potential' && 'Still Potential'}
                {activeSection === 'closed' && 'Dead Leads (Closed Out)'}
              </h3>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0B1437] border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Last Called
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paginatedLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => handleSelectLead(lead)}
                      className="hover:bg-[#0B1437]/50 transition-colors cursor-pointer"
                    >
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-medium">
                          {getFirstName(lead.name)}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300 font-mono">
                          {formatPhone(lead.phone)}
                        </div>
                      </td>

                      {/* State */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {lead.state || 'N/A'}
                        </div>
                      </td>

                      {/* Attempts */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-medium">
                          {lead.times_dialed}
                        </div>
                      </td>

                      {/* Last Called */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {lead.last_dial_at 
                            ? new Date(lead.last_dial_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })
                            : 'Never'
                          }
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(lead.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-800 flex items-center justify-between">
                <div className="text-gray-400 text-sm">
                  Showing {startIndex + 1} - {Math.min(endIndex, filteredLeads.length)} of {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-all flex items-center gap-2 font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-all flex items-center gap-2 font-medium"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lead Detail Modal - Redesigned */}
        {showLeadDetail && selectedLead && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div 
              className="relative bg-[#0a0f1e] rounded-3xl border border-purple-500/20 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(147, 51, 234, 0.15), 0 0 100px rgba(59, 130, 246, 0.1)'
              }}
            >
              {/* Glowing background effects */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Header */}
              <div className="relative bg-gradient-to-r from-purple-600/90 via-fuchsia-600/90 to-pink-600/90 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Lead Details</h2>
                    <p className="text-xs text-white/70">View contact information & call history</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowLeadDetail(false);
                    setLeadCallHistory([]);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="relative overflow-y-auto max-h-[calc(90vh-80px)] p-5 space-y-4">
                
                {/* Name & Status Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#1a1f35]/80 to-[#0f1525]/80 rounded-2xl border border-gray-700/50">
                  <h3 className="text-2xl font-bold text-white">{selectedLead.name}</h3>
                  {getStatusBadge(selectedLead.status)}
                </div>

                {/* Contact Information Section */}
                <div className="p-4 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="w-4 h-4 text-cyan-400" />
                    <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Contact Information</p>
                  </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-[#0a0f1e]/60 rounded-xl border border-gray-700/30">
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <Phone className="w-4 h-4 text-cyan-400" />
                      </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Phone Number</p>
                      <p className="text-white font-semibold">{formatPhone(selectedLead.phone)}</p>
                    </div>
                  </div>

                    <div className="flex items-center gap-3 p-3 bg-[#0a0f1e]/60 rounded-xl border border-gray-700/30">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Mail className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Email</p>
                        <p className="text-white font-semibold">{selectedLead.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lead Type Section */}
                {(selectedLead as any).lead_type && (
                  <div className="p-4 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-amber-400" />
                      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Lead Type</p>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#0a0f1e]/60 rounded-xl border border-gray-700/30">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Home className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-white font-bold text-lg">{(selectedLead as any).lead_type}</p>
                    </div>
                  </div>
                )}

                {/* Demographics Section */}
                <div className="p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-purple-400" />
                    <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Demographics</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#0a0f1e]/60 rounded-xl border border-gray-700/30 text-center">
                      <div className="p-2 bg-purple-500/10 rounded-lg w-fit mx-auto mb-2">
                        <User className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Age</p>
                      <p className="text-white font-bold text-xl">{selectedLead.age || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-[#0a0f1e]/60 rounded-xl border border-gray-700/30 text-center">
                      <div className="p-2 bg-pink-500/10 rounded-lg w-fit mx-auto mb-2">
                        <MapPin className="w-4 h-4 text-pink-400" />
                      </div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">State</p>
                      <p className="text-white font-bold text-xl">{selectedLead.state || 'N/A'}</p>
                    </div>
                  </div>
                      </div>

                {/* Mortgage Protection Data (if available) */}
                {((selectedLead as any).street_address || (selectedLead as any).address) && (
                  <div className="p-4 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 rounded-2xl border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Home className="w-4 h-4 text-amber-400" />
                      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Mortgage Protection Data</p>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#0a0f1e]/60 rounded-xl border border-gray-700/30">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <MapPin className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Street Address</p>
                        <p className="text-white font-semibold uppercase">{(selectedLead as any).street_address || (selectedLead as any).address || 'N/A'}</p>
                      </div>
                    </div>
                    </div>
                  )}

                {/* Lead Location Section */}
                <div className="p-4 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Lead Location</p>
                    </div>
                  <div className="p-3 bg-[#0a0f1e]/60 rounded-xl border border-gray-700/30">
                    <p className="text-white font-semibold mb-1">
                        {getSheetName(selectedLead.google_sheet_id)}
                    </p>
                    {(selectedLead as any).tab_name && (
                      <p className="text-xs text-gray-400 mb-1">
                        Tab: <span className="text-blue-400">{(selectedLead as any).tab_name}</span>
                      </p>
                    )}
                      {selectedLead.sheet_row_number && (
                      <p className="text-xs text-gray-400">
                          Row: <span className="text-blue-400 font-mono">{selectedLead.sheet_row_number}</span>
                        </p>
                      )}
                    </div>
                  </div>

                {/* Call History Section - Last 7 Days */}
                <div className="p-4 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Call History (Last 7 Days)</p>
                    </div>
                    <span className="text-xs text-gray-500">{leadCallHistory.length} calls</span>
                  </div>
                  
                  {loadingCallHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2 text-sm text-gray-400">Loading call history...</span>
                    </div>
                  ) : leadCallHistory.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <PhoneOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No calls in the last 7 days</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {leadCallHistory.map((call, index) => (
                        <div 
                          key={call.id || index}
                          className={`p-3 rounded-xl border transition-all ${
                            call.connected 
                              ? 'bg-emerald-500/10 border-emerald-500/30' 
                              : call.in_voicemail
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {call.connected ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              ) : call.in_voicemail ? (
                                <Voicemail className="w-4 h-4 text-amber-400" />
                              ) : (
                                <PhoneMissed className="w-4 h-4 text-red-400" />
                              )}
                              <span className={`text-sm font-semibold ${
                                call.connected 
                                  ? 'text-emerald-400' 
                                  : call.in_voicemail
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                              }`}>
                                {call.connected ? 'Connected' : call.in_voicemail ? 'Voicemail' : 'No Answer'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(call.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {call.duration ? `${call.duration.toFixed(1)} min` : '0 min'}
                            </span>
                            {call.outcome && call.outcome !== 'no_answer' && (
                              <span className="px-2 py-0.5 bg-gray-700/50 rounded-full text-gray-300">
                                {call.outcome.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
