import fs from 'fs';
import path from 'path';
import { getDB } from './connection';

export async function initDB() {
  const db = await getDB();
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

  // Split queries by semicolon to execute sequentially
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    await db.query(statement);
  }

  console.log('Database schema and indexes initialized successfully.');
}
