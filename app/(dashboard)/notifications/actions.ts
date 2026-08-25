"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/guards"
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
