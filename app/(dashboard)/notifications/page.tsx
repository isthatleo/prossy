import { NotificationList } from "@/components/notifications/notification-list"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/guards"
import { listNotifications } from "@/services/notifications"

export const metadata = { title: "Notifications" }

export default async function NotificationsPage() {
  const session = await requireUser()
  const items = await listNotifications(session.user.id, 50)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Everything that needs your attention, newest first."
      />
      <Card className="glass mt-6 overflow-hidden shadow-none">
        <CardContent className="p-0">
          <NotificationList items={items} />
        </CardContent>
      </Card>
    </div>
  )
}
