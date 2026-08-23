import { redirect } from "next/navigation"

import { ProjectForm } from "@/components/projects/project-form"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import { getCategories } from "@/services/projects"

export default async function NewProjectPage() {
  const session = await requireUser()
  if ((session.user.role as UserRole) !== "student") {
    redirect("/projects")
  }

  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New project"
        description="Describe your project idea. You can submit it for approval once it's ready."
      />
      <Card className="glass mt-6 shadow-none">
        <CardHeader>
          <CardDescription>
            Your project starts as a draft — only you can see it until you
            submit it for approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}
