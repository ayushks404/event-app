import { Pool, PoolClient, types } from 'pg';
import { env } from './env';

// MUST run before the Pool is used. Without these, DATE becomes a host-local JS Date (day shifts on UTC hosts),
// COUNT()/SUM(int) arrive as strings, and NUMERIC arrives as a string.
types.setTypeParser(1082, (v: string) => v);          // DATE    -> 'YYYY-MM-DD'
types.setTypeParser(20,   (v: string) => Number(v));  // INT8    -> number (COUNT / SUM)
types.setTypeParser(1700, (v: string) => Number(v));  // NUMERIC -> number (NUMERIC(10,2) is safe)

export type Db = Pool | PoolClient;
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

export async function withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}
