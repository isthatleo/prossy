"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCheck } from "lucide-react"
import { toast } from "sonner"

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(dashboard)/notifications/actions"
import { Button } from "@/components/ui/button"
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

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function onItemClick(item: NotificationItem) {
    if (!item.readAt) {
      await markNotificationReadAction(item.id).catch(() => {
        toast.error("Could not mark as read.")
        return
      })
    }
    if (item.link) router.push(item.link)
    else startTransition(() => router.refresh())
  }

  async function markAll() {
    await markAllNotificationsReadAction()
    toast.success("All notifications marked as read.")
    startTransition(() => router.refresh())
  }

  const unread = items.filter((item) => !item.readAt)

  return (
    <>
      {unread.length > 0 ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={pending}
            onClick={() => void markAll()}
          >
            <CheckCheck className="size-3.5" /> Mark all read ({unread.length})
          </Button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nothing here yet — activity on your projects, reviews and meetings
          will show up in this list.
        </p>
      ) : (
        <ol className="flex flex-col">
          {items.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => void onItemClick(item)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50",
                  !item.readAt && "bg-primary/[0.05]",
                  index !== items.length - 1 && "border-b border-border/50"
                )}
              >
                <span aria-hidden className="mt-0.5 text-base">
                  {TYPE_EMOJI[item.type] ?? "🔔"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    {!item.readAt ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                    <span className="text-sm font-medium">{item.title}</span>
                  </span>
                  {item.body ? (
                    <span className="mt-0.5 block text-[0.8125rem] leading-6 text-muted-foreground">
                      {item.body}
                    </span>
                  ) : null}
                  <span className="mt-1 block text-xs text-muted-foreground/70">
                    {timeAgo(item.createdAt)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
