import { Bell } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Notifications" }

export default function notificationsPage() {
  return (
    <ModuleScaffold
      title="Notifications"
      description="Event-driven alerts and activity."
      icon={Bell}
      moduleName="Notifications"
    />
  )
}
