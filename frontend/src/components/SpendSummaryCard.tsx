import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  AlertTriangle, 
  Zap, 
  Database,
  RefreshCw
} from 'lucide-react';
import { SpendAggregateResponse } from '../types';

interface SpendSummaryCardProps {
  data: SpendAggregateResponse;
  onRefresh: (nocache?: boolean) => void;
  loading: boolean;
}

export const SpendSummaryCard: React.FC<SpendSummaryCardProps> = ({
  data,
  onRefresh,
  loading
}) => {
  const isIncrease = (data.monthOverMonthChangePercent ?? 0) > 0;
  const isDecrease = (data.monthOverMonthChangePercent ?? 0) < 0;

  // Compute daily average for the month
  const now = new Date();
  const [year, month] = data.month.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = (now.getUTCFullYear() === year && now.getUTCMonth() + 1 === month)
    ? Math.min(now.getUTCDate(), daysInMonth)
    : daysInMonth;
  const dailyAverage = Math.round(data.currentTotal / Math.max(1, currentDay));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Over-budget critical banner */}
      {data.overBudgetAlerts.length > 0 && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start space-x-3 text-rose-200">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-rose-300">Over-Budget Alert: </span>
            {data.overBudgetAlerts.map(a => (
              <span key={a.categoryName} className="inline-block mr-2">
                <strong>{a.categoryName}</strong> is over by ₹{a.excess.toLocaleString()} (₹{a.spent.toLocaleString()} / ₹{a.budget.toLocaleString()})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Main Spending Answer */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            <span>Current Month Spending</span>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-400 font-mono">{data.month}</span>
          </div>

          <div className="flex items-baseline space-x-4">
            <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
              ₹{data.currentTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {data.monthOverMonthChangePercent !== null && (
              <div className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                isIncrease 
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                  : isDecrease 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isIncrease && <TrendingUp className="h-3.5 w-3.5" />}
                {isDecrease && <TrendingDown className="h-3.5 w-3.5" />}
                <span>
                  {isIncrease ? '+' : ''}{data.monthOverMonthChangePercent}% vs last mo
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Previous month total: ₹{data.previousMonthTotal.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Stats and Performance latency indicators */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Transaction count */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Transactions</div>
              <div className="text-base font-bold text-white font-mono">{data.transactionCount}</div>
            </div>
          </div>

          {/* Daily average */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Daily Avg ({currentDay}d)</div>
              <div className="text-base font-bold text-white font-mono">₹{dailyAverage.toLocaleString()}</div>
            </div>
          </div>

          {/* Cache & Latency badge */}
          <div className={`border rounded-xl px-4 py-2.5 flex items-center space-x-3 ${
            data.meta.source === 'cache'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
          }`}>
            <div className={`p-2 rounded-lg ${
              data.meta.source === 'cache' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {data.meta.source === 'cache' ? <Zap className="h-4 w-4 fill-emerald-400" /> : <Database className="h-4 w-4" />}
            </div>
            <div>
              <div className="text-[11px] font-medium opacity-80 flex items-center space-x-1">
                <span>{data.meta.source === 'cache' ? 'Redis Cache HIT' : 'PostgreSQL DB'}</span>
              </div>
              <div className="text-base font-bold font-mono tracking-tight">
                {data.meta.queryTimeMs} ms
              </div>
            </div>
          </div>

          {/* Refresh buttons */}
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => onRefresh(false)}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
              title="Cached Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onRefresh(true)}
              disabled={loading}
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition font-mono"
              title="Force Cold DB Query (Bypass Cache)"
            >
              Cold DB
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
