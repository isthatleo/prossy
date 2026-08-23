import { Users } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Supervisors" }

export default function supervisorsPage() {
  return (
    <ModuleScaffold
      title="Supervisors"
      description="Supervisor records and workload."
      icon={Users}
      moduleName="Supervisor management"
    />
  )
}
