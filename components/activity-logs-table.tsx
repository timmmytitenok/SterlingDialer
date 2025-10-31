'use client';

import { useState, useMemo } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface ActivityLogsTableProps {
  calls: any[];
}

export function ActivityLogsTable({ calls }: ActivityLogsTableProps) {
  const [filter, setFilter] = useState<'all' | 'today' | '7days'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter calls based on selected period
  const filteredCalls = useMemo(() => {
    if (filter === 'all') return calls;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf7Days = new Date();
    startOf7Days.setDate(now.getDate() - 7);

    return calls.filter(call => {
      const callDate = new Date(call.created_at);
      if (filter === 'today') {
        return callDate >= startOfToday;
      } else if (filter === '7days') {
        return callDate >= startOf7Days;
      }
      return true;
    });
  }, [calls, filter]);

  // Pagination
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCalls = filteredCalls.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: 'all' | 'today' | '7days') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // Helper: Format phone number
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return 'N/A';
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      // Handle numbers with country code
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    // Return original if format is unclear
    return phone;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return <span className="text-gray-400">No outcome</span>;

    const configs: Record<string, { label: string; className: string }> = {
      appointment_booked: {
        label: 'Booked',
        className: 'bg-green-500/20 text-green-400 border border-green-500/30'
      },
      not_interested: {
        label: 'Not Interested',
        className: 'bg-red-500/20 text-red-400 border border-red-500/30'
      },
      callback_later: {
        label: 'Call Back',
        className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
      },
      live_transfer: {
        label: 'Transferred',
        className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      },
      unclassified: {
        label: 'Unclassified',
        className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      },
      other: {
        label: 'Other',
        className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      },
    };

    const config = configs[outcome] || configs.other;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (calls.length === 0) {
    return (
      <div className="bg-[#1A2647] rounded-xl p-12 border border-gray-800 text-center">
        <div className="text-6xl mb-4">📞</div>
        <h3 className="text-xl font-bold text-white mb-2">No Calls Yet</h3>
        <p className="text-gray-400">Answered calls will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A2647] rounded-xl border border-gray-800 overflow-hidden">
      {/* Filters */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Call History</h3>
        <div className="flex gap-1 bg-[#0B1437] p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => handleFilterChange('today')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'today'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleFilterChange('7days')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === '7days'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Last 7 Days
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0B1437] border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Phone Number
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Recording
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {paginatedCalls.map((call, index) => (
              <tr key={call.id} className="hover:bg-[#0B1437]/50 transition-colors">
                {/* Date & Time */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white font-medium">
                    {new Date(call.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(call.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </div>
                </td>

                {/* Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {call.contact_name || 'Unknown'}
                  </div>
                </td>

                {/* Phone */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300 font-mono">
                    {formatPhoneNumber(call.contact_phone)}
                  </div>
                </td>

                {/* Duration */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white font-medium">
                    {formatDuration(call.duration_seconds)}
                  </div>
                </td>

                {/* Status/Outcome */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {getOutcomeBadge(call.outcome)}
                </td>

                {/* Recording */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {call.recording_url ? (
                    <a
                      href={call.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      Play
                    </a>
                  ) : (
                    <span className="text-gray-500 text-xs">No recording</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-[#0B1437] border-t border-gray-800">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredCalls.length)} of {filteredCalls.length} calls
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        className={currentPage === page
                          ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[40px]'
                          : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 min-w-[40px]'
                        }
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-gray-500 px-2">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

