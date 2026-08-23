require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")
const { verifyPassword } = require("better-auth/crypto")

const sql = postgres(process.env.DATABASE_URL, { prepare: false })

async function main() {
  const rows = await sql`
    select u.email, a.password, a.provider_id
    from users u join accounts a on a.user_id = u.id
    where u.email = 'leonard@prossy.dev'
  `
  console.log("rows:", rows.length)
  const row = rows[0]
  console.log("providerId:", row.provider_id)
  console.log("hash prefix:", row.password.slice(0, 20) + "...")
  const ok = await verifyPassword({ password: "password123", hash: row.password })
  console.log("verifyPassword:", ok)
  await sql.end()
}

main().catch((e) => {
  console.error("ERR:", e.message)
  process.exit(1)
})
