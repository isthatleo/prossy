import { and, desc, eq, ilike, inArray, ne } from "drizzle-orm"

import { db } from "@/db"
import {
  activityLogs,
  notifications,
  projectCategories,
  projects,
  users,
} from "@/db/schema"
import type { UserRole } from "@/lib/rbac"
import { logActivity } from "@/services/activity"
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/validations/projects"

type ProjectStatus = (typeof projects.status.enumValues)[number]

export const EDITABLE_STATUSES = ["draft", "revision_required"] as const
export const ACTIVE_PROJECT_STATUSES = [
  "draft",
  "topic_submitted",
  "proposal_submitted",
  "under_review",
  "revision_required",
  "approved",
  "in_progress",
  "final_submission",
] as const

/** Transitions each action may perform. Admin may do all of them. */
export const TRANSITIONS = {
  submit: ["draft", "revision_required"],
  start_review: ["topic_submitted"],
  approve: ["under_review"],
  request_revision: ["under_review", "topic_submitted"],
  reject: ["under_review", "topic_submitted"],
  start_work: ["approved"],
} as const satisfies Record<string, readonly string[]>

export type ProjectAction = keyof typeof TRANSITIONS

const ACTION_TO_STATUS: Record<ProjectAction, string> = {
  submit: "topic_submitted",
  start_review: "under_review",
  approve: "approved",
  request_revision: "revision_required",
  reject: "rejected",
  start_work: "in_progress",
}

function canPerform(role: UserRole, action: ProjectAction): boolean {
  if (role === "admin") return true
  if (action === "submit") return role === "student"
  return role === "supervisor"
}

async function notify(userIds: string[], title: string, body: string, link: string) {
  const unique = [...new Set(userIds)].filter(Boolean)
  if (unique.length === 0) return
  await db.insert(notifications).values(
    unique.map((userId) => ({ userId, type: "project_status_changed" as const, title, body, link }))
  )
}

async function adminIds(): Promise<string[]> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.is_active, true)))
  return rows.map((r) => r.id)
}

export async function getCategories() {
  return db.select().from(projectCategories).orderBy(projectCategories.name)
}

export interface ProjectListItem {
  id: string
  title: string
  status: string
  progressPercent: number
  healthScore: number
  updatedAt: Date
  categoryName: string | null
  studentName: string | null
  supervisorName: string | null
}

export async function listProjects(
  viewer: { id: string; role: UserRole },
  statusFilter?: string
): Promise<ProjectListItem[]> {
  const conditions = []
  if (viewer.role === "student") conditions.push(eq(projects.studentId, viewer.id))
  if (viewer.role === "supervisor") conditions.push(eq(projects.supervisorId, viewer.id))
  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(projects.status, statusFilter as ProjectStatus))
  }

  const rows = await db.query.projects.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { student: true, supervisor: true, category: true },
    orderBy: [desc(projects.updatedAt)],
    limit: 100,
  })

  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    progressPercent: p.progressPercent,
    healthScore: p.healthScore,
    updatedAt: p.updatedAt,
    categoryName: p.category?.name ?? null,
    studentName: p.student?.name ?? null,
    supervisorName: p.supervisor?.name ?? null,
  }))
}

export async function findSimilarTitles(title: string, excludeProjectId?: string) {
  const conditions = [ilike(projects.title, `%${title.split(" ")[0]}%`)]
  if (excludeProjectId) conditions.push(ne(projects.id, excludeProjectId))
  return db
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(and(...conditions))
    .limit(3)
}

export async function createProject(studentId: string, input: CreateProjectInput) {
  const existing = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.studentId, studentId),
        inArray(projects.status, [...ACTIVE_PROJECT_STATUSES])
      )
    )
    .limit(1)
  if (existing.length > 0) {
    throw new Error("You already have an active project. Complete or withdraw it first.")
  }

  const [project] = await db
    .insert(projects)
    .values({
      title: input.title,
      description: input.description,
      problemStatement: input.problemStatement || null,
      objectives: input.objectives || null,
      methodology: input.methodology || null,
      categoryId: input.categoryId,
      studentId,
      status: "draft",
    })
    .returning()

  await logActivity({
    projectId: project.id,
    actorId: studentId,
    type: "project_created",
    summary: `created the project "${project.title}"`,
  })

  const similar = await findSimilarTitles(project.title, project.id)
  return { project, similarTitles: similar }
}

export async function updateProject(
  projectId: string,
  viewer: { id: string; role: UserRole },
  input: UpdateProjectInput
) {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
  if (!project) throw new Error("Project not found.")

  const isOwner = project.studentId === viewer.id
  const canEdit =
    viewer.role === "admin" ||
    (isOwner && (EDITABLE_STATUSES as readonly string[]).includes(project.status))
  if (!canEdit) throw new Error("You cannot edit this project right now.")

  await db
    .update(projects)
    .set({
      ...input,
      problemStatement: input.problemStatement ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))

  await logActivity({
    projectId,
    actorId: viewer.id,
    type: "project_updated",
    summary: `updated project details`,
  })
}

