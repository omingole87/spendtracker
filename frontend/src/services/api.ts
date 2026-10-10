import {
  User,
  SpendAggregateResponse,
  Transaction,
  Category,
  Rule,
  BenchmarkResult
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('spendtracker_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errMessage = `Error ${res.status}`;
    try {
      const errData = await res.json();
      errMessage = errData.error || errMessage;
    } catch {
      // Use fallback
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    return request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(name: string, email: string, password: string) {
    return request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  async demoLogin() {
    return request<{ user: User; token: string }>('/auth/demo', {
      method: 'POST'
    });
  },

  async getMe() {
    return request<{ user: User }>('/auth/me');
  },

  // Spend Unified Aggregate
  async getSpendAggregate(month?: string, nocache: boolean = false) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (nocache) params.append('nocache', 'true');
    return request<SpendAggregateResponse>(`/spend?${params.toString()}`);
  },

  async clearSpendCache() {
    return request<{ message: string; keysCleared: number }>('/spend/cache', {
      method: 'DELETE'
    });
  },

  // Transactions
  async getTransactions(params: {
    month?: string;
    search?: string;
    categoryId?: string | number;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.search) query.append('search', params.search);
    if (params.categoryId !== undefined) query.append('categoryId', String(params.categoryId));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));

    return request<{
      transactions: Transaction[];
      pagination: { total: number; limit: number; offset: number };
    }>(`/transactions?${query.toString()}`);
  },

  async createTransaction(data: {
    amount: number;
    merchant: string;
    description?: string;
    categoryId?: number;
    occurredAt?: string;
  }) {
    return request<{ id: number; message: string }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateTransaction(id: number, data: Partial<{
    amount: number;
    merchant: string;
    categoryId: number | null;
    occurredAt: string;
  }>) {
    return request<{ message: string }>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async deleteTransaction(id: number) {
    return request<{ message: string }>(`/transactions/${id}`, {
      method: 'DELETE'
    });
  },

  async uploadCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('spendtracker_token');
    const res = await fetch(`${API_BASE}/transactions/import`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to import CSV');
    }

    return res.json() as Promise<{
      totalProcessed: number;
      imported: number;
      autoCategorized: number;
      skipped: number;
      totalSpent: number;
      durationMs: number;
    }>;
  },

  // Categories & Budgets
  async getCategories() {
    return request<{ categories: Category[] }>('/categories');
  },

  async createCategory(data: { name: string; color: string; icon?: string; monthlyBudget?: number }) {
    return request<{ id: number; message: string }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateCategory(id: number, data: Partial<{ name: string; color: string; icon: string; monthlyBudget: number }>) {
    return request<{ message: string }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteCategory(id: number) {
    return request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE'
    });
  },

  // Rules Engine
  async getRules() {
    return request<{ rules: Rule[] }>('/rules');
  },

  async createRule(data: { pattern: string; categoryId: number; priority?: number; matchType?: string }) {
    return request<{ id: number; message: string }>('/rules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateRule(id: number, data: Partial<{ pattern: string; categoryId: number; priority: number; matchType: string }>) {
    return request<{ message: string }>(`/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteRule(id: number) {
    return request<{ message: string }>(`/rules/${id}`, {
      method: 'DELETE'
    });
  },

  async applyRules() {
    return request<{ message: string; updatedCount: number }>('/rules/apply', {
      method: 'POST'
    });
  },

  // Benchmarks & Scaling
  async runBenchmark(iterations: number = 25, month?: string) {
    const query = new URLSearchParams();
    query.append('iterations', String(iterations));
    if (month) query.append('month', month);
    return request<BenchmarkResult>(`/benchmark/run?${query.toString()}`);
  },

  async seedBenchmarkTransactions(count: number = 5000) {
    return request<{ message: string; inserted: number; durationMs: number }>('/benchmark/seed', {
      method: 'POST',
      body: JSON.stringify({ count })
    });
  },

  async getCacheStats() {
    return request<{ hits: number; misses: number; keysCount: number; isRedisLive: boolean }>('/benchmark/cache-stats');
  }
};
