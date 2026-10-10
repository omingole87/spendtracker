import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Plus, 
  Receipt, 
  Tag 
} from 'lucide-react';
import { Transaction, Category } from '../types';
import { api } from '../services/api';

interface TransactionsTableProps {
  currentMonth: string;
  selectedCategoryId: number | null;
  categories: Category[];
  onTransactionUpdated: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  currentMonth,
  selectedCategoryId,
  categories,
  onTransactionUpdated
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [editingTxId, setEditingTxId] = useState<number | null>(null);

  // Manual transaction creation form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newMerchant, setNewMerchant] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCatId, setNewCatId] = useState<string>('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getTransactions({
        month: currentMonth,
        search: search.trim() || undefined,
        categoryId: selectedCategoryId !== null ? selectedCategoryId : undefined,
        limit: 50,
        offset: 0
      });
      setTransactions(res.transactions);
      setTotalCount(res.pagination.total);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [currentMonth, selectedCategoryId, search]);

  const handleCategoryOverride = async (txId: number, catId: number | null) => {
    try {
      await api.updateTransaction(txId, { categoryId: catId });
      setEditingTxId(null);
      loadTransactions();
      onTransactionUpdated();
    } catch (err) {
      console.error('Failed to override category:', err);
    }
  };

  const handleDelete = async (txId: number) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.deleteTransaction(txId);
      loadTransactions();
      onTransactionUpdated();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || !newMerchant) return;
    try {
      await api.createTransaction({
        amount: parseFloat(newAmount),
        merchant: newMerchant,
        description: newDesc,
        categoryId: newCatId ? parseInt(newCatId, 10) : undefined,
        occurredAt: new Date(newDate).toISOString()
      });
      setShowAddModal(false);
      setNewAmount('');
      setNewMerchant('');
      setNewDesc('');
      setNewCatId('');
      loadTransactions();
      onTransactionUpdated();
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center space-x-2">
          <Receipt className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Transactions ({totalCount})
          </h2>
          {selectedCategoryId !== null && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Filtered
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search merchant or desc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition w-44 sm:w-56"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Merchant & Narration</th>
              <th className="py-2.5 px-3">Category (Click to Override)</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No transactions found for this period.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const txDate = new Date(tx.occurred_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                const isEditing = editingTxId === tx.id;

                return (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition group">
                    {/* Date */}
                    <td className="py-3 px-3 text-slate-400 font-mono whitespace-nowrap">
                      {txDate}
                    </td>

                    {/* Merchant & Description */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{tx.merchant}</div>
                      {tx.raw_description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                          {tx.raw_description}
                        </div>
                      )}
                    </td>

                    {/* Category with Manual Override Dropdown */}
                    <td className="py-3 px-3 relative">
                      {isEditing ? (
                        <div className="flex items-center space-x-1.5 z-20">
                          <select
                            defaultValue={tx.category_id || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleCategoryOverride(tx.id, val ? parseInt(val, 10) : null);
                            }}
                            className="bg-slate-800 border border-indigo-500 text-xs text-white rounded px-2 py-1 outline-none font-sans"
                            autoFocus
                            onBlur={() => setEditingTxId(null)}
                          >
                            <option value="">Uncategorized</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingTxId(tx.id)}
                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition hover:ring-1 hover:ring-indigo-400/50"
                          style={{
                            backgroundColor: tx.category_color ? `${tx.category_color}18` : '#334155',
                            color: tx.category_color || '#94A3B8',
                            border: `1px solid ${tx.category_color ? `${tx.category_color}35` : '#475569'}`
                          }}
                          title="Click to manually override category"
                        >
                          <Tag className="h-3 w-3" />
                          <span>{tx.category_name || 'Uncategorized'}</span>
                          {tx.is_manually_assigned && (
                            <span className="text-[9px] opacity-70 italic">(manual)</span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                      ₹{parseFloat(String(tx.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition opacity-0 group-hover:opacity-100"
                        title="Delete transaction"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Transaction</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Merchant</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy, Uber, Amazon"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 450"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category (Optional - auto-assigned if empty)</label>
                <select
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Auto-Assign via Rules Engine</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lunch with team"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition shadow-md shadow-indigo-600/20"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
