'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { X, Calendar, Clock, User, Phone, MapPin, Hash, ChevronDown, AlertCircle } from 'lucide-react';

interface AddAppointmentModalProps {
  onClose: () => void;
  userId: string;
  existingAppointments?: any[];
}

export function AddAppointmentModal({ onClose, userId, existingAppointments = [] }: AddAppointmentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [state, setState] = useState('');
  const [duration, setDuration] = useState('20'); // Default 20 minutes
  const [selectedDateOption, setSelectedDateOption] = useState(''); // 'today', 'tomorrow', or ISO date
  const [time, setTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  // Time picker options
  const hours = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutes = ['00', '10', '20', '30', '40', '50'];

  // Update time value when hour/minute/period changes
  const updateTime = (hour: string, minute: string, period: 'AM' | 'PM') => {
    let hour24 = parseInt(hour);
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    const timeStr = `${String(hour24).padStart(2, '0')}:${minute}`;
    setTime(timeStr);
  };

  // Format time for display
  const formatTimeDisplay = () => {
    if (!time) return 'Select time';
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    let formatted = '';

    if (input.length > 0) {
      formatted = '(' + input.substring(0, 3);
    }
    if (input.length >= 4) {
      formatted += ') ' + input.substring(3, 6);
    }
    if (input.length >= 7) {
      formatted += '-' + input.substring(6, 10);
    }

    setPhone(formatted);
  };

  // Generate date options (5 days: today + 4 days ahead)
  const dateOptions = useMemo(() => {
    const options = [];
  const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      // Use local date string (YYYY-MM-DD format in local timezone)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
  
      const dayNum = date.getDate();
      const ordinal = dayNum + (dayNum > 3 && dayNum < 21 ? 'th' : ['th', 'st', 'nd', 'rd'][dayNum % 10] || 'th');
      
      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      else label = ordinal;
      
      options.push({ value: dateStr, label, date });
    }
    
    return options;
  }, []);

  // Helper to get actual date string from selection
  const getDateString = () => {
    if (!selectedDateOption) return '';
    return selectedDateOption;
  };

  // Helper to format date for preview
  const formatDateForPreview = () => {
    if (!selectedDateOption) return '';
    const option = dateOptions.find(opt => opt.value === selectedDateOption);
    return option?.label || '';
  };

  // Check for appointment conflicts when date/time changes
  useEffect(() => {
    const dateStr = getDateString();
    if (!dateStr || !time) {
      setConflictWarning('');
      return;
    }

    const selectedDateTime = new Date(`${dateStr}T${time}`);
    const selectedDuration = parseInt(duration);
    const selectedStart = selectedDateTime.getTime();
    const selectedEnd = selectedStart + selectedDuration * 60 * 1000;

    // Check for conflicts with existing appointments
    for (const apt of existingAppointments) {
      const aptStart = new Date(apt.scheduled_at).getTime();
      const aptDuration = apt.duration_minutes || 20;
      const aptEnd = aptStart + aptDuration * 60 * 1000;

      // Check for exact overlap
      if (selectedStart === aptStart) {
        setConflictWarning('🔴 You already have another appointment at this time.');
        return;
      }

      // Check for adjacent appointments (within 5 minutes)
      const timeDiff = Math.abs(selectedStart - aptStart) / 1000 / 60; // in minutes
      if (timeDiff > 0 && timeDiff < 5) {
        setConflictWarning('🟡 This time is adjacent to another appointment.');
        return;
      }
    }

    setConflictWarning('');
  }, [selectedDateOption, time, duration, existingAppointments, getDateString]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - Only name, phone, date, and time are required
    if (!name.trim()) {
      setMessage('❌ Please enter a name');
      return;
    }
    if (!phone.trim()) {
      setMessage('❌ Please enter a phone number');
      return;
    }
    if (!selectedDateOption) {
      setMessage('❌ Please select a date');
      return;
    }
    if (!time) {
      setMessage('❌ Please select a time');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Combine date and time into ISO string
      const dateStr = getDateString();
      const scheduledAt = new Date(`${dateStr}T${time}`).toISOString();

      const payload: any = {
        userId,
        contactName: name.trim(),
        contactPhone: phone.trim(),
        duration: parseInt(duration),
        scheduledAt,
      };

      // Add optional fields if provided
      if (age && parseInt(age) > 0) {
        payload.contactAge = parseInt(age);
      }
      if (state.trim()) {
        payload.contactState = state.trim();
      }

      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage('✅ Appointment created successfully!');
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1500);
      } else {
        const data = await response.json();
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 py-8">
        <div className="bg-[#1A2647] rounded-2xl border border-gray-700 max-w-2xl w-full">
        {/* Header - Scrolls with content */}
        <div className="bg-[#1A2647] flex items-center justify-between p-6 border-b border-gray-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Add New Appointment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contact Info Section */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Phone */}
              <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

            {/* More Details - Collapsible */}
            <div className="border-t border-gray-800 pt-4">
              <button
                type="button"
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showMoreDetails ? 'rotate-180' : ''}`} />
                <span>More Details (optional)</span>
              </button>

              {showMoreDetails && (
                <div className="mt-4 space-y-4 pl-6">
                  {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                      Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="45"
                  min="0"
                  max="120"
                  className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                      State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="CA"
                maxLength={2}
                className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                disabled={loading}
              />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details Section */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            {/* Duration Selection - Compact Pills */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Duration
              </label>
              <div className="flex gap-2">
                {['10', '20', '30'].map((dur) => (
                  <label
                    key={dur}
                    className="cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={dur}
                      checked={duration === dur}
                      onChange={(e) => setDuration(e.target.value)}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        duration === dur
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-[#0B1437] border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                      }`}
                    >
                      {dur}m{duration === '20' && dur === '20' ? ' (default)' : ''}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Selection - Pill Buttons */}
              <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                  Date *
                </label>
              <div className="flex flex-wrap gap-2">
                {dateOptions.map((option) => (
                  <label
                    key={option.value}
                    className="cursor-pointer"
                  >
                <input
                      type="radio"
                      name="date"
                      value={option.value}
                      checked={selectedDateOption === option.value}
                      onChange={(e) => setSelectedDateOption(e.target.value)}
                      className="sr-only"
                  disabled={loading}
                />
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedDateOption === option.value
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-[#0B1437] border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                      }`}
                    >
                      {option.label}
                    </div>
                  </label>
                ))}
              </div>
              </div>

            {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time *
                </label>
              
              {/* Time Display Button */}
              <button
                type="button"
                onClick={() => {
                  setShowTimePicker(!showTimePicker);
                  // Auto-fill 9:00 AM on first open if no time is set
                  if (!showTimePicker && !time) {
                    setTime('09:00');
                  }
                }}
                className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-600"
                  disabled={loading}
              >
                <div className="flex items-center justify-between">
                  <span className={time ? 'text-white' : 'text-gray-500'}>
                    {formatTimeDisplay()}
                  </span>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
              </button>

              {/* Custom Scrollable Time Picker - Expands inline */}
              {showTimePicker && (
                <div className="mt-3 w-full bg-[#0B1437] border border-gray-700 rounded-lg p-4">
                  <div className="flex gap-2 mb-3">
                    {/* Hours Column */}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-2 text-center">Hour</label>
                      <div className="h-40 overflow-y-auto bg-[#0B1437] rounded-lg border border-gray-700 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {hours.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => {
                              setSelectedHour(hour);
                              updateTime(hour, selectedMinute, selectedPeriod);
                            }}
                            className={`w-full px-3 py-2 text-center transition-colors ${
                              selectedHour === hour
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                            }`}
                          >
                            {hour}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Minutes Column */}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-2 text-center">Minute</label>
                      <div className="h-40 overflow-y-auto bg-[#0B1437] rounded-lg border border-gray-700 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {minutes.map((minute) => (
                          <button
                            key={minute}
                            type="button"
                            onClick={() => {
                              setSelectedMinute(minute);
                              updateTime(selectedHour, minute, selectedPeriod);
                            }}
                            className={`w-full px-3 py-2 text-center transition-colors ${
                              selectedMinute === minute
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                            }`}
                          >
                            {minute}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AM/PM Column */}
                    <div className="w-20">
                      <label className="block text-xs text-gray-400 mb-2 text-center">Period</label>
                      <div className="h-40 flex flex-col gap-2 bg-[#0B1437] rounded-lg border border-gray-700 p-2">
                        {['AM', 'PM'].map((period) => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => {
                              const p = period as 'AM' | 'PM';
                              setSelectedPeriod(p);
                              updateTime(selectedHour, selectedMinute, p);
                            }}
                            className={`flex-1 rounded-lg text-sm font-semibold transition-colors ${
                              selectedPeriod === period
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                            }`}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Done Button */}
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(false)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Done
                  </button>
              </div>
              )}
            </div>

            {/* Conflict Warning */}
            {conflictWarning && (
              <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
                conflictWarning.includes('🔴')
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
              }`}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{conflictWarning}</span>
              </div>
            )}
          </div>

          {/* Preview */}
          {name && selectedDateOption && time && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-xs text-blue-400 font-medium mb-2">Preview</p>
              <p className="text-white text-sm">
                <span className="font-semibold">{name}</span>
                {' — '}
                <span>{formatDateForPreview()}</span>
                {' — '}
                <span>{new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                {' — '}
                <span>{duration} minutes</span>
              </p>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg text-sm font-medium ${
              message.includes('Error') || message.includes('Failed') || message.includes('Please')
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {message}
            </div>
          )}

        </form>

        {/* Action Buttons - Scrolls with content */}
        <div className="bg-[#1A2647] border-t border-gray-800 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-700 bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium h-12"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600/80 to-green-600/80 hover:from-blue-600 hover:to-green-600 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 h-12"
            >
              {loading ? '⏳ Creating...' : '✅ Create Appointment'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

