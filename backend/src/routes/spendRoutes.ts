import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getMonthlySpendAggregate } from '../services/spendService';
import { cacheInvalidatePattern } from '../config/redis';

const router = Router();

// Unified Aggregate Endpoint: Returns total, category breakdown, and 6-month trend in one response
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const month = req.query.month as string | undefined;
    const nocache = req.query.nocache === 'true';

    const t0 = performance.now();
    const data = await getMonthlySpendAggregate(userId, month, nocache);
    const totalDuration = Math.round((performance.now() - t0) * 100) / 100;

    // Portfolio metrics headers
    res.setHeader('X-Cache', data.meta.source === 'cache' ? 'HIT' : 'MISS');
    res.setHeader(
      'Server-Timing',
      `app;dur=${totalDuration}, query;dur=${data.meta.queryTimeMs}, source;desc="${data.meta.source}"`
    );

    res.json(data);
  } catch (err: any) {
    console.error('Error fetching spend aggregate:', err);
    res.status(500).json({ error: 'Failed to compute monthly spend summary.' });
  }
});

// Explicitly clear user's spend cache (useful for benchmarks and manual refreshes)
router.delete('/cache', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const count = await cacheInvalidatePattern(`spend:${userId}:*`);
    res.json({ message: 'Spend cache invalidated', keysCleared: count });
  } catch (err: any) {
    console.error('Error clearing cache:', err);
    res.status(500).json({ error: 'Failed to clear cache.' });
  }
});

export default router;
