import {
  User,
  SpendAggregateResponse,
  Transaction,
  Category,
  Rule,
  BenchmarkResult
} from '../types';

const DEMO_USER: User = {
  id: 1,
  name: 'Om Ingole (Demo)',
  email: 'demo@spendtracker.dev'
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Food & Dining', color: '#F59E0B', icon: 'utensils', monthly_budget: 12000, created_at: '2026-01-01' },
  { id: 2, name: 'Rent & Housing', color: '#6366F1', icon: 'home', monthly_budget: 18000, created_at: '2026-01-01' },
  { id: 3, name: 'Shopping & Groceries', color: '#10B981', icon: 'shopping-bag', monthly_budget: 8000, created_at: '2026-01-01' },
  { id: 4, name: 'Transport & Fuel', color: '#3B82F6', icon: 'car', monthly_budget: 5000, created_at: '2026-01-01' },
  { id: 5, name: 'Entertainment & Subs', color: '#EC4899', icon: 'film', monthly_budget: 3500, created_at: '2026-01-01' },
  { id: 6, name: 'Utilities & Bills', color: '#8B5CF6', icon: 'zap', monthly_budget: 2500, created_at: '2026-01-01' }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 1, amount: 18000.00, merchant: 'Apartment Rent (HDFC Transfer)', category_id: 2, category_name: 'Rent & Housing', category_color: '#6366F1', is_manually_assigned: false, occurred_at: '2026-10-02T10:00:00Z', created_at: '2026-10-02T10:00:00Z' },
  { id: 2, amount: 4850.00, merchant: 'D-Mart Supermarket Shegaon', category_id: 3, category_name: 'Shopping & Groceries', category_color: '#10B981', is_manually_assigned: false, occurred_at: '2026-10-03T18:30:00Z', created_at: '2026-10-03T18:30:00Z' },
  { id: 3, amount: 840.00, merchant: 'Swiggy Food Delivery', category_id: 1, category_name: 'Food & Dining', category_color: '#F59E0B', is_manually_assigned: false, occurred_at: '2026-10-04T13:15:00Z', created_at: '2026-10-04T13:15:00Z' },
  { id: 4, amount: 1200.00, merchant: 'Indian Oil Petrol Pump', category_id: 4, category_name: 'Transport & Fuel', category_color: '#3B82F6', is_manually_assigned: false, occurred_at: '2026-10-05T09:45:00Z', created_at: '2026-10-05T09:45:00Z' },
  { id: 5, amount: 649.00, merchant: 'Netflix Standard Subscription', category_id: 5, category_name: 'Entertainment & Subs', category_color: '#EC4899', is_manually_assigned: false, occurred_at: '2026-10-06T00:00:00Z', created_at: '2026-10-06T00:00:00Z' },
  { id: 6, amount: 1450.00, merchant: 'MSEDCL Electricity Bill', category_id: 6, category_name: 'Utilities & Bills', category_color: '#8B5CF6', is_manually_assigned: false, occurred_at: '2026-10-06T15:20:00Z', created_at: '2026-10-06T15:20:00Z' },
  { id: 7, amount: 560.00, merchant: 'Zomato Biryani Order', category_id: 1, category_name: 'Food & Dining', category_color: '#F59E0B', is_manually_assigned: false, occurred_at: '2026-10-07T20:10:00Z', created_at: '2026-10-10T20:10:00Z' },
  { id: 8, amount: 2490.00, merchant: 'Amazon India Electronics', category_id: 3, category_name: 'Shopping & Groceries', category_color: '#10B981', is_manually_assigned: false, occurred_at: '2026-10-08T11:00:00Z', created_at: '2026-10-08T11:00:00Z' },
  { id: 9, amount: 350.00, merchant: 'Uber Auto Ride', category_id: 4, category_name: 'Transport & Fuel', category_color: '#3B82F6', is_manually_assigned: false, occurred_at: '2026-10-09T16:40:00Z', created_at: '2026-10-09T16:40:00Z' },
  { id: 10, amount: 1250.00, merchant: 'College Canteen & Campus Snacks', category_id: 1, category_name: 'Food & Dining', category_color: '#F59E0B', is_manually_assigned: false, occurred_at: '2026-10-09T18:00:00Z', created_at: '2026-10-09T18:00:00Z' }
];

const DEFAULT_RULES: Rule[] = [
  { id: 1, pattern: 'swiggy|zomato', category_id: 1, category_name: 'Food & Dining', category_color: '#F59E0B', priority: 1, match_type: 'regex' },
  { id: 2, pattern: 'rent', category_id: 2, category_name: 'Rent & Housing', category_color: '#6366F1', priority: 1, match_type: 'contains' },
  { id: 3, pattern: 'uber|ola|petrol', category_id: 4, category_name: 'Transport & Fuel', category_color: '#3B82F6', priority: 2, match_type: 'regex' },
  { id: 4, pattern: 'netflix|spotify', category_id: 5, category_name: 'Entertainment & Subs', category_color: '#EC4899', priority: 1, match_type: 'regex' }
];

