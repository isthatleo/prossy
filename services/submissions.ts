import { and, desc, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  documentSubmissions,
  files,
  notifications,
  projects,
  proposals,
  users,
} from "@/db/schema"
import {
  proposalStatusEnum,
  submissionStatusEnum,
} from "@/db/schema/enums"
import { uploadProjectFile } from "@/lib/storage/files"
import type { UserRole } from "@/lib/rbac"
import { logActivity } from "@/services/activity"
import type {
  CreateDocumentInput,
  CreateProposalInput,
} from "@/validations/submissions"

type ProposalStatusValue = (typeof proposalStatusEnum.enumValues)[number]
type SubmissionStatusValue = (typeof submissionStatusEnum.enumValues)[number]

export interface Viewer {
  id: string
  name?: string
  role: UserRole
}

type ProjectStatus = (typeof projects.status.enumValues)[number]

const PROPOSAL_ELIGIBLE: ProjectStatus[] = ["approved", "in_progress"]
const DOCUMENT_ELIGIBLE: ProjectStatus[] = ["in_progress", "final_submission"]

/** Loads the project and verifies viewer is owner / assigned supervisor / admin. */
async function getProjectForViewer(projectId: string, viewer: Viewer) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  })
  if (!project) throw new Error("Project not found.")

  const allowed =
    viewer.role === "admin" ||
    project.studentId === viewer.id ||
    (project.supervisorId !== null && project.supervisorId === viewer.id)
  if (!allowed) throw new Error("You do not have access to this project.")

  return project
}

function canReview(project: { supervisorId: string | null }, viewer: Viewer) {
  return viewer.role === "admin" || project.supervisorId === viewer.id
}

async function adminIds(): Promise<string[]> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.is_active, true)))
  return rows.map((r) => r.id)
}

async function notify(
  recipientIds: string[],
  title: string,
  body: string,
  link: string,
  type:
    | "system"
    | "proposal_reviewed"
    | "document_reviewed" = "system"
) {
  if (recipientIds.length === 0) return
  await db.insert(notifications).values(
    recipientIds.map((userId) => ({ userId, type, title, body, link }))
  )
}

/* ------------------------------------------------------------------ */
/* Proposals                                                           */
/* ------------------------------------------------------------------ */

export async function listProposals(projectId: string) {
  return db.query.proposals.findMany({
    where: eq(proposals.projectId, projectId),
    with: {
      file: true,
      submitter: { columns: { id: true, name: true } },
      reviewer: { columns: { id: true, name: true } },
    },
    orderBy: [desc(proposals.version)],
  })
}

export async function submitProposal(
  projectId: string,
  viewer: Viewer,
  input: CreateProposalInput,
  file?: File | null
): Promise<{ proposalId: string; version: number }> {
  const project = await getProjectForViewer(projectId, viewer)
  if (viewer.role !== "student" || project.studentId !== viewer.id) {
    throw new Error("Only the project's student can submit a proposal.")
  }
  if (!PROPOSAL_ELIGIBLE.includes(project.status)) {
    throw new Error(
      "Proposals can only be submitted while the topic is approved or work is in progress."
    )
  }

  let storedFileId: string | null = null
  if (file && file.size > 0) {
    const stored = await uploadProjectFile(file, projectId)
    const [row] = await db
      .insert(files)
      .values({ ...stored, uploadedBy: viewer.id })
      .returning({ id: files.id })
    storedFileId = row.id
  }

  try {
    const [{ nextVersion }] = await db
      .select({
        nextVersion: sql<number>`COALESCE(MAX(${proposals.version}), 0) + 1`,
      })
      .from(proposals)
      .where(eq(proposals.projectId, projectId))

    const [proposal] = await db
      .insert(proposals)
      .values({
        projectId,
        version: nextVersion,
        title: input.title,
        abstract: input.abstract || null,
        objectives: input.objectives || null,
        methodology: input.methodology || null,
        fileId: storedFileId,
        status: "submitted",
        submittedBy: viewer.id,
      })
      .returning({ id: proposals.id })

    const link = `/projects/${projectId}?tab=proposal`
    await logActivity({
      projectId,
      actorId: viewer.id,
      type: "proposal_submitted",
      summary: `Proposal v${nextVersion} submitted ("${input.title}").`,
    })
    await notify(
      project.supervisorId ? [project.supervisorId] : await adminIds(),
      "Proposal submitted",
      `${viewer.name ?? "The student"} submitted proposal v${nextVersion} for "${project.title}".`,
      link
    )
    return { proposalId: proposal.id, version: nextVersion }
  } catch (error) {
    if (storedFileId) {
      const [f] = await db
        .select({ key: files.storageKey })
        .from(files)
        .where(eq(files.id, storedFileId))
      if (f) {
        const { deleteStoredFile } = await import("@/lib/storage/files")
        await deleteStoredFile(f.key).catch(() => undefined)
        await db.delete(files).where(eq(files.id, storedFileId))
      }
    }
    throw error
  }
}

