"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import {
  createCategory,
  createDepartment,
  deleteCategory,
  deleteDepartment,
  setUserActive,
  setUserRole,
} from "@/services/admin"
import {
  createCategorySchema,
  createDepartmentSchema,
} from "@/validations/admin"

export interface ActionResult {
  ok: boolean
  error?: string
}

function viewer(session: { user: { id: string; role: string; name: string } }) {
  return { id: session.user.id, role: session.user.role as UserRole, name: session.user.name }
}

export async function createCategoryAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()
  const parsed = createCategorySchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }
  try {
    await createCategory(viewer(session), parsed.data)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidatePath("/admin/categories")
  return { ok: true }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  const session = await requireUser()
  try {
    await deleteCategory(viewer(session), categoryId)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidatePath("/admin/categories")
  return { ok: true }
}

export async function createDepartmentAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()
  const parsed = createDepartmentSchema.safeParse({
    name: formData.get("name") ?? "",
    code: formData.get("code") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }
  try {
    await createDepartment(viewer(session), parsed.data)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidatePath("/admin/departments")
  return { ok: true }
}

export async function deleteDepartmentAction(
  departmentId: string
): Promise<ActionResult> {
  const session = await requireUser()
  try {
    await deleteDepartment(viewer(session), departmentId)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidatePath("/admin/departments")
  return { ok: true }
}

export async function setUserActiveAction(
  userId: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await requireUser()
  try {
    await setUserActive(viewer(session), userId, isActive)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidatePath("/students")
  revalidatePath("/supervisors")
  revalidatePath("/admin/users")
  return { ok: true }
}

export async function setUserRoleAction(
  userId: string,
  newRole: UserRole
): Promise<ActionResult> {
  const session = await requireUser()
  try {
    await setUserRole(viewer(session), userId, newRole)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  revalidatePath("/students")
  revalidatePath("/supervisors")
  return { ok: true }
}
