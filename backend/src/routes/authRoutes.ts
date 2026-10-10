import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDB } from '../db/connection';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const db = await getDB();
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertRes = await db.query<{ id: number }>(
      `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id`,
      [email.toLowerCase().trim(), passwordHash, name.trim()]
    );
    const userId = insertRes.rows[0].id;

    // Seed default categories for the new user
    const defaultCategories = [
      { name: 'Food & Dining', color: '#EF4444', icon: 'Utensils', budget: 15000 },
      { name: 'Travel & Transport', color: '#F59E0B', icon: 'Car', budget: 8000 },
      { name: 'Shopping', color: '#8B5CF6', icon: 'ShoppingBag', budget: 10000 },
      { name: 'Groceries', color: '#10B981', icon: 'ShoppingCart', budget: 12000 },
      { name: 'Entertainment', color: '#EC4899', icon: 'Film', budget: 4000 },
      { name: 'Utilities & Bills', color: '#3B82F6', icon: 'Zap', budget: 6000 }
    ];

    const catIdMap = new Map<string, number>();
    for (const cat of defaultCategories) {
      const cRes = await db.query<{ id: number }>(
        `INSERT INTO categories (user_id, name, color, icon, monthly_budget)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userId, cat.name, cat.color, cat.icon, cat.budget]
      );
      catIdMap.set(cat.name, cRes.rows[0].id);
    }

    // Seed default auto-categorization rules
    const defaultRules = [
      { pattern: 'swiggy', cat: 'Food & Dining', priority: 10 },
      { pattern: 'zomato', cat: 'Food & Dining', priority: 10 },
      { pattern: 'mcdonald', cat: 'Food & Dining', priority: 5 },
      { pattern: 'starbucks', cat: 'Food & Dining', priority: 5 },
      { pattern: 'uber', cat: 'Travel & Transport', priority: 10 },
      { pattern: 'ola', cat: 'Travel & Transport', priority: 10 },
      { pattern: 'petrol', cat: 'Travel & Transport', priority: 5 },
      { pattern: 'amazon', cat: 'Shopping', priority: 10 },
      { pattern: 'flipkart', cat: 'Shopping', priority: 10 },
      { pattern: 'myntra', cat: 'Shopping', priority: 10 },
      { pattern: 'blinkit', cat: 'Groceries', priority: 10 },
      { pattern: 'zepto', cat: 'Groceries', priority: 10 },
      { pattern: 'instamart', cat: 'Groceries', priority: 10 },
      { pattern: 'netflix', cat: 'Entertainment', priority: 10 },
      { pattern: 'spotify', cat: 'Entertainment', priority: 10 },
      { pattern: 'airtel', cat: 'Utilities & Bills', priority: 10 },
      { pattern: 'electricity', cat: 'Utilities & Bills', priority: 10 }
    ];

    for (const rule of defaultRules) {
      const cId = catIdMap.get(rule.cat);
      if (cId) {
        await db.query(
          `INSERT INTO rules (user_id, pattern, category_id, priority, match_type)
           VALUES ($1, $2, $3, $4, 'contains')`,
          [userId, rule.pattern, cId, rule.priority]
        );
      }
    }

    const userObj = { id: userId, email: email.toLowerCase().trim(), name: name.trim() };
    const token = generateToken(userObj);

    res.status(201).json({ user: userObj, token });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = await getDB();
    const resUser = await db.query<{ id: number; email: string; password_hash: string; name: string }>(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (resUser.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = resUser.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userObj = { id: user.id, email: user.email, name: user.name };
    const token = generateToken(userObj);

    res.json({ user: userObj, token });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

// One-click demo login (auto-provisions demo user if not present)
router.post('/demo', async (req: Request, res: Response) => {
  try {
    const db = await getDB();
    const demoEmail = 'demo@spendtracker.dev';

    let userRes = await db.query<{ id: number; email: string; name: string }>(
      'SELECT id, email, name FROM users WHERE email = $1',
      [demoEmail]
    );

    if (userRes.rows.length === 0) {
      // Create demo user
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('demo1234', salt);
      const insRes = await db.query<{ id: number }>(
        `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id`,
        [demoEmail, passwordHash, 'Alex Chen']
      );
      userRes = await db.query<{ id: number; email: string; name: string }>(
        'SELECT id, email, name FROM users WHERE id = $1',
        [insRes.rows[0].id]
      );
    }

    const user = userRes.rows[0];
    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.json({ user, token });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Failed to initialize demo session.' });
  }
});

// Current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
