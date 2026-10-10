import React, { useState } from 'react';
import { Target, Plus, X, Check, Trash2 } from 'lucide-react';
import { Category } from '../types';
import { api } from '../services/api';

interface BudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onBudgetsUpdated: () => void;
}

export const BudgetsModal: React.FC<BudgetsModalProps> = ({
  isOpen,
  onClose,
  categories,
  onBudgetsUpdated
}) => {
  const [budgetMap, setBudgetMap] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366F1');
  const [addingCat, setAddingCat] = useState(false);

  if (!isOpen) return null;

  const handleBudgetChange = (catId: number, val: string) => {
    setBudgetMap(prev => ({ ...prev, [catId]: val }));
  };

  const handleSaveBudget = async (category: Category) => {
    const val = budgetMap[category.id] !== undefined ? budgetMap[category.id] : String(category.monthly_budget);
    setSavingId(category.id);
    try {
      await api.updateCategory(category.id, {
        monthlyBudget: parseFloat(val) || 0
      });
      onBudgetsUpdated();
    } catch (err) {
      console.error('Failed to update category budget:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      await api.createCategory({
        name: newCatName.trim(),
        monthlyBudget: parseFloat(newCatBudget) || 0,
        color: newCatColor
      });
      setNewCatName('');
      setNewCatBudget('');
      onBudgetsUpdated();
    } catch (err) {
      console.error('Failed to create category:', err);
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!window.confirm('Delete this category? Associated transactions will become Uncategorized.')) return;
    try {
      await api.deleteCategory(catId);
      onBudgetsUpdated();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Category Budgets</h3>
            <p className="text-xs text-slate-400">Set monthly spending limits to receive over-budget alerts</p>
          </div>
        </div>

        {/* Existing Categories Budgets */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-4">
          {categories.map((cat) => {
            const currentVal = budgetMap[cat.id] !== undefined 
              ? budgetMap[cat.id] 
              : String(cat.monthly_budget || 0);

            const isSaving = savingId === cat.id;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between bg-slate-800/40 border border-slate-800 rounded-xl p-3 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-slate-200">{cat.name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-mono">₹</span>
                  <input
                    type="number"
                    step="100"
                    value={currentVal}
                    onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 text-right"
                  />
                  <button
                    onClick={() => handleSaveBudget(cat)}
                    disabled={isSaving}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
                    title="Save Budget"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                    title="Delete Category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Category */}
        <form onSubmit={handleCreateCategory} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-200 mb-2">Create New Category</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              required
              placeholder="Category Name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              placeholder="Monthly Budget (₹)"
              value={newCatBudget}
              onChange={(e) => setNewCatBudget(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-10 h-8 rounded border border-slate-700 bg-slate-900 cursor-pointer"
                title="Choose Color"
              />
              <button
                type="submit"
                disabled={addingCat}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition flex items-center justify-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