export async function reviewProposal(
  projectId: string,
  proposalId: string,
  viewer: Viewer,
  decision: "start_review" | "approve" | "request_revision" | "reject",
  notes?: string
): Promise<void> {
  const project = await getProjectForViewer(projectId, viewer)
  if (!canReview(project, viewer)) {
    throw new Error("Only the assigned supervisor or an admin can review proposals.")
  }

  const proposal = await db.query.proposals.findFirst({
    where: and(eq(proposals.id, proposalId), eq(proposals.projectId, projectId)),
  })
  if (!proposal) throw new Error("Proposal not found.")

  const transitions: Record<string, string[]> = {
    start_review: ["submitted"],
    approve: ["under_review", "submitted"],
    request_revision: ["under_review", "submitted"],
    reject: ["under_review", "submitted"],
  }
  if (!transitions[decision].includes(proposal.status)) {
    throw new Error(`"${decision}" is not valid while the proposal is "${proposal.status.replace("_", " ")}".`)
  }

  const nextStatus =
    decision === "start_review"
      ? "under_review"
      : decision === "approve"
        ? "approved"
        : decision === "request_revision"
          ? "revision_required"
          : "rejected"

  await db
    .update(proposals)
    .set({
      status: nextStatus as ProposalStatusValue,
      reviewedBy: decision === "start_review" ? proposal.reviewedBy : viewer.id,
      reviewNotes:
        notes?.trim() ? notes.trim() : proposal.reviewNotes,
      reviewedAt: decision === "start_review" ? proposal.reviewedAt : new Date(),
    })
    .where(eq(proposals.id, proposalId))

  const link = `/projects/${projectId}?tab=proposal`
  await logActivity({
    projectId,
    actorId: viewer.id,
    type: `proposal_${nextStatus}`,
    summary: `Proposal v${proposal.version} → ${nextStatus.replace("_", " ")}.`,
  })
  if (decision !== "start_review") {
    await notify(
      [proposal.submittedBy],
      `Proposal ${nextStatus.replace("_", " ")}`,
      `${viewer.name ?? "Your reviewer"} ${decision === "approve" ? "approved" : decision === "request_revision" ? "requested changes to" : "rejected"} proposal v${proposal.version}${notes?.trim() ? `: “${notes.trim()}”` : "."}`,
      link,
      "proposal_reviewed"
    )
  }
}


/* ------------------------------------------------------------------ */
/* Document submissions                                                */
/* ------------------------------------------------------------------ */

export async function listSubmissions(projectId: string) {
  return db.query.documentSubmissions.findMany({
    where: eq(documentSubmissions.projectId, projectId),
    with: {
      file: true,
      submitter: { columns: { id: true, name: true } },
      reviewer: { columns: { id: true, name: true } },
    },
    orderBy: [desc(documentSubmissions.submittedAt)],
  })
}

export async function submitDocument(
  projectId: string,
  viewer: Viewer,
  input: CreateDocumentInput,
  file: File
): Promise<{ submissionId: string; version: number }> {
  if (!file || file.size === 0) throw new Error("A document file is required.")

  const project = await getProjectForViewer(projectId, viewer)
  if (viewer.role !== "student" || project.studentId !== viewer.id) {
    throw new Error("Only the project's student can submit documents.")
  }
  if (!DOCUMENT_ELIGIBLE.includes(project.status)) {
    throw new Error("Documents can only be submitted while work is in progress.")
  }

  const stored = await uploadProjectFile(file, projectId)
  const [fileRow] = await db
    .insert(files)
    .values({ ...stored, uploadedBy: viewer.id })
    .returning({ id: files.id })

  try {
    const [{ nextVersion }] = await db
      .select({
        nextVersion: sql<number>`COALESCE(MAX(${documentSubmissions.version}), 0) + 1`,
      })
      .from(documentSubmissions)
      .where(
        and(
          eq(documentSubmissions.projectId, projectId),
          eq(documentSubmissions.type, input.type)
        )
      )

    const [submission] = await db
      .insert(documentSubmissions)
      .values({
        projectId,
        type: input.type,
        version: nextVersion,
        fileId: fileRow.id,
        description: input.description || null,
        status: "submitted",
        submittedBy: viewer.id,
      })
      .returning({ id: documentSubmissions.id })

    // First final-report submission moves the project into final_submission.
    if (
      input.type === "final_report" &&
      !["final_submission", "completed"].includes(project.status)
    ) {
      await db
        .update(projects)
        .set({ status: "final_submission", updatedAt: new Date() })
        .where(eq(projects.id, projectId))
    }

    const label = input.type.replace(/_/g, " ")
    const link = `/projects/${projectId}?tab=documents`
    await logActivity({
      projectId,
      actorId: viewer.id,
      type: "document_submitted",
      summary: `${label} v${nextVersion} submitted.`,
    })
    await notify(
      project.supervisorId ? [project.supervisorId] : await adminIds(),
      "Document submitted",
      `${viewer.name ?? "The student"} submitted ${label} v${nextVersion}.`,
      link
    )
    return { submissionId: submission.id, version: nextVersion }
  } catch (error) {
    await db.delete(files).where(eq(files.id, fileRow.id))
    const { deleteStoredFile } = await import("@/lib/storage/files")
    await deleteStoredFile(stored.storageKey).catch(() => undefined)
    throw error
  }
}

