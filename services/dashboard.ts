import { and, asc, avg, count, desc, eq, gte, inArray, isNull, notInArray, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  activityLogs,
  departments,
  documentSubmissions,
  meetingParticipants,
  meetings,
  notifications,
  projectCategories,
  projects,
  proposals,
  users,
} from "@/db/schema"
import { feedback } from "@/db/schema/tracking"

const ACTIVE_PROJECT_STATUSES = [
  "draft",
  "topic_submitted",
  "proposal_submitted",
  "under_review",
  "revision_required",
  "approved",
  "in_progress",
  "final_submission",
] as const

export interface StudentProjectInfo {
  id: string
  title: string
  status: string
  progressPercent: number
  healthScore: number
  startDate: string | null
  expectedEndDate: string | null
  category: string | null
  supervisorName: string | null
}

export interface UpcomingMeetingInfo {
  id: string
  title: string
  startAt: Date
  location: string | null
  projectTitle: string | null
}

export interface MilestoneInfo {
  id: string
  title: string
  dueDate: Date | null
  status: "pending" | "in_progress" | "completed"
}

export interface ActivityItem {
  id: string
  summary: string
  actorName: string | null
  createdAt: Date
}

export interface PendingReviewItem {
  id: string
  kind: "proposal" | "document"
  label: string
  projectTitle: string
  studentName: string
  submittedAt: Date
}

export async function getStudentDashboard(userId: string) {
  const [project] = await db.query.projects.findMany({
    where: and(
      eq(projects.studentId, userId),
      notInArray(projects.status, ["rejected", "completed"])
    ),
    with: {
      supervisor: true,
      category: true,
      milestones: true,
    },
    orderBy: [desc(projects.createdAt)],
    limit: 1,
  })

  const [unreadNotifications, unresolvedFeedback] = await Promise.all([
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
    db
      .select({ value: count() })
      .from(feedback)
      .where(and(eq(feedback.recipientId, userId), eq(feedback.isResolved, false))),
  ])

  const upcomingMeetings = project
    ? await db
        .select({
          id: meetings.id,
          title: meetings.title,
          startAt: meetings.startAt,
          location: meetings.location,
          projectTitle: projects.title,
        })
        .from(meetingParticipants)
        .innerJoin(meetings, eq(meetingParticipants.meetingId, meetings.id))
        .innerJoin(projects, eq(meetings.projectId, projects.id))
        .where(
          and(
            eq(meetingParticipants.userId, userId),
            eq(meetings.status, "scheduled"),
            gte(meetings.startAt, new Date())
          )
        )
        .orderBy(asc(meetings.startAt))
        .limit(3)
    : []

  return {
    project: project
      ? ({
          id: project.id,
          title: project.title,
          status: project.status,
          progressPercent: project.progressPercent,
          healthScore: project.healthScore,
          startDate: project.startDate,
          expectedEndDate: project.expectedEndDate,
          category: project.category?.name ?? null,
          supervisorName: project.supervisor?.name ?? null,
        } satisfies StudentProjectInfo)
      : null,
    milestones: (
      project?.milestones
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((m) => ({
          id: m.id,
          title: m.title,
          dueDate: m.dueDate,
          status: m.status,
        })) ?? []
    ) as MilestoneInfo[],
    upcomingMeetings,
    unreadNotifications: unreadNotifications[0]?.value ?? 0,
    unresolvedFeedback: unresolvedFeedback[0]?.value ?? 0,
  }
}

