'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { X, Calendar, Clock, User, Phone, MapPin, Hash } from 'lucide-react';

interface AddAppointmentModalProps {
  onClose: () => void;
  userId: string;
}

export function AddAppointmentModal({ onClose, userId }: AddAppointmentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [state, setState] = useState('');
  const [duration, setDuration] = useState('20'); // Default 20 minutes
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

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

  // Get min and max dates (today to 4 days ahead - 5 days total to match calendar)
  const today = new Date();
  // Force local timezone for date picker
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const minDate = `${year}-${month}-${day}`;
  
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 4);
  const maxYear = maxDateObj.getFullYear();
  const maxMonth = String(maxDateObj.getMonth() + 1).padStart(2, '0');
  const maxDay = String(maxDateObj.getDate()).padStart(2, '0');
  const maxDate = `${maxYear}-${maxMonth}-${maxDay}`;
  
  console.log('📅 Date picker range:', { minDate, maxDate });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      setMessage('❌ Please enter a name');
      return;
    }
    if (!phone.trim()) {
      setMessage('❌ Please enter a phone number');
      return;
    }
    if (!age || parseInt(age) <= 0) {
      setMessage('❌ Please enter a valid age');
      return;
    }
    if (!state.trim()) {
      setMessage('❌ Please enter a state');
      return;
    }
    if (!date) {
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
      const scheduledAt = new Date(`${date}T${time}`).toISOString();

      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contactName: name.trim(),
          contactPhone: phone.trim(),
          contactAge: parseInt(age),
          contactState: state.trim(),
          duration: parseInt(duration),
          scheduledAt,
        }),
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A2647] rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contact Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Contact Information
            </h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
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

            {/* Phone and Age Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Age *
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
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                State *
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

          {/* Appointment Details Section */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-400" />
              Appointment Details
            </h3>

            {/* Duration Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Meeting Duration *
              </label>
              <div className="flex gap-3">
                {['10', '20', '30'].map((dur) => (
                  <label
                    key={dur}
                    className={`flex-1 cursor-pointer transition-all duration-200 ${
                      duration === dur
                        ? 'scale-[1.02]'
                        : ''
                    }`}
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
                      className={`p-4 rounded-lg text-center border-2 transition-all ${
                        duration === dur
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/20'
                          : 'bg-[#0B1437] border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <p className="text-2xl font-bold">{dur}</p>
                      <p className="text-xs mt-1">minutes</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Book up to 5 days in advance</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0B1437] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">7 AM - 9 PM recommended</p>
              </div>
            </div>
          </div>

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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
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
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600/80 to-green-600/80 hover:from-blue-600 hover:to-green-600 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 h-12"
            >
              {loading ? '⏳ Creating...' : '✅ Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

