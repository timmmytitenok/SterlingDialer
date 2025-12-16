'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Settings, ExternalLink, Trash2, FileSpreadsheet, Sparkles } from 'lucide-react';
import { ColumnMapper } from './column-mapper';
import { LeadAgeSelector } from './lead-age-selector';
import { SheetTabSelector } from './sheet-tab-selector';

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
};

interface LeadsSettingsManagerProps {
  userId: string;
}

export function LeadsSettingsManager({ userId }: LeadsSettingsManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [showLeadAgeSelector, setShowLeadAgeSelector] = useState(false);
  const [showTabSelector, setShowTabSelector] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [message, setMessage] = useState('');
  const [currentSheet, setCurrentSheet] = useState<{ id: string; name: string; googleSheetId: string } | null>(null);
  const [sheetHeaders, setSheetHeaders] = useState<{ index: number; name: string }[]>([]);
  const [columnDetections, setColumnDetections] = useState<any>(null);
  const [selectedLeadAge, setSelectedLeadAge] = useState<number>(1);
  const [selectedTabName, setSelectedTabName] = useState<string | null>(null);
  const [availableTabs, setAvailableTabs] = useState<any[]>([]);
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, percentage: 0 });

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_google_sheets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) {
        // Get lead counts for each sheet
        const sheetsWithCounts = await Promise.all(
          data.map(async (sheet) => {
            const { count: totalCount } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('google_sheet_id', sheet.id)
              .eq('user_id', userId);

            // Get qualified leads (based on data quality)
            const { count: qualifiedCount } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('google_sheet_id', sheet.id)
              .eq('user_id', userId)
              .eq('is_qualified', true);

            // Get unqualified leads
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
              unqualified_count: unqualifiedCount || 0
            };
          })
        );
        
        setSheets(sheetsWithCounts);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate the sheet URL and get headers WITHOUT creating the database record yet
      const response = await fetch('/api/google-sheets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage('❌ ' + (data.error || 'Failed to validate sheet'));
        setLoading(false);
        return;
      }

      const googleSheetId = data.sheetId;
      const sheetName = data.sheetName || 'Google Sheet';

      // Fetch available tabs/sheets
      const tabsResponse = await fetch('/api/google-sheets/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: googleSheetId }),
      });

      const tabsData = await tabsResponse.json();

      if (!tabsResponse.ok || !tabsData.success) {
        setMessage('❌ Failed to fetch sheet tabs');
        setLoading(false);
        return;
      }

      // Store sheet info and show tab selector
      setAvailableTabs(tabsData.sheets);
      setCurrentSheet({ id: '', name: sheetName, googleSheetId });
      setShowAddSheet(false);
      
      // FIRST: Show tab selector
      setShowTabSelector(true);
      setMessage('');

    } catch (error: any) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleAdjustColumns = async (dbSheetId: string, sheetName: string) => {
    setLoading(true);
    
    try {
      const { data: sheetInfo } = await supabase
        .from('user_google_sheets')
        .select('sheet_id, min_lead_age_days, tab_name')
        .eq('id', dbSheetId)
        .single();

      const googleSheetId = sheetInfo?.sheet_id;
      const currentMinAge = sheetInfo?.min_lead_age_days ?? 1;
      const tabName = sheetInfo?.tab_name;

      if (!googleSheetId) {
        setMessage('❌ Could not find sheet information');
        return;
      }

      // Set the current age setting
      setSelectedLeadAge(currentMinAge);

      const headersResponse = await fetch('/api/google-sheets/headers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: googleSheetId, sheetName: tabName }),
      });

      const headersData = await headersResponse.json();

      if (!headersResponse.ok || !headersData.success) {
        setMessage('❌ Failed to read sheet headers');
        return;
      }

      setSheetHeaders(headersData.headers);
      setColumnDetections(headersData.detections);
      setCurrentSheet({ id: dbSheetId, name: sheetName, googleSheetId });
      setShowColumnMapper(true);

    } catch (error: any) {
      setMessage('❌ Error: ' + error.message);
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
        setMessage('❌ Failed to read sheet headers');
        setLoading(false);
        return;
      }

      setSheetHeaders(headersData.headers);
      setColumnDetections(headersData.detections);
      
      // Show lead age selector next
      setShowLeadAgeSelector(true);
    } catch (error) {
      setMessage('❌ Error reading sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLeadAge = async (minAgeDays: number) => {
    if (!currentSheet) return;

    // Save the age selection
    setSelectedLeadAge(minAgeDays);
    
    // Close age selector and show column mapper (SECOND step)
    setShowLeadAgeSelector(false);
    setShowColumnMapper(true);
  };

  const handleSaveColumnMapping = async (mapping: { name: number; phone: number; email: number; state: number; date: number }) => {
    if (!currentSheet) return;

    setLoading(true);
    setShowColumnMapper(false);
    setShowSyncProgress(true);
    setSyncProgress({ current: 0, total: 100, percentage: 0 });
    setMessage('');

    try {
      let dbSheetId = currentSheet.id;

      // Check if this is a new sheet or updating existing
      if (!currentSheet.id) {
        // STEP 1: Create the sheet record in database (new sheet)
        setSyncProgress({ current: 10, total: 100, percentage: 10 });
        const createResponse = await fetch('/api/google-sheets/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetUrl,
            googleSheetId: currentSheet.googleSheetId,
            sheetName: currentSheet.name,
            tabName: selectedTabName, // Pass the selected tab name
            columnMapping: mapping,
            minLeadAgeDays: selectedLeadAge,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'Failed to create sheet record');
        }

        const createData = await createResponse.json();
        dbSheetId = createData.sheetId;
      } else {
        // STEP 1: Update existing sheet's column mapping
        setSyncProgress({ current: 10, total: 100, percentage: 10 });
        const updateResponse = await fetch('/api/google-sheets/map-columns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetId: currentSheet.id,
            columnMapping: mapping,
            minLeadAgeDays: selectedLeadAge,
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || 'Failed to update column mapping');
        }
      }

      // STEP 2: Sync leads from the sheet
      setSyncProgress({ current: 30, total: 100, percentage: 30 });
      
      const syncResponse = await fetch('/api/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: dbSheetId }),
      });

      const syncData = await syncResponse.json();

      // Simulate progress (since we don't have real-time updates)
      for (let i = 40; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setSyncProgress({ current: i, total: 100, percentage: i });
      }

      setSyncProgress({ current: 100, total: 100, percentage: 100 });

      if (syncResponse.ok) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setMessage(`✅ ${syncData.message}`);
        await fetchSheets();
        router.refresh();
      } else {
        throw new Error(syncData.error || 'Failed to sync sheet');
      }
    } catch (error: any) {
      setMessage('❌ Error: ' + error.message);
      setSyncProgress({ current: 0, total: 0, percentage: 0 });
    } finally {
      setLoading(false);
      setShowSyncProgress(false);
      setCurrentSheet(null);
      setSelectedLeadAge(1);
      setSheetUrl('');
    }
  };

  const handleDeleteSheet = async (sheetId: string, sheetName: string, leadCount: number) => {
    const confirmMessage = leadCount 
      ? `Are you sure you want to delete "${sheetName}"?\n\nThis will permanently remove ${leadCount} lead${leadCount !== 1 ? 's' : ''} from your system.`
      : `Are you sure you want to delete "${sheetName}"?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error: leadsDeleteError } = await supabase
        .from('leads')
        .delete()
        .eq('google_sheet_id', sheetId)
        .eq('user_id', userId);

      if (leadsDeleteError) throw leadsDeleteError;

      const { error: sheetDeleteError } = await supabase
        .from('user_google_sheets')
        .update({ is_active: false })
        .eq('id', sheetId)
        .eq('user_id', userId);

      if (sheetDeleteError) throw sheetDeleteError;

      setMessage(`✅ Sheet and ${leadCount || 0} lead${leadCount !== 1 ? 's' : ''} deleted successfully!`);
      await fetchSheets();
      router.refresh();
    } catch (error: any) {
      setMessage('❌ Error deleting sheet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437]">
      <main className="container mx-auto px-4 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/leads')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Leads</span>
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileSpreadsheet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Google Sheets Manager</h1>
              <p className="text-gray-400 mt-1">Connect and manage your lead sources</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl border mb-6 animate-in slide-in-from-top-2 duration-300 ${
            message.startsWith('✅') 
              ? 'bg-green-500/10 text-green-400 border-green-500/30' 
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            {message}
          </div>
        )}

        {/* Add New Sheet Button */}
        {!showAddSheet && (
          <button
            onClick={() => setShowAddSheet(true)}
            className="w-full mb-6 group animate-in fade-in slide-in-from-top-4 duration-500"
          >
            <div className="p-8 rounded-2xl border-2 border-dashed border-blue-500/50 hover:border-blue-400 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300">
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold text-white block">Add New Google Sheet</span>
                  <span className="text-gray-400 text-sm">Import leads from your spreadsheet</span>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Add Sheet Form */}
        {showAddSheet && (
          <div className="bg-[#1A2647] rounded-2xl border border-blue-500/30 p-8 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Connect Google Sheet</h2>
            </div>

            <form onSubmit={handleConnectSheet} className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6">
                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Setup Instructions
                </h3>
                <ol className="space-y-3 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">1.</span>
                    <div>
                      <span className="block mb-1">Go to Google Sheets and open the <strong className="text-white">specific spreadsheet</strong> with your leads</span>
                      <span className="block text-xs text-gray-400">Make sure you're viewing the correct sheet/tab that contains your lead data</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">2.</span>
                    <div>
                      <span className="block mb-1">While on that sheet, <strong className="text-white">copy the full URL</strong> from your browser address bar</span>
                      <span className="block text-xs text-gray-400">The URL should include the specific sheet/tab ID</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">3.</span>
                    <div>
                      <span className="block mb-1">Click the <strong className="text-white">"Share"</strong> button in Google Sheets</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">4.</span>
                    <div>
                      <span>Add this email as an <strong className="text-white">Editor</strong>:</span>
                      <div className="mt-2 p-3 bg-[#0F172A] rounded-lg border border-blue-500/20">
                        <code className="text-blue-300 text-xs break-all">
                          sterlingdailer@sterlingdialer.iam.gserviceaccount.com
                        </code>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">5.</span>
                    <span>Paste the URL you copied in step 2 below</span>
                  </li>
                </ol>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-white font-semibold mb-3">
                  Google Sheet URL
                </label>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-5 py-4 bg-[#0F172A] border-2 border-gray-700 focus:border-blue-500 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSheet(false);
                    setSheetUrl('');
                    setMessage('');
                  }}
                  className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !sheetUrl}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3"
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
                      <FileSpreadsheet className="w-5 h-5" />
                      Continue
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Connected Sheets */}
        {loading && sheets.length === 0 ? (
          <div className="bg-[#1A2647] rounded-2xl p-12 border border-gray-800 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading sheets...</p>
          </div>
        ) : sheets.length === 0 ? (
          <div className="bg-[#1A2647] rounded-2xl p-12 border border-gray-800 text-center">
            <FileSpreadsheet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Sheets Connected</h3>
            <p className="text-gray-400">Click "Add New Google Sheet" above to get started</p>
          </div>
        ) : (
          <div className="space-y-6 overflow-visible">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Connected Sheets</h2>
              <span className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-full text-sm font-bold border border-blue-500/30">
                {sheets.length} Active
              </span>
            </div>
            
            {sheets.map((sheet, index) => (
              <div
                key={sheet.id}
                className="bg-[#1A2647]/40 backdrop-blur-xl rounded-2xl border border-gray-700/30 hover:border-blue-500/60 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 hover:shadow-2xl hover:shadow-blue-500/10 relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-5">
                  <div className="flex items-center gap-6">
                    {/* Index Badge */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                    
                    {/* Sheet Name */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{sheet.sheet_name}</h3>
                      {sheet.last_sync_at && (
                        <p className="text-gray-400 text-xs mt-1">
                          Last sync: {new Date(sheet.last_sync_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 backdrop-blur-sm rounded-lg border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-green-300 font-semibold text-sm whitespace-nowrap">
                          {sheet.qualified_count || 0} Qualified Leads
                        </span>
                      </div>

                      {(sheet.unqualified_count ?? 0) > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 backdrop-blur-sm rounded-lg border border-yellow-500/20 group/tooltip relative z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                          <span className="text-yellow-300 font-semibold text-sm whitespace-nowrap">
                            {sheet.unqualified_count} Unqualified
                          </span>
                          
                          {/* Tooltip */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover/tooltip:block z-[9999] pointer-events-none">
                            <div className="bg-gray-900 text-yellow-200 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-2xl border border-yellow-500/30 relative">
                              ⚠️ Bad data detected (emails in name field, invalid phone numbers)
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1">
                                <div className="border-4 border-transparent border-b-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdjustColumns(sheet.id, sheet.sheet_name)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/60 disabled:opacity-50 text-blue-300 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    <Settings className="w-4 h-4" />
                    Columns
                  </button>
                  
                  <a
                    href={sheet.sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-500/10 hover:bg-gray-500/20 backdrop-blur-sm border border-gray-500/30 hover:border-gray-400/60 text-gray-300 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm hover:shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                  
                  <button
                    onClick={() => handleDeleteSheet(sheet.id, sheet.sheet_name, sheet.lead_count || 0)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-sm border border-red-500/30 hover:border-red-500/60 disabled:opacity-50 text-red-300 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm hover:shadow-lg hover:shadow-red-500/20"
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

        {/* Lead Age Selector Modal - FIRST */}
        {/* Tab Selector Modal - FIRST */}
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
            }}
          />
        )}

        {/* Lead Age Selector - SECOND */}
        {showLeadAgeSelector && currentSheet && (
          <LeadAgeSelector
            onSave={handleSaveLeadAge}
            onCancel={() => {
              setShowLeadAgeSelector(false);
              setCurrentSheet(null);
              setSheetHeaders([]);
              setColumnDetections(null);
              setSelectedLeadAge(1);
              setSheetUrl('');
            }}
            sheetName={currentSheet.name}
            hasDateColumn={true}
          />
        )}

        {/* Column Mapper Modal - SECOND */}
        {showColumnMapper && currentSheet && (
          <ColumnMapper
            headers={sheetHeaders}
            detections={columnDetections}
            onSave={handleSaveColumnMapping}
            onCancel={() => {
              setShowColumnMapper(false);
              setCurrentSheet(null);
              setSheetHeaders([]);
              setColumnDetections(null);
              setSelectedLeadAge(1);
              setSheetUrl('');
            }}
            onBack={!currentSheet.id ? () => {
              setShowColumnMapper(false);
              setShowLeadAgeSelector(true);
            } : undefined}
            sheetName={currentSheet.name}
            needsDateColumn={selectedLeadAge > 0}
          />
        )}

        {/* Sync Progress Modal */}
        {showSyncProgress && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-3xl border-2 border-blue-500/30 max-w-md w-full overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">Importing Leads</h2>
                    <p className="text-blue-100 text-sm mt-0.5">Please wait while we sync your leads...</p>
                  </div>
                </div>
                
                {/* Important Warning Banner */}
                <div className="mt-4 p-3 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-lg flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-yellow-100 font-semibold text-sm">⏱️ This could take up to 5 minutes</p>
                    <p className="text-yellow-200/90 text-xs mt-1">Please do not close this tab until the import is complete. Large sheets may take longer to process.</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-blue-400 font-bold text-lg">{syncProgress.percentage}%</span>
                  </div>
                  
                  <div className="relative h-4 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${syncProgress.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center gap-2 transition-opacity ${syncProgress.percentage >= 10 ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-2 h-2 rounded-full ${syncProgress.percentage >= 10 ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-gray-300">Creating sheet connection...</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity ${syncProgress.percentage >= 30 ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-2 h-2 rounded-full ${syncProgress.percentage >= 30 ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-gray-300">Reading Google Sheet...</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity ${syncProgress.percentage >= 50 ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-2 h-2 rounded-full ${syncProgress.percentage >= 50 ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className="text-gray-300">Importing leads...</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity ${syncProgress.percentage >= 100 ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-2 h-2 rounded-full ${syncProgress.percentage >= 100 ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-gray-300">Finalizing...</span>
                  </div>
                </div>

                {syncProgress.percentage === 100 && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-300 font-medium text-sm text-center">
                      ✅ All leads imported successfully!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

