import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Users,
} from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { requireRole } from "@/lib/auth/guards"
import { db } from "@/db"
import { users, projects } from "@/db/schema"
import { and, eq, inArray, asc } from "drizzle-orm"

export const metadata = { title: "Supervisor" }

const ACTIVE_STATUSES = [
  "draft",
  "topic_submitted",
  "proposal_submitted",
  "under_review",
  "revision_required",
  "approved",
  "in_progress",
  "final_submission",
] as const

export default async function SupervisorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("admin")
  const { id } = await params

  const supervisor = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      supervisorProfile: { with: { department: true } },
    },
  })

  if (!supervisor || supervisor.role !== "supervisor") notFound()

  const profile = supervisor.supervisorProfile

  const assignedProjects = await db.query.projects.findMany({
    where: and(
      eq(projects.supervisorId, id),
      inArray(projects.status, [...ACTIVE_STATUSES])
    ),
    with: {
      student: { columns: { name: true, email: true } },
    },
    orderBy: [asc(projects.createdAt)],
  })

  const currentLoad = assignedProjects.length
  const maxStudents = profile?.maxStudents ?? 8
  const actualLoadPct = Math.min(
    100,
    Math.round((currentLoad / maxStudents) * 100)
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/supervisors"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to supervisors
      </Link>

      <PageHeader
        title={`${profile?.title ? profile.title + " " : ""}${supervisor.name}`}
        description={supervisor.email}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Mail className="size-3.5" /> {supervisor.email}
            </p>
          </CardContent>
        </Card>
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Staff number</p>
            <p className="font-mono text-sm font-medium">
              {profile?.staffNumber ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Building2 className="size-3.5" />{" "}
              {profile?.department?.name ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="glass shadow-none">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Office</p>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="size-3.5" />{" "}
              {profile?.officeLocation ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Supervision load
            </span>
            <span className="text-xs text-muted-foreground">
              {currentLoad}/{maxStudents} students
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Capacity</span>
              <span>{actualLoadPct}%</span>
            </div>
            <Progress value={actualLoadPct} />
          </div>
          {profile?.specialization ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Specialisation:
              </span>{" "}
              {profile.specialization}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="glass shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">
            Assigned projects ({assignedProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedProjects.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No active projects.
            </p>
          ) : (
            <div className="space-y-2">
              {assignedProjects.map((project) => (
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
                      by {project.student?.name ?? "Unknown"}
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
