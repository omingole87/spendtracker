import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { SpendSummaryCard } from './components/SpendSummaryCard';
import { CategoryBreakdownChart } from './components/CategoryBreakdownChart';
import { SixMonthTrendChart } from './components/SixMonthTrendChart';
import { BudgetProgressList } from './components/BudgetProgressList';
import { TransactionsTable } from './components/TransactionsTable';
import { CsvImportModal } from './components/CsvImportModal';
import { RulesEngineModal } from './components/RulesEngineModal';
import { BudgetsModal } from './components/BudgetsModal';
import { BenchmarkModal } from './components/BenchmarkModal';
import { AuthModal } from './components/AuthModal';
import { SpendAggregateResponse, Category, Rule } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // Current Month formatted as YYYY-MM
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });

  const [aggregateData, setAggregateData] = useState<SpendAggregateResponse | null>(null);
  const [loadingSpend, setLoadingSpend] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isBudgetsOpen, setIsBudgetsOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);

  // Fetch unified spend aggregate
  const loadSpendData = useCallback(async (nocache: boolean = false) => {
    if (!user) return;
    setLoadingSpend(true);
    try {
      const data = await api.getSpendAggregate(currentMonth, nocache);
      setAggregateData(data);
    } catch (err) {
      console.error('Failed to load spend aggregate:', err);
    } finally {
      setLoadingSpend(false);
    }
  }, [user, currentMonth]);

  // Fetch categories and rules
  const loadMetadata = useCallback(async () => {
    if (!user) return;
    try {
      const [catRes, rulesRes] = await Promise.all([
        api.getCategories(),
        api.getRules()
      ]);
      setCategories(catRes.categories);
      setRules(rulesRes.rules);
    } catch (err) {
      console.error('Failed to load categories/rules:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSpendData();
      loadMetadata();
    }
  }, [user, currentMonth, loadSpendData, loadMetadata]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-sm">
        Initializing SpendTracker...
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <Navbar
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenBudgets={() => setIsBudgetsOpen(true)}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
      />

      {/* Main Single-Screen Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Row 1: The Core Question - Monthly Total & Latency Badge */}
        {aggregateData && (
          <SpendSummaryCard
            data={aggregateData}
            onRefresh={(nocache) => loadSpendData(nocache)}
            loading={loadingSpend}
          />
        )}

        {/* Row 2: Category Breakdown & Budgets List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            {aggregateData && (
              <CategoryBreakdownChart
                categories={aggregateData.categories}
                totalSpent={aggregateData.currentTotal}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
              />
            )}
          </div>
          <div className="lg:col-span-5">
            {aggregateData && (
              <BudgetProgressList
                categories={aggregateData.categories}
                onOpenBudgetsModal={() => setIsBudgetsOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Row 3: 6-Month Spending Trend */}
        {aggregateData && (
          <SixMonthTrendChart
            trend={aggregateData.trend}
            currentMonth={currentMonth}
            onSelectMonth={setCurrentMonth}
          />
        )}

        {/* Row 4: Recent Transactions with Instant Search & Manual Override */}
        <TransactionsTable
          currentMonth={currentMonth}
          selectedCategoryId={selectedCategoryId}
          categories={categories}
          onTransactionUpdated={() => {
            loadSpendData(false);
            loadMetadata();
          }}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 font-mono">
        SpendTracker • Composite Index <code className="text-slate-400">(user_id, occurred_at)</code> • Redis Aggregate Cache
      </footer>

      {/* Modals */}
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={() => {
          loadSpendData(false);
          loadMetadata();
        }}
      />

      <RulesEngineModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        rules={rules}
        categories={categories}
        onRulesUpdated={() => {
          loadMetadata();
          loadSpendData(false);
        }}
      />

      <BudgetsModal
        isOpen={isBudgetsOpen}
        onClose={() => setIsBudgetsOpen(false)}
        categories={categories}
        onBudgetsUpdated={() => {
          loadMetadata();
          loadSpendData(false);
        }}
      />

      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        currentMonth={currentMonth}
        onBenchmarkUpdated={() => loadSpendData(false)}
      />
    </div>
  );
};

export default App;