export async function performProjectAction(
  projectId: string,
  viewer: { id: string; name: string; role: UserRole },
  action: ProjectAction,
  notes?: string
) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      student: { columns: { name: true } },
      supervisor: { columns: { name: true } },
    },
  })
  if (!project) throw new Error("Project not found.")
  if (!canPerform(viewer.role, action)) {
    throw new Error(`You are not allowed to ${action.replace("_", " ")} this project.`)
  }
  const allowed = TRANSITIONS[action] as readonly string[]
  if (!allowed.includes(project.status)) {
    throw new Error(
      `"${action.replace("_", " ")}" is not valid while the project is "${project.status.replace(/_/g, " ")}".`
    )
  }

  // Ownership guard: supervisors may only act on their assigned projects.
  if (viewer.role === "supervisor" && project.supervisorId !== viewer.id) {
    throw new Error("This project is not assigned to you.")
  }

  const nextStatus = ACTION_TO_STATUS[action] as ProjectStatus
  await db
    .update(projects)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(projects.id, projectId))

  const link = `/projects/${projectId}`
  const summaryText = notes?.trim() ? ` — "${notes.trim()}"` : ""

  if (action === "submit") {
    const targets = [
      ...(project.supervisorId ? [project.supervisorId] : []),
      ...(await adminIds()),
    ]
    await notify(
      targets.filter((id) => id !== viewer.id),
      "Project submitted for approval",
      `${viewer.name} submitted "${project.title}" for review.`,
      link
    )
  } else {
    await notify(
      [project.studentId].filter((id) => id !== viewer.id),
      `Project ${nextStatus.replace(/_/g, " ")}`,
      `${viewer.name} set "${project.title}" to ${nextStatus.replace(/_/g, " ")}${summaryText}`,
      link
    )
    if (
      action === "approve" &&
      !project.supervisorId &&
      viewer.role === "supervisor"
    ) {
      // Supervisor approving implicitly claims supervision.
      await db
        .update(projects)
        .set({ supervisorId: viewer.id })
        .where(eq(projects.id, projectId))
    }
  }

  await logActivity({
    projectId,
    actorId: viewer.id,
    type: `project_${action}`,
    summary: `${action.replace("_", " ")}d the project${
      nextStatus !== ACTION_TO_STATUS.submit ? ` (${nextStatus.replace(/_/g, " ")})` : ""
    }${summaryText}`,
    metadata: notes ? { notes } : undefined,
  })
}

export async function assignSupervisor(projectId: string, supervisorId: string | null) {
  await db
    .update(projects)
    .set({ supervisorId, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
}

export interface ProjectDetail {
  id: string
  title: string
  description: string | null
  problemStatement: string | null
  objectives: string | null
  methodology: string | null
  status: string
  progressPercent: number
  healthScore: number
  startDate: string | null
  expectedEndDate: string | null
  createdAt: Date
  updatedAt: Date
  categoryId: string | null
  categoryName: string | null
  student: { id: string; name: string; email: string }
  supervisor: { id: string; name: string; email: string } | null
}

export async function getProjectDetail(
  projectId: string,
  viewer: { id: string; role: UserRole }
): Promise<ProjectDetail | null> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { student: true, supervisor: true, category: true },
  })
  if (!project) return null

  const canView =
    viewer.role === "admin" ||
    project.studentId === viewer.id ||
    (project.supervisorId !== null && project.supervisorId === viewer.id)
  if (!canView) return null

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    problemStatement: project.problemStatement,
    objectives: project.objectives,
    methodology: project.methodology,
    status: project.status,
    progressPercent: project.progressPercent,
    healthScore: project.healthScore,
    startDate: project.startDate,
    expectedEndDate: project.expectedEndDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    categoryId: project.categoryId,
    categoryName: project.category?.name ?? null,
    student: {
      id: project.student.id,
      name: project.student.name,
      email: project.student.email,
    },
    supervisor: project.supervisor
      ? {
          id: project.supervisor.id,
          name: project.supervisor.name,
          email: project.supervisor.email,
        }
      : null,
  }
}

export async function getProjectActivity(
  projectId: string,
  limit = 15,
  viewer?: { id: string; role: UserRole }
) {
  if (viewer) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { id: true, studentId: true, supervisorId: true },
    })
    if (!project) return []
    const canView =
      viewer.role === "admin" ||
      project.studentId === viewer.id ||
      (project.supervisorId !== null && project.supervisorId === viewer.id)
    if (!canView) return []
  }
  return db
    .select({
      id: activityLogs.id,
      summary: activityLogs.summary,
      type: activityLogs.type,
      createdAt: activityLogs.createdAt,
      actorName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.actorId, users.id))
    .where(eq(activityLogs.projectId, projectId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
}

/** Which actions the viewer may perform on this project right now. */
export function allowedActions(
  project: { status: string; studentId: string; supervisorId: string | null },
  viewer: { id: string; role: UserRole }
): ProjectAction[] {
  const result: ProjectAction[] = []
  for (const action of Object.keys(TRANSITIONS) as ProjectAction[]) {
    if (!canPerform(viewer.role, action)) continue
    if (!(TRANSITIONS[action] as readonly string[]).includes(project.status)) continue
    // Supervisors must be assigned; students must own the project.
    if (viewer.role === "supervisor" && project.supervisorId !== viewer.id) continue
    if (viewer.role === "student" && action === "submit" && project.studentId !== viewer.id)
      continue
    result.push(action)
  }
  return result
}
