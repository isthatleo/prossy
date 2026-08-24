"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth/guards"
import { auth } from "@/lib/auth/server"
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications"

export async function markNotificationReadAction(id: string): Promise<void> {
  const session = await requireUser()
  await markNotificationRead(session.user.id, id)
  revalidatePath("/", "layout")
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const session = await requireUser()
  await markAllNotificationsRead(session.user.id)
  revalidatePath("/", "layout")
}

export async function signOutAction(): Promise<void> {
  const session = await requireUser().catch(() => null)
  if (session) {
    await auth.api
      .signOut({ headers: await headers() })
      .catch(() => undefined)
  }
  redirect("/")
}
