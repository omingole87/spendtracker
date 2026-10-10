import bcrypt from 'bcryptjs';
import { getDB } from './connection';
import { initDB } from './init';
import { initRedis, cacheInvalidatePattern } from '../config/redis';

export async function seedDatabase() {
  console.log('--- Initializing SpendTracker Database & Seed Data ---');
  await initDB();
  await initRedis();
  const db = await getDB();

  const demoEmail = 'demo@spendtracker.dev';

  // 1. Create or retrieve demo user
  let userRes = await db.query<{ id: number }>(
    `SELECT id FROM users WHERE email = $1`,
    [demoEmail]
  );

  let userId: number;
  if (userRes.rows.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('demo1234', salt);
    const res = await db.query<{ id: number }>(
      `INSERT INTO users (email, password_hash, name, currency) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [demoEmail, passwordHash, 'Alex Chen', 'INR']
    );
    userId = res.rows[0].id;
    console.log(`Created demo user ID: ${userId}`);
  } else {
    userId = userRes.rows[0].id;
    console.log(`Using existing demo user ID: ${userId}`);
  }

  // 2. Categories with budgets
  const categories = [
    { name: 'Food & Dining', color: '#EF4444', icon: 'Utensils', budget: 16000 },
    { name: 'Travel & Transport', color: '#F59E0B', icon: 'Car', budget: 8500 },
    { name: 'Shopping', color: '#8B5CF6', icon: 'ShoppingBag', budget: 12000 },
    { name: 'Groceries', color: '#10B981', icon: 'ShoppingCart', budget: 14000 },
    { name: 'Entertainment', color: '#EC4899', icon: 'Film', budget: 5000 },
    { name: 'Utilities & Bills', color: '#3B82F6', icon: 'Zap', budget: 7500 },
    { name: 'Healthcare', color: '#14B8A6', icon: 'HeartPulse', budget: 6000 }
  ];

  const catMap = new Map<string, number>();

  for (const cat of categories) {
    const existing = await db.query<{ id: number }>(
      `SELECT id FROM categories WHERE user_id = $1 AND name = $2`,
      [userId, cat.name]
    );

    if (existing.rows.length > 0) {
      catMap.set(cat.name, existing.rows[0].id);
    } else {
      const ins = await db.query<{ id: number }>(
        `INSERT INTO categories (user_id, name, color, icon, monthly_budget)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userId, cat.name, cat.color, cat.icon, cat.budget]
      );
      catMap.set(cat.name, ins.rows[0].id);
    }
  }

  // 3. Rules Engine Rules
  const defaultRules = [
    { pattern: 'swiggy', cat: 'Food & Dining', priority: 10 },
    { pattern: 'zomato', cat: 'Food & Dining', priority: 10 },
    { pattern: 'mcdonald', cat: 'Food & Dining', priority: 5 },
    { pattern: 'starbucks', cat: 'Food & Dining', priority: 5 },
    { pattern: 'dominos', cat: 'Food & Dining', priority: 5 },
    { pattern: 'uber', cat: 'Travel & Transport', priority: 10 },
    { pattern: 'ola', cat: 'Travel & Transport', priority: 10 },
    { pattern: 'petrol', cat: 'Travel & Transport', priority: 5 },
    { pattern: 'metro', cat: 'Travel & Transport', priority: 5 },
    { pattern: 'amazon', cat: 'Shopping', priority: 10 },
    { pattern: 'flipkart', cat: 'Shopping', priority: 10 },
    { pattern: 'myntra', cat: 'Shopping', priority: 10 },
    { pattern: 'zara', cat: 'Shopping', priority: 5 },
    { pattern: 'blinkit', cat: 'Groceries', priority: 10 },
    { pattern: 'zepto', cat: 'Groceries', priority: 10 },
    { pattern: 'instamart', cat: 'Groceries', priority: 10 },
    { pattern: 'dmart', cat: 'Groceries', priority: 8 },
    { pattern: 'netflix', cat: 'Entertainment', priority: 10 },
    { pattern: 'spotify', cat: 'Entertainment', priority: 10 },
    { pattern: 'bookmyshow', cat: 'Entertainment', priority: 8 },
    { pattern: 'airtel', cat: 'Utilities & Bills', priority: 10 },
    { pattern: 'jio', cat: 'Utilities & Bills', priority: 10 },
    { pattern: 'electricity', cat: 'Utilities & Bills', priority: 10 },
    { pattern: 'apollo', cat: 'Healthcare', priority: 10 },
    { pattern: 'pharmacy', cat: 'Healthcare', priority: 8 }
  ];

  for (const r of defaultRules) {
    const catId = catMap.get(r.cat);
    if (!catId) continue;

    const exist = await db.query(
      `SELECT id FROM rules WHERE user_id = $1 AND pattern = $2`,
      [userId, r.pattern]
    );

    if (exist.rows.length === 0) {
      await db.query(
        `INSERT INTO rules (user_id, pattern, category_id, priority, match_type)
         VALUES ($1, $2, $3, $4, 'contains')`,
        [userId, r.pattern, catId, r.priority]
      );
    }
  }

  // 4. Check if demo transactions already exist
  const txCountRes = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM transactions WHERE user_id = $1`,
    [userId]
  );

  const existingTxCount = parseInt(txCountRes.rows[0]?.count || '0', 10);
  if (existingTxCount < 200) {
    console.log('Seeding initial realistic demo transactions across last 6 months...');
    const now = new Date();
    const seedTx: Array<[number, number, string, string, number | null, boolean, string]> = [];

    const merchantTemplates = [
      { name: 'Swiggy', cat: 'Food & Dining', min: 250, max: 950 },
      { name: 'Zomato', cat: 'Food & Dining', min: 320, max: 1200 },
      { name: 'Starbucks Coffee', cat: 'Food & Dining', min: 350, max: 800 },
      { name: 'Dominos Pizza', cat: 'Food & Dining', min: 500, max: 1400 },
      { name: 'Uber Premier', cat: 'Travel & Transport', min: 180, max: 650 },
      { name: 'Ola Auto', cat: 'Travel & Transport', min: 80, max: 250 },
      { name: 'Shell Petrol Station', cat: 'Travel & Transport', min: 1200, max: 3200 },
      { name: 'Amazon Shopping', cat: 'Shopping', min: 650, max: 4500 },
      { name: 'Flipkart Electronics', cat: 'Shopping', min: 1100, max: 7000 },
      { name: 'Myntra Fashion', cat: 'Shopping', min: 990, max: 3500 },
      { name: 'Blinkit Instant', cat: 'Groceries', min: 300, max: 1500 },
      { name: 'Zepto Quick', cat: 'Groceries', min: 200, max: 950 },
      { name: 'DMart Supermarket', cat: 'Groceries', min: 2500, max: 6000 },
      { name: 'Netflix Subscription', cat: 'Entertainment', min: 649, max: 649 },
      { name: 'Spotify Premium', cat: 'Entertainment', min: 119, max: 119 },
      { name: 'BookMyShow Cinema', cat: 'Entertainment', min: 600, max: 1800 },
      { name: 'Airtel Broadband', cat: 'Utilities & Bills', min: 1179, max: 1179 },
      { name: 'Electricity Utility Bill', cat: 'Utilities & Bills', min: 2400, max: 4800 },
      { name: 'Apollo Pharmacy', cat: 'Healthcare', min: 350, max: 1800 }
    ];

    // Generate ~350 transactions across 180 days
    for (let day = 0; day < 180; day++) {
      const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      const txPerDay = Math.random() > 0.4 ? (Math.random() > 0.7 ? 3 : 2) : 1;

      for (let k = 0; k < txPerDay; k++) {
        const item = merchantTemplates[Math.floor(Math.random() * merchantTemplates.length)];
        const amount = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
        const catId = catMap.get(item.cat) || null;

        seedTx.push([
          userId,
          amount,
          item.name,
          `Payment to ${item.name}`,
          catId,
          false,
          date.toISOString()
        ]);
      }
    }

    // Insert
    for (const tx of seedTx) {
      await db.query(
        `INSERT INTO transactions (user_id, amount, merchant, raw_description, category_id, is_manually_assigned, occurred_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        tx
      );
    }
    console.log(`Seeded ${seedTx.length} demo transactions.`);
  }

  await cacheInvalidatePattern(`spend:${userId}:*`);
  console.log('Seed finished successfully.');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
