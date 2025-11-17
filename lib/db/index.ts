import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Create a singleton PostgreSQL connection pool
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

// Create Drizzle instance
export const db = drizzle(pool, { schema })

// Helper function to close the pool (useful for testing)
export async function closeDb() {
  await pool.end()
}
