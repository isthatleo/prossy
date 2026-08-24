"use server"

import { revalidatePath } from "next/cache"

import type { UserRole } from "@/lib/rbac"
import { requireUser } from "@/lib/auth/guards"
import {
  reviewProposal,
  reviewSubmission,
  submitDocument,
  submitProposal,
} from "@/services/submissions"
import {
  createMilestone,
  deleteMilestone,
  setMilestoneStatus,
  updateMilestone,
} from "@/services/milestones"
import {
  createDocumentSchema,
  createProposalSchema,
} from "@/validations/submissions"
import {
  createMilestoneSchema,
  MILESTONE_STATUSES,
  updateMilestoneSchema,
} from "@/validations/milestones"

export interface ActionResult {
  ok: boolean
  error?: string
}

function viewer(session: { user: { id: string; name: string; role: string } }) {
  return {
    id: session.user.id,
    name: session.user.name,
    role: session.user.role as UserRole,
  }
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/projects")
  revalidatePath("/dashboard")
}

export async function submitProposalAction(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()

  const parsed = createProposalSchema.safeParse({
    title: formData.get("title") ?? "",
    abstract: formData.get("abstract") ?? undefined,
    objectives: formData.get("objectives") ?? undefined,
    methodology: formData.get("methodology") ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  const file = formData.get("file")
  const fileOrNull = file instanceof File && file.size > 0 ? file : null

  try {
    await submitProposal(projectId, viewer(session), parsed.data, fileOrNull)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Submission failed." }
  }

  revalidateProject(projectId)
  return { ok: true }
}

export async function reviewProposalAction(
  projectId: string,
  proposalId: string,
  decision: "start_review" | "approve" | "request_revision" | "reject",
  notes?: string
): Promise<ActionResult> {
  const session = await requireUser()
  try {
    await reviewProposal(projectId, proposalId, viewer(session), decision, notes)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Review failed." }
  }
  revalidateProject(projectId)
  return { ok: true }
}

export async function submitDocumentAction(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()

  const parsed = createDocumentSchema.safeParse({
    type: formData.get("type") ?? "",
    description: formData.get("description") ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "A document file is required." }
  }

  try {
    await submitDocument(projectId, viewer(session), parsed.data, file)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Submission failed." }
  }

  revalidateProject(projectId)
  return { ok: true }
}

export async function reviewSubmissionAction(
  projectId: string,
  submissionId: string,
  decision: "start_review" | "approve" | "request_revision",
  notes?: string
): Promise<ActionResult> {
  const session = await requireUser()
  try {
    await reviewSubmission(projectId, submissionId, viewer(session), decision, notes)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Review failed." }
  }
  revalidateProject(projectId)
  return { ok: true }
}

export async function createMilestoneAction(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()

  const parsed = createMilestoneSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? undefined,
    dueDate: formData.get("dueDate") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  try {
    await createMilestone(projectId, viewer(session), parsed.data)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidateProject(projectId)
  return { ok: true }
}

export async function updateMilestoneAction(
  projectId: string,
  milestoneId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()

  const parsed = updateMilestoneSchema.safeParse({
    title: formData.get("title") ?? undefined,
    description: formData.get("description") ?? undefined,
    dueDate: formData.get("dueDate") ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  try {
    await updateMilestone(projectId, milestoneId, viewer(session), parsed.data)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidateProject(projectId)
  return { ok: true }
}

export async function setMilestoneStatusAction(
  projectId: string,
  milestoneId: string,
  status: string
): Promise<ActionResult> {
  const session = await requireUser()
  if (!(MILESTONE_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "Unknown milestone status." }
  }
  try {
    await setMilestoneStatus(
      projectId,
      milestoneId,
      viewer(session),
      status as (typeof MILESTONE_STATUSES)[number]
    )
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidateProject(projectId)
  return { ok: true }
}

export async function deleteMilestoneAction(
  projectId: string,
  milestoneId: string
): Promise<ActionResult> {
  const session = await requireUser()
  try {
    await deleteMilestone(projectId, milestoneId, viewer(session))
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidateProject(projectId)
  return { ok: true }
}
