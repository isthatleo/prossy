import { and, asc, avg, count, desc, eq, gt, gte, inArray, isNull, ne, notInArray, or, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  activityLogs,
  conversationMembers,
  departments,
  documentSubmissions,
  meetingParticipants,
  meetings,
  messages,
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
  projectId: string
  projectTitle: string
  studentName: string
  submittedAt: Date
}

export interface LatestSubmissionInfo {
  kind: "proposal" | "document"
  label: string
  status: string
  version: number
  submittedAt: Date
}

export async function getStudentDashboard(userId: string) {
  const [project, unreadNotifications, unresolvedFeedback, unreadMessagesRow] =
    await Promise.all([
      db.query.projects.findMany({
        where: and(
          eq(projects.studentId, userId),
          notInArray(projects.status, ["rejected", "completed"])
        ),
        with: {
          supervisor: { columns: { name: true } },
          category: { columns: { name: true } },
          milestones: true,
        },
        orderBy: [desc(projects.createdAt)],
        limit: 1,
      }).then((rows) => rows[0] ?? null),
      db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
      db
        .select({ value: count() })
        .from(feedback)
        .where(and(eq(feedback.recipientId, userId), eq(feedback.isResolved, false))),
      db
        .select({ value: count() })
        .from(conversationMembers)
        .innerJoin(
          messages,
          eq(messages.conversationId, conversationMembers.conversationId)
        )
        .where(
          and(
            eq(conversationMembers.userId, userId),
            ne(messages.senderId, userId),
            or(
              isNull(conversationMembers.lastReadAt),
              gt(messages.createdAt, conversationMembers.lastReadAt)
            )
          )
        ),
    ])

  const [latestProposal, latestDocument, upcomingMeetings] =
    await Promise.all([
      project
        ? db
            .select({
              title: proposals.title,
              status: proposals.status,
              version: proposals.version,
              submittedAt: proposals.submittedAt,
            })
            .from(proposals)
            .where(eq(proposals.projectId, project.id))
            .orderBy(desc(proposals.submittedAt))
            .limit(1)
        : Promise.resolve([]),
      project
        ? db
            .select({
              type: documentSubmissions.type,
              status: documentSubmissions.status,
              version: documentSubmissions.version,
              submittedAt: documentSubmissions.submittedAt,
            })
            .from(documentSubmissions)
            .where(eq(documentSubmissions.projectId, project.id))
            .orderBy(desc(documentSubmissions.submittedAt))
            .limit(1)
        : Promise.resolve([]),
      project
        ? db
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
        : Promise.resolve([]),
    ])

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
    unreadMessages: unreadMessagesRow[0]?.value ?? 0,
    latestSubmission:
      latestProposal.length + latestDocument.length === 0
        ? null
        : latestProposal.length > 0 &&
            (latestDocument.length === 0 ||
              latestProposal[0].submittedAt >= latestDocument[0].submittedAt)
          ? ({
              kind: "proposal",
              label: latestProposal[0].title,
              status: latestProposal[0].status,
              version: latestProposal[0].version,
              submittedAt: latestProposal[0].submittedAt,
            } satisfies LatestSubmissionInfo)
          : ({
              kind: "document",
              label: humanizeSubmissionType(latestDocument[0].type),
              status: latestDocument[0].status,
              version: latestDocument[0].version,
              submittedAt: latestDocument[0].submittedAt,
            } satisfies LatestSubmissionInfo),
  }
}

const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  chapter_1: "Chapter 1",
  chapter_2: "Chapter 2",
  chapter_3: "Chapter 3",
  chapter_4: "Chapter 4",
  progress_report: "Progress report",
  draft_report: "Draft report",
  final_report: "Final report",
  other: "Document",
}

function humanizeSubmissionType(type: string) {
  return SUBMISSION_TYPE_LABELS[type] ?? type.replaceAll("_", " ")
}

export async function getSupervisorDashboard(userId: string) {
  const activeFilter = and(
    eq(projects.supervisorId, userId),
    inArray(projects.status, [...ACTIVE_PROJECT_STATUSES])
  )

  const [assignedStats, upcomingMeetings, atRiskProjects, unreadNotifications, unreadMessagesRow] =
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
      db
        .select({ value: count() })
        .from(conversationMembers)
        .innerJoin(
          messages,
          eq(messages.conversationId, conversationMembers.conversationId)
        )
        .where(
          and(
            eq(conversationMembers.userId, userId),
            ne(messages.senderId, userId),
            or(
              isNull(conversationMembers.lastReadAt),
              gt(messages.createdAt, conversationMembers.lastReadAt)
            )
          )
        ),
    ])

  const [proposalReviews, documentReviews] = await Promise.all([
    db
      .select({
        id: proposals.id,
        kind: sql<"proposal">`'proposal'`,
        label: sql<string>`concat('Proposal v', ${proposals.version})`,
        projectId: projects.id,
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
      ),
    db
      .select({
        id: documentSubmissions.id,
        kind: sql<"document">`'document'`,
        label: documentSubmissions.type,
        projectId: projects.id,
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
      ),
  ])

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
    unreadMessages: unreadMessagesRow[0]?.value ?? 0,
  }
}

export async function getSupervisorActivity(userId: string, limit = 8) {
  const rows = await db
    .select({
      id: activityLogs.id,
      summary: activityLogs.summary,
      createdAt: activityLogs.createdAt,
      actorName: users.name,
    })
    .from(activityLogs)
    .innerJoin(projects, eq(activityLogs.projectId, projects.id))
    .leftJoin(users, eq(activityLogs.actorId, users.id))
    .where(eq(projects.supervisorId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    summary: r.summary,
    actorName: r.actorName,
    createdAt: r.createdAt,
  }))
}

export async function getAdminDashboard(userId: string) {
  const [roleCounts, projectStatuses, deptCount, categoryCount, recentActivity, healthAvg,
    unreadNotifications, unreadMessagesRow, pendingReviewCount] =
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
      db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
      db
        .select({ value: count() })
        .from(conversationMembers)
        .innerJoin(messages, eq(messages.conversationId, conversationMembers.conversationId))
        .where(
          and(
            eq(conversationMembers.userId, userId),
            ne(messages.senderId, userId),
            or(isNull(conversationMembers.lastReadAt), gt(messages.createdAt, conversationMembers.lastReadAt))
          )
        ),
      sql<number>`(
        (select count(*)::int from proposals where status in ('submitted', 'under_review'))
        +
        (select count(*)::int from ${documentSubmissions} where status in ('submitted', 'under_review'))
      )`,
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
    unreadNotifications: unreadNotifications[0]?.value ?? 0,
    unreadMessages: unreadMessagesRow[0]?.value ?? 0,
    pendingReviewCount: Number(pendingReviewCount ?? 0),
  }
}
