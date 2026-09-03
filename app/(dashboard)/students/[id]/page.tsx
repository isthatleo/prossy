import { notFound } from "next/navigation"
import { ArrowLeft, GraduationCap, Mail } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/auth/guards"
import { db } from "@/db"
import { users, projects } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

export const metadata = { title: "Student" }

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("admin", "supervisor")
  const { id } = await params

  const student = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      studentProfile: { with: { department: true } },
    },
  })

  if (!student || student.role !== "student") notFound()

  const profile = student.studentProfile
  const studentProjects = await db.query.projects.findMany({
    where: eq(projects.studentId, id),
    with: {
      supervisor: { columns: { name: true } },
      category: { columns: { name: true } },
    },
    orderBy: [asc(projects.createdAt)],
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/students"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to students
      </Link>

      <PageHeader title={student.name} description={student.email} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Mail className="size-3.5" /> {student.email}
            </p>
          </CardContent>
        </Card>
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Reg. number</p>
            <p className="font-mono text-sm font-medium">
              {profile?.registrationNumber ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="text-sm font-medium">
              {profile?.department?.name ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Year of study</p>
            <p className="text-sm font-medium">
              {profile?.yearOfStudy ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <GraduationCap className="size-4 text-primary" />
            Projects ({studentProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentProjects.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No projects yet.
            </p>
          ) : (
            <div className="space-y-2">
              {studentProjects.map((project) => (
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
                      {project.supervisor?.name ?? "No supervisor"} ·{" "}
                      {project.category?.name ?? "Uncategorised"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {project.progressPercent}%
                    </span>
                    <StatusBadge status={project.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
