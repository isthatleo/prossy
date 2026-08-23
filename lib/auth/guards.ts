import { headers } from "next/headers"
import { redirect } from "next/navigation"

import type { Permission, UserRole } from "@/lib/rbac"

import { auth } from "./server"

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireUser() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}

export async function requireRole(...roles: UserRole[]) {
  const session = await requireUser()
  const role = session.user.role as UserRole
  if (!roles.includes(role)) {
    redirect("/dashboard")
  }
  return session
}

export async function requirePermission(permission: Permission) {
  const session = await requireUser()
  const role = session.user.role as UserRole

  // Server-side RBAC enforcement — never rely on the UI alone.
  const { can } = await import("@/lib/rbac")
  if (!can(role, permission)) {
    redirect("/dashboard")
  }
  return session
}
