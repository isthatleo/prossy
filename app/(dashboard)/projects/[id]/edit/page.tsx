import { notFound, redirect } from "next/navigation"

import { ProjectForm } from "@/components/projects/project-form"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import { getCategories, getProjectDetail } from "@/services/projects"

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await requireUser()
  const role = session.user.role as UserRole

  const project = await getProjectDetail(id, { id: session.user.id, role })
  if (!project) notFound()
  if (!(role === "admin" || project.student.id === session.user.id)) {
    redirect(`/projects/${id}`)
  }

  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit project" description={project.title} />
      <Card className="glass mt-6 shadow-none">
        <CardContent className="pt-6">
          <ProjectForm
            categories={categories}
            projectId={project.id}
            defaultValues={{
              title: project.title,
              categoryId: project.categoryId ?? "",
              description: project.description ?? "",
              problemStatement: project.problemStatement ?? "",
              objectives: project.objectives ?? "",
              methodology: project.methodology ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
