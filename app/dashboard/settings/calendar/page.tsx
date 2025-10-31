'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Clock, Calendar, Save } from 'lucide-react';

export default function CalendarSettingsPage() {
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/calendar-settings/get');
      if (response.ok) {
        const data = await response.json();
        setStartHour(data.start_hour);
        setEndHour(data.end_hour);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/calendar-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_hour: startHour, end_hour: endHour }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Calendar hours updated successfully! ✓');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1437] p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1437] p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Calendar Settings</h1>
          <p className="text-gray-400">Manage your Cal.com integration and calendar display preferences</p>
        </div>

        <div className="space-y-6">
          {/* Cal.com Integration Card */}
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border border-purple-500/20 shadow-2xl relative overflow-hidden transition-all duration-300">
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Cal.com Integration</h2>
                  <p className="text-sm text-gray-400">Manage your booking calendar</p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">
                Access your Cal.com dashboard to manage bookings, availability, and calendar integrations.
              </p>

              <a
                href="https://app.cal.com/bookings/upcoming"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
              >
                <span>Open Cal.com Bookings</span>
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Calendar Display Hours Card */}
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border border-blue-500/20 shadow-2xl relative overflow-hidden transition-all duration-300">
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Calendar Display Hours</h2>
                  <p className="text-sm text-gray-400">Set visible hours on your appointments calendar</p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">
                Configure the time range displayed on your Appointments page calendar view.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Start Hour */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Start Hour
                  </label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                      <option key={hour} value={hour} disabled={hour >= endHour}>
                        {formatHour(hour)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* End Hour */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    End Hour
                  </label>
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    {Array.from({ length: 25 }, (_, i) => i).map(hour => (
                      <option key={hour} value={hour} disabled={hour <= startHour}>
                        {formatHour(hour)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-300 mb-1">
                  <strong>Calendar will display:</strong>
                </p>
                <p className="text-lg font-semibold text-white">
                  {formatHour(startHour)} - {formatHour(endHour)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {endHour - startHour + 1} hour{endHour - startHour + 1 !== 1 ? 's' : ''} visible (including {formatHour(endHour)} hour)
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Calendar Hours'}
              </button>

              {/* Success/Error Message */}
              {message && (
                <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium ${
                  message.includes('Error')
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

