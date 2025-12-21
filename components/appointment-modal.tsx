'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { X, Trash2, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePrivacy } from '@/contexts/privacy-context';

interface AppointmentModalProps {
  appointment: any;
  userId: string;
  onClose: () => void;
}

export function AppointmentModal({ appointment, userId, onClose }: AppointmentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSelling, setIsSelling] = useState(false);
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const { blurSensitive } = usePrivacy();

  const appointmentDate = new Date(appointment.scheduled_at);

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

  // Helper: Extract customer name only (remove Cal.ai event title prefix)
  const extractCustomerName = (fullName: string | null) => {
    if (!fullName) return 'N/A';
    
    // Common patterns to remove:
    // "Event Name - Customer Name" or "Event Name – Customer Name"
    // Just return the part after the dash/hyphen
    const dashPattern = /[-–—]\s*(.+)$/;
    const match = fullName.match(dashPattern);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If no dash found, return the whole name
    return fullName.trim();
  };

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#FFD700', '#FFA500', '#FF8C00'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this appointment? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/appointments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id, userId }),
      });

      if (response.ok) {
        setMessage('✅ Appointment deleted');
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1000);
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

  const handleMarkNoShow = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/appointments/no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id, userId }),
      });

      if (response.ok) {
        setMessage('✅ Marked as no-show');
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1000);
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


  const handleMarkComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/appointments/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id, userId }),
      });

      if (response.ok) {
        setMessage('✅ Marked as completed');
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1000);
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

  const handleMarkSold = async () => {
    if (!monthlyPayment || parseFloat(monthlyPayment) <= 0) {
      setMessage('❌ Please enter a valid monthly payment amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/appointments/sold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          userId,
          monthlyPayment: parseFloat(monthlyPayment),
        }),
      });

      if (response.ok) {
        fireConfetti();
        const wasUpdate = appointment.is_sold;
        setMessage(wasUpdate ? '🎉 SOLD amount updated!' : '🎉 SOLD! Congratulations on closing the deal!');
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 3000);
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

  // Pre-fill monthly payment if appointment is already sold (only on initial load)
  useEffect(() => {
    if (appointment.is_sold && appointment.monthly_payment) {
      setMonthlyPayment(appointment.monthly_payment.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment.id]); // Only run when appointment changes, NOT when monthlyPayment changes

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 py-8">
        <div className="bg-[#1A2647] rounded-2xl border border-gray-700 max-w-2xl w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Appointment Details</h2>
            <p className="text-sm text-gray-400">
              {appointmentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appointment Time */}
          <div className="bg-[#0B1437] rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Scheduled Time</p>
            <p className="text-2xl font-bold text-white">
              {appointmentDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>

          {/* Prospect Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0B1437] rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Name</p>
              <p className="text-lg font-medium text-white">
                {extractCustomerName(appointment.prospect_name)}
              </p>
            </div>
            <div className="bg-[#0B1437] rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Phone</p>
              <p 
                className={`text-lg font-medium text-white ${blurSensitive ? 'blur-sm select-none' : ''}`}
                style={blurSensitive ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
              >
                {formatPhoneNumber(appointment.prospect_phone)}
              </p>
            </div>
            <div className="bg-[#0B1437] rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Age</p>
              <p className="text-lg font-medium text-white">
                {appointment.prospect_age || 'N/A'}
              </p>
            </div>
            <div className="bg-[#0B1437] rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">State</p>
              <p className="text-lg font-medium text-white">
                {appointment.prospect_state || 'N/A'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400">Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              appointment.is_sold
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : appointment.status === 'no_show' || appointment.is_no_show
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : appointment.status === 'completed'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {appointment.is_sold ? '💰 SOLD' :
               appointment.status === 'no_show' || appointment.is_no_show ? 'No-Show' : 
               appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </span>
          </div>

          {/* Sold Information */}
          {appointment.is_sold && (
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-4 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">Sale Information</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Monthly Payment</p>
                  <p className="text-xl font-bold text-white">
                    ${appointment.monthly_payment?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Annual Premium (AP)</p>
                  <p className="text-xl font-bold text-yellow-400">
                    ${appointment.total_annual_premium?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>
              {appointment.sold_at && (
                <p className="text-xs text-gray-400 mt-2">
                  Sold on {new Date(appointment.sold_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Mark as Sold Section */}
          {isSelling && (
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-5 border-2 border-yellow-500/40 shadow-lg shadow-yellow-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-500/40">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-base font-semibold text-white">
                  {appointment.is_sold ? 'Update Monthly Payment' : 'Enter Monthly Payment'}
                </p>
              </div>
              
              {appointment.is_sold && (
                <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-400">
                    Current: ${appointment.monthly_payment}/month (${(appointment.monthly_payment * 12).toLocaleString()} AP)
                  </p>
                </div>
              )}
              
              <input
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                placeholder={appointment.is_sold ? `Current: ${appointment.monthly_payment}` : "Enter monthly payment (e.g., 150)"}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-[#0B1437] border-2 border-yellow-500/40 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500/60 mb-3 transition-all"
              />
              
              <div className="mb-4 p-3 bg-[#0B1437]/60 border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">New Annual Premium (AP):</p>
                <p className="text-2xl font-bold text-yellow-400">
                  ${monthlyPayment ? (parseFloat(monthlyPayment) * 12).toLocaleString() : '0'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsSelling(false);
                    setMonthlyPayment(appointment.is_sold ? appointment.monthly_payment.toString() : '');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-700 bg-gray-800/20 text-gray-400 hover:text-white hover:bg-gray-800/40 hover:border-gray-600 rounded-lg transition-all duration-200 hover:scale-[1.02] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkSold}
                  disabled={loading}
                  className="group relative overflow-hidden flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500/80 to-orange-500/80 hover:from-yellow-500 hover:to-orange-500 border-2 border-yellow-500/60 text-white font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    🎉 {appointment.is_sold ? 'Update Sale' : 'Confirm Sale'}
                  </span>
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('Error') || message.includes('Failed')
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-800">
          {!isSelling && (
            <div className="space-y-3">
              {/* Row 1: Mark Complete & No-Show */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleMarkComplete}
                  disabled={loading}
                  className="group relative overflow-hidden px-6 py-3 bg-green-500/10 hover:bg-green-500/20 border-2 border-green-500/40 hover:border-green-500/60 text-green-400 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </span>
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  {/* Inner Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-500/10 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

                <button
                  onClick={handleMarkNoShow}
                  disabled={loading}
                  className="group relative overflow-hidden px-6 py-3 bg-orange-500/10 hover:bg-orange-500/20 border-2 border-orange-500/40 hover:border-orange-500/60 text-orange-400 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    No-Show
                  </span>
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  {/* Inner Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>

              {/* Row 2: Mark as SOLD & Delete */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsSelling(true)}
                  disabled={loading}
                  className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 border-2 border-yellow-500/40 hover:border-yellow-500/60 text-yellow-400 font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {appointment.is_sold ? 'Update SOLD' : 'Mark as SOLD'}
                  </span>
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  {/* Inner Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 via-yellow-500/15 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="group relative overflow-hidden px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/40 hover:border-red-500/60 text-red-400 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </span>
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  {/* Inner Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

