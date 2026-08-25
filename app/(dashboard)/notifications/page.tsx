import Link from "next/link"

import { NotificationList } from "@/components/notifications/notification-list"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"
import { listNotifications } from "@/services/notifications"

export const metadata = { title: "Notifications" }

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "message", label: "Messages" },
  { value: "proposal_reviewed", label: "Proposals" },
  { value: "document_reviewed", label: "Documents" },
  { value: "feedback_added", label: "Feedback" },
  { value: "meeting_scheduled", label: "Meetings" },
  { value: "system", label: "System" },
] as const

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const session = await requireUser()
  const { type = "all" } = await searchParams
  const allItems = await listNotifications(session.user.id, 50)

  const items =
    type !== "all" ? allItems.filter((item) => item.type === type) : allItems

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Everything that needs your attention, newest first."
      />

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {TYPE_FILTERS.map((filter) => {
          const active = type === filter.value || (filter.value === "all" && !type)
          return (
            <Link
              key={filter.value}
              href={filter.value === "all" ? "/notifications" : `/notifications?type=${filter.value}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {filter.label}
            </Link>
          )
        })}
      </div>

      <Card className="glass mt-4 overflow-hidden shadow-none">
        <CardContent className="p-0">
          <NotificationList items={items} />
        </CardContent>
      </Card>
    </div>
  )
}
