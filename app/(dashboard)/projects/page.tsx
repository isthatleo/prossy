import Link from "next/link"
import { FolderKanban, Plus } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Pagination, paginate } from "@/components/shared/pagination"
import { StatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { requireUser } from "@/lib/auth/guards"
import { formatRelative } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import { cn } from "@/lib/utils"
import { listProjects } from "@/services/projects"

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In progress" },
  { value: "under_review", label: "Under review" },
  { value: "revision_required", label: "Revision" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
] as const

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const session = await requireUser()
  const role = session.user.role as UserRole
  const { status = "all", page: pageStr } = await searchParams
  const pageNum = Math.max(1, parseInt(pageStr ?? "1", 10) || 1)

  let effectiveFilter = status
  if (status === "active") {
    effectiveFilter = "all"
  }
  let projects = await listProjects(
    { id: session.user.id, role },
    effectiveFilter
  )
  if (status === "active") {
    projects = projects.filter((p) => !["rejected", "completed"].includes(p.status))
  }

  const canCreate = role === "student"
  const { items: paged, page, totalPages } = paginate(projects, pageNum, 12)

  const filterParams: Record<string, string> = {}
  if (status !== "all") filterParams.status = status

  return (
    <>
      <PageHeader title="Projects" description={role === "admin" ? "All projects across the institution." : role === "supervisor" ? "Projects assigned to you." : "Your projects."}>
        {canCreate ? (
          <Button render={<Link href="/projects/new" />}>
            <Plus className="size-4" />
            New project
          </Button>
        ) : null}
      </PageHeader>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((filter) => {
          const active = status === filter.value || (filter.value === "all" && !status)
          return (
            <Link
              key={filter.value}
              href={filter.value === "all" ? "/projects" : `/projects?status=${filter.value}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {filter.label}
            </Link>
          )
        })}
      </div>

      {projects.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FolderKanban}
            title="No projects here yet"
            description={
              canCreate
                ? "Create your first project to get started with proposals and submissions."
                : "Nothing matches this filter."
            }
            actionLabel={canCreate && status === "all" ? "New project" : undefined}
            actionHref={canCreate && status === "all" ? "/projects/new" : undefined}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paged.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group">
                <Card className="glass tile-hover h-full shadow-none">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <StatusBadge status={project.status} />
                      {project.categoryName ? (
                        <Badge variant="outline">{project.categoryName}</Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
                      {project.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {role === "student"
                        ? (project.supervisorName ?? "Awaiting supervisor assignment")
                        : project.studentName}
                    </p>

                    <div className="mt-auto pt-4">
                      <div className="mb-1.5 flex justify-between text-[0.6875rem] text-muted-foreground">
                        <span>Progress</span>
                        <span className="tabular-nums">{project.progressPercent}%</span>
                      </div>
                      <Progress value={project.progressPercent} className="h-1.5" />
                      <p className="mt-2.5 text-[0.6875rem] text-muted-foreground/70">
                        Updated {formatRelative(project.updatedAt)} · Health {project.healthScore}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              baseUrl="/projects"
              params={filterParams}
            />
          </div>
        </>
      )}
    </>
  )
}
