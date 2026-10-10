import React from 'react';
import { Target, AlertCircle, ChevronRight } from 'lucide-react';
import { CategorySpend } from '../types';

interface BudgetProgressListProps {
  categories: CategorySpend[];
  onOpenBudgetsModal: () => void;
}

export const BudgetProgressList: React.FC<BudgetProgressListProps> = ({
  categories,
  onOpenBudgetsModal
}) => {
  // Only show categories that have a budget set OR have spending
  const budgetItems = categories.filter(c => c.monthlyBudget > 0 || c.totalSpent > 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Category Budgets & Alerts
          </h2>
        </div>
        <button
          onClick={onOpenBudgetsModal}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
        >
          <span>Manage</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {budgetItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-500 text-xs">
          <p>No budgets configured.</p>
          <button
            onClick={onOpenBudgetsModal}
            className="mt-2 text-indigo-400 hover:underline"
          >
            Set category monthly budgets
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {budgetItems.map((cat) => {
            const hasBudget = cat.monthlyBudget > 0;
            const progressPercent = hasBudget
              ? Math.min(100, Math.round((cat.totalSpent / cat.monthlyBudget) * 100))
              : 0;

            const isOver = cat.isOverBudget;
            const isWarning = hasBudget && !isOver && progressPercent >= 80;

            let barColor = 'bg-emerald-500';
            if (isOver) barColor = 'bg-rose-500';
            else if (isWarning) barColor = 'bg-amber-500';

            return (
              <div key={cat.categoryId} className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.categoryColor }}
                    />
                    <span className="text-xs font-semibold text-slate-200">{cat.categoryName}</span>
                    
                    {isOver && (
                      <span className="flex items-center space-x-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <AlertCircle className="h-3 w-3" />
                        <span>Over by ₹{cat.overBudgetAmount.toLocaleString('en-IN')}</span>
                      </span>
                    )}

                    {!isOver && hasBudget && progressPercent >= 80 && (
                      <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {progressPercent}% spent
                      </span>
                    )}
                  </div>

                  <div className="text-right text-xs font-mono">
                    <span className="font-bold text-white">₹{cat.totalSpent.toLocaleString('en-IN')}</span>
                    {hasBudget ? (
                      <span className="text-slate-400 text-[11px]"> / ₹{cat.monthlyBudget.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-slate-500 text-[10px] ml-1">No budget</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {hasBudget && (
                  <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, (cat.totalSpent / cat.monthlyBudget) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
