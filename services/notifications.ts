import { and, desc, eq, isNull } from "drizzle-orm"

import { db } from "@/db"
import { notifications } from "@/db/schema"

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  readAt: Date | null
  createdAt: Date
}

export async function getRecentNotifications(
  userId: string,
  limit = 8
): Promise<{ items: NotificationItem[]; unreadCount: number }> {
  const [items, unread] = await Promise.all([
    db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit,
    }),
    db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt))
      ),
  ])
  return { items, unreadCount: unread.length }
}

export async function listNotifications(userId: string, limit = 50) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit,
  })
}

export async function markNotificationRead(userId: string, id: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, userId),
        isNull(notifications.readAt)
      )
    )
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
}
