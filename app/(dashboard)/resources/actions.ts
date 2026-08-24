"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import { createResource, deleteResource } from "@/services/resources"
import { createResourceSchema } from "@/validations/resources"

export interface ActionResult {
  ok: boolean
  error?: string
}

export async function createResourceAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." }
  }

  const parsed = createResourceSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? undefined,
    category: formData.get("category") ?? "other",
    visibility: formData.get("visibility") ?? "project",
    projectId:
      formData.get("projectId") && String(formData.get("projectId")) !== ""
        ? String(formData.get("projectId"))
        : undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  try {
    await createResource(
      { id: session.user.id, name: session.user.name, role: session.user.role as UserRole },
      parsed.data,
      file
    )
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }

  revalidatePath("/resources")
  return { ok: true }
}

export async function deleteResourceAction(resourceId: string): Promise<ActionResult> {
  const session = await requireUser()
  try {
    await deleteResource(resourceId, {
      id: session.user.id,
      role: session.user.role as UserRole,
    })
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidatePath("/resources")
  return { ok: true }
}
