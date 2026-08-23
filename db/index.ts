import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

type PostgresClient = postgres.Sql
type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

const globalForDb = globalThis as unknown as {
  __prossySql?: PostgresClient
  __prossyDb?: DrizzleDb
}

function createClient(): PostgresClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Supabase connection string."
    )
  }

  // prepare:false — required by Supabase's transaction pooler (PgBouncer)
  return postgres(connectionString, { prepare: false, max: 10 })
}

function getClient(): PostgresClient {
  if (!globalForDb.__prossySql) {
    globalForDb.__prossySql = createClient()
  }
  return globalForDb.__prossySql
}

function getDb(): DrizzleDb {
  if (!globalForDb.__prossyDb) {
    globalForDb.__prossyDb = drizzle(getClient(), { schema })
  }
  return globalForDb.__prossyDb
}

/**
 * Lazily-initialised db export.
 * Importing this module never connects or throws — the client is created
 * on first query. This keeps `next build` working without live credentials.
 */
export const db = new Proxy({} as DrizzleDb, {
  get(_target, property) {
    const real = getDb() as unknown as Record<string | symbol, unknown>
    const value = real[property]
    return typeof value === "function" ? value.bind(real) : value
  },
})

export type Database = DrizzleDb
export { schema }
