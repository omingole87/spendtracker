import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { runLatencyBenchmark, generateSyntheticTransactions } from '../services/benchmarkService';
import { getCacheStats, cacheFlush } from '../config/redis';

const router = Router();

// Run latency benchmark comparing Cold DB queries vs Hot Redis cache
router.get('/run', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const iterations = parseInt(String(req.query.iterations || '25'), 10);
    const month = req.query.month as string | undefined;

    const result = await runLatencyBenchmark(userId, iterations, month);
    res.json(result);
  } catch (err: any) {
    console.error('Benchmark execution error:', err);
    res.status(500).json({ error: 'Failed to run benchmark.' });
  }
});

// Seed synthetic transactions for scale testing (e.g., 5000, 10000, 25000)
router.post('/seed', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const count = Math.min(50000, Math.max(100, parseInt(String(req.body.count || '5000'), 10)));

    const result = await generateSyntheticTransactions(userId, count);
    res.json({
      message: `Successfully seeded ${result.inserted} transactions in ${result.durationMs}ms`,
      ...result
    });
  } catch (err: any) {
    console.error('Benchmark seed error:', err);
    res.status(500).json({ error: 'Failed to seed synthetic transactions.' });
  }
});

// Get cache operational stats
router.get('/cache-stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stats = getCacheStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get cache statistics.' });
  }
});

// Flush all cache
router.post('/cache-flush', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await cacheFlush();
    res.json({ message: 'Cache successfully flushed.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to flush cache.' });
  }
});

export default router;
