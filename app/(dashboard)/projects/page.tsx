import { FolderKanban } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Projects" }

export default function projectsPage() {
  return (
    <ModuleScaffold
      title="Projects"
      description="Browse and manage projects."
      icon={FolderKanban}
      moduleName="Project management"
    />
  )
}
