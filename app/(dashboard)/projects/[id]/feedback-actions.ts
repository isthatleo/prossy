"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import { addFeedback, resolveFeedback } from "@/services/feedback"
import { addFeedbackSchema } from "@/validations/feedback"

export interface ActionResult {
  ok: boolean
  error?: string
}

export async function addFeedbackAction(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()

  const parsed = addFeedbackSchema.safeParse({
    recipientId: formData.get("recipientId") ?? "",
    content: formData.get("content") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  try {
    await addFeedback(projectId, { id: session.user.id, name: session.user.name, role: session.user.role as UserRole }, parsed.data)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidatePath(`/projects/${projectId}`)
  return { ok: true }
}

export async function resolveFeedbackAction(
  projectId: string,
  feedbackId: string
): Promise<ActionResult> {
  const session = await requireUser()
  try {
    await resolveFeedback(feedbackId, {
      id: session.user.id,
      role: session.user.role as UserRole,
    })
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidatePath(`/projects/${projectId}`)
  return { ok: true }
}