export async function getSupervisorDashboard(userId: string) {
  const activeFilter = and(
    eq(projects.supervisorId, userId),
    inArray(projects.status, [...ACTIVE_PROJECT_STATUSES])
  )

  const [assignedStats, upcomingMeetings, atRiskProjects, unreadNotifications] =
    await Promise.all([
      db
        .select({
          value: sql<number>`count(distinct ${projects.studentId})`,
          avgProgress: avg(projects.progressPercent),
          avgHealth: avg(projects.healthScore),
        })
        .from(projects)
        .where(activeFilter),
      db
        .select({
          id: meetings.id,
          title: meetings.title,
          startAt: meetings.startAt,
          location: meetings.location,
          projectTitle: projects.title,
        })
        .from(projects)
        .innerJoin(meetings, eq(meetings.projectId, projects.id))
        .where(
          and(
            eq(projects.supervisorId, userId),
            eq(meetings.status, "scheduled"),
            gte(meetings.startAt, new Date())
          )
        )
        .orderBy(asc(meetings.startAt))
        .limit(4),
      db
        .select({
          id: projects.id,
          title: projects.title,
          healthScore: projects.healthScore,
          progressPercent: projects.progressPercent,
          studentName: users.name,
        })
        .from(projects)
        .innerJoin(users, eq(projects.studentId, users.id))
        .where(and(activeFilter, sql`${projects.healthScore} < 60`))
        .orderBy(asc(projects.healthScore))
        .limit(4),
      db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
    ])

  const proposalReviews = await db
    .select({
      id: proposals.id,
      kind: sql<"proposal">`'proposal'`,
      label: sql<string>`concat('Proposal v', ${proposals.version})`,
      projectTitle: projects.title,
      studentName: users.name,
      submittedAt: proposals.submittedAt,
    })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .innerJoin(users, eq(proposals.submittedBy, users.id))
    .where(
      and(
        eq(projects.supervisorId, userId),
        inArray(proposals.status, ["submitted", "under_review"])
      )
    )

  const documentReviews = await db
    .select({
      id: documentSubmissions.id,
      kind: sql<"document">`'document'`,
      label: documentSubmissions.type,
      projectTitle: projects.title,
      studentName: users.name,
      submittedAt: documentSubmissions.submittedAt,
    })
    .from(documentSubmissions)
    .innerJoin(projects, eq(documentSubmissions.projectId, projects.id))
    .innerJoin(users, eq(documentSubmissions.submittedBy, users.id))
    .where(
      and(
        eq(projects.supervisorId, userId),
        inArray(documentSubmissions.status, ["submitted", "under_review"])
      )
    )

  const pendingReviews: PendingReviewItem[] = [
    ...proposalReviews,
    ...documentReviews,
  ]
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
    .slice(0, 6)

  return {
    assignedStudents: assignedStats[0]?.value ?? 0,
    avgProgress: Math.round(Number(assignedStats[0]?.avgProgress ?? 0)),
    avgHealth: Math.round(Number(assignedStats[0]?.avgHealth ?? 100)),
    pendingReviewCount: proposalReviews.length + documentReviews.length,
    pendingReviews,
    upcomingMeetings,
    atRiskProjects,
    unreadNotifications: unreadNotifications[0]?.value ?? 0,
  }
}

export async function getAdminDashboard() {
  const [roleCounts, projectStatuses, deptCount, categoryCount, recentActivity, healthAvg] =
    await Promise.all([
      db.select({ role: users.role, value: count() }).from(users).groupBy(users.role),
      db.select({ status: projects.status, value: count() }).from(projects).groupBy(projects.status),
      db.select({ value: count() }).from(departments),
      db.select({ value: count() }).from(projectCategories),
      db
        .select({
          id: activityLogs.id,
          summary: activityLogs.summary,
          actorName: users.name,
          createdAt: activityLogs.createdAt,
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.actorId, users.id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(6),
      db.select({ value: avg(projects.healthScore) }).from(projects),
    ])

  return {
    usersByRole: Object.fromEntries(roleCounts.map((r) => [r.role, r.value])) as Record<string, number>,
    totalUsers: roleCounts.reduce((sum, r) => sum + r.value, 0),
    projectsByStatus: Object.fromEntries(projectStatuses.map((r) => [r.status, r.value])) as Record<string, number>,
    totalProjects: projectStatuses.reduce((sum, r) => sum + r.value, 0),
    departments: deptCount[0]?.value ?? 0,
    categories: categoryCount[0]?.value ?? 0,
    avgHealth: Math.round(Number(healthAvg[0]?.value ?? 100)),
    recentActivity: recentActivity satisfies ActivityItem[],
  }
}
