import { and, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import { feedback, notifications, projects, users } from "@/db/schema"
import type { UserRole } from "@/lib/rbac"
import { logActivity } from "@/services/activity"
import type { Viewer } from "@/services/submissions"
import type { AddFeedbackInput } from "@/validations/feedback"

export interface FeedbackItem {
  id: string
  content: string
  isResolved: boolean
  createdAt: Date
  resolvedAt: Date | null
  authorId: string
  authorName: string | null
  recipientId: string
  recipientName: string | null
}

/** Loads project and verifies viewer is a member (student / supervisor / admin). */
async function getProjectForMember(projectId: string, viewer: Viewer) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true, studentId: true, supervisorId: true },
  })
  if (!project) throw new Error("Project not found.")

  const allowed =
    viewer.role === "admin" ||
    project.studentId === viewer.id ||
    (project.supervisorId !== null && project.supervisorId === viewer.id)
  if (!allowed) throw new Error("You do not have access to this project.")

  return project
}

export async function listProjectFeedback(
  projectId: string,
  viewer?: Viewer
): Promise<FeedbackItem[]> {
  if (viewer) {
    await getProjectForMember(projectId, viewer)
  }
  const rows = await db
    .select({
      id: feedback.id,
      content: feedback.content,
      isResolved: feedback.isResolved,
      createdAt: feedback.createdAt,
      resolvedAt: feedback.resolvedAt,
      authorId: feedback.authorId,
      recipientId: feedback.recipientId,
    })
    .from(feedback)
    .where(eq(feedback.projectId, projectId))
    .orderBy(desc(feedback.createdAt))
    .limit(100)

  // Resolve names in one go.
  const userIds = [...new Set(rows.flatMap((r) => [r.authorId, r.recipientId]))]
  const names =
    userIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, userIds))
      : []
  const nameById = new Map(names.map((n) => [n.id, n.name]))

  return rows.map((r) => ({
    ...r,
    authorName: nameById.get(r.authorId) ?? null,
    recipientName: nameById.get(r.recipientId) ?? null,
  }))
}

export async function addFeedback(
  projectId: string,
  viewer: Viewer,
  input: AddFeedbackInput
): Promise<{ feedbackId: string }> {
  const project = await getProjectForMember(projectId, viewer)
  if (input.recipientId === viewer.id) {
    throw new Error("You cannot leave feedback for yourself.")
  }

  // Recipient must be a member of the project or an admin.
  const isProjectMember =
    input.recipientId === project.studentId ||
    (project.supervisorId !== null && input.recipientId === project.supervisorId)
  if (!isProjectMember) {
    const admin = await db.query.users.findFirst({
      where: and(eq(users.id, input.recipientId), eq(users.role, "admin")),
      columns: { id: true },
    })
    if (!admin) throw new Error("Recipient is not part of this project.")
  }

  const [row] = await db
    .insert(feedback)
    .values({
      projectId,
      authorId: viewer.id,
      recipientId: input.recipientId,
      content: input.content,
    })
    .returning({ id: feedback.id })

  await logActivity({
    projectId,
    actorId: viewer.id,
    type: "feedback_added",
    summary: `${viewer.name ?? "A member"} left feedback.`,
  })

  await db.insert(notifications).values({
    userId: input.recipientId,
    type: "feedback_added",
    title: `Feedback from ${viewer.name ?? "a member"}`,
    body: input.content.slice(0, 120),
    link: `/projects/${projectId}?tab=feedback`,
  })

  return { feedbackId: row.id }
}

export async function resolveFeedback(
  feedbackId: string,
  viewer: { id: string; role: UserRole }
): Promise<void> {
  const row = await db.query.feedback.findFirst({
    where: eq(feedback.id, feedbackId),
    columns: { id: true, projectId: true, recipientId: true },
  })
  if (!row) throw new Error("Feedback not found.")

  if (viewer.role !== "admin" && row.recipientId !== viewer.id) {
    throw new Error("Only the recipient can resolve their feedback.")
  }

  await db
    .update(feedback)
    .set({ isResolved: true, resolvedAt: new Date() })
    .where(eq(feedback.id, feedbackId))

  await logActivity({
    projectId: row.projectId,
    actorId: viewer.id,
    type: "feedback_resolved",
    summary: "Feedback marked as resolved.",
  })
}
