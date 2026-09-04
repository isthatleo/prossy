import { and, asc, count, desc, eq, isNull, lt, ne, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  departments,
  milestones,
  projectCategories,
  projects,
  studentProfiles,
  supervisorProfiles,
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

  const [[totals], [overdue]] = await Promise.all([
    db
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
      .where(scope),
    db
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
      ),
  ])

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

/* ---------------- Drill-down reports ---------------- */

export interface EntityReportStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  avgProgress: number
  studentCount: number
  supervisorCount: number
}

export async function getDepartmentReport(departmentId: string): Promise<EntityReportStats> {
  const [[stats], [studentCount], [supervisorCount]] = await Promise.all([
    db
      .select({
        totalProjects: count(),
        activeProjects: sql<number>`count(*) filter (
          where ${projects.status} in ('approved','in_progress','final_submission')
        )::int`,
        completedProjects: sql<number>`count(*) filter (where ${projects.status} = 'completed')::int`,
        avgProgress: sql<number>`coalesce(round(avg(${projects.progressPercent})), 0)::int`,
      })
      .from(projects)
      .where(eq(projects.departmentId, departmentId)),
    db
      .select({ total: count() })
      .from(studentProfiles)
      .where(eq(studentProfiles.departmentId, departmentId)),
    db
      .select({ total: count() })
      .from(supervisorProfiles)
      .where(eq(supervisorProfiles.departmentId, departmentId)),
  ])

  return {
    totalProjects: stats?.totalProjects ?? 0,
    activeProjects: stats?.activeProjects ?? 0,
    completedProjects: stats?.completedProjects ?? 0,
    avgProgress: stats?.avgProgress ?? 0,
    studentCount: studentCount?.total ?? 0,
    supervisorCount: supervisorCount?.total ?? 0,
  }
}

export async function getCategoryReport(categoryId: string): Promise<Omit<EntityReportStats, "studentCount" | "supervisorCount">> {
  const [stats] = await db
    .select({
      totalProjects: count(),
      activeProjects: sql<number>`count(*) filter (
        where ${projects.status} in ('approved','in_progress','final_submission')
      )::int`,
      completedProjects: sql<number>`count(*) filter (where ${projects.status} = 'completed')::int`,
      avgProgress: sql<number>`coalesce(round(avg(${projects.progressPercent})), 0)::int`,
    })
    .from(projects)
    .where(eq(projects.categoryId, categoryId))

  return {
    totalProjects: stats?.totalProjects ?? 0,
    activeProjects: stats?.activeProjects ?? 0,
    completedProjects: stats?.completedProjects ?? 0,
    avgProgress: stats?.avgProgress ?? 0,
  }
}

export async function getStatusBreakdownForEntity(
  filterColumn: "departmentId" | "categoryId",
  entityId: string
): Promise<Array<{ status: string; total: number }>> {
  return db
    .select({
      status: projects.status,
      total: sql<number>`count(*)::int`,
    })
    .from(projects)
    .where(eq(projects[filterColumn], entityId))
    .groupBy(projects.status)
    .orderBy(desc(sql`count(*)`))
}

export async function getProjectsOverTime(
  filterColumn?: "departmentId" | "categoryId",
  entityId?: string
): Promise<Array<{ month: string; total: number }>> {
  const where = filterColumn && entityId
    ? eq(projects[filterColumn], entityId)
    : undefined

  const rows = await db
    .select({
      month: sql<string>`to_char(${projects.createdAt}, 'YYYY-MM')`,
      total: sql<number>`count(*)::int`,
    })
    .from(projects)
    .where(where)
    .groupBy(sql`to_char(${projects.createdAt}, 'YYYY-MM')`)
    .orderBy(asc(sql`to_char(${projects.createdAt}, 'YYYY-MM')`))

  return rows
}

export async function getEntityProjects(
  filterColumn: "departmentId" | "categoryId",
  entityId: string
) {
  return db.query.projects.findMany({
    where: eq(projects[filterColumn], entityId),
    with: {
      student: { columns: { name: true } },
      supervisor: { columns: { name: true } },
    },
    orderBy: [asc(projects.createdAt)],
  })
}

export async function getEntityName(
  filterColumn: "departmentId" | "categoryId",
  entityId: string
): Promise<string | null> {
  if (filterColumn === "departmentId") {
    const row = await db.query.departments.findFirst({
      where: eq(departments.id, entityId),
      columns: { name: true, code: true },
    })
    return row ? `${row.name} (${row.code})` : null
  }
  const row = await db.query.projectCategories.findFirst({
    where: eq(projectCategories.id, entityId),
    columns: { name: true },
  })
  return row?.name ?? null
}
