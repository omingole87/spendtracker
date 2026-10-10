import React, { useState } from 'react';
import { Sliders, Plus, Trash2, Wand2, X, Sparkles } from 'lucide-react';
import { Rule, Category } from '../types';
import { api } from '../services/api';

interface RulesEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: Rule[];
  categories: Category[];
  onRulesUpdated: () => void;
}

export const RulesEngineModal: React.FC<RulesEngineModalProps> = ({
  isOpen,
  onClose,
  rules,
  categories,
  onRulesUpdated
}) => {
  const [newPattern, setNewPattern] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [newPriority, setNewPriority] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);
  const [testText, setTestText] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);

  if (!isOpen) return null;

  // Test matcher
  let testMatch: { rule: Rule; categoryName: string } | null = null;
  if (testText.trim()) {
    const lower = testText.toLowerCase();
    for (const r of rules) {
      if (lower.includes(r.pattern.toLowerCase())) {
        const cat = categories.find(c => c.id === r.category_id);
        testMatch = { rule: r, categoryName: cat?.name || r.category_name || 'Category' };
        break;
      }
    }
  }

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim() || !newCategoryId) return;
    setSubmitting(true);

    try {
      await api.createRule({
        pattern: newPattern.trim().toLowerCase(),
        categoryId: parseInt(newCategoryId, 10),
        priority: newPriority,
        matchType: 'contains'
      });
      setNewPattern('');
      setNewCategoryId('');
      onRulesUpdated();
    } catch (err) {
      console.error('Failed to create rule:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    try {
      await api.deleteRule(id);
      onRulesUpdated();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handleApplyRules = async () => {
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await api.applyRules();
      setApplyResult(res.message);
      onRulesUpdated();
    } catch (err: any) {
      setApplyResult('Failed to apply rules');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Auto-Categorization Rules Engine</h3>
            <p className="text-xs text-slate-400">
              Matches transaction narration keywords (e.g. "Swiggy" → Food & Dining)
            </p>
          </div>
        </div>

        {/* Interactive Pattern Tester */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 mb-4">
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Test Narration Matcher</span>
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="e.g. SWIGGY BANGALORE IN ORDER #8392"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            {testText.trim() && (
              <div className="text-xs font-medium shrink-0">
                {testMatch ? (
                  <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                    Matches: <strong>{testMatch.categoryName}</strong> (via "{testMatch.rule.pattern}")
                  </span>
                ) : (
                  <span className="text-slate-500 bg-slate-800 px-2 py-1 rounded">
                    No matching rule
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Rule Form */}
        <form onSubmit={handleAddRule} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="text-xs font-semibold text-slate-200 mb-2">Add New Categorization Rule</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                required
                placeholder="Merchant pattern (e.g. uber)"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <select
                required
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="20"
                value={newPriority}
                onChange={(e) => setNewPriority(parseInt(e.target.value, 10))}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                title="Priority (higher numbers match first)"
              />
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition flex items-center justify-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Rule</span>
              </button>
            </div>
          </div>
        </form>

        {/* Existing Rules List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>Configured Rules ({rules.length})</span>
            <span className="text-[11px]">Priority Order (High → Low)</span>
          </div>

          {rules.length === 0 ? (
            <p className="text-center py-6 text-slate-500 text-xs">No rules defined yet.</p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 rounded-lg px-3 py-2 text-xs transition"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                    P{rule.priority}
                  </span>
                  <span className="font-mono font-semibold text-slate-200">
                    "{rule.pattern}"
                  </span>
                  <span className="text-slate-500">→</span>
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-medium"
                    style={{
                      backgroundColor: rule.category_color ? `${rule.category_color}20` : '#334155',
                      color: rule.category_color || '#cbd5e1'
                    }}
                  >
                    {rule.category_name}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                  title="Delete rule"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer with Apply button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div>
            {applyResult && (
              <span className="text-xs text-emerald-400 font-medium">
                {applyResult}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleApplyRules}
              disabled={applying}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>{applying ? 'Applying...' : 'Apply Rules Retroactively'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
