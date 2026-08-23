import { Tags } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Categories" }

export default function AdmincategoriesPage() {
  return (
    <ModuleScaffold
      title="Categories"
      description="Project category taxonomy."
      icon={Tags}
      moduleName="Categories"
    />
  )
}
