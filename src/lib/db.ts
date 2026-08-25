import { Pool, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
) {
  return pool.query<T>(text, values);
}

export default pool;
