import { and, asc, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { milestones, notifications, projects } from "@/db/schema"
import type { UserRole } from "@/lib/rbac"
import { logActivity } from "@/services/activity"
import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "@/validations/milestones"

export interface Viewer {
  id: string
  name?: string
  role: UserRole
}

type MilestoneStatus = (typeof milestones.status.enumValues)[number]

async function getProjectForViewer(projectId: string, viewer: Viewer) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      title: true,
      studentId: true,
      supervisorId: true,
    },
  })
  if (!project) throw new Error("Project not found.")

  const allowed =
    viewer.role === "admin" ||
    project.studentId === viewer.id ||
    (project.supervisorId !== null && project.supervisorId === viewer.id)
  if (!allowed) throw new Error("You do not have access to this project.")

  return project
}

function canManage(
  project: { supervisorId: string | null },
  viewer: Viewer
) {
  return viewer.role === "admin" || project.supervisorId === viewer.id
}

/** Recomputes the parent project's completion percentage. */
async function recomputeProgress(projectId: string) {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${milestones.status} = 'completed')`,
    })
    .from(milestones)
    .where(eq(milestones.projectId, projectId))

  const total = Number(stats?.total ?? 0)
  const completed = Number(stats?.completed ?? 0)
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  await db
    .update(projects)
    .set({ progressPercent: percent, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
}

export async function listMilestones(projectId: string, viewer?: Viewer) {
  if (viewer) {
    await getProjectForViewer(projectId, viewer)
  }
  return db.query.milestones.findMany({
    where: eq(milestones.projectId, projectId),
    orderBy: [asc(milestones.orderIndex), asc(milestones.createdAt)],
  })
}

export async function createMilestone(
  projectId: string,
  viewer: Viewer,
  input: CreateMilestoneInput
): Promise<{ milestoneId: string }> {
  const project = await getProjectForViewer(projectId, viewer)
  if (!canManage(project, viewer)) {
    throw new Error("Only the assigned supervisor or an admin can plan milestones.")
  }

  const [{ nextIndex }] = await db
    .select({ nextIndex: sql<number>`COALESCE(MAX(${milestones.orderIndex}), -1) + 1` })
    .from(milestones)
    .where(eq(milestones.projectId, projectId))

  const [milestone] = await db
    .insert(milestones)
    .values({
      projectId,
      title: input.title,
      description: input.description || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      orderIndex: Number(nextIndex),
      status: "pending",
    })
    .returning({ id: milestones.id })

  await logActivity({
    projectId,
    actorId: viewer.id,
    type: "milestone_created",
    summary: `Milestone added: "${input.title}".`,
  })
  await db.insert(notifications).values({
    userId: project.studentId,
    type: "system",
    title: "New milestone",
    body: `${viewer.name ?? "Your supervisor"} added "${input.title}" to your project plan.`,
    link: `/projects/${projectId}?tab=milestones`,
  })

  return { milestoneId: milestone.id }
}

export async function updateMilestone(
  projectId: string,
  milestoneId: string,
  viewer: Viewer,
  input: UpdateMilestoneInput
): Promise<void> {
  const project = await getProjectForViewer(projectId, viewer)
  if (!canManage(project, viewer)) {
    throw new Error("Only the assigned supervisor or an admin can edit milestones.")
  }

  const milestone = await db.query.milestones.findFirst({
    where: and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)),
  })
  if (!milestone) throw new Error("Milestone not found.")

  await db
    .update(milestones)
    .set({
      title: input.title?.trim() || milestone.title,
      description:
        input.description !== undefined
          ? input.description || null
          : milestone.description,
      dueDate: input.dueDate !== undefined
        ? input.dueDate
          ? new Date(input.dueDate)
          : null
        : milestone.dueDate,
      updatedAt: new Date(),
    })
    .where(eq(milestones.id, milestoneId))
}

export async function deleteMilestone(
  projectId: string,
  milestoneId: string,
  viewer: Viewer
): Promise<void> {
  const project = await getProjectForViewer(projectId, viewer)
  if (!canManage(project, viewer)) {
    throw new Error("Only the assigned supervisor or an admin can delete milestones.")
  }

  const milestone = await db.query.milestones.findFirst({
    where: and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)),
  })
  if (!milestone) throw new Error("Milestone not found.")

  await db.delete(milestones).where(eq(milestones.id, milestoneId))
  await recomputeProgress(projectId)
  await logActivity({
    projectId,
    actorId: viewer.id,
    type: "milestone_deleted",
    summary: `Milestone removed: "${milestone.title}".`,
  })
}

export async function setMilestoneStatus(
  projectId: string,
  milestoneId: string,
  viewer: Viewer,
  status: MilestoneStatus
): Promise<void> {
  const project = await getProjectForViewer(projectId, viewer)

  const milestone = await db.query.milestones.findFirst({
    where: and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)),
  })
  if (!milestone) throw new Error("Milestone not found.")

  await db
    .update(milestones)
    .set({
      status,
      completedAt: status === "completed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(milestones.id, milestoneId))

  await recomputeProgress(projectId)

  if (status === "completed" && milestone.status !== "completed") {
    await logActivity({
      projectId,
      actorId: viewer.id,
      type: "milestone_completed",
      summary: `Milestone completed: "${milestone.title}" (${viewer.name ?? "member"}).`,
    })
    const recipients = [project.studentId, project.supervisorId].filter(
      (id): id is string => id !== null && id !== viewer.id
    )
    if (recipients.length > 0) {
      await db.insert(notifications).values(
        recipients.map((userId) => ({
          userId,
          type: "system" as const,
          title: "Milestone completed",
          body: `"${milestone.title}" is done.`,
          link: `/projects/${projectId}?tab=milestones`,
        }))
      )
    }
  }
}
