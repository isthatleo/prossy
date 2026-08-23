import { CalendarDays } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Meetings" }

export default function meetingsPage() {
  return (
    <ModuleScaffold
      title="Meetings"
      description="Supervision sessions and their history."
      icon={CalendarDays}
      moduleName="Meetings"
    />
  )
}
