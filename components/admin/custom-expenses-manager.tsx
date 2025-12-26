'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Trash2, Edit2, DollarSign, Calendar, Loader2, Receipt, Sparkles, Monitor, Megaphone, TrendingUp, CreditCard, Minus, Hash } from 'lucide-react';

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

type MainTab = 'expenses' | 'revenue';
type ExpenseCategory = 'Software' | 'Advertising' | 'AI Calls';
type RevenueCategory = 'Subscription' | 'Balance Refill';

// Price per unit for each revenue category
const REVENUE_PRICES: Record<RevenueCategory, number> = {
  'Subscription': 379,
  'Balance Refill': 25,
};

// User rate per minute (what users pay)
const USER_RATE_PER_MINUTE = 0.30;

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
  const [aiCostPerMinute, setAiCostPerMinute] = useState(0.15); // Default, will be fetched

  // Main tab: expenses or revenue
  const [mainTab, setMainTab] = useState<MainTab>('expenses');
  
  // Sub tabs for each main tab
  const [expenseTab, setExpenseTab] = useState<ExpenseCategory>('Software');
  const [revenueTab, setRevenueTab] = useState<RevenueCategory>('Subscription');

  // Form state
  const [amount, setAmount] = useState(''); // For expenses (dollar amount)
  const [quantity, setQuantity] = useState(1); // For revenue (number of payments)
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubtract, setIsSubtract] = useState(false); // For revenue: add or subtract

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      fetchSettings();
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

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.settings?.ai_cost_per_minute) {
        setAiCostPerMinute(parseFloat(data.settings.ai_cost_per_minute));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Calculate AI expense based on revenue and cost per minute
  const calculateAIExpense = (revenueAmount: number): number => {
    const minutesPurchased = revenueAmount / USER_RATE_PER_MINUTE;
    const expense = minutesPurchased * aiCostPerMinute;
    return Math.round(expense * 100) / 100; // Round to 2 decimal places
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAmount: number;
    
    if (mainTab === 'expenses') {
      // For expenses, use the dollar amount directly
      finalAmount = parseFloat(amount);
      if (!finalAmount || finalAmount <= 0) {
        alert('Please enter a valid amount!');
        return;
      }
    } else {
      // For revenue, calculate based on quantity × price
      if (quantity < 1) {
        alert('Please enter at least 1!');
        return;
      }
      const pricePerUnit = REVENUE_PRICES[revenueTab];
      finalAmount = quantity * pricePerUnit;
      
      // If subtracting, make it negative
      if (isSubtract) {
        finalAmount = -finalAmount;
      }
    }

    const currentCategory = mainTab === 'expenses' ? expenseTab : revenueTab;

    try {
      setSubmitting(true);

      const payload = {
        type: mainTab === 'expenses' ? 'expense' : 'revenue',
        category: currentCategory,
        amount: finalAmount,
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

      if (!response.ok) throw new Error('Failed to save item');

      // 🔗 AUTO-LINK: If adding Balance Refill revenue, also create AI Calls expense
      if (mainTab === 'revenue' && revenueTab === 'Balance Refill' && !editingId && !isSubtract) {
        console.log('📊 Auto-creating AI Calls expense for Balance Refill revenue...');
        
        // Calculate actual expense based on ai_cost_per_minute setting
        const revenueAmount = quantity * REVENUE_PRICES['Balance Refill'];
        const aiExpenseAmount = calculateAIExpense(revenueAmount);
        const minutesPurchased = revenueAmount / USER_RATE_PER_MINUTE;
        const profit = revenueAmount - aiExpenseAmount;
        
        console.log(`📊 Calculation: $${revenueAmount} revenue → ${minutesPurchased.toFixed(1)} min @ $${aiCostPerMinute}/min = $${aiExpenseAmount} expense (profit: $${profit})`);
        
        const expenseResponse = await fetch('/api/admin/custom-expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expense',
            category: 'AI Calls',
            amount: aiExpenseAmount,
            description: `Auto-linked: ${minutesPurchased.toFixed(1)} min @ $${aiCostPerMinute}/min`,
            date,
          }),
        });

        if (expenseResponse.ok) {
          console.log(`✅ AI Calls expense auto-created: $${aiExpenseAmount} (profit: $${profit})`);
        } else {
          console.error('⚠️ Failed to auto-create AI Calls expense');
        }
      }

      // Reset form
      resetForm();

      // Refresh list
      await fetchItems();
      
      // Notify parent to refresh revenue data
      onExpenseChange?.();
      
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;

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
    const currentCategory = mainTab === 'expenses' ? expenseTab : revenueTab;
    const expectedType = mainTab === 'expenses' ? 'expense' : 'revenue';
    
    if (item.type !== expectedType || item.category !== currentCategory) {
      alert(`You can only edit ${currentCategory} items from this tab!`);
      return;
    }
    setEditingId(item.id);
    
    if (mainTab === 'expenses') {
      setAmount(Math.abs(item.amount).toString());
    } else {
      // For revenue, calculate the quantity from amount
      const pricePerUnit = REVENUE_PRICES[revenueTab];
      const calculatedQty = Math.round(Math.abs(item.amount) / pricePerUnit);
      setQuantity(calculatedQty > 0 ? calculatedQty : 1);
      setIsSubtract(item.amount < 0);
    }
    
    setDescription(item.description || '');
    setDate(item.date);
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setQuantity(1);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsSubtract(false);
  };

  // Reset form when switching tabs
  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab);
    resetForm();
  };

  const handleExpenseTabChange = (tab: ExpenseCategory) => {
    setExpenseTab(tab);
    resetForm();
  };

  const handleRevenueTabChange = (tab: RevenueCategory) => {
    setRevenueTab(tab);
    resetForm();
  };

  // Filter items based on current tabs
  const currentCategory = mainTab === 'expenses' ? expenseTab : revenueTab;
  const currentType = mainTab === 'expenses' ? 'expense' : 'revenue';
  const filteredItems = items.filter(item => item.type === currentType && item.category === currentCategory);
  const totalFiltered = filteredItems.reduce((sum, item) => sum + item.amount, 0);

  // Get placeholder text based on category
  const getPlaceholder = () => {
    if (mainTab === 'expenses') {
      if (expenseTab === 'Software') return 'e.g., Cursor Pro, Vercel...';
      if (expenseTab === 'Advertising') return 'e.g., Facebook Ads, Google Ads...';
      if (expenseTab === 'AI Calls') return 'e.g., Retell API usage...';
    } else {
      if (revenueTab === 'Subscription') return 'e.g., John Smith signup...';
      if (revenueTab === 'Balance Refill') return 'e.g., From user Jane Doe...';
    }
    return 'Description';
  };

  // Get the unit label for revenue
  const getUnitLabel = () => {
    if (revenueTab === 'Subscription') return quantity === 1 ? 'subscription' : 'subscriptions';
    if (revenueTab === 'Balance Refill') return quantity === 1 ? 'refill' : 'refills';
    return 'payments';
  };

  // Calculate the total for revenue display
  const calculatedRevenueAmount = quantity * REVENUE_PRICES[revenueTab];

  const isExpenses = mainTab === 'expenses';
  const isRevenue = mainTab === 'revenue';

  return (
    <>
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Background Glows */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isExpenses ? 'bg-red-500/10' : 'bg-green-500/10'} rounded-full blur-[120px] animate-pulse`} />
            <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${isExpenses ? 'bg-orange-500/10' : 'bg-emerald-500/10'} rounded-full blur-[120px] animate-pulse`} style={{ animationDelay: '1s' }} />
          </div>

          <div className={`relative w-full max-w-4xl flex flex-col bg-gradient-to-br from-[#1A2647] to-[#0F1629] rounded-2xl border ${isExpenses ? 'border-red-500/20 shadow-red-500/10' : 'border-green-500/20 shadow-green-500/10'} shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden`}>
            {/* Gradient Header Line */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${isExpenses ? 'from-red-500 via-orange-500 to-red-500' : 'from-green-500 via-emerald-500 to-green-500'}`} />
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${isExpenses ? 'from-red-500/20 to-orange-500/20 border-red-500/30' : 'from-green-500/20 to-emerald-500/20 border-green-500/30'} rounded-lg border`}>
                  {isExpenses ? <Receipt className="w-5 h-5 text-red-400" /> : <TrendingUp className="w-5 h-5 text-green-400" />}
                </div>
                <div>
                  <h2 className={`text-xl font-black bg-gradient-to-r ${isExpenses ? 'from-red-400 to-orange-400' : 'from-green-400 to-emerald-400'} bg-clip-text text-transparent`}>
                    Financial Tracker
                  </h2>
                  <p className="text-xs text-gray-400">Track revenue & expenses</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-gray-800/50 hover:bg-red-500/20 rounded-lg transition-all duration-300 group border border-gray-700/50 hover:border-red-500/50"
              >
                <X className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
              </button>
            </div>

            {/* Main Tabs: Expenses vs Revenue */}
            <div className="px-4 pt-4">
              <div className="flex gap-2 p-1 bg-[#0B1437] rounded-xl border border-gray-700/50">
                <button
                  onClick={() => handleMainTabChange('expenses')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                    mainTab === 'expenses'
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Expenses
                </button>
                <button
                  onClick={() => handleMainTabChange('revenue')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                    mainTab === 'revenue'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Revenue
                </button>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="px-4 pt-3">
              {isExpenses ? (
                <div className="flex gap-2 p-1 bg-[#0B1437]/50 rounded-lg border border-gray-800/50">
                  <button
                    onClick={() => handleExpenseTabChange('Software')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all duration-300 ${
                      expenseTab === 'Software'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Software
                  </button>
                  <button
                    onClick={() => handleExpenseTabChange('Advertising')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all duration-300 ${
                      expenseTab === 'Advertising'
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    Advertising
                  </button>
                  <button
                    onClick={() => handleExpenseTabChange('AI Calls')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all duration-300 ${
                      expenseTab === 'AI Calls'
                        ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/40'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    AI Calls
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 p-1 bg-[#0B1437]/50 rounded-lg border border-gray-800/50">
                  <button
                    onClick={() => handleRevenueTabChange('Subscription')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all duration-300 ${
                      revenueTab === 'Subscription'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Subscription ($379)
                  </button>
                  <button
                    onClick={() => handleRevenueTabChange('Balance Refill')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all duration-300 ${
                      revenueTab === 'Balance Refill'
                        ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/40'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Refill ($25)
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                
                {/* Add/Edit Form - Takes 2 columns */}
                <div className={`lg:col-span-2 bg-gradient-to-br from-[#0F1629]/80 to-[#0B1437]/80 rounded-xl p-4 border border-gray-700/50 ${isExpenses ? 'hover:border-red-500/30' : 'hover:border-green-500/30'} transition-all duration-300`}>
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <div className={`p-1.5 ${isExpenses ? 'bg-red-500/20' : 'bg-green-500/20'} rounded-md`}>
                      {editingId ? <Edit2 className={`w-3.5 h-3.5 ${isExpenses ? 'text-red-400' : 'text-green-400'}`} /> : <Plus className={`w-3.5 h-3.5 ${isExpenses ? 'text-red-400' : 'text-green-400'}`} />}
                    </div>
                    {editingId ? `Edit ${currentCategory}` : `Add ${currentCategory}`}
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Add/Subtract Toggle for Revenue */}
                    {isRevenue && (
                      <div className="flex gap-2 p-1 bg-[#0B1437] rounded-lg border border-gray-700/50">
                        <button
                          type="button"
                          onClick={() => setIsSubtract(false)}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all ${
                            !isSubtract
                              ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSubtract(true)}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all ${
                            isSubtract
                              ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                          Subtract
                        </button>
                      </div>
                    )}

                    {/* Amount Input for Expenses */}
                    {isExpenses && (
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
                            className="w-full pl-9 pr-3 py-2.5 bg-[#0B1437] border-2 border-gray-700/50 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-red-500/50 focus:ring-red-500/20 focus:ring-2 transition-all"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Quantity Input for Revenue */}
                    {isRevenue && (
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                          <Hash className={`w-3.5 h-3.5 ${isSubtract ? 'text-red-400' : 'text-green-400'}`} />
                          Number of {revenueTab === 'Subscription' ? 'Subscriptions' : 'Refills'}
                        </label>
                        <div className="flex items-center gap-3">
                          {/* Decrement Button */}
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-12 h-12 bg-[#0B1437] border-2 border-gray-700/50 rounded-lg text-white text-xl font-bold hover:bg-gray-800/50 hover:border-gray-600 transition-all flex items-center justify-center"
                          >
                            −
                          </button>
                          
                          {/* Quantity Display */}
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              className={`w-full px-3 py-2.5 bg-[#0B1437] border-2 border-gray-700/50 rounded-lg text-white text-2xl font-black text-center focus:outline-none ${isSubtract ? 'focus:border-red-500/50 focus:ring-red-500/20' : 'focus:border-green-500/50 focus:ring-green-500/20'} focus:ring-2 transition-all`}
                            />
                          </div>
                          
                          {/* Increment Button */}
                          <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-12 h-12 bg-[#0B1437] border-2 border-gray-700/50 rounded-lg text-white text-xl font-bold hover:bg-gray-800/50 hover:border-gray-600 transition-all flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Calculated Amount Display */}
                        <div className={`mt-2 p-3 rounded-lg border ${isSubtract ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {quantity} {getUnitLabel()} × ${REVENUE_PRICES[revenueTab]}
                            </span>
                            <span className={`text-lg font-black ${isSubtract ? 'text-red-400' : 'text-green-400'}`}>
                              {isSubtract ? '-' : '+'}${calculatedRevenueAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

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
                        className={`w-full px-3 py-2.5 bg-[#0B1437] border-2 border-gray-700/50 rounded-lg text-white text-sm font-medium focus:outline-none ${isExpenses ? 'focus:border-red-500/50 focus:ring-red-500/20' : 'focus:border-green-500/50 focus:ring-green-500/20'} focus:ring-2 transition-all`}
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
                        placeholder={getPlaceholder()}
                        className={`w-full px-3 py-2.5 bg-[#0B1437] border-2 border-gray-700/50 rounded-lg text-white text-sm focus:outline-none ${isExpenses ? 'focus:border-red-500/50 focus:ring-red-500/20' : 'focus:border-green-500/50 focus:ring-green-500/20'} focus:ring-2 transition-all placeholder:text-gray-600`}
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={submitting || (isExpenses && !amount)}
                        className={`flex-1 py-3 bg-gradient-to-r ${
                          isExpenses 
                            ? 'from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 shadow-red-500/30' 
                            : isSubtract 
                              ? 'from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 shadow-red-500/30'
                              : 'from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 shadow-green-500/30'
                        } text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 text-sm`}
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
                            {isRevenue && isSubtract ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isExpenses ? 'Add Expense' : `${isSubtract ? 'Subtract' : 'Add'} ${quantity} ${getUnitLabel()}`}
                          </>
                        )}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold rounded-lg transition-all border border-gray-600/50 hover:border-gray-500 text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Items List - Takes 3 columns - SCROLLABLE */}
                <div className="lg:col-span-3 bg-gradient-to-br from-[#0F1629]/80 to-[#0B1437]/80 rounded-xl p-4 border border-gray-700/50 flex flex-col max-h-[50vh] overflow-hidden">
                  {/* Header with Total */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {isExpenses ? <Receipt className="w-4 h-4 text-gray-400" /> : <TrendingUp className="w-4 h-4 text-gray-400" />}
                      Recent {currentCategory}
                    </h3>
                    <div className={`px-4 py-2 bg-gradient-to-r ${
                      isExpenses 
                        ? 'from-red-500/20 to-orange-500/20 border-red-500/30' 
                        : totalFiltered >= 0 
                          ? 'from-green-500/20 to-emerald-500/20 border-green-500/30'
                          : 'from-red-500/20 to-rose-500/20 border-red-500/30'
                    } border rounded-lg hover:scale-105 transition-transform cursor-default`}>
                      <span className={`text-base font-black ${
                        isExpenses 
                          ? 'text-red-400' 
                          : totalFiltered >= 0 ? 'text-green-400' : 'text-red-400'
                      }`} style={{ filter: `drop-shadow(0 0 8px ${isExpenses || totalFiltered < 0 ? 'rgba(248, 113, 113, 0.4)' : 'rgba(74, 222, 128, 0.4)'})` }}>
                        {totalFiltered < 0 ? '-' : ''}${Math.abs(totalFiltered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <Loader2 className={`w-8 h-8 animate-spin ${isExpenses ? 'text-red-400' : 'text-green-400'}`} />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <div className="text-center">
                        <DollarSign className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No {currentCategory.toLowerCase()} entries yet</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                      {filteredItems.map((item, index) => {
                        // Calculate how many units this represents (for revenue)
                        const units = isRevenue ? Math.round(Math.abs(item.amount) / REVENUE_PRICES[revenueTab]) : 0;
                        
                        return (
                          <div
                            key={item.id}
                            className={`p-3 bg-[#0B1437]/60 rounded-lg border border-gray-700/50 ${isExpenses ? 'hover:border-red-500/40 hover:shadow-red-500/10' : item.amount >= 0 ? 'hover:border-green-500/40 hover:shadow-green-500/10' : 'hover:border-red-500/40 hover:shadow-red-500/10'} transition-all duration-300 group hover:shadow-lg`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Index Number */}
                                <div className={`w-7 h-7 ${isExpenses ? 'bg-red-500/10 border-red-500/20' : item.amount >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} rounded-md flex items-center justify-center border flex-shrink-0`}>
                                  <span className={`text-[10px] font-bold ${isExpenses ? 'text-red-400' : item.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>#{filteredItems.length - index}</span>
                                </div>
                                
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-lg font-black ${isExpenses ? 'text-red-400' : item.amount >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ filter: `drop-shadow(0 0 6px ${isExpenses || item.amount < 0 ? 'rgba(248, 113, 113, 0.3)' : 'rgba(74, 222, 128, 0.3)'})` }}>
                                      {item.amount < 0 ? '-' : (isRevenue ? '+' : '')}${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    {isRevenue && units > 0 && (
                                      <span className="text-[10px] text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded">
                                        {units}×
                                      </span>
                                    )}
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
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
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
