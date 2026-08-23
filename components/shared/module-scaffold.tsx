import type { LucideIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"

/**
 * Shared scaffold for routes whose full implementation lands in the
 * upcoming module phases. Clearly labelled — not disguised as finished.
 */
export function ModuleScaffold({
  title,
  description,
  icon,
  moduleName,
}: {
  title: string
  description: string
  icon: LucideIcon
  moduleName: string
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        className="mt-6"
        icon={icon}
        title={`${moduleName} is coming online`}
        description={`The ${moduleName} module is part of the current build phase. Its interface appears here once the database is connected and seeded.`}
      />
    </>
  )
}
