import { getDB } from '../db/connection';
import { cacheInvalidatePattern } from '../config/redis';

export interface Rule {
  id: number;
  user_id: number;
  pattern: string;
  category_id: number;
  priority: number;
  match_type: 'contains' | 'regex' | 'exact';
}

export async function getUserRules(userId: number): Promise<Rule[]> {
  const db = await getDB();
  const res = await db.query<Rule>(
    `SELECT id, user_id, pattern, category_id, priority, match_type
     FROM rules
     WHERE user_id = $1
     ORDER BY priority DESC, id ASC`,
    [userId]
  );
  return res.rows;
}

export function evaluateRules(
  merchant: string,
  rawDescription: string | null | undefined,
  rules: Rule[]
): number | null {
  const targetText = `${merchant} ${rawDescription || ''}`.toLowerCase();

  for (const rule of rules) {
    const pattern = rule.pattern.trim().toLowerCase();
    if (!pattern) continue;

    if (rule.match_type === 'contains') {
      if (targetText.includes(pattern)) {
        return rule.category_id;
      }
    } else if (rule.match_type === 'exact') {
      if (merchant.trim().toLowerCase() === pattern) {
        return rule.category_id;
      }
    } else if (rule.match_type === 'regex') {
      try {
        const re = new RegExp(rule.pattern, 'i');
        if (re.test(targetText)) {
          return rule.category_id;
        }
      } catch {
        // If invalid regex, fallback to contains
        if (targetText.includes(pattern)) {
          return rule.category_id;
        }
      }
    }
  }

  return null;
}

export async function applyRulesToExisting(userId: number): Promise<number> {
  const db = await getDB();
  const rules = await getUserRules(userId);
  if (rules.length === 0) return 0;

  // Fetch all transactions that are not manually assigned
  const txRes = await db.query<{ id: number; merchant: string; raw_description: string; category_id: number | null }>(
    `SELECT id, merchant, raw_description, category_id 
     FROM transactions 
     WHERE user_id = $1 AND is_manually_assigned = FALSE`,
    [userId]
  );

  let updatedCount = 0;
  for (const tx of txRes.rows) {
    const matchedCategory = evaluateRules(tx.merchant, tx.raw_description, rules);
    if (matchedCategory !== null && matchedCategory !== tx.category_id) {
      await db.query(
        `UPDATE transactions SET category_id = $1 WHERE id = $2 AND user_id = $3`,
        [matchedCategory, tx.id, userId]
      );
      updatedCount++;
    }
  }

  // Invalidate any cached spend metrics for this user
  await cacheInvalidatePattern(`spend:${userId}:*`);

  return updatedCount;
}
