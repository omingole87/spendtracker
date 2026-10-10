import { Router, Response } from 'express';
import { getDB } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { applyRulesToExisting } from '../services/rulesEngine';

const router = Router();

// Get all rules with category details
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDB();
    const result = await db.query(
      `SELECT 
        r.id, 
        r.pattern, 
        r.category_id, 
        r.priority, 
        r.match_type, 
        r.created_at,
        c.name as category_name,
        c.color as category_color
       FROM rules r
       JOIN categories c ON r.category_id = c.id
       WHERE r.user_id = $1
       ORDER BY r.priority DESC, r.id ASC`,
      [userId]
    );
    res.json({ rules: result.rows });
  } catch (err: any) {
    console.error('Error fetching rules:', err);
    res.status(500).json({ error: 'Failed to fetch rules.' });
  }
});

// Create rule
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { pattern, categoryId, priority = 1, matchType = 'contains' } = req.body;

    if (!pattern || !categoryId) {
      return res.status(400).json({ error: 'Pattern and categoryId are required.' });
    }

    const db = await getDB();
    const result = await db.query<{ id: number }>(
      `INSERT INTO rules (user_id, pattern, category_id, priority, match_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, pattern.trim().toLowerCase(), parseInt(categoryId, 10), parseInt(priority, 10), matchType]
    );

    res.status(201).json({ id: result.rows[0].id, message: 'Rule created successfully' });
  } catch (err: any) {
    console.error('Error creating rule:', err);
    res.status(500).json({ error: 'Failed to create rule.' });
  }
});

// Update rule
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const ruleId = parseInt(req.params.id, 10);
    const { pattern, categoryId, priority, matchType } = req.body;

    const db = await getDB();
    const updates: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (pattern !== undefined) {
      updates.push(`pattern = $${pIdx++}`);
      params.push(pattern.trim().toLowerCase());
    }
    if (categoryId !== undefined) {
      updates.push(`category_id = $${pIdx++}`);
      params.push(parseInt(categoryId, 10));
    }
    if (priority !== undefined) {
      updates.push(`priority = $${pIdx++}`);
      params.push(parseInt(priority, 10));
    }
    if (matchType !== undefined) {
      updates.push(`match_type = $${pIdx++}`);
      params.push(matchType);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    params.push(ruleId, userId);
    const sql = `
      UPDATE rules
      SET ${updates.join(', ')}
      WHERE id = $${pIdx++} AND user_id = $${pIdx++}
    `;

    const result = await db.query(sql, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Rule not found.' });
    }

    res.json({ message: 'Rule updated successfully' });
  } catch (err: any) {
    console.error('Error updating rule:', err);
    res.status(500).json({ error: 'Failed to update rule.' });
  }
});

// Delete rule
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const ruleId = parseInt(req.params.id, 10);

    const db = await getDB();
    const result = await db.query(
      `DELETE FROM rules WHERE id = $1 AND user_id = $2`,
      [ruleId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Rule not found.' });
    }

    res.json({ message: 'Rule deleted' });
  } catch (err: any) {
    console.error('Error deleting rule:', err);
    res.status(500).json({ error: 'Failed to delete rule.' });
  }
});

// Apply rules retroactively to existing transactions
router.post('/apply', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const updatedCount = await applyRulesToExisting(userId);
    res.json({ message: `Applied rules to ${updatedCount} transactions.`, updatedCount });
  } catch (err: any) {
    console.error('Error applying rules:', err);
    res.status(500).json({ error: 'Failed to apply rules.' });
  }
});

export default router;
