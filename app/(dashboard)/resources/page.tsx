import { BookOpen } from "lucide-react"
import Link from "next/link"

import {
  DeleteResourceButton,
  DownloadResourceButton,
  UploadResourceDialog,
} from "@/components/resources/resource-ui"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/guards"
import { formatBytes, formatRelative, humanize } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import { listAttachableProjects, listVisibleResources } from "@/services/resources"
import { RESOURCE_CATEGORIES } from "@/validations/resources"

export const metadata = { title: "Resources" }

const VISIBILITY_VARIANT: Record<string, "secondary" | "outline" | "warning"> = {
  everyone: "secondary",
  project: "outline",
  private: "warning",
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await requireUser()
  const role = session.user.role as UserRole
  const { q } = await searchParams
  const query = q?.trim().toLowerCase() ?? ""

  const [allResources, projects] = await Promise.all([
    listVisibleResources(session.user.id, role),
    listAttachableProjects(session.user.id, role),
  ])

  const resources = query
    ? allResources.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          (r.description ?? "").toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query)
      )
    : allResources

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Resource library"
        description="Shared guidelines, references and project documents."
      />

      <div className="mt-5 flex items-center gap-3">
        <SearchInput placeholder="Search resources…" className="flex-1" />
        <UploadResourceDialog
          categories={RESOURCE_CATEGORIES}
          projects={projects}
        />
      </div>

      {resources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No resources yet"
          description="Upload guidelines or references to build the library — visibility controls who can see each file."
        />
      ) : (
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {resources.map((resource) => (
            <Card key={resource.id} className="glass flex flex-col shadow-none">
              <CardHeader className="pb-1.5">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">
                    <Link
                      href={`/resources/${resource.id}`}
                      className="transition-colors hover:text-primary"
                    >
                      {resource.title}
                    </Link>
                  </CardTitle>
                  <Badge variant={VISIBILITY_VARIANT[resource.visibility] ?? "outline"}>
                    {humanize(resource.visibility)}
                  </Badge>
                </div>
                <CardDescription>
                  {humanize(resource.category)}
                  {resource.projectTitle ? ` · ${resource.projectTitle}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3 pt-0">
                {resource.description ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {resource.description}
                  </p>
                ) : (
                  <span />
                )}
                <div className="flex items-end justify-between gap-2">
                  <p className="text-xs text-muted-foreground/70">
                    {resource.fileName} · {formatBytes(resource.sizeBytes)} ·{" "}
                    {resource.uploaderName} · {formatRelative(resource.createdAt)}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <DownloadResourceButton fileId={resource.fileId} />
                    {role === "admin" || resource.uploadedBy === session.user.id ? (
                      <DeleteResourceButton resourceId={resource.id} title={resource.title} />
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
