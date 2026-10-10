import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Database, 
  Layers, 
  Cpu, 
  Play, 
  X, 
  TrendingDown
} from 'lucide-react';
import { BenchmarkResult } from '../types';
import { api } from '../services/api';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  onBenchmarkUpdated: () => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  onBenchmarkUpdated
}) => {
  const [running, setRunning] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const stats = await api.getCacheStats();
      setCacheStats(stats);
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  const handleRunBenchmark = async () => {
    setRunning(true);
    try {
      const result = await api.runBenchmark(25, currentMonth);
      setBenchmarkResult(result);
      await loadStats();
      onBenchmarkUpdated();
    } catch (err) {
      console.error('Failed to run benchmark:', err);
    } finally {
      setRunning(false);
    }
  };

  const handleSeedTransactions = async (count: number) => {
    setSeeding(true);
    setSeedStatus(null);
    try {
      const res = await api.seedBenchmarkTransactions(count);
      setSeedStatus(`Added ${res.inserted.toLocaleString()} transactions in ${res.durationMs}ms`);
      await loadStats();
      onBenchmarkUpdated();
    } catch (err) {
      setSeedStatus('Failed to seed transactions');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="h-5 w-5 fill-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Performance Story & p95 Benchmark</h3>
            <p className="text-xs text-slate-400">
              Composite Index <span className="font-mono text-indigo-300">(user_id, occurred_at)</span> + Redis Aggregate Caching
            </p>
          </div>
        </div>

        {/* Architecture Showcase Callouts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-xs">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold mb-1">
              <Database className="h-3.5 w-3.5" />
              <span>Composite Index</span>
            </div>
            <p className="text-[11px] text-slate-400">
              <code className="text-slate-300 font-mono">idx_user_occurred</code> isolates user data & eliminates full scans over 50k+ rows.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center space-x-1.5 text-violet-400 font-semibold mb-1">
              <Layers className="h-3.5 w-3.5" />
              <span>Unified CTE SQL</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Single roundtrip aggregates total, breakdown, and 6-mo trend in one query instead of 3 roundtrips.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
              <Zap className="h-3.5 w-3.5" />
              <span>Redis Cache TTL</span>
            </div>
            <p className="text-[11px] text-slate-400">
              60s TTL cache with write-invalidation provides instantaneous responses to recurring dashboard loads.
            </p>
          </div>
        </div>

        {/* Scale Testing & Seeding Section */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-200">Scale Stress-Testing</div>
              <p className="text-[11px] text-slate-400">Generate thousands of realistic transactions to test index efficiency</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSeedTransactions(2000)}
                disabled={seeding}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono transition"
              >
                +2,000 txns
              </button>
              <button
                onClick={() => handleSeedTransactions(10000)}
                disabled={seeding}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono transition"
              >
                +10,000 txns
              </button>
            </div>
          </div>
          {seedStatus && (
            <div className="mt-2 text-[11px] text-emerald-400 font-mono">
              ✓ {seedStatus}
            </div>
          )}
        </div>

        {/* Benchmark Results */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
          {benchmarkResult ? (
            <div>
              {/* Highlight Metric Banner */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 rounded-2xl p-4 text-center mb-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Measured Performance Metric
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono flex items-center justify-center space-x-2">
                  <TrendingDown className="h-8 w-8 text-emerald-400" />
                  <span>-{benchmarkResult.p95ImprovementPercent}% Latency</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  p95 latency dropped from{' '}
                  <strong className="text-white font-mono">{benchmarkResult.databaseMetrics.p95}ms</strong> (Database) to{' '}
                  <strong className="text-emerald-300 font-mono">{benchmarkResult.cacheMetrics.p95}ms</strong> (Redis Cache)
                  across {benchmarkResult.transactionCount.toLocaleString()} transactions!
                </p>
              </div>

              {/* Detailed Percentile Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                      <th className="py-2 px-3">Metric</th>
                      <th className="py-2 px-3 text-right">PostgreSQL (Cold)</th>
                      <th className="py-2 px-3 text-right">Redis Cache (Hot)</th>
                      <th className="py-2 px-3 text-right">Improvement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-300">p50 (Median)</td>
                      <td className="py-2 px-3 text-right text-slate-300">{benchmarkResult.databaseMetrics.p50} ms</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">{benchmarkResult.cacheMetrics.p50} ms</td>
                      <td className="py-2 px-3 text-right text-emerald-400">
                        -{Math.round(((benchmarkResult.databaseMetrics.p50 - benchmarkResult.cacheMetrics.p50) / Math.max(0.01, benchmarkResult.databaseMetrics.p50)) * 100)}%
                      </td>
                    </tr>
                    <tr className="bg-emerald-500/5">
                      <td className="py-2 px-3 font-semibold text-emerald-300">p95 (95th Percentile)</td>
                      <td className="py-2 px-3 text-right text-slate-300">{benchmarkResult.databaseMetrics.p95} ms</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">{benchmarkResult.cacheMetrics.p95} ms</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                        -{benchmarkResult.p95ImprovementPercent}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-300">p99 (Tail Latency)</td>
                      <td className="py-2 px-3 text-right text-slate-300">{benchmarkResult.databaseMetrics.p99} ms</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">{benchmarkResult.cacheMetrics.p99} ms</td>
                      <td className="py-2 px-3 text-right text-emerald-400">
                        -{Math.round(((benchmarkResult.databaseMetrics.p99 - benchmarkResult.cacheMetrics.p99) / Math.max(0.01, benchmarkResult.databaseMetrics.p99)) * 100)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-300">Average Latency</td>
                      <td className="py-2 px-3 text-right text-slate-300">{benchmarkResult.databaseMetrics.avg} ms</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">{benchmarkResult.cacheMetrics.avg} ms</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                        -{benchmarkResult.avgImprovementPercent}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              <Cpu className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              <p>Click "Run Latency Benchmark" below to execute 25 iterations of Cold DB vs Hot Redis queries.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            {cacheStats && (
              <span>Cache: {cacheStats.hits} hits / {cacheStats.misses} misses ({cacheStats.isRedisLive ? 'Live Redis' : 'In-Memory Cache'})</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Close
            </button>
            <button
              onClick={handleRunBenchmark}
              disabled={running}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>{running ? 'Running 25x Benchmark...' : 'Run Latency Benchmark'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
