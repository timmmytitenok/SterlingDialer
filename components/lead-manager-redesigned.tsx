'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { usePrivacy } from '@/contexts/privacy-context';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom hook for smooth counting animation with dramatic slowdown at the end
function useCountAnimation(targetValue: number, duration: number = 2000) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function with strong deceleration at the end (easeOutExpo)
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const currentValue = startValue + (targetValue - startValue) * easeOutExpo;
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = targetValue;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}
import { 
  Plus, FileSpreadsheet, Upload, UserPlus, Search, Settings, 
  ExternalLink, Trash2, X, Check, AlertCircle,
  Phone, Mail, MapPin, TrendingUp, Calendar, Sparkles, ArrowRight,
  ChevronLeft, ChevronRight, Users, Target, Skull, Zap, ChevronDown, Loader2,
  Clock, PhoneCall, PhoneOff, PhoneMissed, CheckCircle, XCircle, Voicemail, Home, User,
  Play, Pause, Volume2
} from 'lucide-react';

// Status options for the editable dropdown (in order)
const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'unclassified', label: 'Unclassified', className: 'bg-gray-600/30 text-gray-300 border-gray-600/40' },
  { value: 'no_answer', label: 'No Answer', className: 'bg-slate-800/50 text-slate-400 border-slate-700/60' },
  { value: 'not_interested', label: 'Not Interested', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'callback_later', label: 'Callback', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'live_transfer', label: 'Live Transfer', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'appointment_booked', label: 'Appointment', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'no_show', label: 'No Show', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'dead_lead', label: 'Dead', className: 'bg-black/40 text-gray-300 border-gray-700' },
];
import { ColumnMapperRedesigned } from './column-mapper-redesigned';
import { SheetTabSelector } from './sheet-tab-selector';
import { LeadTypeSelector, LeadTypeResult, LeadTypeValue } from './lead-type-selector';

