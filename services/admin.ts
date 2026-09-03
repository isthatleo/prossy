import { asc, count, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  departments,
  projectCategories,
  projects,
  studentProfiles,
  supervisorProfiles,
  users,
} from "@/db/schema"
import type { UserRole } from "@/lib/rbac"
import type {
  CreateCategoryInput,
  CreateDepartmentInput,
} from "@/validations/admin"
import { logActivity } from "@/services/activity"

/* ---------------- Categories ---------------- */

export async function listCategoriesWithCounts() {
  const rows = await db
    .select({
      id: projectCategories.id,
      name: projectCategories.name,
      description: projectCategories.description,
      projectCount: sql<number>`(
        select count(*)::int from ${projects} p where p.category_id = ${projectCategories.id}
      )`,
    })
    .from(projectCategories)
    .orderBy(asc(projectCategories.name))
  return rows
}

export async function createCategory(
  viewer: { id: string; role: UserRole; name?: string },
  input: CreateCategoryInput
): Promise<{ id: string }> {
  if (viewer.role !== "admin") throw new Error("Only admins can manage categories.")

  const existing = await db.query.projectCategories.findFirst({
    where: eq(projectCategories.name, input.name),
    columns: { id: true },
  })
  if (existing) throw new Error("A category with this name already exists.")

  const [row] = await db
    .insert(projectCategories)
    .values({ name: input.name, description: input.description ?? null })
    .returning({ id: projectCategories.id })

  await logActivity({
    projectId: null,
    actorId: viewer.id,
    type: "category_created",
    summary: `Category "${input.name}" created.`,
  })
  return { id: row.id }
}

export async function deleteCategory(
  viewer: { id: string; role: UserRole },
  categoryId: string
): Promise<void> {
  if (viewer.role !== "admin") throw new Error("Only admins can manage categories.")
  // projects.categoryId is ON DELETE SET NULL — safe to remove.
  await db.delete(projectCategories).where(eq(projectCategories.id, categoryId))
  await logActivity({
    projectId: null,
    actorId: viewer.id,
    type: "category_deleted",
    summary: "A project category was removed.",
  })
}

/* ---------------- Departments ---------------- */

export async function listDepartmentsWithCounts() {
  return db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      students: sql<number>`(
        select count(*)::int from ${studentProfiles} sp where sp.department_id = ${departments.id}
      )`,
      supervisors: sql<number>`(
        select count(*)::int from ${supervisorProfiles} sup where sup.department_id = ${departments.id}
      )`,
      projectCount: sql<number>`(
        select count(*)::int from ${projects} p where p.department_id = ${departments.id}
      )`,
    })
    .from(departments)
    .orderBy(asc(departments.name))
}

export async function createDepartment(
  viewer: { id: string; role: UserRole },
  input: CreateDepartmentInput
): Promise<{ id: string }> {
  if (viewer.role !== "admin") throw new Error("Only admins can manage departments.")

  const existing = await db.query.departments.findFirst({
    where: eq(departments.code, input.code.toUpperCase()),
    columns: { id: true },
  })
  if (existing) throw new Error("A department with this code already exists.")

  const [row] = await db
    .insert(departments)
    .values({ name: input.name, code: input.code.toUpperCase() })
    .returning({ id: departments.id })

  await logActivity({
    projectId: null,
    actorId: viewer.id,
    type: "department_created",
    summary: `Department "${input.name}" (${input.code.toUpperCase()}) created.`,
  })
  return { id: row.id }
}

export async function deleteDepartment(
  viewer: { id: string; role: UserRole },
  departmentId: string
): Promise<void> {
  if (viewer.role !== "admin") throw new Error("Only admins can manage departments.")
  // Profiles reference with ON DELETE SET NULL.
  await db.delete(departments).where(eq(departments.id, departmentId))
  await logActivity({
    projectId: null,
    actorId: viewer.id,
    type: "department_deleted",
    summary: "A department was removed.",
  })
}

/* ---------------- Users ---------------- */

export async function setUserActive(
  viewer: { id: string; role: UserRole },
  userId: string,
  isActive: boolean
): Promise<void> {
  if (viewer.role !== "admin") throw new Error("Only admins can manage users.")
  if (userId === viewer.id && !isActive) {
    throw new Error("You cannot deactivate your own account.")
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, name: true },
  })
  if (!target) throw new Error("User not found.")

  await db.update(users).set({ is_active: isActive }).where(eq(users.id, userId))

  await logActivity({
    projectId: null,
    actorId: viewer.id,
    type: isActive ? "user_activated" : "user_deactivated",
    summary: `${target.name} was ${isActive ? "re-activated" : "deactivated"}.`,
  })
}

/* ---------------- User directory ---------------- */

export interface UserDirectoryRow {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  departmentName: string | null
  projectCount: number
  createdAt: Date
}

export async function listAllUsers(): Promise<UserDirectoryRow[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.is_active,
      departmentName: sql<string | null>`
        coalesce(
          (select d.name from ${studentProfiles} sp
            join ${departments} d on d.id = sp.department_id
            where sp.user_id = ${users.id}),
          (select d.name from ${supervisorProfiles} sup
            join ${departments} d on d.id = sup.department_id
            where sup.user_id = ${users.id})
        )
      `,
      projectCount: sql<number>`(
        select count(*)::int from ${projects} p
        where p.student_id = ${users.id} or p.supervisor_id = ${users.id}
      )`,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.name))
  return rows
}

export async function setUserRole(
  viewer: { id: string; role: UserRole },
  userId: string,
  newRole: UserRole
): Promise<void> {
  if (viewer.role !== "admin") throw new Error("Only admins can change roles.")
  if (userId === viewer.id) {
    throw new Error("You cannot change your own role.")
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, name: true, role: true },
  })
  if (!target) throw new Error("User not found.")
  if (target.role === newRole) return

  await db.update(users).set({ role: newRole }).where(eq(users.id, userId))

  await logActivity({
    projectId: null,
    actorId: viewer.id,
    type: "user_role_changed",
    summary: `${target.name} role changed from ${target.role} to ${newRole}.`,
  })
}
