import { getDB } from '../db/connection';
import { getMonthlySpendAggregate } from './spendService';

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

function calculatePercentiles(latencies: number[]): LatencyStats {
  if (latencies.length === 0) {
    return { samples: 0, min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const getP = (p: number) => {
    const idx = Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1);
    return Math.round(sorted[idx] * 100) / 100;
  };
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  return {
    samples: sorted.length,
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted[sorted.length - 1] * 100) / 100,
    avg: Math.round((sum / sorted.length) * 100) / 100,
    p50: getP(50),
    p90: getP(90),
    p95: getP(95),
    p99: getP(99)
  };
}

export async function runLatencyBenchmark(
  userId: number,
  iterations: number = 25,
  targetMonth?: string
): Promise<BenchmarkResult> {
  const db = await getDB();
  const txCountRes = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM transactions WHERE user_id = $1`,
    [userId]
  );
  const totalTx = parseInt(txCountRes.rows[0]?.count || '0', 10);

  // 1. Benchmark Cold Database Queries (bypassCache = true)
  const dbLatencies: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await getMonthlySpendAggregate(userId, targetMonth, true);
    const dur = performance.now() - t0;
    dbLatencies.push(dur);
  }

  // 2. Prime the cache
  await getMonthlySpendAggregate(userId, targetMonth, false);

  // 3. Benchmark Warm Redis Cache Queries (bypassCache = false)
  const cacheLatencies: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await getMonthlySpendAggregate(userId, targetMonth, false);
    const dur = performance.now() - t0;
    cacheLatencies.push(dur);
  }

  const dbStats = calculatePercentiles(dbLatencies);
  const cacheStats = calculatePercentiles(cacheLatencies);

  const p95Improvement = dbStats.p95 > 0
    ? Math.round(((dbStats.p95 - cacheStats.p95) / dbStats.p95) * 1000) / 10
    : 0;

  const avgImprovement = dbStats.avg > 0
    ? Math.round(((dbStats.avg - cacheStats.avg) / dbStats.avg) * 1000) / 10
    : 0;

  return {
    transactionCount: totalTx,
    databaseMetrics: dbStats,
    cacheMetrics: cacheStats,
    p95ImprovementPercent: Math.max(0, p95Improvement),
    avgImprovementPercent: Math.max(0, avgImprovement),
    timestamp: new Date().toISOString()
  };
}

export async function generateSyntheticTransactions(
  userId: number,
  count: number = 10000
): Promise<{ inserted: number; durationMs: number }> {
  const startTime = performance.now();
  const db = await getDB();

  // Fetch categories
  const catRes = await db.query<{ id: number; name: string }>(
    `SELECT id, name FROM categories WHERE user_id = $1`,
    [userId]
  );
  const categories = catRes.rows;

  const merchantsByCat: Record<string, string[]> = {
    'Food & Dining': ['Swiggy', 'Zomato', 'McDonalds', 'Dominos Pizza', 'Starbucks', 'Subway', 'Chai Point', 'Haldirams'],
    'Travel & Transport': ['Uber India', 'Ola Cabs', 'IRCTC Rail', 'MakeMyTrip', 'Indigo Airlines', 'Shell Petrol', 'Metro Card'],
    'Shopping': ['Amazon India', 'Flipkart', 'Myntra', 'Zara', 'Decathlon', 'IKEA', 'H&M', 'Nykaa'],
    'Groceries': ['Blinkit', 'Zepto', 'Instamart', 'BigBasket', 'Nature Basket', 'DMart', 'Spencers'],
    'Entertainment': ['Netflix India', 'Spotify', 'BookMyShow', 'Disney+ Hotstar', 'PlayStation Store', 'Steam Games'],
    'Utilities & Bills': ['Airtel Mobile', 'Jio Fiber', 'Electricity Board', 'Tata Power', 'Water Utility', 'Gas Cylinder']
  };

  const now = new Date();
  const records: Array<[number, number, string, string, number | null, boolean, string]> = [];

  for (let i = 0; i < count; i++) {
    // Distribute across last 6 months
    const daysAgo = Math.floor(Math.random() * 180);
    const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 86400000);

    const cat = categories.length > 0 ? categories[Math.floor(Math.random() * categories.length)] : null;
    const catName = cat?.name || 'Food & Dining';
    const merchantPool = merchantsByCat[catName] || ['Retail Merchant', 'Online Store', 'Local Vendor'];
    const merchant = merchantPool[Math.floor(Math.random() * merchantPool.length)];

    let amount = Math.floor(Math.random() * 1500) + 80;
    if (catName === 'Travel & Transport' && Math.random() > 0.8) amount = Math.floor(Math.random() * 6000) + 2000;
    if (catName === 'Shopping' && Math.random() > 0.7) amount = Math.floor(Math.random() * 8000) + 1200;

    records.push([
      userId,
      amount,
      merchant,
      `Transaction at ${merchant}`,
      cat ? cat.id : null,
      false,
      txDate.toISOString()
    ]);
  }

  // Batch insert in chunks of 1000
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const valueClauses: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    for (const r of chunk) {
      valueClauses.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
      params.push(...r);
    }

    const insertSql = `
      INSERT INTO transactions (user_id, amount, merchant, raw_description, category_id, is_manually_assigned, occurred_at)
      VALUES ${valueClauses.join(', ')}
    `;
    await db.query(insertSql, params);
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
  return { inserted: count, durationMs };
}