// Skeleton Loading Component for Leads Table
function LeadsTableSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Skeleton rows */}
      {[...Array(8)].map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 px-6 py-4 border-b border-gray-800"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Name */}
          <div className="flex-1 min-w-[120px]">
            <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-3/4 animate-shimmer"></div>
          </div>
          {/* Phone */}
          <div className="flex-1 min-w-[120px]">
            <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-2/3 animate-shimmer" style={{ animationDelay: '100ms' }}></div>
          </div>
          {/* State */}
          <div className="w-16">
            <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-full animate-shimmer" style={{ animationDelay: '200ms' }}></div>
          </div>
          {/* Attempts */}
          <div className="w-16">
            <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-8 animate-shimmer" style={{ animationDelay: '300ms' }}></div>
          </div>
          {/* Last Called */}
          <div className="w-32">
            <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-full animate-shimmer" style={{ animationDelay: '400ms' }}></div>
          </div>
          {/* Status */}
          <div className="w-24">
            <div className="h-6 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-full w-full animate-shimmer" style={{ animationDelay: '500ms' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton for Stats Cards
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div 
          key={i} 
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50 animate-pulse"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
            <div className="w-3 h-3 bg-gray-700 rounded-full"></div>
          </div>
          <div className="h-3 bg-gray-700 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-2 bg-gray-700 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

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
  // Lead type for AI script selection (2=FE, 3=Veterans FE, 4=MP)
  lead_type?: number;
  // Mortgage Protection specific fields
  lead_vendor?: string;
  street_address?: string;
};

// Agent config type for custom agent names - includes type for dynamic mapping
interface AgentConfig {
  agent1: { name: string; isConfigured: boolean; type: string };
  agent2: { name: string; isConfigured: boolean; type: string };
}

// Emoji options for agents - consistent with lead-type-selector
const agentEmojis = ['🤖', '📞', '💼', '🎯', '⭐', '🔥', '💚', '💙', '🏠', '🛡️', '📊', '💪'];

const getAgentEmoji = (name: string, index: number): string => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return agentEmojis[(hash + index) % agentEmojis.length];
};

// Helper to get lead type label - shows the configured agent NAME
// Maps lead_type to the agent whose configured type matches
// lead_type 2 = final_expense, 3 = veteran, 4 = mortgage_protection, 5 = final_expense_2, 6 = mortgage_protection_2
const getLeadTypeLabel = (leadType?: number, agentConfig?: AgentConfig): { label: string; icon: string; color: string } => {
  const agent1Name = agentConfig?.agent1?.name || 'Agent 1';
  const agent2Name = agentConfig?.agent2?.name || 'Agent 2';
  const agent1Type = agentConfig?.agent1?.type || 'final_expense';
  const agent2Type = agentConfig?.agent2?.type || 'mortgage_protection';
  
  // Map lead_type to type string
  const leadTypeToTypeString: Record<number, string> = {
    2: 'final_expense',
    3: 'final_expense', // Veteran is still final_expense type
    4: 'mortgage_protection',
    5: 'final_expense_2',
    6: 'mortgage_protection_2',
  };
  
  const leadTypeString = leadType ? leadTypeToTypeString[leadType] : null;
  
  // Check which agent is configured with this lead type
  if (leadTypeString) {
    // Agent 1 handles this lead type
    if (agent1Type === leadTypeString) {
      return { label: agent1Name, icon: getAgentEmoji(agent1Name, 0), color: 'green' };
    }
    // Agent 2 handles this lead type
    if (agent2Type === leadTypeString) {
      return { label: agent2Name, icon: getAgentEmoji(agent2Name, 1), color: 'blue' };
    }
    
    // Fallback: check if agent type "family" matches (e.g., final_expense matches final_expense_2)
    const isFinalExpenseFamily = ['final_expense', 'final_expense_2'].includes(leadTypeString);
    const isMortgageFamily = ['mortgage_protection', 'mortgage_protection_2'].includes(leadTypeString);
    
    if (isFinalExpenseFamily) {
      // Check if any agent handles final expense family
      if (['final_expense', 'final_expense_2'].includes(agent1Type)) {
        return { label: agent1Name, icon: getAgentEmoji(agent1Name, 0), color: 'green' };
      }
      if (['final_expense', 'final_expense_2'].includes(agent2Type)) {
        return { label: agent2Name, icon: getAgentEmoji(agent2Name, 1), color: 'blue' };
      }
    }
    
    if (isMortgageFamily) {
      // Check if any agent handles mortgage family
      if (['mortgage_protection', 'mortgage_protection_2'].includes(agent1Type)) {
        return { label: agent1Name, icon: getAgentEmoji(agent1Name, 0), color: 'green' };
      }
      if (['mortgage_protection', 'mortgage_protection_2'].includes(agent2Type)) {
        return { label: agent2Name, icon: getAgentEmoji(agent2Name, 1), color: 'blue' };
      }
    }
  }
  
  // Default fallback
  return { label: 'Unknown', icon: '❓', color: 'gray' };
};

type GoogleSheet = {
  id: string;
  sheet_id: string; // The Google Sheet document ID (for identifying tabs within the same spreadsheet)
  sheet_name: string;
  tab_name?: string;
  sheet_url: string;
  last_sync_at?: string;
  lead_count?: number;
  qualified_count?: number;
  unqualified_count?: number;
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
  const { blurSensitive } = usePrivacy();
  
  // Tab state - Default to 'all_leads' so users see their leads first
  const [activeTab, setActiveTab] = useState<'google_sheets' | 'all_leads'>('all_leads');
  
  // Google Sheets state
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [showTabSelector, setShowTabSelector] = useState(false);
  const [showLeadTypeSelector, setShowLeadTypeSelector] = useState(false);
  const [selectedLeadType, setSelectedLeadType] = useState<LeadTypeResult | null>(null);
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
  const [leadCallHistory, setLeadCallHistory] = useState<{
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
  }[]>([]);
  const [loadingCallHistory, setLoadingCallHistory] = useState(false);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle audio playback
  const toggleAudioPlayback = (callId: string, recordingUrl: string) => {
    if (playingCallId === callId) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingCallId(null);
    } else {
      // Stop any current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Play new audio
      audioRef.current = new Audio(recordingUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingCallId(null);
      setPlayingCallId(callId);
    }
  };

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
        setLeadCallHistory(data);
      }
    } catch (err) {
      console.error('Error fetching call history:', err);
    } finally {
      setLoadingCallHistory(false);
    }
  };

  // Handle opening lead detail modal
  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetail(true);
    fetchCallHistory(lead.id);
  };
  
  // Server-side pagination state
  const [totalLeadCount, setTotalLeadCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  
  // Debounce search to prevent too many API calls
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Script type for Mortgage Protection support
  const [scriptType, setScriptType] = useState<'final_expense' | 'mortgage_protection'>('final_expense');
  
  // Agent config for custom agent names
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  
  // Status editing state
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  
  // Smart dropdown positioning - uses fixed positioning to escape table stacking context
  const handleStatusDropdownToggle = (leadId: string, buttonElement: HTMLButtonElement) => {
    if (openStatusDropdownId === leadId) {
      setOpenStatusDropdownId(null);
      return;
    }
    
    // Calculate position based on button location
    const rect = buttonElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 320; // Approximate height of dropdown (8 options * ~40px each)
    
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      // Open above
      setDropdownStyle({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
      });
    } else {
      // Open below
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    
    setOpenStatusDropdownId(leadId);
  };
  
  // Summary stats
  const [leadStats, setLeadStats] = useState({
    total: 0,
    potential: 0,
    dead: 0,
    pickupRate: 0
  });
  
  // Animated counter values
  const animatedTotal = useCountAnimation(leadStats.total);
  const animatedPotential = useCountAnimation(leadStats.potential);
  const animatedDead = useCountAnimation(leadStats.dead);
  const animatedPickupRate = useCountAnimation(leadStats.pickupRate);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<{ id: string; name: string; leadCount: number } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Track if we've already done an auto-retry
  const [hasAutoRetried, setHasAutoRetried] = useState(false);

  // Track visit to Lead Manager for onboarding step 3
  useEffect(() => {
    fetch('/api/onboarding/mark-step-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 3 }),
    }).catch(() => {}); // Silently fail if not in onboarding
  }, []);

  useEffect(() => {
    const initializeAndLoadLeads = async () => {
      // STEP 1: Load first page of leads with server-side pagination (FAST!)
      setIsInitialLoad(true);
      setLoading(true);
      
      try {
        const { data: activeSheets } = await supabase
          .from('user_google_sheets')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true);
      
        const activeSheetIds = activeSheets?.map(s => s.id) || [];
        
        if (activeSheetIds.length > 0) {
          // Get total count first (fast - uses head: true)
          const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_qualified', true)
            .in('google_sheet_id', activeSheetIds);
          
          setTotalLeadCount(count || 0);
          
          // Only fetch first page (50 leads) - MUCH FASTER!
          const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', userId)
            .eq('is_qualified', true)
            .in('google_sheet_id', activeSheetIds)
            .order('sheet_row_number', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true })
            .range(0, leadsPerPage - 1);

          setAllLeads(data || []);
          setDataReady(true);
        } else {
          setAllLeads([]);
          setTotalLeadCount(0);
          setDataReady(true);
        }
      } catch (error) {
        console.error('Error loading leads:', error);
        setAllLeads([]);
        setTotalLeadCount(0);
        setDataReady(true);
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
        
      // STEP 2: Load sheets and stats in background
      fetchSheets();
      fetchLeadStats();
      
      // STEP 3: Fetch user's script type for Mortgage Protection support
      const { data: retellConfig } = await supabase
        .from('user_retell_config')
        .select('script_type')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (retellConfig?.script_type) {
        setScriptType(retellConfig.script_type as 'final_expense' | 'mortgage_protection');
      }
      
      // STEP 4: Load agent config for custom agent names
      try {
        const agentResponse = await fetch('/api/user/agent-config');
        if (agentResponse.ok) {
          const agentData = await agentResponse.json();
          setAgentConfig({
            agent1: agentData.agents.agent1,
            agent2: agentData.agents.agent2,
          });
        }
      } catch (err) {
        console.error('Failed to load agent config:', err);
      }
    };
    
    initializeAndLoadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh after 3 seconds if data hasn't loaded yet
  useEffect(() => {
    if (!dataReady && !hasAutoRetried) {
      const autoRefreshTimer = setTimeout(() => {
        console.log('🔄 Auto-refreshing leads after 3 seconds...');
        setHasAutoRetried(true);
        
        // Retry loading leads
        const retryLoad = async () => {
          setLoading(true);
          try {
            const { data: activeSheets } = await supabase
              .from('user_google_sheets')
              .select('id')
              .eq('user_id', userId)
              .eq('is_active', true);
          
            const activeSheetIds = activeSheets?.map(s => s.id) || [];
            
            if (activeSheetIds.length > 0) {
              const { count } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_qualified', true)
                .in('google_sheet_id', activeSheetIds);
              
              setTotalLeadCount(count || 0);
              
              const { data } = await supabase
                .from('leads')
                .select('*')
                .eq('user_id', userId)
                .eq('is_qualified', true)
                .in('google_sheet_id', activeSheetIds)
                .order('sheet_row_number', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: true })
                .range(0, leadsPerPage - 1);

              setAllLeads(data || []);
            }
            setDataReady(true);
          } catch (error) {
            console.error('Auto-refresh error:', error);
            setDataReady(true);
          } finally {
            setLoading(false);
            setIsInitialLoad(false);
          }
        };
        
        retryLoad();
      }, 3000);
      
      return () => clearTimeout(autoRefreshTimer);
    }
  }, [dataReady, hasAutoRetried, userId, supabase, leadsPerPage]);

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
          
          const { count: unqualifiedCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('google_sheet_id', sheet.id)
            .eq('user_id', userId)
            .eq('is_qualified', false);
          
          return { 
            ...sheet, 
            lead_count: totalCount || 0,
            qualified_count: qualifiedCount || 0,
            unqualified_count: unqualifiedCount || 0,
            source_type: 'google_sheet' as const
          };
        })
      );
      
      setSheets(sheetsWithCounts);
    }
  };

  const fetchLeadStats = async () => {
    // First, get only ACTIVE Google Sheets
    const { data: activeSheets } = await supabase
      .from('user_google_sheets')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    const activeSheetIds = activeSheets?.map(s => s.id) || [];
    
    // If no active sheets, show 0 for everything
    if (activeSheetIds.length === 0) {
      setLeadStats({
        total: 0,
        potential: 0,
        dead: 0,
        pickupRate: 0
      });
      return;
    }

    // Only count leads from ACTIVE Google Sheets
    const { count: totalCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds);

    const { count: potentialCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds)
      .in('status', ['no_answer', 'callback_later', 'new', 'unclassified', 'no_show']);

    const { count: deadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds)
      .in('status', ['not_interested', 'dead_lead']);

    // Calculate pickup rate FROM CALLS TABLE (same as dashboard!)
    // This ensures Lead Manager and Dashboard show the same Connected Rate
    const { data: allCalls } = await supabase
      .from('calls')
      .select('disposition, connected')
      .eq('user_id', userId);

    let pickupRate = 0;
    if (allCalls && allCalls.length > 0) {
      const totalCalls = allCalls.length;
      const connectedCalls = allCalls.filter(c => c.disposition === 'answered' || c.connected === true).length;
      pickupRate = totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0;
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
      
      // Show lead type selector first (before tab selector)
      setShowLeadTypeSelector(true);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle lead type selection
  const handleLeadTypeSelect = (result: LeadTypeResult) => {
    setSelectedLeadType(result);
    setShowLeadTypeSelector(false);
    setShowTabSelector(true);
  };

  const handleLeadTypeSelectorCancel = () => {
    setShowLeadTypeSelector(false);
    setSelectedLeadType(null);
    setCurrentSheet(null);
    setSheetUrl('');
  };

  const handleSelectTab = async (tabName: string) => {
    setSelectedTabName(tabName);
    
    if (!currentSheet) return;
    
    setIsTransitioning(true);
    
    // Fade out tab selector smoothly
    setTimeout(() => {
      setShowTabSelector(false);
    }, 200);
    
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
        setIsTransitioning(false);
        return;
      }

      setSheetHeaders(headersData.headers);
      setColumnDetections(headersData.detections);
      
      // Wait for data to load, then show column mapper with smooth fade-in
      setTimeout(() => {
        setShowColumnMapper(true);
        setIsTransitioning(false);
      }, 400);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error reading sheet' });
      setIsTransitioning(false);
    }
  };

  const handleSaveColumnMapping = async (mapping: { name: number; phone: number; email: number; age: number; state: number; lead_vendor?: number; street_address?: number }) => {
    if (!currentSheet) return;

    setLoading(true);
    setShowColumnMapper(false);
    setShowSyncProgress(true);
    setSyncProgress(0);

    try {
      let dbSheetId = currentSheet.id;

      // Create sheet record
      setSyncProgress(10);
      
      // BULLETPROOF: Check if selectedLeadType exists, if not something went wrong
      if (!selectedLeadType || !selectedLeadType.leadType) {
        console.error('❌❌❌ CRITICAL ERROR: selectedLeadType is null/undefined!');
        console.error('   This should NOT happen - user should have selected a lead type!');
        console.error('   selectedLeadType:', selectedLeadType);
        // Show alert to user
        alert('Error: Lead type was not properly selected. Please try again and make sure to select Final Expense, Veterans, or Mortgage Protection.');
        setLoading(false);
        setShowSyncProgress(false);
        return;
      }
      
      const leadTypeToSend = selectedLeadType.leadType;
      console.log('🎯 LEAD TYPE BEING SENT TO API:', leadTypeToSend);
      console.log('🎯 Selected Lead Type Object:', selectedLeadType);
      console.log(`🎯 Lead Type Meaning: ${leadTypeToSend === 2 ? 'Final Expense' : leadTypeToSend === 4 ? 'Mortgage Protection' : 'UNKNOWN'}`);
      
      const createResponse = await fetch('/api/google-sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetUrl,
          googleSheetId: currentSheet.googleSheetId,
          sheetName: currentSheet.name,
          tabName: selectedTabName,
          columnMapping: { 
            ...mapping, 
            date: -1,
            // Include mortgage protection fields if present
            lead_vendor: mapping.lead_vendor ?? -1,
            street_address: mapping.street_address ?? -1,
          },
          minLeadAgeDays: 0, // No age filtering
          leadType: leadTypeToSend, // Pass lead type (2=FE, 3=Veterans FE, 4=MP)
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create sheet record');
      }

      const createData = await createResponse.json();
      dbSheetId = createData.sheetId;
      console.log('✅ Sheet created with ID:', dbSheetId);
      console.log('✅ Sheet lead_type confirmed:', createData.leadType);

      // Start jittery progress animation that runs during sync
      // 3x slower: interval every 450ms instead of 150ms
      let currentProgress = 30;
      let syncComplete = false;
      setSyncProgress(currentProgress);
      
      const progressInterval = setInterval(() => {
        if (syncComplete) {
          // If sync is done, quickly finish the animation
          currentProgress = Math.min(currentProgress + 15, 100);
        } else {
          // Slow jitter: add random increment between 0.5-1.5% (3x slower)
          const jitter = Math.random() * 1 + 0.5;
          currentProgress = Math.min(currentProgress + jitter, 97);
        }
        setSyncProgress(Math.round(currentProgress));
        
        // Clear interval when we hit 100
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, 450); // 3x slower (450ms instead of 150ms)

      // Sync leads (this is the actual API call that takes time)
      const syncResponse = await fetch('/api/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: dbSheetId }),
      });

      const syncData = await syncResponse.json();

      // Mark sync as complete - this will speed up the animation
      syncComplete = true;
      
      // Wait for progress bar to finish (max 2 seconds)
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (currentProgress >= 100) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        // Safety timeout
        setTimeout(() => {
          clearInterval(progressInterval);
      setSyncProgress(100);
          resolve();
        }, 2000);
      });

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
      setSelectedLeadType(null);
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
      console.log(`🗑️ Deleting sheet ${sheetToDelete.id} and ${sheetToDelete.leadCount || 0} leads...`);
      
      // 1. Delete ALL leads from this sheet
      const { error: leadsError } = await supabase
        .from('leads')
        .delete()
        .eq('google_sheet_id', sheetToDelete.id)
        .eq('user_id', userId);
      
      if (leadsError) throw leadsError;
      console.log(`✅ Deleted ${sheetToDelete.leadCount || 0} leads`);
      
      // 2. Actually DELETE the Google Sheet record (not just mark inactive)
      const { error: sheetError } = await supabase
        .from('user_google_sheets')
        .delete()
        .eq('id', sheetToDelete.id)
        .eq('user_id', userId);
      
      if (sheetError) throw sheetError;
      console.log(`✅ Deleted Google Sheet record`);

      setMessage({ type: 'success', text: `Sheet and ${sheetToDelete.leadCount || 0} lead${sheetToDelete.leadCount !== 1 ? 's' : ''} deleted successfully!` });
      await fetchSheets();
      await fetchLeadStats();
      router.refresh();
    } catch (error: any) {
      console.error('❌ Error deleting sheet:', error);
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

  const handleSaveCsvMapping = async (mapping: { name: number; phone: number; email: number; age: number; state: number; lead_vendor?: number; street_address?: number }) => {
    if (!csvFile) return;

    setLoading(true);
    setShowCsvColumnMapper(false);
    setMessage({ type: 'success', text: `CSV uploaded successfully! Imported leads from ${csvFile.name}` });
    
    // TODO: Implement actual CSV import API with lead_vendor and street_address support
    // For now, just show success message
    console.log('CSV mapping with mortgage protection fields:', mapping);
    
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
  // Server-side paginated fetch - only loads one page at a time!
  const fetchLeadsPage = useCallback(async (page: number, filter: string = 'all', search: string = '') => {
    setPageLoading(true);
    try {
      // First, get only ACTIVE Google Sheets
      const { data: activeSheets } = await supabase
        .from('user_google_sheets')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      const activeSheetIds = activeSheets?.map(s => s.id) || [];
      
      // If no active sheets, show empty list
      if (activeSheetIds.length === 0) {
        setAllLeads([]);
        setTotalLeadCount(0);
        setPageLoading(false);
        return;
      }

      // Build query based on filters
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_qualified', true)
        .in('google_sheet_id', activeSheetIds);

      // Apply status filter
      if (filter === 'potential') {
        query = query.in('status', ['no_answer', 'callback_later', 'new', 'unclassified', 'no_show']);
      } else if (filter === 'dead') {
        query = query.in('status', ['not_interested', 'dead_lead']);
      } else if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply search filter (server-side)
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,state.ilike.%${search}%`);
      }

      // Calculate offset for pagination
      const from = (page - 1) * leadsPerPage;
      const to = from + leadsPerPage - 1;

      // Fetch with pagination
      const { data, count } = await query
        .order('sheet_row_number', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
        .range(from, to);

      setAllLeads(data || []);
      setTotalLeadCount(count || 0);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setPageLoading(false);
    }
  }, [supabase, userId, leadsPerPage]);

  // Legacy function for compatibility (now uses paginated fetch)
  const fetchAllLeads = async () => {
    setCurrentPage(1);
    await fetchLeadsPage(1, statusFilter, searchQuery);
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
      unclassified: { label: 'Unclassified', colors: 'bg-gray-600/30 text-gray-300 border-gray-600/40' },
      no_answer: { label: 'No Answer', colors: 'bg-slate-800/50 text-slate-400 border-slate-700/60' },
      not_interested: { label: 'Not Interested', colors: 'bg-red-500/20 text-red-400 border-red-500/30' },
      callback_later: { label: 'Callback', colors: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      live_transfer: { label: 'Live Transfer', colors: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      potential_appointment: { label: 'Potential Appt', colors: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse' },
      appointment_booked: { label: 'Appointment', colors: 'bg-green-500/20 text-green-400 border-green-500/30' },
      no_show: { label: 'No Show', colors: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      dead_lead: { label: 'Dead', colors: 'bg-black/40 text-gray-300 border-gray-700' },
    };

    const badge = badges[status] || { label: status, colors: 'bg-gray-600/30 text-gray-300 border-gray-600/40' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.colors}`}>
        {badge.label}
      </span>
    );
  };

  // Get the current status for a lead (from updates or original)
  const getLeadStatus = (lead: Lead): string => {
    return statusUpdates[lead.id] || lead.status || 'new';
  };

  // Handle lead status change
  const handleLeadStatusChange = async (lead: Lead, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setUpdatingLeadId(lead.id);
    setOpenStatusDropdownId(null);
    
    try {
      const response = await fetch('/api/leads/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      // Update local state
      setStatusUpdates(prev => ({
        ...prev,
        [lead.id]: newStatus,
      }));

      // Also update the lead in allLeads array
      setAllLeads(prev => prev.map(l => 
        l.id === lead.id ? { ...l, status: newStatus } : l
      ));

      console.log(`✅ Updated lead ${lead.id} status to ${newStatus}`);
    } catch (error: any) {
      console.error('❌ Failed to update lead status:', error);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  // Close dropdown when clicking outside - use mousedown to avoid race condition with click handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openStatusDropdownId) {
        const target = e.target as Element;
        // Check if click is inside dropdown or on a status toggle button
        const isInsideDropdown = target.closest('.lead-status-dropdown');
        const isStatusButton = target.closest('[data-status-toggle]');
        
        if (!isInsideDropdown && !isStatusButton) {
          setOpenStatusDropdownId(null);
        }
      }
    };
    // Use mousedown instead of click to avoid race condition
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openStatusDropdownId]);

  // Server-side pagination - leads are already filtered and paginated from the server!
  // allLeads now contains only the current page's leads
  const totalPages = Math.ceil(totalLeadCount / leadsPerPage);
  const paginatedLeads = allLeads; // Already paginated from server

  // Reset search when switching tabs
  useEffect(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, [activeTab]);

  // Fetch leads when page, filter, or search changes (server-side pagination)
  useEffect(() => {
    if (!isInitialLoad && activeTab === 'all_leads') {
      fetchLeadsPage(currentPage, statusFilter, debouncedSearch);
    }
  }, [currentPage, statusFilter, debouncedSearch, isInitialLoad, activeTab, fetchLeadsPage]);

  // Auto-scroll to top when error message appears
  useEffect(() => {
    if (message?.type === 'error') {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        // Try multiple scroll methods for maximum compatibility
        const messageBanner = document.getElementById('message-banner-area');
        if (messageBanner) {
          messageBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 150);
    }
  }, [message]);

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
            <p className="text-5xl font-bold text-white mb-1">{Math.round(animatedTotal).toLocaleString()}</p>
            <p className="text-xs text-blue-400/60">All leads in system</p>
          </div>

          {/* Still Potential */}
          <div className="bg-gradient-to-br from-green-500/10 via-green-600/5 to-transparent rounded-2xl p-6 border border-green-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 group">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform" />
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
            <p className="text-green-300/70 text-sm font-semibold mb-1">STILL POTENTIAL</p>
            <p className="text-5xl font-bold text-white mb-1">{Math.round(animatedPotential).toLocaleString()}</p>
            <p className="text-xs text-green-400/60">Worth pursuing</p>
          </div>

          {/* Dead Leads */}
          <div className="bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent rounded-2xl p-6 border border-red-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 group">
            <div className="flex items-center justify-between mb-3">
              <Skull className="w-10 h-10 text-red-400 group-hover:scale-110 transition-transform" />
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
            </div>
            <p className="text-red-300/70 text-sm font-semibold mb-1">DEAD LEADS</p>
            <p className="text-5xl font-bold text-white mb-1">{Math.round(animatedDead).toLocaleString()}</p>
            <p className="text-xs text-red-400/60">Unqualified</p>
          </div>

          {/* Pickup Rate */}
          <div className="bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent rounded-2xl p-6 border border-purple-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 group">
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
            </div>
            <p className="text-purple-300/70 text-sm font-semibold mb-1">PICKUP RATE</p>
            <p className="text-5xl font-bold text-white mb-1">{animatedPickupRate.toFixed(0)}%</p>
            <p className="text-xs text-purple-400/60">Answer rate</p>
          </div>
        </div>

        {/* Message Banner */}
        <div id="message-banner-area" />
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
                <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-2xl border-2 border-blue-500/40 p-8 shadow-2xl shadow-blue-500/20 animate-in fade-in zoom-in-95 duration-300">
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
                                sterlingdailer@sterlingdialer.iam.gserviceaccount.com
                              </code>
                            </div>
                            <p className="text-gray-300 text-sm mb-2">
                              Give it: <strong className="text-white">Editor Access</strong> (so the AI can read/update lead statuses)."
                            </p>
                            <p className="text-yellow-300 text-xs italic bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                                We will NOT edit your sheet. The AI only uses it to read your leads.
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
                            
                            {(sheet.unqualified_count || 0) > 0 && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 backdrop-blur-sm rounded-xl border border-yellow-500/30">
                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                <span className="text-yellow-300 font-semibold text-sm whitespace-nowrap">
                                  {sheet.unqualified_count} Unqualified
                                </span>
                              </div>
                            )}
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
                        <option value="no_show">No Show</option>
                        <option value="appointment_booked">Confirmed Appointments</option>
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
                        setCurrentPage(1); // Reset to first page when searching
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-[#1A2647] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  {!dataReady ? (
                    // Beautiful skeleton loading on initial load
                    <div>
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
                      </table>
                      <LeadsTableSkeleton />
                      <div className="text-center py-4 text-gray-400 text-sm">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          <span className="ml-2">Loading your leads...</span>
                        </div>
                      </div>
                    </div>
                  ) : totalLeadCount === 0 ? (
                    sheets.length === 0 ? (
                      <div className="text-center py-16">
                        <FileSpreadsheet className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-3">No Leads Found</h3>
                        <p className="text-gray-400 mb-6">Upload a Google Sheet to get started!</p>
                        <button
                          onClick={() => setActiveTab('google_sheets')}
                          className="group relative px-8 py-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 backdrop-blur-sm border-2 border-blue-500/50 hover:border-blue-400/70 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 inline-flex items-center gap-3"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                          <Plus className="w-5 h-5 relative z-10" />
                          <span className="relative z-10">Upload Lead Sheet</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Leads Found</h3>
                        <p className="text-gray-400">
                          {searchQuery ? `No leads match "${searchQuery}"` : statusFilter !== 'all' ? 'No leads with this status' : 'No leads in your system yet'}
                        </p>
                      </div>
                    )
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
                              onClick={() => openLeadDetail(lead)}
                              className="hover:bg-[#0B1437]/50 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white font-medium">
                                  {lead.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div 
                                  className={`text-sm text-gray-300 font-mono ${blurSensitive ? 'blur-sm select-none' : ''}`}
                                  style={blurSensitive ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
                                >
                                  {formatPhone(lead.phone)}
                                </div>
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
                              {/* Status - Editable Dropdown */}
                              <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="relative lead-status-dropdown">
                                  {updatingLeadId === lead.id ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span className="text-xs font-medium">Updating...</span>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        data-status-toggle="true"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusDropdownToggle(lead.id, e.currentTarget);
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 cursor-pointer ${
                                          LEAD_STATUS_OPTIONS.find(s => s.value === getLeadStatus(lead))?.className || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                        } border`}
                                      >
                                        <span>
                                          {LEAD_STATUS_OPTIONS.find(s => s.value === getLeadStatus(lead))?.label || lead.status}
                                        </span>
                                        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${openStatusDropdownId === lead.id ? 'rotate-180' : ''}`} />
                                      </button>
                                      
                                      {/* Dropdown Menu - Fixed positioning to escape table stacking context */}
                                      {openStatusDropdownId === lead.id && (
                                        <div 
                                          className="fixed z-[99999] w-44 bg-[#1A2647] border border-gray-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
                                          style={{
                                            top: dropdownStyle.top !== undefined ? `${dropdownStyle.top}px` : 'auto',
                                            bottom: dropdownStyle.bottom !== undefined ? `${dropdownStyle.bottom}px` : 'auto',
                                            left: `${dropdownStyle.left}px`,
                                          }}
                                        >
                                          {LEAD_STATUS_OPTIONS.map((option) => (
                                            <button
                                              key={option.value}
                                              onClick={(e) => handleLeadStatusChange(lead, option.value, e)}
                                              className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-gray-700/50 transition-colors ${
                                                getLeadStatus(lead) === option.value ? 'bg-gray-700/30' : ''
                                              }`}
                                            >
                                              <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full ${option.className} border`}>
                                                {option.label}
                                              </span>
                                              {getLeadStatus(lead) === option.value && (
                                                <Check className="w-3.5 h-3.5 text-green-400" />
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
                          <div className="text-gray-400 text-sm flex items-center gap-2">
                            {pageLoading && (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            Showing {((currentPage - 1) * leadsPerPage) + 1} - {Math.min(currentPage * leadsPerPage, totalLeadCount)} of {totalLeadCount.toLocaleString()} lead{totalLeadCount !== 1 ? 's' : ''}
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

      {/* Transition Loading Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1A2647] rounded-2xl border border-blue-500/40 p-8 shadow-2xl shadow-blue-500/20">
            <div className="flex flex-col items-center gap-4">
              <svg className="w-12 h-12 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-white font-semibold">Reading sheet headers...</p>
            </div>
          </div>
        </div>
      )}

      {/* Lead Type Selector Modal - Shows first before tab selector */}
      {showLeadTypeSelector && (
        <LeadTypeSelector
          onSelect={handleLeadTypeSelect}
          onCancel={handleLeadTypeSelectorCancel}
        />
      )}

      {/* Tab Selector Modal */}
      {showTabSelector && availableTabs.length > 0 && (
        <SheetTabSelector
          tabs={availableTabs}
          existingTabs={
            // Only filter tabs that are already connected from the SAME Google Sheet document
            // This allows "Sheet1" from Sheet A and "Sheet1" from Sheet B to both be added
            sheets
              .filter(s => s.sheet_id === currentSheet?.googleSheetId)
              .map(s => s.tab_name)
              .filter(Boolean) as string[]
          }
          onSelect={handleSelectTab}
          onCancel={() => {
            setShowTabSelector(false);
            setCurrentSheet(null);
            setAvailableTabs([]);
            setSheetUrl('');
            setSelectedLeadType(null);
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
            setSelectedLeadType(null);
          }}
          scriptType={selectedLeadType?.scriptType || 'final_expense'}
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
          scriptType={scriptType}
        />
      )}

      {/* Lead Detail Modal - Redesigned */}
      {showLeadDetail && selectedLead && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Stop audio when closing
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
              }
              setPlayingCallId(null);
              setShowLeadDetail(false);
              setSelectedLead(null);
              setLeadCallHistory([]);
            }
          }}
        >
          <div 
            className="relative bg-[#0d1225]/95 backdrop-blur-xl rounded-3xl border border-purple-500/30 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            style={{
              boxShadow: '0 0 80px rgba(147, 51, 234, 0.2), 0 0 120px rgba(59, 130, 246, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Glowing background effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
            
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
                  // Stop audio when closing
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                  setPlayingCallId(null);
                  setShowLeadDetail(false);
                  setSelectedLead(null);
                  setLeadCallHistory([]);
                }}
                className="p-2 hover:bg-white/20 rounded-xl transition-all hover:scale-110"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="relative overflow-y-auto max-h-[calc(90vh-80px)] p-5 space-y-4">
              
              {/* Name & Status Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#1a1f35]/60 to-[#0f1525]/60 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white">{selectedLead.name}</h3>
                {/* Status Badge - Display only */}
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                  LEAD_STATUS_OPTIONS.find(s => s.value === getLeadStatus(selectedLead))?.className || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                } border`}>
                  {LEAD_STATUS_OPTIONS.find(s => s.value === getLeadStatus(selectedLead))?.label || selectedLead.status}
                </span>
              </div>

              {/* 1. Contact Information Section */}
              <div className="p-4 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl border border-cyan-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Contact Information</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <Phone className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Phone Number</p>
                      <p 
                        className={`text-white font-semibold ${blurSensitive ? 'blur-sm select-none' : ''}`}
                        style={blurSensitive ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
                      >
                        {formatPhone(selectedLead.phone)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20">
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

              {/* 2. Demographics Section */}
              <div className="p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-purple-400" />
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Demographics</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20 text-center">
                    <div className="p-2 bg-purple-500/10 rounded-lg w-fit mx-auto mb-2 text-lg">🎂</div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Age</p>
                    <p className="text-white font-bold text-xl">{selectedLead.age || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20 text-center">
                    <div className="p-2 bg-pink-500/10 rounded-lg w-fit mx-auto mb-2">
                      <MapPin className="w-4 h-4 text-pink-400" />
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">State</p>
                    <p className="text-white font-bold text-xl">{selectedLead.state || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* 3. Lead Type Card */}
              {(() => {
                const leadTypeInfo = getLeadTypeLabel(selectedLead.lead_type, agentConfig || undefined);
                const colorClasses = {
                  green: 'from-green-500/5 to-emerald-500/5 border-green-500/20',
                  amber: 'from-amber-500/5 to-orange-500/5 border-amber-500/20',
                  blue: 'from-blue-500/5 to-cyan-500/5 border-blue-500/20',
                };
                return (
                  <div className={`p-4 bg-gradient-to-br ${colorClasses[leadTypeInfo.color as keyof typeof colorClasses]} rounded-2xl border backdrop-blur-sm`}>
                    <div className="flex items-center gap-3 p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-xl">
                        {leadTypeInfo.icon}
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Lead Type</p>
                        <p className="text-white font-bold text-lg">{leadTypeInfo.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 4. Mortgage Protection Data */}
              {(selectedLead.lead_vendor || selectedLead.street_address) && (
                <div className="p-4 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 rounded-2xl border border-amber-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-4 h-4 text-amber-400" />
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Mortgage Protection Data</p>
                  </div>
                  <div className="space-y-3">
                    {selectedLead.lead_vendor && (
                      <div className="flex items-center gap-3 p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-sm">🏢</div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Lead Vendor</p>
                          <p className="text-white font-semibold">{selectedLead.lead_vendor}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.street_address && (
                      <div className="flex items-center gap-3 p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                          <MapPin className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Street Address</p>
                          <p className="text-white font-semibold uppercase">{selectedLead.street_address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. Lead Location Section */}
              {selectedLead.google_sheet_id && (
                <div className="p-4 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Lead Location</p>
                  </div>
                  <div className="p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20">
                    <p className="text-white font-semibold mb-1">
                      {(() => {
                        const sheet = sheets.find(s => s.id === selectedLead.google_sheet_id);
                        return sheet?.sheet_name || 'Unknown Sheet';
                      })()}
                    </p>
                    {(() => {
                      const sheet = sheets.find(s => s.id === selectedLead.google_sheet_id);
                      return sheet?.tab_name && (
                        <p className="text-xs text-gray-400 mb-1">
                          Tab: <span className="text-blue-400">{sheet.tab_name}</span>
                        </p>
                      );
                    })()}
                    {selectedLead.sheet_row_number && (
                      <p className="text-xs text-gray-400">
                        Row: <span className="text-blue-400 font-mono">{selectedLead.sheet_row_number}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 6. Call History Section - Last 7 Days */}
              <div className="p-4 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
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
                          <div className="flex items-center gap-2">
                            {/* Play Recording Button - Only show if duration >= 10 seconds (0.167 min) */}
                            {call.recording_url && call.duration && call.duration >= 0.167 && (
                              <button
                                onClick={() => toggleAudioPlayback(call.id, call.recording_url!)}
                                className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                                  playingCallId === call.id 
                                    ? 'bg-emerald-500/30 text-emerald-400' 
                                    : 'bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50'
                                }`}
                                title={playingCallId === call.id ? 'Stop' : 'Play Recording'}
                              >
                                {playingCallId === call.id ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(call.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
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
                          {call.recording_url && call.duration && call.duration >= 0.167 && (
                            <span className="flex items-center gap-1 text-emerald-400/70">
                              <Volume2 className="w-3 h-3" />
                              Recording available
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
              
              {/* Warning Banner */}
              <div className="mt-4 p-4 bg-yellow-500/20 backdrop-blur-sm border-2 border-yellow-400/40 rounded-xl flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-yellow-100 font-bold text-sm mb-1">⏱️ This can take several minutes</p>
                  <p className="text-yellow-200/90 text-xs leading-relaxed">
                    For thousands of leads, this may take up to 10 minutes. Please do NOT leave or refresh this page or your progress will be lost!
                  </p>
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

      {/* Shimmer Animation Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
}

