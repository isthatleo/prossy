import { BarChart3 } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Reports" }

export default function reportsPage() {
  return (
    <ModuleScaffold
      title="Reports"
      description="Workload, progress and outcome reports."
      icon={BarChart3}
      moduleName="Reports & analytics"
    />
  )
}
