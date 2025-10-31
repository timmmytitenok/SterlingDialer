'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export function BalanceSuccessHandler() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [amount, setAmount] = useState<string>('0');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Check for success or cancel parameters
    const params = new URLSearchParams(window.location.search);
    const balanceSuccess = params.get('balance_success');
    const balanceCanceled = params.get('balance_canceled');
    const refillAmount = params.get('amount');

    console.log('Balance Success Handler - URL params:', { balanceSuccess, balanceCanceled, refillAmount });

    if (balanceSuccess === 'true' && refillAmount) {
      setAmount(refillAmount);
      setShowSuccessModal(true);
      
      // Clean up URL after a short delay
      setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 500);
    }

    if (balanceCanceled === 'true') {
      setShowCancelModal(true);
      
      // Clean up URL after a short delay
      setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 500);
    }
  }, [isClient]);

  if (!isClient) return null;

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border-2 border-green-500/40 max-w-md w-full shadow-2xl shadow-green-500/20 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border-2 border-green-500/50 animate-pulse">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">✅ Balance Added!</h2>
              </div>
              <p className="text-gray-400 text-sm">Your call balance has been topped up</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-green-950/30 border-2 border-green-500/30 rounded-xl p-5 text-center">
                <p className="text-green-300 font-semibold mb-2">Added to Balance:</p>
                <p className="text-5xl font-bold text-green-400">${amount}</p>
                <p className="text-sm text-gray-400 mt-3">
                  ≈ {parseInt(amount) * 10} minutes of calling time
                </p>
              </div>

              <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  💡 <strong>Tip:</strong> Enable auto-refill below to automatically top up when your balance runs low.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-6 border-t border-gray-800/50">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  // Refresh the page to update balance
                  window.location.reload();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/40 h-12"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border-2 border-orange-500/40 max-w-md w-full shadow-2xl shadow-orange-500/20 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/50">
                  <XCircle className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Payment Canceled</h2>
              </div>
              <p className="text-gray-400 text-sm">No charges were made</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-orange-950/30 border border-orange-500/30 rounded-xl p-5">
                <p className="text-orange-300 text-sm">
                  Your balance top-up was canceled. No payment was processed.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-6 border-t border-gray-800/50">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full px-6 py-3 border border-gray-700 bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium h-12"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

