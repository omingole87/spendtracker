import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { getDB } from '../db/connection';
import { getUserRules, evaluateRules } from './rulesEngine';
import { cacheInvalidatePattern } from '../config/redis';

export interface ImportResult {
  totalProcessed: number;
  imported: number;
  autoCategorized: number;
  skipped: number;
  totalSpent: number;
  durationMs: number;
  errors: string[];
}

function parseFlexibleDate(dateStr: string): Date {
  const clean = dateStr.trim();
  // Check ISO / standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }
  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(Date.UTC(year, month, day));
  }
  const fallback = new Date(clean);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

function parseFlexibleAmount(row: any): number {
  // Check Debit / Amount / Withdrawal
  const raw = 
    row.Debit || 
    row.debit || 
    row.Amount || 
    row.amount || 
    row['Debit Amount'] || 
    row['Withdrawal'] || 
    row.withdrawal ||
    '0';

  const sanitized = String(raw).replace(/[^0-9.-]/g, '');
  const val = parseFloat(sanitized);
  return isNaN(val) ? 0 : Math.abs(val); // Treat expenses as positive value
}

function parseFlexibleMerchant(row: any): { merchant: string; description: string } {
  const merchant = 
    row.Merchant || 
    row.merchant || 
    row.Payee || 
    row.payee || 
    row.Beneficiary || 
    row['Narration'] ||
    row['Description'] || 
    row.description || 
    'Unknown Merchant';

  const description = 
    row.Description || 
    row.description || 
    row.Narration || 
    row.narration || 
    row['Details'] || 
    '';

  return { merchant: String(merchant).trim(), description: String(description).trim() };
}

export async function importTransactionsCSV(
  userId: number,
  csvBuffer: Buffer
): Promise<ImportResult> {
  const startTime = performance.now();
  const db = await getDB();
  const rules = await getUserRules(userId);

  // Fetch user categories for direct name matching
  const catRes = await db.query<{ id: number; name: string }>(
    `SELECT id, name FROM categories WHERE user_id = $1`,
    [userId]
  );
  const catMap = new Map<string, number>();
  for (const c of catRes.rows) {
    catMap.set(c.name.toLowerCase().trim(), c.id);
  }

  const rows: any[] = [];
  const stream = Readable.from(csvBuffer);

  await new Promise<void>((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });

  const parsedTransactions: Array<{
    userId: number;
    amount: number;
    merchant: string;
    rawDescription: string;
    categoryId: number | null;
    isManuallyAssigned: boolean;
    occurredAt: string;
  }> = [];

  let autoCategorizedCount = 0;
  let totalSpent = 0;
  let skipped = 0;

  for (const row of rows) {
    const amount = parseFlexibleAmount(row);
    if (amount <= 0) {
      skipped++;
      continue;
    }

    const { merchant, description } = parseFlexibleMerchant(row);
    const date = parseFlexibleDate(row.Date || row.date || row['Transaction Date'] || row['Txn Date'] || '');

    // 1. Check if row explicitly specifies a category name
    let matchedCategoryId: number | null = null;
    const explicitCat = row.Category || row.category;
    if (explicitCat && catMap.has(String(explicitCat).toLowerCase().trim())) {
      matchedCategoryId = catMap.get(String(explicitCat).toLowerCase().trim()) || null;
    }

    // 2. Otherwise run rules engine
    if (!matchedCategoryId) {
      matchedCategoryId = evaluateRules(merchant, description, rules);
    }

    if (matchedCategoryId) {
      autoCategorizedCount++;
    }

    totalSpent += amount;

    parsedTransactions.push({
      userId,
      amount,
      merchant,
      rawDescription: description,
      categoryId: matchedCategoryId,
      isManuallyAssigned: false,
      occurredAt: date.toISOString()
    });
  }

  // Batch insert transactions in chunks of 500 for optimal performance
  const CHUNK_SIZE = 500;
  for (let i = 0; i < parsedTransactions.length; i += CHUNK_SIZE) {
    const chunk = parsedTransactions.slice(i, i + CHUNK_SIZE);
    const valueClauses: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    for (const t of chunk) {
      valueClauses.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
      params.push(
        t.userId,
        t.amount,
        t.merchant,
        t.rawDescription,
        t.categoryId,
        t.isManuallyAssigned,
        t.occurredAt
      );
    }

    const insertSql = `
      INSERT INTO transactions (user_id, amount, merchant, raw_description, category_id, is_manually_assigned, occurred_at)
      VALUES ${valueClauses.join(', ')}
    `;
    await db.query(insertSql, params);
  }

  // Invalidate Redis cache for this user
  await cacheInvalidatePattern(`spend:${userId}:*`);

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    totalProcessed: rows.length,
    imported: parsedTransactions.length,
    autoCategorized: autoCategorizedCount,
    skipped,
    totalSpent: Math.round(totalSpent * 100) / 100,
    durationMs,
    errors: []
  };
}
