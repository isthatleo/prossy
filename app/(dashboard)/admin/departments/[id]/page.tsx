import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  Users,
} from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/auth/guards"
import { db } from "@/db"
import { departments, studentProfiles, supervisorProfiles, users } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

export const metadata = { title: "Department" }

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("admin")
  const { id } = await params

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
  })
  if (!department) notFound()

  const [students, supervisors] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(eq(studentProfiles.departmentId, id))
      .orderBy(asc(users.name)),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .innerJoin(supervisorProfiles, eq(supervisorProfiles.userId, users.id))
      .where(eq(supervisorProfiles.departmentId, id))
      .orderBy(asc(users.name)),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/departments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to departments
      </Link>

      <PageHeader
        title={department.name}
        description={`Code: ${department.code}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="size-3.5" /> Students
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {students.length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="size-3.5" /> Supervisors
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {supervisors.length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="size-3.5" /> Code
            </div>
            <p className="mt-1 text-2xl font-semibold">{department.code}</p>
          </CardContent>
        </Card>
      </div>

      {students.length > 0 ? (
        <Card className="glass shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">
              Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {students.map((s) => (
                <Link
                  key={s.id}
                  href={`/students/${s.id}`}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.email}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {supervisors.length > 0 ? (
        <Card className="glass shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">
              Supervisors ({supervisors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {supervisors.map((s) => (
                <Link
                  key={s.id}
                  href={`/supervisors/${s.id}`}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.email}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
