"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth/server"
import { getSession } from "@/lib/auth/guards"

export async function signOutAction(): Promise<void> {
  const session = await getSession().catch(() => null)
  if (session) {
    await auth.api.signOut({ headers: await headers() })
  }
  redirect("/login")
}
