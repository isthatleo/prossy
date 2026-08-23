"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import {
  createProject,
  performProjectAction,
  updateProject,
  type ProjectAction,
} from "@/services/projects"
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/validations/projects"

export interface ActionResult {
  ok: boolean
  error?: string
}

export async function createProjectAction(_prev: ActionResult | null, formData: FormData) {
  const session = await requireUser()
  if (session.user.role !== "student" && session.user.role !== "admin") {
    return { ok: false, error: "Only students can create projects." }
  }

  const parsed = createProjectSchema.safeParse({
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    problemStatement: formData.get("problemStatement") ?? "",
    objectives: formData.get("objectives") ?? "",
    methodology: formData.get("methodology") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  let projectId: string
  try {
    const result = await createProject(session.user.id, parsed.data)
    projectId = result.project.id
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create project." }
  }

  revalidatePath("/projects")
  redirect(`/projects/${projectId}`)
}

export async function updateProjectAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()
  const projectId = String(formData.get("projectId") ?? "")

  const parsed = updateProjectSchema.safeParse({
    title: formData.get("title") ?? undefined,
    categoryId: formData.get("categoryId") ?? undefined,
    description: formData.get("description") ?? undefined,
    problemStatement: formData.get("problemStatement") ?? undefined,
    objectives: formData.get("objectives") ?? undefined,
    methodology: formData.get("methodology") ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  try {
    await updateProject(
      projectId,
      { id: session.user.id, role: session.user.role as UserRole },
      parsed.data
    )
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update." }
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/projects")
  return { ok: true }
}

export async function projectTransitionAction(
  projectId: string,
  action: ProjectAction,
  notes?: string
): Promise<ActionResult> {
  const session = await requireUser()

  try {
    await performProjectAction(
      projectId,
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as UserRole,
      },
      action,
      notes
    )
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Action failed." }
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/projects")
  revalidatePath("/dashboard")
  return { ok: true }
}
