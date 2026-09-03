"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/guards"
import { db } from "@/db"
import { accounts, supervisorProfiles, users } from "@/db/schema"
import { eq } from "drizzle-orm"

export interface ActionResult {
  ok: boolean
  error?: string
}

export async function createSupervisorAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()
  if (session.user.role !== "admin")
    return { ok: false, error: "Only admins can create supervisors." }

  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim()
  const password = (formData.get("password") as string) ?? ""
  const staffNumber = (formData.get("staffNumber") as string)?.trim()
  const title = (formData.get("title") as string)?.trim() || null
  const departmentId =
    (formData.get("departmentId") as string)?.trim() || null
  const specialization =
    (formData.get("specialization") as string)?.trim() || null
  const officeLocation =
    (formData.get("officeLocation") as string)?.trim() || null

  if (!name || name.length < 2)
    return { ok: false, error: "Name is required." }
  if (!email) return { ok: false, error: "Email is required." }
  if (password.length < 8)
    return {
      ok: false,
      error: "Password must be at least 8 characters.",
    }
  if (!staffNumber)
    return { ok: false, error: "Staff number is required." }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })
  if (existing)
    return {
      ok: false,
      error: "A user with this email already exists.",
    }

  const userId = crypto.randomUUID()

  await db.insert(users).values({
    id: userId,
    name,
    email,
    role: "supervisor",
  })

  // Hash password with scrypt — same algorithm and format Better Auth uses
  // (see @better-auth/utils/password.node.mjs).
  const { randomBytes, scryptSync } = await import("node:crypto")
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  }).toString("hex")
  const hashedPassword = `${salt}:${derived}`

  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    userId,
    accountId: email,
    providerId: "credential",
    password: hashedPassword,
  })

  await db.insert(supervisorProfiles).values({
    userId,
    staffNumber,
    title,
    departmentId: departmentId || null,
    specialization,
    officeLocation,
  })

  revalidatePath("/supervisors")
  revalidatePath("/dashboard")
  return { ok: true }
}
