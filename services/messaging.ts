import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

import { db } from "@/db"
import {
  conversationMembers,
  conversations,
  messages,
  notifications,
  users,
} from "@/db/schema"
import type { UserRole } from "@/lib/rbac"

export interface ConversationListItem {
  id: string
  title: string
  lastMessage: string | null
  lastMessageAt: Date
  unread: number
}

export interface MessageItem {
  id: string
  body: string
  createdAt: Date
  senderId: string
  senderName: string | null
}

/** People the current user is allowed to start a conversation with. */
export async function listMessagePartners(
  userId: string,
  role: UserRole
): Promise<Array<{ id: string; name: string; role: string }>> {
  if (role === "admin") {
    return db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(and(eq(users.is_active, true), ne(users.id, userId)))
      .orderBy(asc(users.role), asc(users.name))
  }

  const partnerRoles =
    role === "student" ? (["supervisor", "admin"] as const) : (["student", "supervisor", "admin"] as const)

  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(
      and(
        eq(users.is_active, true),
        ne(users.id, userId),
        or(...partnerRoles.map((r) => eq(users.role, r)))
      )
    )
    .orderBy(asc(users.name))
}

/**
 * Finds a conversation whose member set is exactly {a, b}, otherwise creates it.
 */
export async function getOrCreateDirectConversation(
  viewerId: string,
  otherId: string
): Promise<string> {
  if (viewerId === otherId) throw new Error("You cannot message yourself.")

  const existing = await db.execute<{ id: string }>(sql`
    select c.id from ${conversations} c
    join ${conversationMembers} m1 on m1.conversation_id = c.id and m1.user_id = ${viewerId}
    join ${conversationMembers} m2 on m2.conversation_id = c.id and m2.user_id = ${otherId}
    where (select count(*) from ${conversationMembers} cm where cm.conversation_id = c.id) = 2
    limit 1
  `)
  const found = existing[0]
  if (found) return found.id

  const [created] = await db
    .insert(conversations)
    .values({ createdBy: viewerId })
    .returning({ id: conversations.id })

  await db.insert(conversationMembers).values([
    { conversationId: created.id, userId: viewerId },
    { conversationId: created.id, userId: otherId },
  ])
  return created.id
}

export async function listConversations(
  userId: string
): Promise<ConversationListItem[]> {
  const mine = alias(conversationMembers, "mine")

  // Per-conversation aggregates for my membership.
  const stats = await db
    .select({
      conversationId: messages.conversationId,
      lastAt: sql<string>`max(${messages.createdAt})`,
      unread: sql<number>`count(*) filter (
        where ${messages.senderId} <> ${userId}
        and (${mine.lastReadAt} is null or ${messages.createdAt} > ${mine.lastReadAt})
      )::int`,
      preview: sql<string | null>`(array_agg(${messages.body} order by ${messages.createdAt} desc))[1]`,
    })
    .from(messages)
    .innerJoin(
      mine,
      and(eq(mine.conversationId, messages.conversationId), eq(mine.userId, userId))
    )
    .groupBy(messages.conversationId)

  if (stats.length === 0) return []
  const ids = stats.map((s) => s.conversationId)

  // Other members' display names (direct conversations -> single name).
  const others = await db
    .select({
      conversationId: conversationMembers.conversationId,
      name: users.name,
    })
    .from(conversationMembers)
    .innerJoin(users, eq(users.id, conversationMembers.userId))
    .where(
      and(inArray(conversationMembers.conversationId, ids), ne(conversationMembers.userId, userId))
    )

  const namesByConversation = new Map<string, string[]>()
  for (const row of others) {
    const list = namesByConversation.get(row.conversationId) ?? []
    list.push(row.name)
    namesByConversation.set(row.conversationId, list)
  }

  return stats
    .map((s) => {
      const names = namesByConversation.get(s.conversationId) ?? ["Conversation"]
      return {
        id: s.conversationId,
        title:
          names.length <= 2 ? names.join(", ") : `${names[0]} +${names.length - 1}`,
        lastMessage: s.preview,
        lastMessageAt: new Date(s.lastAt),
        unread: s.unread,
      }
    })
    .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
}

async function assertMembership(conversationId: string, userId: string) {
  const member = await db.query.conversationMembers.findFirst({
    where: and(
      eq(conversationMembers.conversationId, conversationId),
      eq(conversationMembers.userId, userId)
    ),
  })
  if (!member) throw new Error("You are not part of this conversation.")
}

export async function listMessages(
  conversationId: string,
  userId: string
): Promise<MessageItem[]> {
  await assertMembership(conversationId, userId)

  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      senderName: users.name,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(200)

  return rows.reverse()
}

export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await db
    .update(conversationMembers)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId)
      )
    )
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  body: string
): Promise<void> {
  await assertMembership(conversationId, senderId)

  await db.insert(messages).values({
    conversationId,
    senderId,
    body,
  })

  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId))

  // My own read pointer moves up so the thread shows as read.
  await markConversationRead(conversationId, senderId)

  const others = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        ne(conversationMembers.userId, senderId)
      )
    )
  if (others.length > 0) {
    await db.insert(notifications).values(
      others.map((o) => ({
        userId: o.userId,
        type: "message" as const,
        title: `New message from ${senderName}`,
        body: body.slice(0, 120),
        link: `/messages?c=${conversationId}`,
      }))
    )
  }
}
