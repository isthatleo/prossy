/**
 * Applies drizzle-generated migration SQL without drizzle-kit.
 * drizzle-kit's schema introspection hangs behind Supabase's PgBouncer
 * poolers, so we execute the statements ourselves over postgres.js.
 *
 * Tracks applied files in a `_applied_migrations` journal table.
 */
require("dotenv").config({ path: ".env.local" })
const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const sql = postgres(process.env.DATABASE_URL, { prepare: false })

async function main() {
  await sql`create table if not exists _applied_migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  )`

  const applied = new Set(
    (await sql`select filename from _applied_migrations`).map((r) => r.filename)
  )

  const dir = path.join(__dirname, "..", "db", "migrations")
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  let ran = 0
  for (const file of files) {
    if (applied.has(file)) continue

    // Legacy: initial schema may already exist from before journaling existed.
    const usersExists = await sql`
      select 1 from pg_tables
      where schemaname = 'public' and tablename = 'users'
    `
    if (file.startsWith("0000") && usersExists.length > 0) {
      console.log(`↷ ${file}: schema already present, marking as applied`)
      await sql`insert into _applied_migrations (filename) values (${file}) on conflict do nothing`
      continue
    }

    const raw = fs.readFileSync(path.join(dir, file), "utf8")
    const statements = raw
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean)

    console.log(`→ ${file}: ${statements.length} statements`)
    for (const statement of statements) {
      await sql.unsafe(statement)
    }
    await sql`insert into _applied_migrations (filename) values (${file})`
    ran++
  }
  console.log(ran === 0 ? "✔ Nothing to apply." : `✔ ${ran} migration(s) applied.`)
}

main()
  .then(() => sql.end())
  .catch(async (e) => {
    console.error("✖ Migration failed:", e.message)
    await sql.end()
    process.exit(1)
  })
