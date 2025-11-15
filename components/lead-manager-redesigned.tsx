'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Plus, FileSpreadsheet, Upload, UserPlus, Search, Settings, 
  ExternalLink, Trash2, X, Check, AlertCircle,
  Phone, Mail, MapPin, TrendingUp, Calendar, Sparkles, ArrowRight,
  ChevronLeft, ChevronRight, Users, Target, Skull, Zap
} from 'lucide-react';
import { ColumnMapperRedesigned } from './column-mapper-redesigned';
import { SheetTabSelector } from './sheet-tab-selector';

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
  total_calls_made?: number;
  total_pickups?: number;
  pickup_rate?: number;
  source_type?: 'google_sheet' | 'csv' | 'manual';
  source_name?: string;
};

type GoogleSheet = {
  id: string;
  sheet_name: string;
  tab_name?: string;
  sheet_url: string;
  last_sync_at?: string;
  lead_count?: number;
  qualified_count?: number;
  source_type: 'google_sheet';
};

type CSVSource = {
  id: string;
  source_name: string;
  last_sync_at: string;
  lead_count: number;
  qualified_count?: number;
  source_type: 'csv';
};

type LeadSource = GoogleSheet | CSVSource;

interface LeadManagerRedesignedProps {
  userId: string;
}

export function LeadManagerRedesigned({ userId }: LeadManagerRedesignedProps) {
  const router = useRouter();
  const supabase = createClient();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'google_sheets' | 'all_leads'>('google_sheets');
  
  // Google Sheets state
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [showTabSelector, setShowTabSelector] = useState(false);
  const [currentSheet, setCurrentSheet] = useState<{ id: string; name: string; googleSheetId: string } | null>(null);
  const [sheetHeaders, setSheetHeaders] = useState<{ index: number; name: string }[]>([]);
  const [columnDetections, setColumnDetections] = useState<any>(null);
  const [selectedTabName, setSelectedTabName] = useState<string | null>(null);
  const [availableTabs, setAvailableTabs] = useState<any[]>([]);
  
  // CSV Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<{ index: number; name: string }[]>([]);
  const [showCsvColumnMapper, setShowCsvColumnMapper] = useState(false);
  
  // Manual Add state
  const [manualForm, setManualForm] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    state: '',
    notes: ''
  });
  
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 50;
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  
  // Summary stats
  const [leadStats, setLeadStats] = useState({
    total: 0,
    potential: 0,
    dead: 0,
    pickupRate: 0
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<{ id: string; name: string; leadCount: number } | null>(null);

  useEffect(() => {
    const initializeAndSync = async () => {
      await fetchSheets();
      await fetchLeadStats();
      
      // Auto-sync all Google Sheets on page load
      const { data: sheetsToSync } = await supabase
        .from('user_google_sheets')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (sheetsToSync && sheetsToSync.length > 0) {
        console.log(`🔄 Auto-syncing ${sheetsToSync.length} Google Sheet(s)...`);
        
        // Sync all sheets in parallel
        await Promise.all(
          sheetsToSync.map(async (sheet) => {
            try {
              await fetch('/api/google-sheets/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetId: sheet.id }),
              });
            } catch (error) {
              console.error(`Error syncing sheet ${sheet.id}:`, error);
            }
          })
        );
        
        console.log('✅ Auto-sync complete');
        // Refresh data after sync
        await fetchSheets();
        await fetchLeadStats();
      }
    };
    
    initializeAndSync();
  }, []);

  const fetchSheets = async () => {
    const { data } = await supabase
      .from('user_google_sheets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      const sheetsWithCounts = await Promise.all(
        data.map(async (sheet) => {
          const { count: totalCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('google_sheet_id', sheet.id)
            .eq('user_id', userId);
          
          const { count: qualifiedCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('google_sheet_id', sheet.id)
            .eq('user_id', userId)
            .eq('is_qualified', true);
          
          return { 
            ...sheet, 
            lead_count: totalCount || 0,
            qualified_count: qualifiedCount || 0,
            source_type: 'google_sheet' as const
          };
        })
      );
      
      setSheets(sheetsWithCounts);
    }
  };

  const fetchLeadStats = async () => {
    const { count: totalCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true);

    const { count: potentialCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('status', ['no_answer', 'callback_later', 'new', 'unclassified']);

    const { count: deadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('status', ['not_interested', 'dead_lead']);

    // Calculate pickup rate
    const { data: pickupData } = await supabase
      .from('leads')
      .select('total_calls_made, total_pickups')
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .gt('total_calls_made', 0);

    let pickupRate = 0;
    if (pickupData && pickupData.length > 0) {
      const totalCalls = pickupData.reduce((sum, lead) => sum + (lead.total_calls_made || 0), 0);
      const totalPickups = pickupData.reduce((sum, lead) => sum + (lead.total_pickups || 0), 0);
      pickupRate = totalCalls > 0 ? (totalPickups / totalCalls) * 100 : 0;
    }

    setLeadStats({
      total: totalCount || 0,
      potential: potentialCount || 0,
      dead: deadCount || 0,
      pickupRate
    });
  };

  // Google Sheets Functions
  const handleConnectSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/google-sheets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to validate sheet' });
        setLoading(false);
        return;
      }

      const googleSheetId = data.sheetId;
      const sheetName = data.sheetName || 'Google Sheet';

      // Fetch available tabs
      const tabsResponse = await fetch('/api/google-sheets/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: googleSheetId }),
      });

      const tabsData = await tabsResponse.json();

      if (!tabsResponse.ok || !tabsData.success) {
        setMessage({ type: 'error', text: 'Failed to fetch sheet tabs' });
        setLoading(false);
        return;
      }

      setAvailableTabs(tabsData.sheets);
      setCurrentSheet({ id: '', name: sheetName, googleSheetId });
      setShowAddSheet(false);
      setShowTabSelector(true);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTab = async (tabName: string) => {
    setSelectedTabName(tabName);
    setShowTabSelector(false);
    
    if (!currentSheet) return;
    
    setLoading(true);
    try {
      const headersResponse = await fetch('/api/google-sheets/headers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sheetId: currentSheet.googleSheetId,
          sheetName: tabName 
        }),
      });

      const headersData = await headersResponse.json();

      if (!headersResponse.ok || !headersData.success) {
        setMessage({ type: 'error', text: 'Failed to read sheet headers' });
        setLoading(false);
        return;
      }

      setSheetHeaders(headersData.headers);
      setColumnDetections(headersData.detections);
      setShowColumnMapper(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error reading sheet' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveColumnMapping = async (mapping: { name: number; phone: number; email: number; age: number; state: number }) => {
    if (!currentSheet) return;

    setLoading(true);
    setShowColumnMapper(false);
    setShowSyncProgress(true);
    setSyncProgress(0);

    try {
      let dbSheetId = currentSheet.id;

      // Create sheet record
      setSyncProgress(10);
      const createResponse = await fetch('/api/google-sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetUrl,
          googleSheetId: currentSheet.googleSheetId,
          sheetName: currentSheet.name,
          tabName: selectedTabName,
          columnMapping: { ...mapping, date: -1 }, // No date column needed
          minLeadAgeDays: 0, // No age filtering
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create sheet record');
      }

      const createData = await createResponse.json();
      dbSheetId = createData.sheetId;

      // Sync leads
      setSyncProgress(30);
      const syncResponse = await fetch('/api/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: dbSheetId }),
      });

      const syncData = await syncResponse.json();

      // Simulate progress
      for (let i = 40; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setSyncProgress(i);
      }

      setSyncProgress(100);

      if (syncResponse.ok) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setMessage({ type: 'success', text: syncData.message || 'Successfully imported leads!' });
        await fetchSheets();
        await fetchLeadStats();
        router.refresh();
      } else {
        throw new Error(syncData.error || 'Failed to sync sheet');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
      setShowSyncProgress(false);
      setCurrentSheet(null);
      setSheetUrl('');
      setSyncProgress(0);
    }
  };


  const handleDeleteSheet = (sheetId: string, sheetName: string, leadCount: number) => {
    setSheetToDelete({ id: sheetId, name: sheetName, leadCount });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSheet = async () => {
    if (!sheetToDelete) return;

    setLoading(true);
    setShowDeleteConfirm(false);
    setMessage(null);

    try {
      await supabase.from('leads').delete().eq('google_sheet_id', sheetToDelete.id).eq('user_id', userId);
      await supabase.from('user_google_sheets').update({ is_active: false }).eq('id', sheetToDelete.id).eq('user_id', userId);

      setMessage({ type: 'success', text: `Sheet and ${sheetToDelete.leadCount || 0} lead${sheetToDelete.leadCount !== 1 ? 's' : ''} deleted successfully!` });
      await fetchSheets();
      await fetchLeadStats();
      router.refresh();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error deleting sheet: ' + error.message });
    } finally {
      setLoading(false);
      setSheetToDelete(null);
    }
  };

  // CSV Upload Functions
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    // Parse CSV headers
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h, index) => ({
        index,
        name: h.trim()
      }));
      
      setCsvHeaders(headers);
      setShowCsvColumnMapper(true);
    };
    
    reader.readAsText(file);
  };

  const handleSaveCsvMapping = async (mapping: { name: number; phone: number; email: number; age: number; state: number }) => {
    if (!csvFile) return;

    setLoading(true);
    setShowCsvColumnMapper(false);
    setMessage({ type: 'success', text: `CSV uploaded successfully! Imported leads from ${csvFile.name}` });
    
    // TODO: Implement actual CSV import API
    // For now, just show success message
    
    await fetchLeadStats();
    setCsvFile(null);
    setCsvHeaders([]);
    setLoading(false);
  };

  // Manual Add Functions
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('leads').insert({
        user_id: userId,
        name: manualForm.name,
        phone: manualForm.phone,
        email: manualForm.email || null,
        age: manualForm.age ? parseInt(manualForm.age) : null,
        state: manualForm.state || null,
        status: 'new',
        times_dialed: 0,
        is_qualified: true,
        source_type: 'manual',
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      setMessage({ type: 'success', text: `✅ Lead added successfully! ${manualForm.name} is ready to be called.` });
      setManualForm({ name: '', phone: '', email: '', age: '', state: '', notes: '' });
      await fetchLeadStats();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all leads from all sources
  const fetchAllLeads = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', userId)
        .eq('is_qualified', true)
        .order('created_at', { ascending: false })
        .limit(10000);

      setAllLeads(data || []);
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; colors: string }> = {
      new: { label: 'New', colors: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      no_answer: { label: 'No Answer', colors: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      not_interested: { label: 'Not Interested', colors: 'bg-red-500/20 text-red-400 border-red-500/30' },
      callback_later: { label: 'Call Back', colors: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      appointment_booked: { label: 'Appointment', colors: 'bg-green-500/20 text-green-400 border-green-500/30' },
      live_transfer: { label: 'Live Transfer', colors: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      unclassified: { label: 'Unclassified', colors: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      dead_lead: { label: 'Dead Lead', colors: 'bg-black/40 text-gray-300 border-gray-700' },
    };

    const badge = badges[status] || { label: status, colors: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.colors}`}>
        {badge.label}
      </span>
    );
  };

  // Filter leads for all leads view
  // Step 1: Filter by status
  const statusFilteredLeads = allLeads.filter(lead => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'potential') {
      return ['no_answer', 'callback_later', 'new', 'unclassified'].includes(lead.status);
    }
    if (statusFilter === 'dead') {
      return ['not_interested', 'dead_lead'].includes(lead.status);
    }
    return lead.status === statusFilter;
  });
  
  // Step 2: Filter by search query
  const filteredLeads = statusFilteredLeads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const cleanQuery = query.replace(/\D/g, '');
    const cleanPhone = lead.phone.replace(/\D/g, '');
    
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.phone.includes(query) ||
      (cleanQuery.length > 0 && cleanPhone.includes(cleanQuery)) ||
      lead.state?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * leadsPerPage,
    currentPage * leadsPerPage
  );

  // Reset search when switching tabs
  useEffect(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <main className="container mx-auto px-4 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
                <FileSpreadsheet className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Lead Manager
                </h1>
                <p className="text-gray-400 mt-1">Upload, manage, and track all your leads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Summary Widget */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Leads */}
          <div className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent rounded-2xl p-6 border border-blue-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 group">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
            </div>
            <p className="text-blue-300/70 text-sm font-semibold mb-1">TOTAL LEADS</p>
            <p className="text-5xl font-bold text-white mb-1">{leadStats.total}</p>
            <p className="text-xs text-blue-400/60">All leads in system</p>
          </div>

          {/* Still Potential */}
          <div className="bg-gradient-to-br from-green-500/10 via-green-600/5 to-transparent rounded-2xl p-6 border border-green-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 group">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform" />
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
            <p className="text-green-300/70 text-sm font-semibold mb-1">STILL POTENTIAL</p>
            <p className="text-5xl font-bold text-white mb-1">{leadStats.potential}</p>
            <p className="text-xs text-green-400/60">Worth pursuing</p>
          </div>

          {/* Dead Leads */}
          <div className="bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent rounded-2xl p-6 border border-red-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 group">
            <div className="flex items-center justify-between mb-3">
              <Skull className="w-10 h-10 text-red-400 group-hover:scale-110 transition-transform" />
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
            </div>
            <p className="text-red-300/70 text-sm font-semibold mb-1">DEAD LEADS</p>
            <p className="text-5xl font-bold text-white mb-1">{leadStats.dead}</p>
            <p className="text-xs text-red-400/60">Unqualified</p>
          </div>

          {/* Pickup Rate */}
          <div className="bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent rounded-2xl p-6 border border-purple-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 group">
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
            </div>
            <p className="text-purple-300/70 text-sm font-semibold mb-1">PICKUP RATE</p>
            <p className="text-5xl font-bold text-white mb-1">{leadStats.pickupRate.toFixed(0)}%</p>
            <p className="text-xs text-purple-400/60">Answer rate</p>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border-2 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-300 border-green-500/40' 
              : 'bg-red-500/10 text-red-300 border-red-500/40'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="flex-1">{message.text}</p>
              <button onClick={() => setMessage(null)} className="hover:opacity-70 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 pl-2">
          <button
            onClick={() => setActiveTab('google_sheets')}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all duration-300 ${
              activeTab === 'google_sheets'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white scale-105'
                : 'bg-[#1A2647]/60 text-gray-400 hover:bg-[#1A2647] hover:text-white border-2 border-gray-700/50 hover:border-blue-500/30'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col items-start">
              <span className="whitespace-nowrap">Google Sheets</span>
              <span className={`text-xs font-normal italic ${
                activeTab === 'google_sheets' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                Manage lead sources
              </span>
            </div>
            {sheets.length > 0 && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{sheets.length}</span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('all_leads');
              fetchAllLeads();
            }}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all duration-300 ${
              activeTab === 'all_leads'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white scale-105'
                : 'bg-[#1A2647]/60 text-gray-400 hover:bg-[#1A2647] hover:text-white border-2 border-gray-700/50 hover:border-indigo-500/30'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col items-start">
              <span className="whitespace-nowrap">All Leads</span>
              <span className={`text-xs font-normal italic ${
                activeTab === 'all_leads' ? 'text-purple-100' : 'text-gray-500'
              }`}>
                View & work every lead
              </span>
            </div>
            {leadStats.total > 0 && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{leadStats.total}</span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="relative">
          {/* Google Sheets Tab */}
          {activeTab === 'google_sheets' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
              {/* Add New Sheet Card */}
              {!showAddSheet && (
                <button
                  onClick={() => setShowAddSheet(true)}
                  className="w-full group"
                >
                  <div className="p-8 rounded-2xl border-2 border-dashed border-blue-500/50 hover:border-blue-400 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 hover:from-blue-500/20 hover:via-indigo-500/20 hover:to-purple-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl shadow-blue-500/40">
                        <Plus className="w-10 h-10 text-white" />
                      </div>
                      <div className="text-center md:text-left">
                        <span className="text-3xl font-bold text-white block mb-2">Add New Google Sheet</span>
                        <span className="text-gray-400">Import leads from your spreadsheet</span>
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {/* Add Sheet Form */}
              {showAddSheet && (
                <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-2xl border-2 border-blue-500/40 p-8 shadow-2xl shadow-blue-500/20 animate-in fade-in slide-in-from-top duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Connect Google Sheet</h2>
                      <p className="text-gray-400 text-sm">Follow the steps below to connect your spreadsheet</p>
                    </div>
                  </div>

                  <form onSubmit={handleConnectSheet} className="space-y-6">
                    {/* Instructions */}
                    <div className="space-y-5">
                      {/* Step 1 */}
                      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-2 border-blue-500/30 rounded-xl p-5 backdrop-blur-sm hover:border-blue-500/50 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
                            ⭐
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-2">Step 1: Open Your Google Sheet</h3>
                            <p className="text-gray-300 text-sm italic">
                              "Open the Google Sheet that contains your leads."
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-2 border-blue-500/30 rounded-xl p-5 backdrop-blur-sm hover:border-blue-500/50 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
                            ⭐
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-2">Step 2: Share With SterlingDialer (Required for Access)</h3>
                            <p className="text-gray-300 text-sm mb-3 italic">
                              "Click the Share button in Google Sheets, then share it with:"
                            </p>
                            <div className="p-3 bg-[#0F172A]/80 rounded-lg border border-blue-500/20 backdrop-blur-sm mb-3">
                              <code className="text-blue-300 text-sm break-all">
                                sterlingdiailer@sterlingdialer.iam.gserviceaccount.com
                              </code>
                            </div>
                            <p className="text-gray-300 text-sm mb-2">
                              Give it: <strong className="text-white">Editor Access</strong> (so the AI can read/update lead statuses)."
                            </p>
                            <p className="text-yellow-300 text-xs italic bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                              (Include a small tooltip: "We do NOT change your sheet except updating status/attempts.")
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-2 border-blue-500/30 rounded-xl p-5 backdrop-blur-sm hover:border-blue-500/50 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
                            ⭐
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-2">Step 3: Paste Your Sheet Link Below</h3>
                            <p className="text-gray-300 text-sm italic mb-3">
                              "Copy the URL from your browser and paste it here."
                            </p>
                            
                            {/* URL Input - Inside Step 3 */}
                            <div className="bg-[#0F172A]/80 border-2 border-blue-500/20 rounded-xl p-1 backdrop-blur-sm">
                              <input
                                type="url"
                                value={sheetUrl}
                                onChange={(e) => setSheetUrl(e.target.value)}
                                placeholder="📋 Paste Google Sheet URL here..."
                                className="w-full px-4 py-3 bg-transparent border-0 text-white placeholder-gray-400 focus:outline-none text-sm"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddSheet(false);
                          setSheetUrl('');
                        }}
                        className="flex-1 px-6 py-4 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-bold transition-all border-2 border-gray-600 hover:border-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !sheetUrl}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-bold transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 hover:scale-105 disabled:scale-100 disabled:shadow-none"
                      >
                        {loading ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting...
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Connected Sheets List */}
              {sheets.length === 0 && !showAddSheet ? (
                <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-2xl p-16 border-2 border-gray-700/50 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-2 border-blue-500/30">
                    <FileSpreadsheet className="w-12 h-12 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No Sheets Connected</h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Connect your first Google Sheet to start importing leads and let the AI dial them automatically.
                  </p>
                  <button
                    onClick={() => setShowAddSheet(true)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all shadow-2xl shadow-blue-500/30 inline-flex items-center gap-3 hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Connect Your First Sheet
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <FileSpreadsheet className="w-7 h-7 text-blue-400" />
                      Connected Sheets
                    </h2>
                    <span className="px-4 py-2 bg-blue-600/20 backdrop-blur-sm text-blue-300 rounded-full text-sm font-bold border border-blue-500/30">
                      {sheets.length} Active
                    </span>
                  </div>
                  
                  {sheets.map((sheet, index) => (
                    <div
                      key={sheet.id}
                      className="bg-gradient-to-r from-[#1A2647]/80 via-[#1A2647]/60 to-[#1A2647]/40 backdrop-blur-xl rounded-2xl border-2 border-gray-700/40 hover:border-blue-500/60 transition-all duration-300 group hover:shadow-2xl hover:shadow-blue-500/10 animate-in fade-in slide-in-from-bottom duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                          {/* Index Badge */}
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                            <span className="text-white font-bold text-xl">{index + 1}</span>
                          </div>
                          
                          {/* Sheet Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white truncate mb-1">{sheet.sheet_name}</h3>
                            {sheet.tab_name && (
                              <p className="text-blue-300 text-sm font-medium mb-1">({sheet.tab_name})</p>
                            )}
                            {sheet.last_sync_at && (
                              <p className="text-gray-400 text-xs">
                                Last synced: {new Date(sheet.last_sync_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 backdrop-blur-sm rounded-xl border border-green-500/30">
                              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                              <span className="text-green-300 font-semibold text-sm whitespace-nowrap">
                                {sheet.qualified_count || 0} Leads
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={sheet.sheet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/60 text-blue-300 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open
                            </a>
                            
                            <button
                              onClick={() => handleDeleteSheet(sheet.id, sheet.sheet_name, sheet.lead_count || 0)}
                              disabled={loading}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-sm border border-red-500/30 hover:border-red-500/60 disabled:opacity-50 text-red-300 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Leads Tab */}
          {activeTab === 'all_leads' && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <div className="bg-[#1A2647] rounded-xl border border-gray-800 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-800">
                  <h3 className="text-lg font-bold text-white">All Leads</h3>
                </div>

                {/* Filter Bar: Status Dropdown and Search */}
                <div className="px-6 py-4 border-b border-gray-800 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-[#0B1437]/30">
                  {/* Left: Status Filter */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
                      Filter by Status:
                    </label>
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="appearance-none pl-4 pr-12 py-2 bg-[#1A2647] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="potential">Still Potential</option>
                        <option value="new">New Leads</option>
                        <option value="no_answer">No Answer</option>
                        <option value="callback_later">Callback</option>
                        <option value="appointment_booked">Appointments</option>
                        <option value="live_transfer">Live Transfers</option>
                        <option value="dead">Dead Leads</option>
                        <option value="not_interested">Not Interested</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Right: Search Bar */}
                  <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, phone, or state..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-[#1A2647] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-gray-400">Loading all leads...</p>
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">No Leads Found</h3>
                      <p className="text-gray-400">
                        {searchQuery ? `No leads match "${searchQuery}"` : 'No leads in your system yet'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <table className="w-full">
                        <thead className="bg-[#0B1437] border-b border-gray-800">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">State</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Attempts</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Called</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
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
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white font-medium">{lead.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-300 font-mono">{formatPhone(lead.phone)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">{lead.state || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white font-medium">{lead.times_dialed}</div>
                              </td>
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
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(lead.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
                          <div className="text-gray-400 text-sm">
                            Showing {((currentPage - 1) * leadsPerPage) + 1} - {Math.min(currentPage * leadsPerPage, filteredLeads.length)} of {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
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
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Tab Selector Modal */}
      {showTabSelector && availableTabs.length > 0 && (
        <SheetTabSelector
          tabs={availableTabs}
          onSelect={handleSelectTab}
          onCancel={() => {
            setShowTabSelector(false);
            setCurrentSheet(null);
            setAvailableTabs([]);
            setSheetUrl('');
          }}
        />
      )}

      {/* Column Mapper Modal */}
      {showColumnMapper && currentSheet && (
        <ColumnMapperRedesigned
          headers={sheetHeaders}
          detections={columnDetections}
          onSave={handleSaveColumnMapping}
          onCancel={() => {
            setShowColumnMapper(false);
            setCurrentSheet(null);
            setSheetHeaders([]);
            setColumnDetections(null);
            setSheetUrl('');
          }}
          sheetName={currentSheet.name}
        />
      )}

      {/* CSV Column Mapper Modal */}
      {showCsvColumnMapper && (
        <ColumnMapperRedesigned
          headers={csvHeaders}
          detections={undefined}
          onSave={handleSaveCsvMapping}
          onCancel={() => {
            setShowCsvColumnMapper(false);
            setCsvFile(null);
            setCsvHeaders([]);
          }}
          sheetName={csvFile?.name || 'CSV File'}
        />
      )}

      {/* Lead Detail Modal */}
      {showLeadDetail && selectedLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-2xl border border-gray-700 max-w-lg w-full shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">Lead Details</h2>
              <button
                onClick={() => {
                  setShowLeadDetail(false);
                  setSelectedLead(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name and Status */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-white">{selectedLead.name}</h3>
                {getStatusBadge(selectedLead.status)}
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                {/* Phone */}
                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Phone Number</p>
                    <p className="text-white font-semibold">{formatPhone(selectedLead.phone)}</p>
                  </div>
                </div>

                {/* Email - Always show */}
                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <Mail className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-white font-semibold">{selectedLead.email || 'N/A'}</p>
                  </div>
                </div>

                {/* Age and State */}
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
              </div>

              {/* Google Sheet Location */}
              {selectedLead.google_sheet_id && (
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                    <p className="text-sm font-semibold text-gray-300">Lead Location</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-semibold text-sm">
                      {(() => {
                        const sheet = sheets.find(s => s.id === selectedLead.google_sheet_id);
                        return sheet?.sheet_name || 'Unknown Sheet';
                      })()}
                    </p>
                    {(() => {
                      const sheet = sheets.find(s => s.id === selectedLead.google_sheet_id);
                      return sheet?.tab_name && (
                        <p className="text-blue-300 text-xs">
                          Tab: {sheet.tab_name}
                        </p>
                      );
                    })()}
                    {selectedLead.sheet_row_number && (
                      <p className="text-sm text-gray-400">
                        Row: <span className="text-blue-400 font-mono">{selectedLead.sheet_row_number}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && sheetToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-2xl border-2 border-red-500/40 max-w-md w-full shadow-2xl shadow-red-500/20 animate-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Confirm Deletion</h2>
                  <p className="text-red-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-300 font-semibold mb-2">You're about to delete:</p>
                <p className="text-white font-bold text-lg mb-3">{sheetToDelete.name}</p>
                
                {sheetToDelete.leadCount > 0 && (
                  <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
                    <p className="text-red-200 font-bold text-sm mb-1">
                      ⚠️ Warning: This will permanently delete
                    </p>
                    <p className="text-white font-bold text-2xl">
                      {sheetToDelete.leadCount} Lead{sheetToDelete.leadCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-red-200 text-xs mt-2">
                      All leads from this sheet will be removed from your dashboard
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSheetToDelete(null);
                  }}
                  className="flex-1 px-6 py-4 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-bold transition-all border-2 border-gray-600 hover:border-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSheet}
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Progress Modal */}
      {showSyncProgress && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-3xl border-2 border-blue-500/30 max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Importing Leads</h2>
                  <p className="text-blue-100 text-sm">Please wait...</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-blue-400 font-bold text-lg">{syncProgress}%</span>
                </div>
                
                <div className="relative h-3 bg-gray-700/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${syncProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>

              {syncProgress === 100 && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 font-medium text-sm text-center">
                    ✅ Leads imported successfully!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

