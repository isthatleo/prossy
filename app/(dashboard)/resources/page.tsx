import { BookOpen } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Resources" }

export default function resourcesPage() {
  return (
    <ModuleScaffold
      title="Resources"
      description="Notes, references and project files."
      icon={BookOpen}
      moduleName="Notes & resources"
    />
  )
}
