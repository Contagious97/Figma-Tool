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
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  })

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

// Create Drizzle instance
export const db = drizzle(pool, { schema })

// Helper functions for direct SQL queries (for non-Drizzle operations)
export const query = (text: string, params?: any[]) => pool.query(text, params)
export const getClient = () => pool.connect()

// Helper function to close the pool (useful for testing)
export async function closeDb() {
  await pool.end()
}
