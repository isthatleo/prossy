"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck } from "lucide-react"
import { toast } from "sonner"

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(dashboard)/notifications/actions"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import type { NotificationItem } from "@/services/notifications"
import { cn } from "@/lib/utils"

const TYPE_EMOJI: Record<string, string> = {
  message: "💬",
  proposal_reviewed: "📄",
  document_reviewed: "📑",
  feedback_added: "💡",
  meeting_scheduled: "📅",
  deadline_approaching: "⏰",
  milestone_overdue: "⚠️",
  project_status_changed: "🚀",
  system: "🔔",
}

function timeAgo(date: Date | string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell({
  initialItems,
  initialUnreadCount,
}: {
  initialItems: NotificationItem[]
  initialUnreadCount: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [items, setItems] = useState(initialItems)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  async function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) startTransition(() => router.refresh())
  }

  async function onItemClick(item: NotificationItem) {
    if (!item.readAt) {
      try {
        await markNotificationReadAction(item.id)
        setItems((prev) =>
          prev.map((n) =>
            n.id === item.id ? { ...n, readAt: new Date() } : n
          )
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        toast.error("Could not mark notification as read.")
        return
      }
    }
    setOpen(false)
    if (item.link) router.push(item.link)
    else startTransition(() => router.refresh())
  }

  async function markAll() {
    await markAllNotificationsReadAction()
    setItems((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date() }))
    )
    setUnreadCount(0)
    toast.success("All notifications marked as read.")
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.5625rem] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-84 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              disabled={pending}
              onClick={() => void markAll()}
            >
              <CheckCheck className="size-3" /> Mark all read
            </Button>
          ) : null}
        </div>
        <Separator />
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={pending}
                onClick={() => void onItemClick(item)}
                className={cn(
                  "flex w-full items-start gap-2.5 border-b border-border/50 px-3 py-2.5 text-left transition-colors last:border-b-0",
                  !item.readAt ? "bg-primary/[0.06]" : "",
                  "hover:bg-muted/60"
                )}
              >
                <span aria-hidden className="mt-0.5 text-sm">
                  {TYPE_EMOJI[item.type] ?? "🔔"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    {!item.readAt ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                    <span className="truncate text-[0.8125rem] font-medium">
                      {item.title}
                    </span>
                  </span>
                  {item.body ? (
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                      {item.body}
                    </span>
                  ) : null}
                  <span className="mt-0.5 block text-[0.6875rem] text-muted-foreground/70">
                    {timeAgo(item.createdAt)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
        <Separator />
        <div className="p-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-center text-xs text-muted-foreground"
            render={<Link href="/notifications" onClick={() => setOpen(false)} />}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
