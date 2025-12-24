'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2, AlertCircle, CheckCircle, DollarSign, Calendar, Phone, User, Clock, MapPin, Users } from 'lucide-react';
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
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  // Helper: Extract customer name only (remove Cal.ai event title prefix)
  const extractCustomerName = (fullName: string | null) => {
    if (!fullName) return 'N/A';
    const dashPattern = /[-–—]\s*(.+)$/;
    const match = fullName.match(dashPattern);
    if (match && match[1]) {
      return match[1].trim();
    }
    return fullName.trim();
  };

  // Get status info
  const getStatusInfo = () => {
    if (appointment.is_sold) {
      return { label: '💰 SOLD', color: 'yellow', bgClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    }
    if (appointment.status === 'no_show' || appointment.is_no_show) {
      return { label: 'No-Show', color: 'red', bgClass: 'bg-red-500/20 text-red-400 border-red-500/30' };
    }
    if (appointment.status === 'completed') {
      return { label: 'Completed', color: 'green', bgClass: 'bg-green-500/20 text-green-400 border-green-500/30' };
    }
    return { label: 'Scheduled', color: 'blue', bgClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  };

  const statusInfo = getStatusInfo();

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
    console.log('🔴 Marking as No-Show:');
    console.log('   Appointment ID:', appointment.id);
    console.log('   Prospect Name:', appointment.prospect_name);
    console.log('   Prospect Phone:', appointment.prospect_phone);
    console.log('   Lead ID:', appointment.lead_id || 'NOT SET');
    
    try {
      const response = await fetch('/api/appointments/no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id, userId }),
      });

      const data = await response.json();
      console.log('📋 No-Show API Response:', data);
      
      if (response.ok) {
        if (data.leadUpdated) {
          setMessage('✅ Marked as no-show (Lead status updated!)');
        } else {
          setMessage('✅ Marked as no-show (⚠️ Lead not found in system)');
        }
        console.log('   Lead Updated:', data.leadUpdated);
        console.log('   Lead ID:', data.leadId);
        console.log('   Debug Info:', data.debugInfo);
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1500);
      } else {
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
    if (appointment.is_sold && appointment.monthly_payment) {
      setMonthlyPayment(appointment.monthly_payment.toString());
    }
  }, [appointment.id]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative bg-[#0d1225]/95 backdrop-blur-xl rounded-3xl border border-orange-500/20 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        style={{
          boxShadow: '0 0 40px rgba(249, 115, 22, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Subtle background effects */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-orange-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-amber-600/8 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-600/90 via-amber-600/90 to-yellow-600/90 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Appointment Details</h2>
              <p className="text-xs text-white/70">
                {appointmentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all hover:scale-110"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="relative overflow-y-auto max-h-[calc(90vh-80px)] p-5 space-y-4">
          
          {/* Name & Status Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#1a1f35]/60 to-[#0f1525]/60 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white">{extractCustomerName(appointment.prospect_name)}</h3>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusInfo.bgClass}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Scheduled Time Section */}
          <div className="p-4 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl border border-orange-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-orange-400" />
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Scheduled Time</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Time</p>
                <p className="text-2xl font-bold text-white">
                  {appointmentDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
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
                    {formatPhoneNumber(appointment.prospect_phone)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Demographics Section */}
          <div className="p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-purple-400" />
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Demographics</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <span className="text-xl">🎂</span>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Age</p>
                <p className="text-xl font-bold text-white">{appointment.prospect_age || 'N/A'}</p>
              </div>
              <div className="p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-pink-400" />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">State</p>
                <p className="text-xl font-bold text-white">{appointment.prospect_state || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Sale Information (if sold) */}
          {appointment.is_sold && (
            <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl border border-yellow-500/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Sale Information</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Monthly Payment</p>
                  <p className="text-2xl font-bold text-white">
                    ${appointment.monthly_payment?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-[#0a0f1e]/40 rounded-xl border border-gray-700/20 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Annual Premium (AP)</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    ${appointment.total_annual_premium?.toLocaleString() || (appointment.monthly_payment ? (appointment.monthly_payment * 12).toLocaleString() : 'N/A')}
                  </p>
                </div>
              </div>
              {appointment.sold_at && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Sold on {new Date(appointment.sold_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Mark as Sold Section */}
          {isSelling && (
            <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl border-2 border-yellow-500/40 shadow-lg shadow-yellow-500/20">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </button>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('Error') || message.includes('Failed')
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {message}
            </div>
          )}

          {/* Action Buttons */}
          {!isSelling && (
            <div className="space-y-3 pt-2">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
