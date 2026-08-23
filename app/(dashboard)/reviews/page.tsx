import { Tags } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Reviews" }

export default function reviewsPage() {
  return (
    <ModuleScaffold
      title="Reviews"
      description="Proposals and documents awaiting review."
      icon={Tags}
      moduleName="Review workflow"
    />
  )
}
