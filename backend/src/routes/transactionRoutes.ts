import { Router, Response } from 'express';
import multer from 'multer';
import { getDB } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { importTransactionsCSV } from '../services/csvImporter';
import { cacheInvalidatePattern } from '../config/redis';
import { getUserRules, evaluateRules } from '../services/rulesEngine';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// List transactions with filtering, search, and pagination
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { month, search, categoryId, limit = '50', offset = '0' } = req.query;

    const db = await getDB();
    const conditions: string[] = ['t.user_id = $1'];
    const params: any[] = [userId];
    let pIdx = 2;

    if (month && /^\d{4}-\d{2}$/.test(String(month))) {
      const [year, m] = String(month).split('-').map(Number);
      const start = new Date(Date.UTC(year, m - 1, 1)).toISOString();
      const end = new Date(Date.UTC(year, m, 1)).toISOString();
      conditions.push(`t.occurred_at >= $${pIdx++} AND t.occurred_at < $${pIdx++}`);
      params.push(start, end);
    }

    if (search) {
      conditions.push(`(t.merchant ILIKE $${pIdx} OR t.raw_description ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (categoryId) {
      if (categoryId === '0' || categoryId === 'uncategorized') {
        conditions.push(`t.category_id IS NULL`);
      } else {
        conditions.push(`t.category_id = $${pIdx++}`);
        params.push(parseInt(String(categoryId), 10));
      }
    }

    const whereClause = conditions.join(' AND ');

    // Total count query
    const countRes = await db.query<{ total: string }>(
      `SELECT COUNT(*) as total FROM transactions t WHERE ${whereClause}`,
      params
    );
    const totalCount = parseInt(countRes.rows[0]?.total || '0', 10);

    // Data query with composite index (user_id, occurred_at DESC)
    const sql = `
      SELECT 
        t.id,
        t.amount,
        t.merchant,
        t.raw_description,
        t.category_id,
        c.name as category_name,
        c.color as category_color,
        t.is_manually_assigned,
        t.occurred_at,
        t.created_at
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
      ORDER BY t.occurred_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;
    params.push(parseInt(String(limit), 10), parseInt(String(offset), 10));

    const result = await db.query(sql, params);

    res.json({
      transactions: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(String(limit), 10),
        offset: parseInt(String(offset), 10)
      }
    });
  } catch (err: any) {
    console.error('Error listing transactions:', err);
    res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
});

// Single transaction creation
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, merchant, description, categoryId, occurredAt } = req.body;

    if (!amount || !merchant) {
      return res.status(400).json({ error: 'Amount and merchant are required.' });
    }

    const db = await getDB();
    let finalCategoryId = categoryId ? parseInt(categoryId, 10) : null;
    let isManual = Boolean(categoryId);

    // Auto-categorize if category wasn't explicitly chosen
    if (!finalCategoryId) {
      const rules = await getUserRules(userId);
      finalCategoryId = evaluateRules(merchant, description, rules);
    }

    const txDate = occurredAt ? new Date(occurredAt) : new Date();

    const insertRes = await db.query<{ id: number }>(
      `INSERT INTO transactions 
        (user_id, amount, merchant, raw_description, category_id, is_manually_assigned, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [userId, Math.abs(parseFloat(amount)), merchant.trim(), description || '', finalCategoryId, isManual, txDate.toISOString()]
    );

    // Invalidate Redis cache
    await cacheInvalidatePattern(`spend:${userId}:*`);

    res.status(201).json({ id: insertRes.rows[0].id, message: 'Transaction created successfully' });
  } catch (err: any) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
});

// Manual category override or transaction edit
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const txId = parseInt(req.params.id, 10);
    const { categoryId, merchant, amount, occurredAt } = req.body;

    const db = await getDB();

    const updates: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (categoryId !== undefined) {
      updates.push(`category_id = $${pIdx++}`, `is_manually_assigned = TRUE`);
      params.push(categoryId === null || categoryId === 0 ? null : parseInt(categoryId, 10));
    }

    if (merchant !== undefined) {
      updates.push(`merchant = $${pIdx++}`);
      params.push(String(merchant).trim());
    }

    if (amount !== undefined) {
      updates.push(`amount = $${pIdx++}`);
      params.push(Math.abs(parseFloat(amount)));
    }

    if (occurredAt !== undefined) {
      updates.push(`occurred_at = $${pIdx++}`);
      params.push(new Date(occurredAt).toISOString());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    params.push(txId, userId);
    const sql = `
      UPDATE transactions 
      SET ${updates.join(', ')} 
      WHERE id = $${pIdx++} AND user_id = $${pIdx++}
    `;

    const result = await db.query(sql, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    // Invalidate Redis cache on write
    await cacheInvalidatePattern(`spend:${userId}:*`);

    res.json({ message: 'Transaction updated successfully' });
  } catch (err: any) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction.' });
  }
});

// Delete transaction
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const txId = parseInt(req.params.id, 10);

    const db = await getDB();
    const result = await db.query(
      `DELETE FROM transactions WHERE id = $1 AND user_id = $2`,
      [txId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    // Invalidate cache
    await cacheInvalidatePattern(`spend:${userId}:*`);

    res.json({ message: 'Transaction deleted' });
  } catch (err: any) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
});

// Import transactions via CSV
router.post('/import', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Please upload a CSV file.' });
    }

    const result = await importTransactionsCSV(userId, req.file.buffer);
    res.json(result);
  } catch (err: any) {
    console.error('Error importing CSV:', err);
    res.status(500).json({ error: 'Failed to process CSV file.' });
  }
});

export default router;
