'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plus, X, Phone, Mail, MapPin, Calendar, TrendingUp, FileSpreadsheet, Search, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface LeadsManagerV2Props {
  userId: string;
}

export function LeadsManagerV2({ userId }: LeadsManagerV2Props) {
  const router = useRouter();
  const supabase = createClient();
  
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
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
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowLeadDetail(true);
                      }}
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

        {/* Lead Detail Modal */}
        {showLeadDetail && selectedLead && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 max-w-lg w-full shadow-2xl">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">Lead Details</h2>
                <button
                  onClick={() => setShowLeadDetail(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">{selectedLead.name}</h3>
                  {getStatusBadge(selectedLead.status)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-gray-400">Phone Number</p>
                      <p className="text-white font-semibold">{formatPhone(selectedLead.phone)}</p>
                    </div>
                  </div>

                  {selectedLead.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <Mail className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-white font-semibold">{selectedLead.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Age</p>
                      <p className="text-white font-semibold text-lg">{selectedLead.age || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">State</p>
                      <p className="text-white font-semibold text-lg">{selectedLead.state || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <p className="text-xs text-gray-400">Total Calls Made</p>
                    </div>
                    <p className="text-white font-semibold text-lg">{selectedLead.total_calls_made || selectedLead.times_dialed || 0}</p>
                  </div>

                  {/* Missed Calls Tracking */}
                  {(selectedLead.total_missed_calls || 0) > 0 && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-xs text-red-400 font-semibold mb-2">⏰ Missed Calls Tracking</p>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Morning</p>
                          <p className="text-white font-bold">{selectedLead.morning_missed_calls || 0}/6</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Daytime</p>
                          <p className="text-white font-bold">{selectedLead.daytime_missed_calls || 0}/6</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Evening</p>
                          <p className="text-white font-bold">{selectedLead.evening_missed_calls || 0}/6</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-red-500/20">
                        <p className="text-xs text-gray-400">Total Missed</p>
                        <p className="text-red-400 font-bold text-lg">{selectedLead.total_missed_calls || 0}/18</p>
                        {(selectedLead.total_missed_calls || 0) >= 18 && (
                          <p className="text-xs text-red-300 mt-1">💀 Marked as dead lead</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pickup Rate */}
                  {(selectedLead.total_calls_made || 0) > 0 && (
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Pickup Rate</p>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-lg">
                          {selectedLead.pickup_rate?.toFixed(0) || 0}%
                        </p>
                        <p className="text-xs text-gray-500">
                          ({selectedLead.total_pickups || 0} answered / {selectedLead.total_calls_made || 0} calls)
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedLead.last_dial_at && (
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-yellow-400" />
                        <p className="text-xs text-gray-400">Last Called</p>
                      </div>
                      <p className="text-white font-semibold">
                        {new Date(selectedLead.last_dial_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Google Sheet Location */}
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                      <p className="text-sm font-semibold text-gray-300">Google Sheet Location</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-semibold">
                        {getSheetName(selectedLead.google_sheet_id)}
                      </p>
                      {selectedLead.sheet_row_number && (
                        <p className="text-sm text-gray-400">
                          Row: <span className="text-blue-400 font-mono">{selectedLead.sheet_row_number}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
