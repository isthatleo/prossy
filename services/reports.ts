import { and, count, desc, eq, isNull, lt, ne, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  milestones,
  projects,
  users,
} from "@/db/schema"
import type { UserRole } from "@/lib/rbac"
import { listSupervisorDirectory } from "@/services/directory"

function scopeFor(viewerId: string, role: UserRole) {
  return role === "supervisor" ? eq(projects.supervisorId, viewerId) : undefined
}

export interface ReportStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  avgProgress: number
  avgHealth: number
  overdueMilestones: number
}

export async function getReportStats(
  viewerId: string,
  role: UserRole
): Promise<ReportStats> {
  const scope = scopeFor(viewerId, role)

  const [totals] = await db
    .select({
      totalProjects: count(),
      activeProjects: sql<number>`count(*) filter (
        where ${projects.status} in ('approved','in_progress','final_submission')
      )::int`,
      completedProjects: sql<number>`count(*) filter (where ${projects.status} = 'completed')::int`,
      avgProgress: sql<number>`coalesce(round(avg(${projects.progressPercent})), 0)::int`,
      avgHealth: sql<number>`coalesce(round(avg(${projects.healthScore})), 0)::int`,
    })
    .from(projects)
    .where(scope)

  const [overdue] = await db
    .select({ total: count() })
    .from(milestones)
    .innerJoin(projects, eq(projects.id, milestones.projectId))
    .where(
      and(
        scope,
        ne(milestones.status, "completed"),
        lt(milestones.dueDate, new Date()),
        isNull(milestones.completedAt)
      )
    )

  return {
    totalProjects: totals?.totalProjects ?? 0,
    activeProjects: totals?.activeProjects ?? 0,
    completedProjects: totals?.completedProjects ?? 0,
    avgProgress: totals?.avgProgress ?? 0,
    avgHealth: totals?.avgHealth ?? 0,
    overdueMilestones: overdue?.total ?? 0,
  }
}

export async function getStatusBreakdown(
  viewerId: string,
  role: UserRole
): Promise<Array<{ status: string; total: number }>> {
  const scope = scopeFor(viewerId, role)
  return db
    .select({
      status: projects.status,
      total: sql<number>`count(*)::int`,
    })
    .from(projects)
    .where(scope)
    .groupBy(projects.status)
    .orderBy(desc(sql`count(*)`))
}

export async function getCategoryBreakdown(
  viewerId: string,
  role: UserRole
): Promise<Array<{ name: string; total: number }>> {
  const scope = scopeFor(viewerId, role)
  const rows = await db
    .select({
      name: sql<string | null>`coalesce(max(cat.name), 'Uncategorised')`,
      total: sql<number>`count(*)::int`,
    })
    .from(projects)
    .leftJoin(sql`project_categories cat`, sql`cat.id = ${projects.categoryId}`)
    .where(scope)
    .groupBy(projects.categoryId)
    .orderBy(desc(sql`count(*)`))
    .limit(8)
  return rows.map((row) => ({ name: row.name ?? "Uncategorised", total: row.total }))
}

/** Admin-only table: supervision load per supervisor. */
export async function getSupervisorLoadTable() {
  return listSupervisorDirectory()
}

export async function getRecentCompletions(
  viewerId: string,
  role: UserRole,
  limit = 5
): Promise<Array<{ id: string; title: string; studentName: string | null; completedAt: Date | null }>> {
  const scope = scopeFor(viewerId, role)
  return db
    .select({
      id: projects.id,
      title: projects.title,
      studentName: users.name,
      completedAt: projects.completedAt,
    })
    .from(projects)
    .innerJoin(users, eq(users.id, projects.studentId))
    .where(and(scope, eq(projects.status, "completed")))
    .orderBy(desc(projects.completedAt))
    .limit(limit)
}
