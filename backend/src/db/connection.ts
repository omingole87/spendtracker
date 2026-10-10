import { Pool, QueryResult } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export interface DBClient {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
  isEmbedded: boolean;
}

let dbInstance: DBClient | null = null;

export async function getDB(): Promise<DBClient> {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      console.log('Connecting to PostgreSQL via DATABASE_URL...');
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      // Test connection
      await pool.query('SELECT 1');
      console.log('Successfully connected to external PostgreSQL database.');

      dbInstance = {
        query: async <T = any>(sql: string, params?: any[]) => {
          const res = await pool.query(sql, params);
          return { rows: res.rows as T[], rowCount: res.rowCount || 0 };
        },
        isEmbedded: false
      };
      return dbInstance;
    } catch (err) {
      console.warn('Failed to connect to DATABASE_URL, falling back to embedded PostgreSQL (PGlite):', err);
    }
  }

  // Persistent PGlite database in ./data/spendtracker_pglite
  const dataDir = path.resolve(__dirname, '../../data/spendtracker_pglite');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`Initializing embedded PostgreSQL (PGlite) at: ${dataDir}`);
  const pglite = new PGlite(dataDir);
  await pglite.waitReady;
  console.log('Embedded PostgreSQL engine ready.');

  dbInstance = {
    query: async <T = any>(sql: string, params?: any[]) => {
      // PGlite handles $1, $2 parameterized queries
      const res = await pglite.query(sql, params);
      return { rows: res.rows as T[], rowCount: res.rows.length };
    },
    isEmbedded: true
  };

  return dbInstance;
}
