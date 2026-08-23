require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const sql = postgres(process.env.DATABASE_URL, { prepare: false })

async function main() {
  const tables = await sql`
    select tablename from pg_tables
    where schemaname = 'public'
    order by tablename
  `
  console.log(`tables (${tables.length}):`)
  console.log(tables.map((t) => " - " + t.tablename).join("\n"))
  await sql.end()
}

main().catch((e) => {
  console.error("ERR:", e.message)
  process.exit(1)
})
