import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  Rocket,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { requireUser } from "@/lib/auth/guards"
import { formatRelative, humanize } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import {
  getCategoryBreakdown,
  getRecentCompletions,
  getReportStats,
  getStatusBreakdown,
  getSupervisorLoadTable,
} from "@/services/reports"

export const metadata = { title: "Reports" }

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted-foreground",
  topic_submitted: "bg-sky-500",
  proposal_submitted: "bg-indigo-500",
  under_review: "bg-amber-500",
  revision_required: "bg-orange-500",
  approved: "bg-emerald-500",
  in_progress: "bg-primary",
  final_submission: "bg-violet-500",
  completed: "bg-emerald-600",
  rejected: "bg-red-500",
}

function BarList({
  rows,
}: {
  rows: Array<{ label: string; total: number; color?: string }>
}) {
  const max = Math.max(1, ...rows.map((row) => row.total))
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{row.label}</span>
            <span className="tabular-nums text-muted-foreground">{row.total}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${row.color ?? "bg-primary"}`}
              style={{ width: `${(row.total / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default async function ReportsPage() {
  const session = await requireUser()
  const role = session.user.role as UserRole
  if (role === "student") redirect("/dashboard")

  const [stats, statusRows, categoryRows, completions] = await Promise.all([
    getReportStats(session.user.id, role),
    getStatusBreakdown(session.user.id, role),
    getCategoryBreakdown(session.user.id, role),
    getRecentCompletions(session.user.id, role),
  ])
  const supervisors = role === "admin" ? await getSupervisorLoadTable() : []

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={role === "admin" ? "System analytics" : "Supervision reports"}
        description={
          role === "admin"
            ? "Institution-wide project health, throughput and load."
            : "How your supervised projects are tracking."
        }
      />

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          hint={`${stats.activeProjects} active`}
        />
        <StatCard
          label="Completed"
          value={stats.completedProjects}
          icon={CheckCircle2}
          hint={
            stats.totalProjects > 0
              ? `${Math.round((stats.completedProjects / stats.totalProjects) * 100)}% of all`
              : undefined
          }
        />
        <StatCard
          label="Avg. progress"
          value={`${stats.avgProgress}%`}
          icon={Activity}
          hint={`Health ${stats.avgHealth}/100`}
        />
        <StatCard
          label="Overdue milestones"
          value={stats.overdueMilestones}
          icon={ListChecks}
          hint={stats.overdueMilestones > 0 ? "Needs attention" : "All on track"}
        />
      </div>

      {/* Breakdowns */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="glass shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="size-4 text-primary" /> Projects by stage
            </CardTitle>
            <CardDescription>Current lifecycle position.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {statusRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <BarList
                rows={statusRows.map((row) => ({
                  label: humanize(row.status),
                  total: row.total,
                  color: STATUS_COLORS[row.status] ?? "bg-primary",
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card className="glass shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Projects by category</CardTitle>
            <CardDescription>Top research areas.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {categoryRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <BarList
                rows={categoryRows.map((row) => ({ label: row.name, total: row.total }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Supervisor load (admin only) */}
      {role === "admin" ? (
        <Card className="glass mt-4 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Rocket className="size-4 text-primary" /> Supervision load
            </CardTitle>
            <CardDescription>Active projects per supervisor against their cap.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {supervisors.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No supervisors yet.</p>
            ) : (
              <ul className="space-y-3">
                {supervisors.map((supervisor) => (
                  <li key={supervisor.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {supervisor.title ? `${supervisor.title} ` : ""}
                        {supervisor.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {supervisor.currentLoad}/{supervisor.maxStudents}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        100,
                        Math.round((supervisor.currentLoad / supervisor.maxStudents) * 100)
                      )}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Recent completions */}
      <section className="mt-6">
        <h2 className="px-1 text-sm font-semibold tracking-wide text-muted-foreground">
          Recently completed
        </h2>
        <div className="mt-3">
          {completions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing completed yet"
              description="Finished projects will be listed here."
            />
          ) : (
            completions.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="glass mb-2 flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.studentName}
                    {project.completedAt ? ` · finished ${formatRelative(project.completedAt)}` : ""}
                  </p>
                </div>
                <Badge variant="success" className="shrink-0">
                  Done
                </Badge>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
