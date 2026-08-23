import { Building2 } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Departments" }

export default function AdmindepartmentsPage() {
  return (
    <ModuleScaffold
      title="Departments"
      description="Academic departments."
      icon={Building2}
      moduleName="Departments"
    />
  )
}
