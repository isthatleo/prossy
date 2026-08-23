import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Storage client for the Supabase Storage bucket (file uploads/downloads).
 *
 * Uses the service-role key server-side only — it bypasses row-level
 * security, so it must never reach client code. The publishable key is
 * only used when a signed-URL flow needs it.
 */

const globalForSupabase = globalThis as unknown as {
  __prossyStorage?: SupabaseClient
}

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "project-files"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set. See .env.example.`)
  }
  return value
}

/** Server-only storage client (service role). Lazily initialised. */
export function getStorageClient(): SupabaseClient {
  if (!globalForSupabase.__prossyStorage) {
    globalForSupabase.__prossyStorage = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    )
  }
  return globalForSupabase.__prossyStorage
}
