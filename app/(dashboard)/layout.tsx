import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import { AppShell } from "@/components/layout/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireUser()
  const user = session.user

  return (
    <AppShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
        role: user.role as UserRole,
      }}
    >
      {children}
    </AppShell>
  )
}