export const mockSpendEngine = {
  getAuth() {
    return {
      user: DEMO_USER,
      token: 'demo_spendtracker_token'
    };
  },

  getSpendAggregate(month?: string, nocache: boolean = false): SpendAggregateResponse {
    const currentMonthStr = month || '2026-10';
    const totalSpent = 31639.00;
    const txCount = 10;

    return {
      month: currentMonthStr,
      currency: '₹',
      currentTotal: totalSpent,
      transactionCount: txCount,
      previousMonthTotal: 28400.00,
      monthOverMonthChangePercent: 11.4,
      overBudgetAlerts: [],
      categories: [
        { categoryId: 2, categoryName: 'Rent & Housing', categoryColor: '#6366F1', categoryIcon: 'home', monthlyBudget: 18000, totalSpent: 18000.00, txCount: 1, percentageOfTotal: 56.9, isOverBudget: false, overBudgetAmount: 0 },
        { categoryId: 3, categoryName: 'Shopping & Groceries', categoryColor: '#10B981', categoryIcon: 'shopping-bag', monthlyBudget: 8000, totalSpent: 7340.00, txCount: 2, percentageOfTotal: 23.2, isOverBudget: false, overBudgetAmount: 0 },
        { categoryId: 1, categoryName: 'Food & Dining', categoryColor: '#F59E0B', categoryIcon: 'utensils', monthlyBudget: 12000, totalSpent: 2650.00, txCount: 3, percentageOfTotal: 8.4, isOverBudget: false, overBudgetAmount: 0 },
        { categoryId: 4, categoryName: 'Transport & Fuel', categoryColor: '#3B82F6', categoryIcon: 'car', monthlyBudget: 5000, totalSpent: 1550.00, txCount: 2, percentageOfTotal: 4.9, isOverBudget: false, overBudgetAmount: 0 },
        { categoryId: 6, categoryName: 'Utilities & Bills', categoryColor: '#8B5CF6', categoryIcon: 'zap', monthlyBudget: 2500, totalSpent: 1450.00, txCount: 1, percentageOfTotal: 4.6, isOverBudget: false, overBudgetAmount: 0 },
        { categoryId: 5, categoryName: 'Entertainment & Subs', categoryColor: '#EC4899', categoryIcon: 'film', monthlyBudget: 3500, totalSpent: 649.00, txCount: 1, percentageOfTotal: 2.0, isOverBudget: false, overBudgetAmount: 0 }
      ],
      trend: [
        { month: '2026-05', totalSpent: 27100, txCount: 28 },
        { month: '2026-06', totalSpent: 29400, txCount: 31 },
        { month: '2026-07', totalSpent: 26800, txCount: 26 },
        { month: '2026-08', totalSpent: 30500, txCount: 34 },
        { month: '2026-09', totalSpent: 28400, txCount: 29 },
        { month: '2026-10', totalSpent: 31639, txCount: 10 }
      ],
      meta: {
        queryTimeMs: nocache ? 1.4 : 0.6,
        source: nocache ? 'database' : 'cache',
        cachedAt: new Date().toISOString()
      }
    };
  },

  getTransactions(params: any = {}) {
    let list = [...DEFAULT_TRANSACTIONS];
    if (params.categoryId) {
      list = list.filter(t => t.category_id === Number(params.categoryId));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(t => t.merchant.toLowerCase().includes(q));
    }
    return {
      transactions: list,
      pagination: {
        total: list.length,
        limit: params.limit || 50,
        offset: params.offset || 0
      }
    };
  },

  getCategories() {
    return { categories: DEFAULT_CATEGORIES };
  },

  getRules() {
    return { rules: DEFAULT_RULES };
  },

  getBudgets() {
    return {
      budgets: DEFAULT_CATEGORIES.map(c => ({
        categoryId: c.id,
        categoryName: c.name,
        monthlyBudget: c.monthly_budget
      }))
    };
  },

  runBenchmark(): BenchmarkResult {
    return {
      transactionCount: 50000,
      databaseMetrics: {
        samples: 100,
        min: 0.9,
        max: 8.4,
        avg: 1.8,
        p50: 1.5,
        p90: 2.8,
        p95: 3.4,
        p99: 5.6
      },
      cacheMetrics: {
        samples: 100,
        min: 0.2,
        max: 1.1,
        avg: 0.45,
        p50: 0.4,
        p90: 0.65,
        p95: 0.8,
        p99: 0.95
      },
      p95ImprovementPercent: 76.5,
      avgImprovementPercent: 75.0,
      timestamp: new Date().toISOString()
    };
  }
};
