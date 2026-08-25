import { MessagesSquare } from "lucide-react"

import { Composer, NewChatDialog } from "@/components/messaging/messaging-ui"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/guards"
import { formatRelative } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import { initials } from "@/lib/utils"
import {
  listConversations,
  listMessagePartners,
  listMessages,
  markConversationRead,
} from "@/services/messaging"

export const metadata = { title: "Messages" }

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; q?: string }>
}) {
  const [{ c, q }, session] = await Promise.all([searchParams, requireUser()])
  const role = session.user.role as UserRole

  const [partners, conversations] = await Promise.all([
    listMessagePartners(session.user.id, role),
    listConversations(session.user.id),
  ])

  const query = q?.trim().toLowerCase() ?? ""
  const filtered = query
    ? conversations.filter(
        (conv) =>
          conv.title.toLowerCase().includes(query) ||
          (conv.lastMessage ?? "").toLowerCase().includes(query)
      )
    : conversations

  const activeId =
    c && conversations.some((conversation) => conversation.id === c)
      ? c
      : undefined
  const thread = activeId ? await listMessages(activeId, session.user.id) : []
  if (activeId) await markConversationRead(activeId, session.user.id)

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeId
  )

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <Card className="glass flex h-fit flex-col shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Conversations</CardTitle>
            <SearchInput placeholder="Search conversations…" className="mt-2" />
            <NewChatDialog partners={partners} />
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {query ? "No conversations match your search." : "No conversations yet — start one."}
              </p>
            ) : (
              filtered.map((conversation) => (
                <a
                  key={conversation.id}
                  href={`/messages?c=${conversation.id}`}
                  className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 transition-colors ${
                    conversation.id === activeId
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-muted/60"
                  }`}
                >
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-primary/15 text-[0.625rem] font-semibold text-primary">
                      {initials(conversation.title)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {conversation.title}
                      </span>
                      <span className="shrink-0 text-[0.625rem] text-muted-foreground/70">
                        {formatRelative(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {conversation.lastMessage ?? "…"}
                    </span>
                  </span>
                  {conversation.unread > 0 ? (
                    <Badge className="mt-1 shrink-0 rounded-full px-1.5 tabular-nums">
                      {conversation.unread}
                    </Badge>
                  ) : null}
                </a>
              ))
            )}
          </CardContent>
        </Card>

        {/* Thread */}
        <Card className="glass flex min-h-[60vh] flex-col shadow-none">
          {activeId && activeConversation ? (
            <>
              <CardHeader className="border-b border-border/50 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessagesSquare className="size-4 text-primary" />
                  {activeConversation.title}
                </CardTitle>
                <CardDescription>Direct conversation</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-end gap-3 pt-4">
                <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                  {thread.map((message) => {
                    const mine = message.senderId === session.user.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] space-y-0.5 rounded-xl px-3.5 py-2 text-sm leading-6 ${
                            mine
                              ? "rounded-br-sm bg-primary text-primary-foreground"
                              : "rounded-bl-sm border border-border bg-muted/60"
                          }`}
                        >
                          {!mine ? (
                            <p className="text-xs font-medium opacity-70">
                              {message.senderName}
                            </p>
                          ) : null}
                          <p className="whitespace-pre-line">{message.body}</p>
                          <p
                            className={`text-right text-[0.625rem] ${mine ? "opacity-70" : "text-muted-foreground"}`}
                          >
                            {formatRelative(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {thread.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      No messages yet — say hello.
                    </p>
                  ) : null}
                </div>
                <Composer conversationId={activeId} />
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={MessagesSquare}
                title="No conversation selected"
                description="Pick a conversation on the left or start a new chat."
              />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