export async function reviewSubmission(
  projectId: string,
  submissionId: string,
  viewer: Viewer,
  decision: "start_review" | "approve" | "request_revision",
  notes?: string
): Promise<void> {
  const project = await getProjectForViewer(projectId, viewer)
  if (!canReview(project, viewer)) {
    throw new Error("Only the assigned supervisor or an admin can review submissions.")
  }

  const submission = await db.query.documentSubmissions.findFirst({
    where: and(
      eq(documentSubmissions.id, submissionId),
      eq(documentSubmissions.projectId, projectId)
    ),
  })
  if (!submission) throw new Error("Submission not found.")

  const transitions: Record<string, string[]> = {
    start_review: ["submitted"],
    approve: ["under_review", "submitted"],
    request_revision: ["under_review", "submitted"],
  }
  if (!transitions[decision].includes(submission.status)) {
    throw new Error(`"${decision}" is not valid while the submission is "${submission.status.replace("_", " ")}".`)
  }

  const nextStatus =
    decision === "start_review"
      ? "under_review"
      : decision === "approve"
        ? "approved"
        : "revision_required"

  await db
    .update(documentSubmissions)
    .set({
      status: nextStatus as SubmissionStatusValue,
      reviewedBy: decision === "start_review" ? submission.reviewedBy : viewer.id,
      reviewNotes: notes?.trim() ? notes.trim() : submission.reviewNotes,
      reviewedAt: decision === "start_review" ? submission.reviewedAt : new Date(),
    })
    .where(eq(documentSubmissions.id, submissionId))

  // Final report approved → project completed.
  if (
    decision === "approve" &&
    submission.type === "final_report" &&
    project.status === "final_submission"
  ) {
    await db
      .update(projects)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(projects.id, projectId))
  }

  const label = submission.type.replace(/_/g, " ")
  const link = `/projects/${projectId}?tab=documents`
  await logActivity({
    projectId,
    actorId: viewer.id,
    type: `submission_${nextStatus}`,
    summary: `${label} v${submission.version} → ${nextStatus.replace("_", " ")}.`,
  })
  if (decision !== "start_review") {
    await notify(
      [submission.submittedBy],
      `Submission ${nextStatus.replace("_", " ")}`,
      `${viewer.name ?? "Your reviewer"} ${decision === "approve" ? "approved" : "requested changes to"} ${label} v${submission.version}${notes?.trim() ? `: “${notes.trim()}”` : "."}`,
      link,
      "document_reviewed"
    )
  }
}


/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

export function proposalReviewActions(status: string): Array<
  "start_review" | "approve" | "request_revision" | "reject"
> {
  if (status === "submitted") return ["start_review", "approve", "request_revision", "reject"]
  if (status === "under_review") return ["approve", "request_revision", "reject"]
  return []
}

export function submissionReviewActions(status: string): Array<
  "start_review" | "approve" | "request_revision"
> {
  if (status === "submitted") return ["start_review", "approve", "request_revision"]
  if (status === "under_review") return ["approve", "request_revision"]
  return []
}

export function studentCanSubmitProposals(status: string) {
  return PROPOSAL_ELIGIBLE.includes(status as ProjectStatus)
}

export function studentCanSubmitDocuments(status: string) {
  return DOCUMENT_ELIGIBLE.includes(status as ProjectStatus)
}
