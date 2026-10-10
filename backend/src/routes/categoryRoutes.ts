import { Router, Response } from 'express';
import { getDB } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { cacheInvalidatePattern } from '../config/redis';

const router = Router();

// Get all categories for user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDB();
    const result = await db.query(
      `SELECT id, name, color, icon, monthly_budget, created_at
       FROM categories
       WHERE user_id = $1
       ORDER BY name ASC`,
      [userId]
    );
    res.json({ categories: result.rows });
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// Create category
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, color = '#6366F1', icon = 'Tag', monthlyBudget = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const db = await getDB();
    const result = await db.query<{ id: number }>(
      `INSERT INTO categories (user_id, name, color, icon, monthly_budget)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, name.trim(), color, icon, Math.max(0, parseFloat(monthlyBudget) || 0)]
    );

    await cacheInvalidatePattern(`spend:${userId}:*`);

    res.status(201).json({ id: result.rows[0].id, message: 'Category created' });
  } catch (err: any) {
    if (err.message && err.message.includes('unique')) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// Update category (name, color, icon, budget)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const catId = parseInt(req.params.id, 10);
    const { name, color, icon, monthlyBudget } = req.body;

    const db = await getDB();
    const updates: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (name !== undefined) {
      updates.push(`name = $${pIdx++}`);
      params.push(name.trim());
    }
    if (color !== undefined) {
      updates.push(`color = $${pIdx++}`);
      params.push(color);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${pIdx++}`);
      params.push(icon);
    }
    if (monthlyBudget !== undefined) {
      updates.push(`monthly_budget = $${pIdx++}`);
      params.push(Math.max(0, parseFloat(monthlyBudget) || 0));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    params.push(catId, userId);
    const sql = `
      UPDATE categories
      SET ${updates.join(', ')}
      WHERE id = $${pIdx++} AND user_id = $${pIdx++}
    `;

    const result = await db.query(sql, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    await cacheInvalidatePattern(`spend:${userId}:*`);

    res.json({ message: 'Category updated successfully' });
  } catch (err: any) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

// Delete category
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const catId = parseInt(req.params.id, 10);

    const db = await getDB();
    const result = await db.query(
      `DELETE FROM categories WHERE id = $1 AND user_id = $2`,
      [catId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    await cacheInvalidatePattern(`spend:${userId}:*`);

    res.json({ message: 'Category deleted' });
  } catch (err: any) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

export default router;
