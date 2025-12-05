'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Trash2, Edit2, DollarSign, Calendar, Loader2, Receipt, Sparkles } from 'lucide-react';

interface CustomItem {
  id: string;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
}

interface CustomExpensesManagerProps {
  onExpenseChange?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CustomExpensesManager({ onExpenseChange, isOpen: externalIsOpen, onOpenChange }: CustomExpensesManagerProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };
  const [items, setItems] = useState<CustomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state - Simplified to only Software expenses
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fixed category - only Software for now
  const category = 'Software';

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/custom-expenses');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching revenue/expenses:', error);
      alert('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const expenseAmount = parseFloat(amount);
    
    if (!expenseAmount || expenseAmount <= 0) {
      alert('Please enter a valid amount!');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        type: 'expense',
        category: 'Software',
        amount: expenseAmount,
        description: description || null,
        date,
      };

      let response;
      if (editingId) {
        // Update existing
        response = await fetch('/api/admin/custom-expenses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingId }),
        });
      } else {
        // Create new
        response = await fetch('/api/admin/custom-expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error('Failed to save expense');

      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setEditingId(null);

      // Refresh list
      await fetchItems();
      
      // Notify parent to refresh revenue data
      onExpenseChange?.();
      
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;

    try {
      const response = await fetch(`/api/admin/custom-expenses?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete item');

      await fetchItems();
      
      // Notify parent to refresh revenue data
      onExpenseChange?.();
      
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleEdit = (item: CustomItem) => {
    // Only allow editing Software expenses
    if (item.type !== 'expense' || item.category !== 'Software') {
      alert('You can only edit Software expenses from this menu!');
      return;
    }
    setEditingId(item.id);
    setAmount(item.amount.toString());
    setDescription(item.description || '');
    setDate(item.date);
  };

  const handleCancel = () => {
    setEditingId(null);
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  // Only show Software expenses
  const softwareExpenses = items.filter(item => item.type === 'expense' && item.category === 'Software');
  const totalSoftwareExpenses = softwareExpenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Background Glows */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative w-full max-w-4xl flex flex-col bg-gradient-to-br from-[#1A2647] to-[#0F1629] rounded-2xl border border-red-500/20 shadow-2xl shadow-red-500/10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
            {/* Gradient Header Line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
            
            {/* Header - Compact */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/30">
                  <Receipt className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    Software Expenses
                  </h2>
                  <p className="text-xs text-gray-400">Track your software costs</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-gray-800/50 hover:bg-red-500/20 rounded-lg transition-all duration-300 group border border-gray-700/50 hover:border-red-500/50"
              >
                <X className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
              </button>
            </div>

            {/* Content - Compact */}
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                
                {/* Add/Edit Form - Takes 2 columns */}
                <div className="lg:col-span-2 bg-gradient-to-br from-[#0F1629]/80 to-[#0B1437]/80 rounded-xl p-4 border border-gray-700/50 hover:border-red-500/30 transition-all duration-300">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-red-500/20 rounded-md">
                      {editingId ? <Edit2 className="w-3.5 h-3.5 text-red-400" /> : <Plus className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    {editingId ? 'Edit Expense' : 'Add New Expense'}
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-green-400" />
                        Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-green-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-9 pr-3 py-2.5 bg-[#0B1437] border-2 border-gray-700/50 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        Date
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#0B1437] border-2 border-gray-700/50 rounded-lg text-white text-sm font-medium focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        Description
                        <span className="text-[10px] text-gray-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Cursor Pro, Vercel..."
                        className="w-full px-3 py-2.5 bg-[#0B1437] border-2 border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-600"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={submitting || !amount}
                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : editingId ? (
                          <>
                            <Edit2 className="w-4 h-4" />
                            Update
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add Expense
                          </>
                        )}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="px-4 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold rounded-lg transition-all border border-gray-600/50 hover:border-gray-500 text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Expenses List - Takes 3 columns - SCROLLABLE */}
                <div className="lg:col-span-3 bg-gradient-to-br from-[#0F1629]/80 to-[#0B1437]/80 rounded-xl p-4 border border-gray-700/50 flex flex-col max-h-[50vh] overflow-hidden">
                  {/* Header with Total */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-gray-400" />
                      Recent Expenses
                    </h3>
                    <div className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg hover:scale-105 transition-transform cursor-default">
                      <span className="text-base font-black text-red-400" style={{ filter: 'drop-shadow(0 0 8px rgba(248, 113, 113, 0.4))' }}>
                        ${totalSoftwareExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <Loader2 className="w-8 h-8 animate-spin text-red-400" />
                    </div>
                  ) : softwareExpenses.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <div className="text-center">
                        <DollarSign className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No expenses yet</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                      {softwareExpenses.map((item, index) => (
                        <div
                          key={item.id}
                          className="p-3 bg-[#0B1437]/60 rounded-lg border border-gray-700/50 hover:border-red-500/40 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Index Number */}
                              <div className="w-7 h-7 bg-red-500/10 rounded-md flex items-center justify-center border border-red-500/20 flex-shrink-0">
                                <span className="text-[10px] font-bold text-red-400">#{softwareExpenses.length - index}</span>
                              </div>
                              
                              <div className="min-w-0">
                                <div className="text-lg font-black text-red-400" style={{ filter: 'drop-shadow(0 0 6px rgba(248, 113, 113, 0.3))' }}>
                                  ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-gray-500">
                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  {item.description && (
                                    <>
                                      <span className="text-gray-600">•</span>
                                      <span className="text-gray-400 truncate">{item.description}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-all border border-blue-500/30 hover:border-blue-400/50"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-all border border-red-500/30 hover:border-red-400/50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - Compact */}
            <div className="flex items-center justify-end px-4 py-3 border-t border-gray-700/50 bg-[#0B1437]/50">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold rounded-lg transition-all duration-300 border border-gray-600/50 hover:border-gray-500 text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
