/**
 * One-time Supabase Storage setup: creates the project-files bucket (private)
 * and the avatars bucket (public). Safe to re-run.
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

async function ensureBucket(supabase, name, options) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.name === name)) {
    console.log(`Bucket "${name}" already exists.`)
    return
  }
  const { error } = await supabase.storage.createBucket(name, options)
  if (error) {
    console.error(`Failed to create bucket "${name}":`, error.message)
    process.exit(1)
  }
  console.log(
    `Created ${options.public ? "public" : "private"} bucket "${name}".`
  )
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const filesBucket =
    process.env.SUPABASE_STORAGE_BUCKET || "project-files"
  await ensureBucket(supabase, filesBucket, {
    public: false,
    fileSizeLimit: 26214400, // 25 MB
  })
  await ensureBucket(supabase, "avatars", {
    public: true,
    fileSizeLimit: 5242880, // 5 MB
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
