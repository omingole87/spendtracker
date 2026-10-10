export interface User {
  id: number;
  email: string;
  name: string;
}

export interface CategorySpend {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  monthlyBudget: number;
  totalSpent: number;
  txCount: number;
  percentageOfTotal: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
}

export interface MonthTrend {
  month: string;
  totalSpent: number;
  txCount: number;
}

export interface OverBudgetAlert {
  categoryName: string;
  budget: number;
  spent: number;
  excess: number;
}

export interface SpendAggregateResponse {
  month: string;
  currency: string;
  currentTotal: number;
  transactionCount: number;
  previousMonthTotal: number;
  monthOverMonthChangePercent: number | null;
  overBudgetAlerts: OverBudgetAlert[];
  categories: CategorySpend[];
  trend: MonthTrend[];
  meta: {
    queryTimeMs: number;
    source: 'cache' | 'database';
    cachedAt?: string;
  };
}

export interface Transaction {
  id: number;
  amount: number;
  merchant: string;
  raw_description?: string;
  category_id: number | null;
  category_name?: string;
  category_color?: string;
  is_manually_assigned: boolean;
  occurred_at: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  monthly_budget: number;
  created_at: string;
}

export interface Rule {
  id: number;
  pattern: string;
  category_id: number;
  category_name?: string;
  category_color?: string;
  priority: number;
  match_type: 'contains' | 'regex' | 'exact';
  created_at?: string;
}

export interface LatencyStats {
  samples: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface BenchmarkResult {
  transactionCount: number;
  databaseMetrics: LatencyStats;
  cacheMetrics: LatencyStats;
  p95ImprovementPercent: number;
  avgImprovementPercent: number;
  timestamp: string;
}
