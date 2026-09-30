import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reset = process.argv.includes('--reset');

async function migrate() {
  if (reset && env.nodeEnv === 'production') {
    throw new Error('Refusing to reset the database in production');
  }

  const sql = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  const client = await pool.connect();

  try {
    // Postgres can roll back schema changes too, so if any statement
    // fails, nothing is left half-created.
    await client.query('BEGIN');
    if (reset) {
      await client.query('DROP SCHEMA public CASCADE');
      await client.query('CREATE SCHEMA public');
    }
    await client.query(sql);
    await client.query('COMMIT');
    console.log(reset ? 'Database reset and schema created.' : 'Schema created.');
  } catch (err) {
    await client.query('ROLLBACK');
    // 42710 = type already exists, 42P07 = table already exists
    if (err.code === '42710' || err.code === '42P07') {
      console.error('The schema already exists. Run "npm run db:reset" to rebuild it.');
    }
    throw err;
  } finally {
    client.release();
  }
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());