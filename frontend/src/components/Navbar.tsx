import React from 'react';
import { 
  Zap, 
  UploadCloud, 
  Sliders, 
  Target, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onOpenImport: () => void;
  onOpenRules: () => void;
  onOpenBudgets: () => void;
  onOpenBenchmark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMonth,
  onMonthChange,
  onOpenImport,
  onOpenRules,
  onOpenBudgets,
  onOpenBenchmark
}) => {
  const { user, logout } = useAuth();

  // Parse YYYY-MM
  const [year, month] = currentMonth.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, 1));
  const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const handlePrevMonth = () => {
    const prev = new Date(Date.UTC(year, month - 2, 1));
    onMonthChange(`${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const next = new Date(Date.UTC(year, month, 1));
    onMonthChange(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Stack tags */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">SpendTracker</span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PostgreSQL + Redis
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Instant Single-Screen Financial Dashboard</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700/80 rounded-lg p-1 shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs sm:text-sm font-semibold text-slate-200 px-3 min-w-[125px] text-center select-none font-mono">
            {monthLabel}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenBenchmark}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition shadow-sm animate-pulse hover:animate-none"
            title="Measure p95 latency and see performance story"
          >
            <Zap className="h-3.5 w-3.5 fill-emerald-400" />
            <span className="hidden md:inline">Latency Benchmark</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
          >
            <UploadCloud className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          <button
            onClick={onOpenRules}
            className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
            title="Auto-categorization rules"
          >
            <Sliders className="h-3.5 w-3.5 text-violet-400" />
            <span className="hidden lg:inline">Rules</span>
          </button>

          <button
            onClick={onOpenBudgets}
            className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
            title="Category budgets"
          >
            <Target className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden lg:inline">Budgets</span>
          </button>

          {/* User Profile / Logout */}
          <div className="flex items-center pl-2 border-l border-slate-800 space-x-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-slate-200">{user?.name}</span>
              <span className="text-[10px] text-slate-400">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
