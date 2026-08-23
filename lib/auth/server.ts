import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { db } from "@/db"
import { accounts, sessions, users, verifications } from "@/db/schema"

export const auth = betterAuth({
  appName: "Prossy",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
  },
  user: {
    additionalFields: {
      // Role is managed exclusively through admin server actions, never client input
      role: {
        type: "string",
        defaultValue: "student",
        input: false,
      },
    },
  },
})

export type AuthSession = typeof auth.$Infer.Session
