import { getDB } from '../db/connection';
import { cacheGet, cacheSet } from '../config/redis';

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

export interface SpendAggregateResponse {
  month: string;
  currency: string;
  currentTotal: number;
  transactionCount: number;
  previousMonthTotal: number;
  monthOverMonthChangePercent: number | null;
  overBudgetAlerts: Array<{
    categoryName: string;
    budget: number;
    spent: number;
    excess: number;
  }>;
  categories: CategorySpend[];
  trend: MonthTrend[];
  meta: {
    queryTimeMs: number;
    source: 'cache' | 'database';
    cachedAt?: string;
  };
}

export async function getMonthlySpendAggregate(
  userId: number,
  targetMonth?: string,
  bypassCache: boolean = false
): Promise<SpendAggregateResponse> {
  const startTime = performance.now();

  // Validate or default month (format: YYYY-MM)
  const now = new Date();
  const currentMonthStr = targetMonth && /^\d{4}-\d{2}$/.test(targetMonth)
    ? targetMonth
    : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  const cacheKey = `spend:${userId}:${currentMonthStr}`;

  // 1. Check Redis Cache
  if (!bypassCache) {
    const cached = await cacheGet<SpendAggregateResponse>(cacheKey);
    if (cached) {
      const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;
      return {
        ...cached,
        meta: {
          ...cached.meta,
          queryTimeMs: latencyMs,
          source: 'cache'
        }
      };
    }
  }

  // 2. Compute date boundaries
  const [year, month] = currentMonthStr.split('-').map(Number);
  const currentStart = new Date(Date.UTC(year, month - 1, 1));
  const currentEnd = new Date(Date.UTC(year, month, 1));

  // Previous month for comparison
  const prevStart = new Date(Date.UTC(year, month - 2, 1));

  // 6 months trend window start (5 months before current month start)
  const trendStart = new Date(Date.UTC(year, month - 6, 1));

  const db = await getDB();

  // Single unified SQL query using CTE and PostgreSQL aggregations
  const query = `
    WITH user_window_tx AS (
      SELECT 
        t.id,
        t.amount,
        t.occurred_at,
        t.category_id,
        TO_CHAR(t.occurred_at, 'YYYY-MM') as month_str
      FROM transactions t
      WHERE t.user_id = $1 
        AND t.occurred_at >= $2 
        AND t.occurred_at < $3
    ),
    current_summary AS (
      SELECT 
        COALESCE(SUM(amount), 0)::numeric(12,2) as current_month_total,
        COUNT(*)::int as transaction_count
      FROM user_window_tx
      WHERE occurred_at >= $4 AND occurred_at < $3
    ),
    prev_summary AS (
      SELECT 
        COALESCE(SUM(amount), 0)::numeric(12,2) as prev_month_total
      FROM user_window_tx
      WHERE occurred_at >= $5 AND occurred_at < $4
    ),
    cat_breakdown AS (
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        COALESCE(c.monthly_budget, 0)::numeric(12,2) as monthly_budget,
        COALESCE(SUM(t.amount), 0)::numeric(12,2) as total_spent,
        COUNT(t.id)::int as tx_count
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id 
        AND t.user_id = $1 
        AND t.occurred_at >= $4 
        AND t.occurred_at < $3
      WHERE c.user_id = $1
      GROUP BY c.id, c.name, c.color, c.icon, c.monthly_budget
      HAVING COALESCE(SUM(t.amount), 0) > 0 OR c.monthly_budget > 0
      UNION ALL
      SELECT 
        0 as category_id,
        'Uncategorized' as category_name,
        '#94A3B8' as category_color,
        'HelpCircle' as category_icon,
        0::numeric(12,2) as monthly_budget,
        COALESCE(SUM(amount), 0)::numeric(12,2) as total_spent,
        COUNT(id)::int as tx_count
      FROM transactions
      WHERE user_id = $1 
        AND category_id IS NULL
        AND occurred_at >= $4 
        AND occurred_at < $3
      HAVING COALESCE(SUM(amount), 0) > 0
    ),
    six_trend AS (
      SELECT 
        month_str as month,
        COALESCE(SUM(amount), 0)::numeric(12,2) as total_spent,
        COUNT(*)::int as tx_count
      FROM user_window_tx
      GROUP BY month_str
      ORDER BY month_str ASC
    )
    SELECT 
      (SELECT row_to_json(current_summary) FROM current_summary) as current_summary,
      (SELECT row_to_json(prev_summary) FROM prev_summary) as prev_summary,
      (SELECT json_agg(cat_breakdown ORDER BY total_spent DESC) FROM cat_breakdown) as categories,
      (SELECT json_agg(six_trend ORDER BY month ASC) FROM six_trend) as trend;
  `;

  const queryParams = [
    userId,
    trendStart.toISOString(),
    currentEnd.toISOString(),
    currentStart.toISOString(),
    prevStart.toISOString()
  ];

  const result = await db.query(query, queryParams);
  const row = result.rows[0] || {};

  const currentSummary = row.current_summary || { current_month_total: 0, transaction_count: 0 };
  const prevSummary = row.prev_summary || { prev_month_total: 0 };
  const rawCategories = (row.categories || []) as any[];
  const rawTrend = (row.trend || []) as any[];

  const currentTotal = parseFloat(currentSummary.current_month_total) || 0;
  const prevTotal = parseFloat(prevSummary.prev_month_total) || 0;
  const transactionCount = parseInt(currentSummary.transaction_count, 10) || 0;

  // Month-over-month delta
  let monthOverMonthChangePercent: number | null = null;
  if (prevTotal > 0) {
    monthOverMonthChangePercent = Math.round(((currentTotal - prevTotal) / prevTotal) * 1000) / 10;
  }

  // Calculate percentages and budget alerts
  const overBudgetAlerts: SpendAggregateResponse['overBudgetAlerts'] = [];
  const processedCategories: CategorySpend[] = rawCategories.map((c) => {
    const spent = parseFloat(c.total_spent) || 0;
    const budget = parseFloat(c.monthly_budget) || 0;
    const percentage = currentTotal > 0 ? Math.round((spent / currentTotal) * 1000) / 10 : 0;
    const isOver = budget > 0 && spent > budget;
    const excess = isOver ? Math.round((spent - budget) * 100) / 100 : 0;

    if (isOver) {
      overBudgetAlerts.push({
        categoryName: c.category_name,
        budget,
        spent,
        excess
      });
    }

    return {
      categoryId: c.category_id,
      categoryName: c.category_name,
      categoryColor: c.category_color,
      categoryIcon: c.category_icon || 'Tag',
      monthlyBudget: budget,
      totalSpent: spent,
      txCount: parseInt(c.tx_count, 10) || 0,
      percentageOfTotal: percentage,
      isOverBudget: isOver,
      overBudgetAmount: excess
    };
  });

  // Ensure full 6-month array is filled even if some months have 0 spending
  const trendMap = new Map<string, { totalSpent: number; txCount: number }>();
  for (const t of rawTrend) {
    trendMap.set(t.month, {
      totalSpent: parseFloat(t.total_spent) || 0,
      txCount: parseInt(t.tx_count, 10) || 0
    });
  }

  const completeTrend: MonthTrend[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    const mStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const found = trendMap.get(mStr);
    completeTrend.push({
      month: mStr,
      totalSpent: found ? found.totalSpent : 0,
      txCount: found ? found.txCount : 0
    });
  }

  const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

  const responseData: SpendAggregateResponse = {
    month: currentMonthStr,
    currency: 'INR',
    currentTotal: Math.round(currentTotal * 100) / 100,
    transactionCount,
    previousMonthTotal: Math.round(prevTotal * 100) / 100,
    monthOverMonthChangePercent,
    overBudgetAlerts,
    categories: processedCategories,
    trend: completeTrend,
    meta: {
      queryTimeMs: latencyMs,
      source: 'database',
      cachedAt: new Date().toISOString()
    }
  };

  // Cache in Redis for 60 seconds
  await cacheSet(cacheKey, responseData, 60);

  return responseData;
}
