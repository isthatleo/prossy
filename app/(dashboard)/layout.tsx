import { AppShell } from "@/components/layout/app-shell"
import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import { getRecentNotifications } from "@/services/notifications"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireUser()
  const user = session.user
  const notifications = await getRecentNotifications(user.id, 8)

  return (
    <AppShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
        role: user.role as UserRole,
      }}
      notifications={notifications}
    >
      {children}
    </AppShell>
  )
}
