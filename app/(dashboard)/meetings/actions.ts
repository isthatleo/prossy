"use server"

import { revalidatePath } from "next/cache"

import type { UserRole } from "@/lib/rbac"
import { requireUser } from "@/lib/auth/guards"
import {
  cancelMeeting,
  completeMeeting,
  scheduleMeeting,
  updateMeetingNotes,
} from "@/services/meetings"
import { scheduleMeetingSchema } from "@/validations/meetings"

export interface ActionResult {
  ok: boolean
  error?: string
}

export async function scheduleMeetingAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()

  const parsed = scheduleMeetingSchema.safeParse({
    projectId: formData.get("projectId") ?? "",
    title: formData.get("title") ?? "",
    startAt: formData.get("startAt") ?? "",
    durationMinutes: formData.get("durationMinutes") ?? "30",
    location: formData.get("location") ?? undefined,
    agenda: formData.get("agenda") ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  try {
    await scheduleMeeting(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as UserRole,
      },
      parsed.data
    )
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }

  revalidatePath("/meetings")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function meetingStatusAction(
  meetingId: string,
  action: "complete" | "cancel",
  notes?: string
): Promise<ActionResult> {
  const session = await requireUser()
  const viewer = {
    id: session.user.id,
    name: session.user.name,
    role: session.user.role as UserRole,
  }

  try {
    if (action === "complete") {
      await completeMeeting(meetingId, viewer, notes)
    } else {
      await cancelMeeting(meetingId, viewer, notes)
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }

  revalidatePath("/meetings")
  revalidatePath("/dashboard")
  revalidatePath(`/meetings/${meetingId}`)
  return { ok: true }
}

export async function updateMeetingNotesAction(
  meetingId: string,
  notes: string
): Promise<ActionResult> {
  const session = await requireUser()
  const viewer = {
    id: session.user.id,
    name: session.user.name,
    role: session.user.role as UserRole,
  }

  try {
    await updateMeetingNotes(meetingId, viewer, notes)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }

  revalidatePath(`/meetings/${meetingId}`)
  return { ok: true }
}
