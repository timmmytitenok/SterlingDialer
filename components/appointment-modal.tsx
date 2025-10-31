'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { X, Trash2, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

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

  // Pre-fill monthly payment if appointment is already sold
  useEffect(() => {
    if (appointment.is_sold && appointment.monthly_payment && !monthlyPayment) {
      setMonthlyPayment(appointment.monthly_payment.toString());
    }
  }, [appointment, monthlyPayment]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
              <p className="text-lg font-medium text-white">
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
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg p-4 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <p className="text-sm font-medium text-white">
                  {appointment.is_sold ? 'Update Monthly Payment' : 'Enter Monthly Payment'}
                </p>
              </div>
              {appointment.is_sold && (
                <p className="text-xs text-yellow-400 mb-2">
                  Current: ${appointment.monthly_payment}/month (${(appointment.monthly_payment * 12).toLocaleString()} AP)
                </p>
              )}
              <input
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                placeholder={appointment.is_sold ? `Current: ${appointment.monthly_payment}` : "Enter monthly payment (e.g., 150)"}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-[#1A2647] border border-yellow-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-2"
              />
              <p className="text-xs text-gray-400 mb-3">
                New Annual Premium (AP): ${monthlyPayment ? (parseFloat(monthlyPayment) * 12).toLocaleString() : '0'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsSelling(false);
                    setMonthlyPayment(appointment.is_sold ? appointment.monthly_payment.toString() : '');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-800 bg-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleMarkSold}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-yellow-500/80 to-orange-500/80 hover:from-yellow-500 hover:to-orange-500 text-white font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/30"
                >
                  🎉 {appointment.is_sold ? 'Update Sale' : 'Confirm Sale'}
                </Button>
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
                <Button
                  onClick={handleMarkComplete}
                  className="bg-green-600/80 hover:bg-green-600 text-white font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/30"
                  disabled={loading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>

                <Button
                  onClick={handleMarkNoShow}
                  className="bg-orange-600/80 hover:bg-orange-600 text-white font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/30"
                  disabled={loading}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  No-Show
                </Button>
              </div>

              {/* Row 2: Mark as SOLD & Delete */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setIsSelling(true)}
                  className="bg-gradient-to-r from-yellow-500/80 to-orange-500/80 hover:from-yellow-500 hover:to-orange-500 text-white font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/30"
                  disabled={loading}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {appointment.is_sold ? 'Update SOLD Amount' : 'Mark as SOLD'}
                </Button>

                <Button
                  onClick={handleDelete}
                  className="bg-red-600/80 hover:bg-red-600 text-white font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/30"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

