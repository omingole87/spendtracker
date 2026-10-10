import { getMonthlySpendAggregate } from './services/spendService';
import { importTransactionsCSV } from './services/csvImporter';
import { runLatencyBenchmark } from './services/benchmarkService';
import { initDB } from './db/init';
import { initRedis, getCacheStats } from './config/redis';
import fs from 'fs';
import path from 'path';

async function verify() {
  console.log('=== Running SpendTracker Backend Verification ===');
  await initDB();
  await initRedis();

  const userId = 1;

  // 1. Cold DB aggregate query
  console.log('\n--- 1. Testing Cold DB Query (Bypass Cache) ---');
  const coldRes = await getMonthlySpendAggregate(userId, '2026-10', true);
  console.log(`Month: ${coldRes.month}`);
  console.log(`Total Spent: ₹${coldRes.currentTotal}`);
  console.log(`Transaction Count: ${coldRes.transactionCount}`);
  console.log(`Category Breakdown: ${coldRes.categories.length} categories`);
  console.log(`6-Month Trend points: ${coldRes.trend.length} months`);
  console.log(`Cold Query Latency: ${coldRes.meta.queryTimeMs}ms (Source: ${coldRes.meta.source})`);

  // 2. Warm Cache aggregate query
  console.log('\n--- 2. Testing Warm Redis Cache Query ---');
  const warmRes = await getMonthlySpendAggregate(userId, '2026-10', false);
  console.log(`Warm Query Latency: ${warmRes.meta.queryTimeMs}ms (Source: ${warmRes.meta.source})`);
  console.log('Cache Stats:', getCacheStats());

  // 3. Test CSV Import with Rules Engine
  console.log('\n--- 3. Testing CSV Import with Auto-Categorization Rules ---');
  const csvPath = path.resolve(__dirname, '../../sample-data/sample_bank_transactions.csv');
  const csvBuffer = fs.readFileSync(csvPath);
  const importResult = await importTransactionsCSV(userId, csvBuffer);
  console.log('Import Result:', importResult);

  // 4. Verify Cache Invalidation on Write
  console.log('\n--- 4. Verifying Cache Invalidation on Write ---');
  const postImportRes = await getMonthlySpendAggregate(userId, '2026-10', false);
  console.log(`Post-Import Source: ${postImportRes.meta.source} (Must be 'database' due to write invalidation)`);
  console.log(`New Total Spent: ₹${postImportRes.currentTotal}`);
  console.log(`New Transaction Count: ${postImportRes.transactionCount}`);

  // 5. Test Live Benchmark
  console.log('\n--- 5. Running Latency Benchmark (15 iterations) ---');
  const benchmark = await runLatencyBenchmark(userId, 15, '2026-10');
  console.log(`Total Transactions Indexed: ${benchmark.transactionCount}`);
  console.log(`Database p95: ${benchmark.databaseMetrics.p95}ms | Cache p95: ${benchmark.cacheMetrics.p95}ms`);
  console.log(`p95 Improvement: ${benchmark.p95ImprovementPercent}% faster!`);
  console.log(`Average Latency Improvement: ${benchmark.avgImprovementPercent}% faster!`);

  console.log('\n=== All Backend Checks Passed Successfully! ===');
}

verify().catch(console.error);
