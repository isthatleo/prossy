import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: ".env.local" })

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations run over the direct/session connection, not the transaction pooler
    url:
      process.env.DIRECT_URL && process.env.DIRECT_URL.length > 0
        ? process.env.DIRECT_URL
        : process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
})
