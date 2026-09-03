import { notFound } from "next/navigation"
import { ArrowLeft, Tags } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/auth/guards"
import { db } from "@/db"
import { projectCategories, projects } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

export const metadata = { title: "Category" }

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("admin")
  const { id } = await params

  const category = await db.query.projectCategories.findFirst({
    where: eq(projectCategories.id, id),
  })
  if (!category) notFound()

  const categoryProjects = await db.query.projects.findMany({
    where: eq(projects.categoryId, id),
    with: {
      student: { columns: { name: true } },
      supervisor: { columns: { name: true } },
    },
    orderBy: [asc(projects.createdAt)],
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to categories
      </Link>

      <PageHeader
        title={category.name}
        description={category.description ?? "No description."}
      />

      <Card className="glass shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Tags className="size-4 text-primary" />
            Linked projects ({categoryProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryProjects.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No projects in this category.
            </p>
          ) : (
            <div className="space-y-2">
              {categoryProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {project.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.student?.name ?? "Unknown"} ·{" "}
                      {project.supervisor?.name ?? "No supervisor"}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
