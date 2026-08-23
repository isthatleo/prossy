/**
 * One-time Supabase Storage setup: creates the project-files bucket if it
 * doesn't exist. Safe to re-run.
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "project-files"

  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.name === bucket)) {
    console.log(`Bucket "${bucket}" already exists.`)
    return
  }

  const { error } = await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 26214400, // 25 MB
  })
  if (error) {
    console.error("Failed to create bucket:", error.message)
    process.exit(1)
  }
  console.log(`Created private bucket "${bucket}" (25 MB limit).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
